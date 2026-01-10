import sqlite3
from datetime import datetime
from db.db import open_db

def handle(query, user_context):
    """
    Records medicine intake and provides proactive reminders based 
    on standard pregnancy supplement requirements.
    """
    db = open_db()
    try:
        # Standard supplements for pregnancy
        required_meds = ["iron", "folic acid", "calcium"]
        query_lower = query.lower()
        
        # Identify which medicine the user is logging
        logged_med = next((med for med in required_meds if med in query_lower), "medicine")
        
        week = user_context.get('week_number', 1)

        # Record the entry in the database
        db.execute(
            'INSERT INTO weekly_medicine_logs (week_number, medicine_name, status, time) VALUES (?, ?, ?, datetime("now"))',
            (week, logged_med, "taken")
        )
        db.commit()

        # --- PROACTIVE LOGIC ---
        # Remind user about other important meds if they only logged one
        missing_meds = [m for m in required_meds if m not in query_lower]
        
        response = f"✅ Logged your {logged_med} intake for week {week}."
        
        if missing_meds:
            response += f"\n\n💡 **Tip**: Don't forget to also take your {', '.join(missing_meds)} today as prescribed for your pregnancy stage."
        
        return response

    except sqlite3.Error as e:
        return f"Database error: {str(e)}"
    except Exception as e:
        return f"Unexpected error: {str(e)}"
    finally:
        db.close()