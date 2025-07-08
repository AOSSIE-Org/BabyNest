from db.db import open_db

def handle(query: str):
    db = open_db()
    rows = db.execute("""
        SELECT week_number, symptom, note FROM weekly_symptoms ORDER BY week_number
    """).fetchall()

    if not rows:
        return "No symptoms found."

    return "\n".join(
        f"Week {r['week_number']}: {r['symptom']} - {r['note']}" for r in rows
    )
