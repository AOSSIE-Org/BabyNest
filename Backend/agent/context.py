from db.db import open_db

def get_structured_context():
    db = open_db()
    
    appointments = db.execute("""
        SELECT title, appointment_date, appointment_time, appointment_location, appointment_status 
        FROM appointments ORDER BY appointment_date
    """).fetchall()

    weights = db.execute("""
        SELECT week_number, weight, note FROM weekly_weight ORDER BY week_number
    """).fetchall()

    symptoms = db.execute("""
        SELECT week_number, symptom, note FROM weekly_symptoms ORDER BY week_number
    """).fetchall()

    result = "\nAppointments:\n"
    for a in appointments:
        result += f"- {a['title']} on {a['appointment_date']} at {a['appointment_time']} ({a['appointment_status']})\n"

    result += "\nWeight Logs:\n"
    for w in weights:
        result += f"- Week {w['week_number']}: {w['weight']}kg ({w['note']})\n"

    result += "\nSymptoms:\n"
    for s in symptoms:
        result += f"- Week {s['week_number']}: {s['symptom']} ({s['note']})\n"

    return result

def get_unstructured_context(query):
    # Placeholder - return static info for now
    return "Pregnancy-related health guidance snippets (offline)."
