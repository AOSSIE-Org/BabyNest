import chromadb
from chromadb.utils import embedding_functions
import json
import os
import hashlib

os.makedirs("db/chromadb", exist_ok=True)
client = chromadb.PersistentClient(path="db/chromadb")

# Use default embedding function instead of sentence transformers

# Collection for pregnancy guidelines embeddings
guidelines_collection = client.get_or_create_collection(
    "pregnancy_guidelines",
    embedding_function=embedding_functions.DefaultEmbeddingFunction()
)

# Separate collection for user details embeddings
user_details_collection = client.get_or_create_collection(
    "user_details",
    embedding_function=embedding_functions.DefaultEmbeddingFunction()
)

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
    
def update_guidelines_in_vector_store():
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
            count = guidelines_collection.count()
            if count > 0:
                guidelines_collection.delete(where={"source": {"$ne": "none"}})
        except Exception:
            print(f"Warning: Failed to clear guidelines collection: {e}")
        
        documents, ids, metadatas = [], [], []

        # Add guidelines to vector store
        for i, guideline in enumerate(guidelines):
            content = f"Week {guideline.get('week_range', 'Unknown')}: {guideline.get('title', '')}"
            metadata = {
                "week": guideline.get('week_range', 'Unknown'),
                "priority": guideline.get('priority', 'general'),
                "source": ", ".join(guideline.get('organization', ['government_guidelines'])),
                "purpose" : guideline.get('purpose', 'general')
            }

            documents.append(content)
            ids.append(f"guideline_{i}")
            metadatas.append(metadata)
            
        guidelines_collection.add(
            documents=documents,
            metadatas=metadatas,
            ids=ids
        )
        
        print(f"Vector store updated with {len(guidelines)} guidelines")
        return True
        
    except Exception as e:
        print(f"Error updating vector store: {e}")
        return False
    
def update_user_details_in_vector_store(documents: list = None, ids: list = None, metadatas: list = None):
    """Update user details in the vector store."""
    if not documents or not ids or not metadatas:
        print("No user detail documents to update.")
        return
    try:
        user_details_collection.upsert(
            documents=documents,
            metadatas=metadatas,
            ids=ids
        )
        print(f"Vector store updated with {len(documents)} user detail documents")
    except Exception as e:
        print(f"Error updating user details in vector store: {e}")

def query_vector_store(query: str, n_results: int = 3):
    """Query the vector store for relevant guidelines."""
    try:
        results = guidelines_collection.query(
            query_texts=[query],
            n_results=n_results
        )
        
        if results and results.get('documents'):
            return results['documents'][0]
        return []
        
    except Exception as e:
        print(f"Error querying vector store: {e}")
        return []

