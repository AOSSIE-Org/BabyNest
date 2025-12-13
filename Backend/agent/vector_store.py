try:
    import chromadb
    from chromadb.utils import embedding_functions
    _CHROMA_AVAILABLE = True
except Exception:
    chromadb = None
    embedding_functions = None
    _CHROMA_AVAILABLE = False

import json
import os
import hashlib

client = None
collection = None

if _CHROMA_AVAILABLE:
    try:
        os.makedirs("db/chromadb", exist_ok=True)
        client = chromadb.PersistentClient(path="db/chromadb")

        collection = client.get_or_create_collection(
            "pregnancy_guidelines",
            embedding_function=embedding_functions.DefaultEmbeddingFunction()
        )
    except Exception:
        # If init fails, degrade gracefully
        client = None
        collection = None
        _CHROMA_AVAILABLE = False

_update_vector_store_callback = None


def register_vector_store_updater(callback):
    global _update_vector_store_callback
    _update_vector_store_callback = callback


def auto_refresh_embeddings():
    """If a callback is registered, refresh vector store."""
    if _update_vector_store_callback:
        _update_vector_store_callback()


def get_file_hash(path):
    with open(path, "rb") as f:
        return hashlib.md5(f.read()).hexdigest()


def update_vector_store():
    if not _CHROMA_AVAILABLE or collection is None:
        return False

    try:
        guidelines_file = os.path.join(os.path.dirname(__file__), "guidelines.json")
        os.makedirs("db/chromadb", exist_ok=True)

        hash_file = os.path.join("db/chromadb", "guidelines.hash")
        current_hash = get_file_hash(guidelines_file)
        previous_hash = None

        if os.path.exists(hash_file):
            with open(hash_file, "r") as f:
                previous_hash = f.read().strip()

        if current_hash == previous_hash:
            return False

        with open(hash_file, "w") as f:
            f.write(current_hash)

        with open(guidelines_file, "r", encoding="utf-8") as f:
            guidelines = json.load(f)

        try:
            count = collection.count()
            if count > 0:
                collection.delete(where={"source": {"$ne": "none"}})
        except Exception:
            pass

        for i, guideline in enumerate(guidelines):
            content = f"Week {guideline.get('week', 'Unknown')}: {guideline.get('content', '')}"
            metadata = {
                "week": guideline.get("week", "Unknown"),
                "category": guideline.get("category", "general"),
                "source": guideline.get("source", "government_guidelines")
            }

            collection.add(
                documents=[content],
                metadatas=[metadata],
                ids=[f"guideline_{i}"]
            )

        return True

    except Exception:
        return False


def query_vector_store(query: str, n_results: int = 3):
    if not _CHROMA_AVAILABLE or collection is None:
        return []

    try:
        results = collection.query(
            query_texts=[query],
            n_results=n_results
        )

        if results and results.get("documents"):
            return results["documents"][0]
        return []

    except Exception:
        return []
