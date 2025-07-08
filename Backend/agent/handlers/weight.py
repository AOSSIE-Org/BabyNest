from db.db import open_db

def handle(query: str):
    db = open_db()
    rows = db.execute("""
        SELECT week_number, weight, note FROM weekly_weight ORDER BY week_number
    """).fetchall()

    if not rows:
        return "No weight records available."

    return "\n".join(
        f"Week {r['week_number']}: {r['weight']}kg - {r['note']}" for r in rows
    )
