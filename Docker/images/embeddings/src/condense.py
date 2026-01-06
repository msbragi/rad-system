"""
Chunk Condensation Module for RAG Optimization

This module provides functionality to condense large text chunks by extracting
the most relevant sentences based on similarity to the query, reducing token
usage for local LLMs while maintaining context quality.

Strategy:
- Extract top N most relevant sentences (default: 6)
- Limit total character count (default: 1000)
- Preserve sentence order from original text
- Optional reference preservation
"""

import re
from typing import List, Tuple, Optional
from sentence_transformers import SentenceTransformer, util
import torch


def split_into_sentences(text: str) -> List[str]:
    """
    Split text into sentences using regex patterns.
    Handles common sentence endings and edge cases.
    
    Args:
        text: Input text to split
        
    Returns:
        List of sentences
    """
    # Handle common abbreviations that shouldn't trigger sentence breaks
    text = re.sub(r'(\w)\.(\s+[A-Z])', r'\1<PERIOD>\2', text)
    
    # Split on sentence endings followed by whitespace and capital letter
    sentences = re.split(r'(?<=[.!?])\s+(?=[A-Z])', text)
    
    # Restore periods in abbreviations
    sentences = [s.replace('<PERIOD>', '.') for s in sentences]
    
    # Clean up whitespace
    sentences = [s.strip() for s in sentences if s.strip()]
    
    return sentences


def score_sentences(
    query: str,
    sentences: List[str],
    model: SentenceTransformer,
    preserve_references: bool = False
) -> List[Tuple[int, float, str]]:
    """
    Score sentences based on semantic similarity to the query.
    
    Args:
        query: User's question
        sentences: List of sentences from the chunk
        model: Sentence transformer model for embeddings
        preserve_references: If True, boost scores for sentences with references like [1], (fig. 2)
        
    Returns:
        List of tuples: (original_index, score, sentence_text)
    """
    if not sentences:
        return []
    
    # Encode query and sentences
    query_embedding = model.encode(query, convert_to_tensor=True)
    sentence_embeddings = model.encode(sentences, convert_to_tensor=True)
    
    # Calculate cosine similarity
    similarities = util.cos_sim(query_embedding, sentence_embeddings)[0]
    
    # Create scored list
    scored_sentences = []
    for idx, (sentence, score) in enumerate(zip(sentences, similarities)):
        score_value = float(score)
        
        # Boost score if sentence contains references (when preserve_references=True)
        if preserve_references:
            # Check for common reference patterns: [1], (fig. 2), [Smith et al.], etc.
            if re.search(r'\[\d+\]|\(fig\.\s*\d+\)|\[[\w\s,]+\s+et\s+al\.\]', sentence, re.IGNORECASE):
                score_value *= 1.15  # 15% boost for sentences with references
        
        scored_sentences.append((idx, score_value, sentence))
    
    # Sort by score (descending)
    scored_sentences.sort(key=lambda x: x[1], reverse=True)
    
    return scored_sentences


def condense_chunk(
    query: str,
    chunk_text: str,
    model: SentenceTransformer,
    top_n: int = 6,
    max_chars: int = 1000,
    preserve_references: bool = False
) -> str:
    """
    Condense a text chunk by extracting the most relevant sentences.
    
    Args:
        query: User's question
        chunk_text: Text chunk to condense
        model: Sentence transformer model for embeddings
        top_n: Maximum number of sentences to extract (default: 6)
        max_chars: Maximum total character count (default: 1000)
        preserve_references: Whether to boost sentences with citations/references
        
    Returns:
        Condensed text with most relevant sentences in original order
    """
    # Split into sentences
    sentences = split_into_sentences(chunk_text)
    
    # If chunk is already small, return as-is
    if len(chunk_text) <= max_chars:
        return chunk_text
    
    # Score sentences
    scored = score_sentences(query, sentences, model, preserve_references)
    
    # Select top N sentences
    selected = scored[:top_n]
    
    # Sort by original index to preserve order
    selected.sort(key=lambda x: x[0])
    
    # Build condensed text
    condensed_sentences = []
    total_chars = 0
    
    for idx, score, sentence in selected:
        sentence_len = len(sentence)
        
        # Stop if adding this sentence exceeds max_chars
        if total_chars + sentence_len > max_chars and condensed_sentences:
            break
        
        condensed_sentences.append(sentence)
        total_chars += sentence_len
    
    # Join sentences
    result = ' '.join(condensed_sentences)
    
    # Ensure we don't exceed max_chars (truncate if necessary)
    if len(result) > max_chars:
        result = result[:max_chars].rsplit(' ', 1)[0] + '...'
    
    return result


def condense_chunks_batch(
    query: str,
    chunks: List[dict],
    model: SentenceTransformer,
    top_n: int = 6,
    max_chars: int = 1000,
    preserve_references: bool = False
) -> List[dict]:
    """
    Condense multiple chunks in batch.
    
    Args:
        query: User's question
        chunks: List of chunk dictionaries with 'text' and optionally 'score' fields
        model: Sentence transformer model for embeddings
        top_n: Maximum number of sentences per chunk
        max_chars: Maximum character count per chunk
        preserve_references: Whether to boost sentences with citations/references
        
    Returns:
        List of chunks with condensed text
    """
    condensed_chunks = []
    
    for chunk in chunks:
        # Create a copy to avoid modifying the original
        condensed_chunk = chunk.copy()
        
        # Get the text field (handle different possible keys)
        text = chunk.get('text') or chunk.get('content') or chunk.get('page_content', '')
        
        if text:
            # Condense the text
            condensed_text = condense_chunk(
                query=query,
                chunk_text=text,
                model=model,
                top_n=top_n,
                max_chars=max_chars,
                preserve_references=preserve_references
            )
            
            # Update the text field
            if 'text' in condensed_chunk:
                condensed_chunk['text'] = condensed_text
            elif 'content' in condensed_chunk:
                condensed_chunk['content'] = condensed_text
            elif 'page_content' in condensed_chunk:
                condensed_chunk['page_content'] = condensed_text
            
            # Add condensation metadata
            condensed_chunk['condensed'] = True
            condensed_chunk['original_length'] = len(text)
            condensed_chunk['condensed_length'] = len(condensed_text)
        
        condensed_chunks.append(condensed_chunk)
    
    return condensed_chunks

# Helper functions for working with reranked results

def prepare_chunks_for_condensation(results: list) -> list:
    """
    Prepare reranked results for condensation by extracting text chunks
    
    Args:
        results: List of result dicts with index, score, text
        
    Returns:
        List of chunks ready for condense_chunks_batch
    """
    chunks_to_condense = []
    for result in results:
        if "text" in result:
            chunks_to_condense.append({
                "text": result["text"],
                "score": result.get("score", 1.0),
                "index": result["index"]
            })
    
    return chunks_to_condense


def apply_condensation_to_results(results: list, condensed_chunks: list) -> list:
    """
    Apply condensed text back to reranked results
    
    Args:
        results: List of result dicts with index, score, text
        condensed_chunks: List of condensed chunks from condense_chunks_batch
        
    Returns:
        Updated results list with condensed text
    """
    for result in results:
        if "text" in result:
            # Find corresponding condensed chunk by index
            for condensed_chunk in condensed_chunks:
                if condensed_chunk["index"] == result["index"]:
                    result["text"] = condensed_chunk["text"]
                    result["condensed"] = True
                    result["original_length"] = condensed_chunk.get("original_length")
                    result["condensed_length"] = condensed_chunk.get("condensed_length")
                    break
    
    return results
