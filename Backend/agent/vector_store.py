import chromadb
from chromadb.utils import embedding_functions

# --- Configuration ---
CHROMA_PATH = "db/chromadb"
COLLECTION_NAME = "babynest_context"

# The embedding function is stateless and can remain global.
sentence_transformer_ef = embedding_functions.SentenceTransformerEmbeddingFunction(
    model_name="all-MiniLM-L6-v2"
)

# --- Helper Function for On-Demand Initialization ---
def _get_collection():
    """
    Initializes a persistent client on-demand and returns the collection.
    This prevents file locks during module import.
    """
    client = chromadb.PersistentClient(path=CHROMA_PATH)
    collection = client.get_or_create_collection(
        name=COLLECTION_NAME,
        embedding_function=sentence_transformer_ef,
        metadata={"hnsw:space": "cosine"}
    )
    return collection

# --- Core Functions ---
def update_vector_store(documents: list[str], ids: list[str], metadatas: list[dict]):
    """
    Adds or updates documents in the ChromaDB collection.
    """
    if not documents:
        return
    try:
        # Get the collection only when the function is called
        collection = _get_collection()
        collection.add(
            documents=documents,
            ids=ids,
            metadatas=metadatas
        )
    except Exception as e:
        print(f"Error updating vector store: {e}")

def query_vector_store(query_text: str, n_results: int = 5) -> str:
    """
    Queries the collection for documents similar to the query text.
    """
    if not query_text:
        return ""
    try:
        # Get the collection only when the function is called
        collection = _get_collection()
        results = collection.query(
            query_texts=[query_text],
            n_results=n_results
        )
        
        documents = results.get("documents", [[]])[0]
        return "\n".join(documents)
    except Exception as e:
        print(f"Error querying vector store: {e}")
        return ""

