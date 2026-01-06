from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import os
import json
from typing import List, Optional, Dict, Any
import logging

# Import business logic modules
from models import (
    generate_embeddings,
    get_embedding_model,
    get_reranker_model,
    rerank_passages,
    create_dummy_results,
    get_default_model, 
    get_default_reranker,
    get_models_info
)

from condense import (
    condense_chunks_batch,
    prepare_chunks_for_condensation,
    apply_condensation_to_results
)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Embedding Service", version="1.0.0")

# --- Load default model and reranker from models.py module ---
DEFAULT_MODEL = get_default_model()
DEFAULT_RERANKER = get_default_reranker()

# --- Condense endpoint (with optional reranking) ---
class CondenseOptions(BaseModel):
    """Options for chunk condensation to reduce token usage"""
    top_n: Optional[int] = 6  # Number of sentences to extract per chunk
    max_chars: Optional[int] = 1000  # Maximum characters per condensed chunk
    preserve_references: Optional[bool] = False  # Boost sentences with citations

class RerankOptions(BaseModel):
    model: Optional[str] = None
    return_text: Optional[bool] = True
    top_k: Optional[int] = None

class CondenseRequest(BaseModel):
    question: str
    passages: List[str]
    options: Optional[RerankOptions] = None
    rerank: Optional[bool] = True  # Whether to perform reranking (default: True)
    condense: Optional[CondenseOptions] = None  # Condensation always applied if provided

class EmbedRequest(BaseModel):
    text: List[str]  # Always expect a list
    model: str = None  # Optional: override model
    dimensions: int = None  # Optional: override output dim (for info only)

class EmbedResponse(BaseModel):
    embeddings: List[List[float]]
    dimensions: int
    model: str

@app.get("/")
async def root():
    # Try to get dimensions for default model
    try:
        embedding_models = get_models_info()
    except Exception as e:
        logger.warning(f"Could not get embedding models info: {e}")
        embedding_models = []

    # Try to get dimensions for default model
    try:
        model = get_embedding_model(DEFAULT_MODEL)
        dims = model.get_sentence_embedding_dimension()
    except Exception:
        dims = None

    # Try to get reranker info
    reranker_loaded = False
    try:
        _ = get_reranker_model(DEFAULT_RERANKER)
        reranker_loaded = True
    except Exception:
        reranker_loaded = False

    return {
        "service": "Embedding Service",
        "embedding_models": embedding_models,
        "default_model": DEFAULT_MODEL,
        "reranker": {
            "model": DEFAULT_RERANKER,
            "loaded": reranker_loaded
        },
        "status": "ready"
    }

@app.get("/health")
async def health():
    return {"status": "healthy"}

@app.post("/embed", response_model=EmbedResponse)
async def create_embedding(request: EmbedRequest):
    try:
        # Validate input
        if not request.text or len(request.text) == 0:
            raise HTTPException(status_code=400, detail="Text list cannot be empty")

        # Determine which model to use
        model_name = request.model or DEFAULT_MODEL
        
        # Call embed module function
        embedding_list, dims, model_name = generate_embeddings(request.text, model_name)
        
        # Override dimensions if provided in request
        if request.dimensions:
            dims = request.dimensions

        return EmbedResponse(
            embeddings=embedding_list,
            dimensions=dims,
            model=model_name
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating embeddings: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error generating embeddings: {str(e)}")

@app.post("/condense")
@app.post("/rerank")  # Keep for backward compatibility
async def condense_endpoint(request: CondenseRequest):
    try:
        if not request.question or not request.passages or len(request.passages) == 0:
            raise HTTPException(status_code=400, detail="Question and passages are required")
        
        opts = request.options or RerankOptions()
        results = []
        reranker_name = None
        condensation_applied = False
        
        # Step 1: Reranking (if enabled, default True)
        if request.rerank is None or request.rerank:
            reranker_name = opts.model or DEFAULT_RERANKER
            # Call rerank module function
            results = rerank_passages(
                question=request.question,
                passages=request.passages,
                reranker_name=reranker_name,
                return_text=opts.return_text,
                top_k=opts.top_k
            )
        else:
            # No reranking: create dummy results
            results = create_dummy_results(
                passages=request.passages,
                return_text=opts.return_text,
                top_k=opts.top_k
            )

        # Step 2: Condensation (if requested)
        if request.condense is not None:
            # Prepare chunks for condensation
            chunks_to_condense = prepare_chunks_for_condensation(results)
            
            if chunks_to_condense:
                # Get embedding model and apply condensation
                model = get_embedding_model(DEFAULT_MODEL)
                condensed = condense_chunks_batch(
                    query=request.question,
                    chunks=chunks_to_condense,
                    model=model,
                    top_n=request.condense.top_n,
                    max_chars=request.condense.max_chars,
                    preserve_references=request.condense.preserve_references
                )
                
                # Apply condensed text to results
                results = apply_condensation_to_results(results, condensed)
                condensation_applied = True
        
        # Build response
        response = {
            "reranked": results
        }
        
        if reranker_name:
            response["reranker"] = reranker_name
        
        if condensation_applied:
            response["condensation_applied"] = True
            response["condensation_params"] = {
                "top_n": request.condense.top_n,
                "max_chars": request.condense.max_chars,
                "preserve_references": request.condense.preserve_references
            }
        
        return response
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in condense endpoint: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error in condense endpoint: {str(e)}")
