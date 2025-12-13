import chromadb
from chromadb.utils import embedding_functions
import json
import os
import hashlib
import shutil
import sqlite3

def init_chroma_client(recreate_on_schema_mismatch: bool = True):
    """Initialize the persistent chromadb client and collection.

    If the database schema is incompatible (e.g. older version missing a
    column), optionally remove and recreate the DB directory so the
    library can initialize a fresh DB with the expected schema.
    """
    os.makedirs("db/chromadb", exist_ok=True)
    try:
        client = chromadb.PersistentClient(path="db/chromadb")
        collection = client.get_or_create_collection(
            "pregnancy_guidelines",
            embedding_function=embedding_functions.DefaultEmbeddingFunction()
        )
        return client, collection
    except Exception as e:
        message = str(e).lower()
        is_sqlite_op = isinstance(e, sqlite3.OperationalError)
        schema_issue = "no such column" in message or "no such table" in message
        if recreate_on_schema_mismatch and (schema_issue or is_sqlite_op):
             print("[vector_store] Chromadb schema mismatch detected, recreating DB directory")
+           import logging
+               logging.warning("[vector_store] Chromadb schema mismatch detected, recreating DB directory. All existing embeddings will be lost.")            try:
                shutil.rmtree("db/chromadb")
            except FileNotFoundError:
                pass
            os.makedirs("db/chromadb", exist_ok=True)
            client = chromadb.PersistentClient(path="db/chromadb")
            collection = client.get_or_create_collection(
                "pregnancy_guidelines",
                embedding_function=embedding_functions.DefaultEmbeddingFunction()
            )
            return client, collection
        raise


# Initialize Chromadb client and collection using the safe initializer
client, collection = init_chroma_client()

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
    """Update the vector store with pregnancy guidelines."""
    try:
        # Load guidelines from JSON file
        guidelines_file = os.path.join(os.path.dirname(__file__), "guidelines.json")
        os.makedirs("db/chromadb", exist_ok=True)

        # Compare file hash to avoid unnecessary updates
        hash_file = os.path.join("db/chromadb", "guidelines.hash")
        current_hash = get_file_hash(guidelines_file)
        previous_hash = None

        if os.path.exists(hash_file):
            with open(hash_file, "r") as f:
                previous_hash = f.read().strip()

        if current_hash == previous_hash:
            print("🔄 No change in guidelines.json, skipping vector update.")
            return False
        
        # Save new hash
        with open(hash_file, "w") as f:
            f.write(current_hash)

        with open(guidelines_file, 'r', encoding='utf-8') as f:
            guidelines = json.load(f)
        
        # Clear existing data (only if collection has data)
        try:
            count = collection.count()
            if count > 0:
                collection.delete(where={"source": {"$ne": "none"}})
        except Exception:
            pass
        
        # Add guidelines to vector store
        for i, guideline in enumerate(guidelines):
            content = f"Week {guideline.get('week', 'Unknown')}: {guideline.get('content', '')}"
            metadata = {
                "week": guideline.get('week', 'Unknown'),
                "category": guideline.get('category', 'general'),
                "source": guideline.get('source', 'government_guidelines')
            }
            
            collection.add(
                documents=[content],
                metadatas=[metadata],
                ids=[f"guideline_{i}"]
            )
        
        print(f"Vector store updated with {len(guidelines)} guidelines")
        return True
        
    except Exception as e:
        print(f"Error updating vector store: {e}")
        return False

def query_vector_store(query: str, n_results: int = 3):
    """Query the vector store for relevant guidelines."""
    try:
        results = collection.query(
            query_texts=[query],
            n_results=n_results
        )
        
        if results and results.get('documents'):
            return results['documents'][0]
        return []
        
    except Exception as e:
        print(f"Error querying vector store: {e}")
        return []

