import re
import sqlite3
from db.db import open_db

def handle(query, user_context):
    """
    Extracts BP readings, validates thresholds for pregnancy safety, 
    and logs data into the database.
    """
    db = open_db()
    try:
        # Improved regex to capture systolic and diastolic values
        match = re.search(r'(\d{1,3})\s*(?:/|over|-)\s*(\d{1,3})', query, re.IGNORECASE)
        if not match:
            return "Please provide BP in format like '120/80' or '120 over 80'."
            
        systolic = int(match.group(1))
        diastolic = int(match.group(2))
        
        # Basic physiological range validation
        if not (70 <= systolic <= 250 and 40 <= diastolic <= 150):
            return "BP values out of valid range. Please check and try again."

        week = user_context.get('week_number', 1)

        # Database persistence
        db.execute(
            'INSERT INTO blood_pressure_logs (week_number, systolic, diastolic, time) VALUES (?, ?, ?, datetime("now"))',
            (week, systolic, diastolic)
        )
        db.commit()

        # --- MEDICAL ALERT LOGIC ---
        # Thresholds based on pregnancy-induced hypertension (PIH) guidelines
        if systolic >= 140 or diastolic >= 90:
            return (f"🚨 **URGENT ALERT**: Your BP is {systolic}/{diastolic}. This is classified as High Blood Pressure (Hypertension). "
                    "In pregnancy, this requires immediate attention. Please rest and **contact your doctor right away**.")
        
        elif systolic <= 90 or diastolic <= 60:
            return (f"⚠️ **WARNING**: Your BP is {systolic}/{diastolic}, which is low. "
                    "Ensure you are hydrated and notify your healthcare provider if you feel faint.")
        
        else:
            return f"✅ Recorded BP: {systolic}/{diastolic} for week {week}. Your reading is within the healthy range."

    except sqlite3.Error as e:
        return f"Database error: {str(e)}"
    except Exception as e:
        return f"Unexpected error: {str(e)}"
    finally:
        db.close()