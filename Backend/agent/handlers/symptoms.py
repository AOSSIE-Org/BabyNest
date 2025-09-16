from db.db import open_db

def handle(query: str, user_context=None):
    if not query or not isinstance(query, str):
        return "Invalid query. Please provide a valid string."
    
    try: 
        db = open_db()
        rows = db.execute("""
            SELECT week_number, symptom, note FROM weekly_symptoms ORDER BY week_number
        """).fetchall()

    except Exception as e:
        return f"Error retrieving symptoms: {e}"
    
    if not rows:
        return "No symptoms found."

    # Build response with user context if available
    response_parts = []
    
    if user_context:
        current_week = user_context.get('current_week', 'Unknown')
        response_parts.append(f"Current Status: You are in week {current_week} of pregnancy.")
        response_parts.append("")
    
    response_parts.append("Your Symptom Tracking:")
    response_parts.extend(
        f"• Week {r['week_number']}: {r['symptom']} - {r['note']}" for r in rows
    )
    
    return "\n".join(response_parts)
    
