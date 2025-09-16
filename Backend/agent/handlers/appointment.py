from db.db import open_db

def handle(query: str, user_context=None):
    db = open_db()
    rows = db.execute("""
        SELECT title, appointment_date, appointment_time, appointment_location, appointment_status 
        FROM appointments ORDER BY appointment_date
    """).fetchall()

    if not rows:
        return "No appointments found."

    # Build response with user context if available
    response_parts = []
    
    if user_context:
        current_week = user_context.get('current_week', 'Unknown')
        response_parts.append(f"Current Status: You are in week {current_week} of pregnancy.")
        response_parts.append("")
    
    response_parts.append("Your Appointments:")
    response_parts.extend(
        f"• {r['title']} on {r['appointment_date']} at {r['appointment_time']} ({r['appointment_status']})"
        for r in rows
    )
    
    return "\n".join(response_parts)