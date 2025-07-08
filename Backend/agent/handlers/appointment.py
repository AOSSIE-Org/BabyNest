from db.db import open_db

def handle(query: str):
    db = open_db()
    rows = db.execute("""
        SELECT title, appointment_date, appointment_time, appointment_location, appointment_status 
        FROM appointments ORDER BY appointment_date
    """).fetchall()

    if not rows:
        return "No appointments found."

    return "\n".join(
        f"{r['title']} on {r['appointment_date']} at {r['appointment_time']} ({r['appointment_status']})"
        for r in rows
    )
from db.db import open_db

def handle(query: str):
    db = open_db()
    rows = db.execute("""
        SELECT title, appointment_date, appointment_time, appointment_location, appointment_status 
        FROM appointments ORDER BY appointment_date
    """).fetchall()

    if not rows:
        return "No appointments found."

    return "\n".join(
        f"{r['title']} on {r['appointment_date']} at {r['appointment_time']} ({r['appointment_status']})"
        for r in rows
    )
