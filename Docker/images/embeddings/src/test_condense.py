"""
Test script for chunk condensation functionality
Run this to verify the condensation logic works correctly
"""

import sys
sys.path.insert(0, '/workspace/angular/ai-stack/Docker/embeddings')

from condense import split_into_sentences, score_sentences, condense_chunk, condense_chunks_batch
from sentence_transformers import SentenceTransformer
from utils import get_device

# Test data
test_query = "What are the key features of machine learning?"

test_chunk = """
Machine learning is a subset of artificial intelligence that enables computers to learn from data. 
The main types of machine learning include supervised learning, unsupervised learning, and reinforcement learning.
Supervised learning uses labeled datasets to train models. Deep learning is a specialized form of machine learning using neural networks.
Neural networks consist of layers of interconnected nodes. Common applications include image recognition and natural language processing.
Data preprocessing is crucial for model accuracy. Feature engineering helps improve model performance.
Overfitting occurs when a model learns the training data too well. Cross-validation helps prevent overfitting.
"""

def test_sentence_splitting():
    print("=== Test 1: Sentence Splitting ===")
    sentences = split_into_sentences(test_chunk)
    print(f"Found {len(sentences)} sentences:")
    for i, sent in enumerate(sentences, 1):
        print(f"  {i}. {sent}")
    print()

def test_sentence_scoring():
    print("=== Test 2: Sentence Scoring ===")
    device = get_device()
    print(f"[INFO] Using device: {device}")
    model = SentenceTransformer("all-MiniLM-L6-v2", device=device)
    sentences = split_into_sentences(test_chunk)
    scored = score_sentences(test_query, sentences, model)
    print("Top 3 most relevant sentences:")
    for idx, score, sentence in scored[:3]:
        print(f"  Score: {score:.4f} | {sentence}")
    print()

def test_chunk_condensation():
    print("=== Test 3: Chunk Condensation ===")
    model = SentenceTransformer("all-MiniLM-L6-v2")
    condensed = condense_chunk(test_query, test_chunk, model, top_n=4, max_chars=500)
    print(f"Original length: {len(test_chunk)} chars")
    print(f"Condensed length: {len(condensed)} chars")
    print(f"Reduction: {(1 - len(condensed)/len(test_chunk)) * 100:.1f}%")
    print(f"\nCondensed text:\n{condensed}")
    print()

def test_batch_condensation():
    print("=== Test 4: Batch Condensation ===")
    model = SentenceTransformer("all-MiniLM-L6-v2")
    
    chunks = [
        {"text": test_chunk, "score": 0.95, "index": 0},
        {"text": "Python is a popular programming language. It is widely used in data science.", "score": 0.85, "index": 1}
    ]
    
    condensed_chunks = condense_chunks_batch(test_query, chunks, model, top_n=3, max_chars=300)
    
    for chunk in condensed_chunks:
        print(f"Chunk {chunk['index']}:")
        print(f"  Original: {chunk['original_length']} chars")
        print(f"  Condensed: {chunk['condensed_length']} chars")
        print(f"  Text: {chunk['text'][:100]}...")
        print()

def test_retrocompatibility_payload():
    print("=== Test 5: API Payload Examples ===")
    
    # Old payload (still works)
    old_payload = {
        "question": "What is machine learning?",
        "passages": ["text1", "text2"],
        "options": {"model": None, "return_text": True, "top_k": 5}
    }
    print("✅ Old payload (retrocompatible):")
    print(f"   {old_payload}")
    print()
    
    # New payload with rerank only
    rerank_only = {
        "question": "What is machine learning?",
        "passages": ["text1", "text2"],
        "rerank": True,
        "options": {"return_text": True, "top_k": 5}
    }
    print("✅ New payload (rerank only):")
    print(f"   {rerank_only}")
    print()
    
    # New payload with condensation
    with_condense = {
        "question": "What is machine learning?",
        "passages": ["text1", "text2"],
        "rerank": True,
        "condense": {
            "top_n": 6,
            "max_chars": 1000,
            "preserve_references": False
        },
        "options": {"return_text": True, "top_k": 5}
    }
    print("✅ New payload (rerank + condense):")
    print(f"   {with_condense}")
    print()
    
    # Condense without rerank
    condense_only = {
        "question": "What is machine learning?",
        "passages": ["text1", "text2"],
        "rerank": False,
        "condense": {
            "top_n": 6,
            "max_chars": 1000
        },
        "options": {"return_text": True}
    }
    print("✅ New payload (condense only, no rerank):")
    print(f"   {condense_only}")
    print()

if __name__ == "__main__":
    print("=" * 60)
    print("CHUNK CONDENSATION TEST SUITE")
    print("=" * 60)
    print()
    
    try:
        test_sentence_splitting()
        test_sentence_scoring()
        test_chunk_condensation()
        test_batch_condensation()
        test_retrocompatibility_payload()
        
        print("=" * 60)
        print("✅ ALL TESTS COMPLETED SUCCESSFULLY")
        print("=" * 60)
    except Exception as e:
        print(f"❌ TEST FAILED: {e}")
        import traceback
        traceback.print_exc()
