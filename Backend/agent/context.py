import sqlite3
from agent.vector_store import update_vector_store, query_vector_store

def _format_data_for_embedding(db: sqlite3.Connection) -> tuple[list, list, list]:
    """
    Fetches structured data and formats it into individual documents for embedding.
    """
    docs, ids, metadatas = [], [], []

    # Fetch and format appointments
    appointments = db.execute("SELECT title, appointment_date, appointment_time, appointment_status FROM appointments ORDER BY appointment_date").fetchall()
    for i, a in enumerate(appointments):
        doc_content = f"Appointment: {a['title']} on {a['appointment_date']} at {a['appointment_time']} (Status: {a['appointment_status']})"
        docs.append(doc_content)
        ids.append(f"appt_{a['id']}")
        metadatas.append({"source": "appointments"})

    # Fetch and format weight logs
    weights = db.execute("SELECT week_number, weight, note FROM weekly_weight ORDER BY week_number").fetchall()
    for i, w in enumerate(weights):
        doc_content = f"Weight Log Week {w['week_number']}: {w['weight']}kg. Note: {w['note']}"
        docs.append(doc_content)
        ids.append(f"weight_{a['id']}")
        metadatas.append({"source": "weight_logs"})
    
    # Fetch and format symptoms
    symptoms = db.execute("SELECT week_number, symptom, note FROM weekly_symptoms ORDER BY week_number").fetchall()
    for i, s in enumerate(symptoms):
        doc_content = f"Symptom Week {s['week_number']}: {s['symptom']}. Note: {s['note']}"
        docs.append(doc_content)
        ids.append(f"symptom_{a['id']}")
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
    Retrieves context from the vector store that is semantically relevant to the user's query.
    Also includes static, general guidance.
    """
    # Query ChromaDB for relevant data based on the user's input
    queried_context = query_vector_store(query, n_results=5)
    
    # Placeholder for general, non-vectorized knowledge
    guidance = "Pregnancy-related health guidance snippets (offline)."
    
    return f"{queried_context}\n\n{guidance}"

