import sqlite3
from agent.vector_store import update_vector_store, query_vector_store

def _format_data_for_embedding(db: sqlite3.Connection) -> tuple[list, list, list]:
    """
    Fetches structured data and formats it into individual documents for embedding.
    """
    docs, ids, metadatas = [], [], []

    # Fetch and format appointments (using tuple indexing)
    appointments = db.execute("SELECT title, appointment_date, appointment_time, appointment_status FROM appointments ORDER BY appointment_date").fetchall()
    for i, a in enumerate(appointments):
        doc_content = f"Appointment: {a[0]} on {a[1]} at {a[2]} (Status: {a[3]})"
        docs.append(doc_content)
        ids.append(f"appt_{i}")  # Use enumerate index for unique ID
        metadatas.append({"source": "appointments"})

    # Fetch and format weight logs
    weights = db.execute("SELECT week_number, weight, note FROM weekly_weight ORDER BY week_number").fetchall()
    for i, w in enumerate(weights):
        doc_content = f"Weight Log Week {w[0]}: {w[1]}kg. Note: {w[2]}"
        docs.append(doc_content)
        ids.append(f"weight_{i}")  # Use enumerate index for unique ID
        metadatas.append({"source": "weight_logs"})
    
    # Fetch and format symptoms
    symptoms = db.execute("SELECT week_number, symptom, note FROM weekly_symptoms ORDER BY week_number").fetchall()
    for i, s in enumerate(symptoms):
        doc_content = f"Symptom Week {s[0]}: {s[1]}. Note: {s[2]}"
        docs.append(doc_content)
        ids.append(f"symptom_{i}")  # Use enumerate index for unique ID
        metadatas.append({"source": "symptoms"})
        
    return docs, ids, metadatas

def update_structured_context_in_vector_store():
    """
    Fetches the latest structured data from the main database
    and updates it in the ChromaDB vector store.
    """
    db = None
    try:
        # Connect directly to the SQLite DB
        db = sqlite3.connect("db/database.db")
        db.row_factory = sqlite3.Row
        
        docs, ids, metadatas = _format_data_for_embedding(db)
        
        # Update ChromaDB with the latest data
        update_vector_store(documents=docs, ids=ids, metadatas=metadatas)
        
    except Exception as e:
        print(f"Error updating structured context in vector store: {e}")
    finally:
        if db:
            db.close()

def get_relevant_context_from_vector_store(query: str) -> str:
    """
    Retrieve relevant context from the vector store based on the query.
    """
    try:
        # Query the vector store for relevant guidelines
        relevant_docs = query_vector_store(query, n_results=3)
        
        if relevant_docs:
            # Join the documents into a single context string
            context = "\n\n".join(relevant_docs)
            return context
        else:
            return "Pregnancy-related health guidance snippets (offline)."
            
    except Exception as e:
        print(f"Error retrieving context: {e}")
        return "Pregnancy-related health guidance snippets (offline)."

def initialize_knowledge_base():
    """
    Initialize the knowledge base with pregnancy guidelines.
    Call this once when the app starts.
    """
    try:
        success = update_vector_store()
        if success:
            print("Knowledge base initialized successfully")
        else:
            print("Failed to initialize knowledge base")
        return success
    except Exception as e:
        print(f"Error initializing knowledge base: {e}")
        return False

