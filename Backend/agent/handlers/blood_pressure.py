import re
import sqlite3
from db.db import open_db

def handle(query, user_context):
    """
    Parses blood pressure readings (systolic/diastolic) from the user query,
    validates the numeric ranges, and records the data into the database logs.
    """
    db = open_db()
    try:
        
        match = re.search(r'(\d{1,3})\s*(?:/|over|-)\s*(\d{1,3})', query, re.IGNORECASE)
        if not match:
            return "Please provide BP in format like '120/80' or '120 over 80'."
            
        systolic = int(match.group(1))
        diastolic = int(match.group(2))
        
        if not (70 <= systolic <= 250 and 40 <= diastolic <= 150):
            return "BP values out of valid range. Please check."

        week = user_context.get('week_number', 1)

        
        db.execute(
            'INSERT INTO blood_pressure_logs (week_number, systolic, diastolic, time) VALUES (?, ?, ?, datetime("now"))',
            (week, systolic, diastolic)
        )
        db.commit()
        return f"Recorded BP: {systolic}/{diastolic} for week {week}."
    except sqlite3.Error as e:
        return f"Database error: {str(e)}"
    except Exception as e:
        return f"Unexpected error: {str(e)}"
    finally:
        db.close()