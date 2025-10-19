from db.db import open_db
import re

def parse_symptom_command(query: str):
    """Parse symptom logging commands from natural language."""
    query_lower = query.lower()
    
    # Extract symptom description
    symptom_patterns = [
        r'(?:log|record|add|symptom|symptoms?)\s+(.+?)(?:\s+for\s+week\s+(\d+))?(?:\s+note\s+(.+))?$',
        r'(?:symptom|symptoms?)\s+(.+?)(?:\s+week\s+(\d+))?(?:\s+note\s+(.+))?$',
    ]
    
    symptom = None
    week = None
    note = None
    
    for pattern in symptom_patterns:
        match = re.search(pattern, query_lower)
        if match:
            symptom = match.group(1).strip()
            if len(match.groups()) > 1 and match.group(2):
                week = int(match.group(2))
            if len(match.groups()) > 2 and match.group(3):
                note = match.group(3).strip()
            break
    
    # Extract week if not found above
    if not week:
        week_match = re.search(r'(?:week|for\s+week)\s+(\d+)', query_lower)
        if week_match:
            week = int(week_match.group(1))
    
    # Extract note if not found above
    if not note:
        note_match = re.search(r'(?:note|comment)\s+(.+)', query_lower)
        if note_match:
            note = note_match.group(1).strip()
    
    return {
        'symptom': symptom,
        'week': week,
        'note': note
    }

def create_symptom_entry(symptom_data, user_context):
    """Create a new symptom entry in the database."""
    db = open_db()
    
    try:
        # Use current week if not specified
        week = symptom_data['week'] or user_context.get('current_week', 1)
        
        db.execute(
            'INSERT INTO weekly_symptoms (week_number, symptom, note) VALUES (?, ?, ?)',
            (week, symptom_data['symptom'], symptom_data['note'] or 'Logged via chat')
        )
        db.commit()
        return True
    except Exception as e:
        print(f"Error creating symptom entry: {e}")
        return False

def handle(query: str, user_context=None):
    if not query or not isinstance(query, str):
        return "Invalid query. Please provide a valid string."
    
    query_lower = query.lower()
    
    # Check if this is a symptom logging command
    if any(word in query_lower for word in ['log', 'record', 'add', 'symptom']):
        parsed = parse_symptom_command(query)
        
        if parsed['symptom']:
            if create_symptom_entry(parsed, user_context):
                week = parsed['week'] or user_context.get('current_week', 'current')
                return f"✅ Symptom '{parsed['symptom']}' has been logged for week {week}"
            else:
                return "❌ Failed to log symptom. Please try again."
        else:
            return "❌ Could not understand the symptom description. Please specify what symptom you're experiencing."
    
    # Default: show symptom records
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
    
