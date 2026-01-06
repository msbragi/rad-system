"""
Unified Model Management Module
Handles loading, caching, and device management for all ML models (embedding + reranking)
"""
from sentence_transformers import SentenceTransformer, CrossEncoder
from utils import get_device
import logging
import os
import json

logger = logging.getLogger(__name__)

# Global device (initialized once)
_device = None

# Model caches
_embedding_models = {}
_reranker_models = {}

CONFIG_PATH = os.environ.get("EMBEDDING_CONFIG_PATH", "/app/models/embedding_config.json")

def get_default_model():
    model = "all-MiniLM-L6-v2"
    try:
        if os.path.exists(CONFIG_PATH):
            with open(CONFIG_PATH, "r") as f:
                config = json.load(f)
                model = config.get("default_model", model)
        logger.info(f"Default embedding model: {model}")
        
        # Force load the default embedding model at startup
        try:
            _ = get_embedding_model(model)
            logger.info(f"Default embedding model loaded at startup: {model}")
        except Exception as e:
            logger.warning(f"Could not load default embedding model {model} at startup: {e}")
            
    except Exception as e:
        logger.warning(f"Could not read config file {CONFIG_PATH}: {e}")
    return model

def get_default_reranker():
    reranker = "cross-encoder/ms-marco-MiniLM-L-6-v2"
    try:
        if os.path.exists(CONFIG_PATH):
            with open(CONFIG_PATH, "r") as f:
                config = json.load(f)
                reranker = config.get("default_reranker", reranker)
        logger.info(f"Default reranker model: {reranker}")
        
        # Force load the default reranker model at startup
        try:
            _ = get_reranker_model(reranker)
            logger.info(f"Default reranker model loaded at startup: {reranker}")
        except Exception as e:
            logger.warning(f"Could not load default reranker model {reranker} at startup: {e}")
            
    except Exception as e:
        logger.warning(f"Could not read config file {CONFIG_PATH}: {e}")
    return reranker

def get_models_info() -> list:
    """
    Return all embedding models info from config, copying all properties as-is.
    """
    try:
        config_path = os.environ.get("EMBEDDING_CONFIG_PATH", "/app/models/embedding_config.json")
        with open(config_path, "r") as f:
            config = json.load(f)
        return config.get("available_models", [])
    except Exception as e:
        logger.warning(f"Could not read config file for embedding models: {e}")
        return []
        
def get_model_device():
    """
    Get the device for model loading (initialized once, then cached)
    
    Returns:
        torch.device: Device to use (CPU, CUDA, ROCm, or MPS)
    """
    global _device
    if _device is None:
        _device = get_device()
        logger.info(f"[Models] Device initialized: {_device}")
    return _device


def get_embedding_model(model_name: str) -> SentenceTransformer:
    """
    Get or load an embedding model with caching
    
    Args:
        model_name: Name of the sentence transformer model
        
    Returns:
        SentenceTransformer instance
    """
    if model_name not in _embedding_models:
        device = get_model_device()
        logger.info(f"[Models] Loading embedding model: {model_name} on {device}")
        _embedding_models[model_name] = SentenceTransformer(model_name, device=device)
    
    return _embedding_models[model_name]


def get_reranker_model(reranker_name: str) -> CrossEncoder:
    """
    Get or load a reranker model with caching
    
    Args:
        reranker_name: Name of the cross-encoder model
        
    Returns:
        CrossEncoder instance
    """
    if reranker_name not in _reranker_models:
        device = get_model_device()
        logger.info(f"[Models] Loading reranker model: {reranker_name} on {device}")
        _reranker_models[reranker_name] = CrossEncoder(reranker_name, device=device)
    
    return _reranker_models[reranker_name]


def generate_embeddings(texts: list, model_name: str) -> tuple:
    """
    Generate embeddings for a list of texts
    
    Args:
        texts: List of strings to embed
        model_name: Name of the model to use
        
    Returns:
        Tuple of (embeddings_list, dimensions, model_name)
    """
    model = get_embedding_model(model_name)
    embeddings = model.encode(texts, convert_to_tensor=False)
    embedding_list = embeddings.tolist()
    dimensions = model.get_sentence_embedding_dimension()
    
    return embedding_list, dimensions, model_name


def rerank_passages(question: str, passages: list, reranker_name: str, 
                   return_text: bool = True, top_k: int = None) -> list:
    """
    Rerank passages based on relevance to question
    
    Args:
        question: User's question
        passages: List of text passages
        reranker_name: Name of the reranker model
        return_text: Whether to include text in results
        top_k: Optional limit on number of results
        
    Returns:
        List of dicts with index, score, and optionally text
    """
    reranker = get_reranker_model(reranker_name)
    pairs = [(question, passage) for passage in passages]
    scores = reranker.predict(pairs)
    
    results = [
        {
            "index": i,
            "score": float(score),
            **({"text": passage} if return_text else {})
        }
        for i, (passage, score) in enumerate(zip(passages, scores))
    ]
    
    results = sorted(results, key=lambda x: x["score"], reverse=True)
    
    if top_k is not None:
        results = results[:top_k]
    
    return results


def create_dummy_results(passages: list, return_text: bool = True, top_k: int = None) -> list:
    """
    Create dummy results without reranking (when rerank=False)
    
    Args:
        passages: List of text passages
        return_text: Whether to include text in results
        top_k: Optional limit on number of results
        
    Returns:
        List of dicts with index, score=1.0, and optionally text
    """
    results = [
        {
            "index": i,
            "score": 1.0,
            **({"text": passage} if return_text else {})
        }
        for i, passage in enumerate(passages)
    ]
    
    if top_k is not None:
        results = results[:top_k]
    
    return results

