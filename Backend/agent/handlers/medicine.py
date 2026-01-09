import re
import sqlite3
from db.db import open_db

def handle(query, user_context):
    """
    Extracts medicine name, dosage, and time from user query using regex 
    and persists the record into the weekly_medicine database table.
    """
    db = open_db()
    try:
        
        name_match = re.search(r'(?:took|taking|take)\s+([\w\s\-()]+?)(?:\s+\d|\s+at|$)', query, re.IGNORECASE)
        name = name_match.group(1).strip() if name_match else "Medicine"
        
        dose_match = re.search(r'(\d+\s*(?:tablet|pill|capsule|mg|ml|unit)s?)', query, re.IGNORECASE)
        dose = dose_match.group(1).strip() if dose_match else "1 unit"
        
        time_match = re.search(r'at\s+(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)', query, re.IGNORECASE)
        time = time_match.group(1) if time_match else "00:00"
        
        week = user_context.get('week_number', 1)

        db.execute(
            'INSERT INTO weekly_medicine (week_number, name, dose, time) VALUES (?, ?, ?, ?)',
            (week, name, dose, time)
        )
        db.commit()
        return f"Logged {name} ({dose}) at {time} for week {week}."
    except sqlite3.Error as e:
        return f"Database error: {str(e)}"
    except Exception as e:
        return f"Unexpected error: {str(e)}"
    finally:
        db.close()