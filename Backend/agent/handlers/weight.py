from db.db import open_db
import re

def parse_weight_command(query: str):
    """Parse weight logging commands from natural language."""
    query_lower = query.lower()
    
    # Extract weight value
    weight_patterns = [
        r'(?:log|record|add|my\s+weight\s+as|weight\s+is|weight\s+)\s*(\d+(?:\.\d+)?)\s*(?:kg|kilos|kgs|lb|lbs|pound|pounds)?',
        r'(\d+(?:\.\d+)?)\s*(?:kg|kilos?)(?:\s+for\s+week\s+(\d+))?',
    ]
    
    weight = None
    week = None
    
    for pattern in weight_patterns:
        match = re.search(pattern, query_lower)
        if match:
            weight = float(match.group(1))
            if len(match.groups()) > 1 and match.group(2):
                week = int(match.group(2))
            break
    
    # Extract week if not found above
    if not week:
        week_match = re.search(r'(?:week|for\s+week)\s+(\d+)', query_lower)
        if week_match:
            week = int(week_match.group(1))
    
    # Extract note
    note_match = re.search(r'\b(?:note|comment|felt|feel|feeling)\b\s+(.+)', query_lower)
    note = note_match.group(1).strip() if note_match else None
    
    return {
        'weight': weight,
        'week': week,
        'note': note
    }

def create_weight_entry(weight_data, user_context):
    """Create a new weight entry in the database."""
    db = open_db()
    
    try:
        # Use current week if not specified
        week = weight_data['week'] or user_context.get('current_week', 1)
        
        db.execute(
            'INSERT INTO weekly_weight (week_number, weight, note) VALUES (?, ?, ?)',
            (week, weight_data['weight'], weight_data['note'] or 'Logged via chat')
        )
        db.commit()
        return True
    except Exception as e:
        print(f"Error creating weight entry: {e}")
        return False

def handle(query: str, user_context=None):
    if not query or not isinstance(query, str):
        return "Invalid query. Please provide a valid string."
    
    query_lower = query.lower()
    
    # Check if this is a weight logging command
    if any(word in query_lower for word in ['log', 'record', 'add', 'weight']) and any(char.isdigit() for char in query):
        parsed = parse_weight_command(query)
        
        if parsed['weight']:
            if create_weight_entry(parsed, user_context):
                week = parsed['week'] or user_context.get('current_week', 'current')
                return f"✅ Weight of {parsed['weight']}kg has been logged for week {week}"
            else:
                return "❌ Failed to log weight. Please try again."
        else:
            return "❌ Could not understand the weight value. Please specify your weight in kg."
    
    # Default: show weight records
    try:
        db = open_db()
        rows = db.execute("""
            SELECT week_number, weight, note FROM weekly_weight ORDER BY week_number
        """).fetchall()

    except Exception as e:
        return f"Error retrieving weight records: {e}"
    
    if not rows:
        return "No weight records available."

    # Build response with user context if available
    response_parts = []
    
    if user_context:
        current_week = user_context.get('current_week', 'Unknown')
        current_weight = user_context.get('weight', 'Unknown')
        response_parts.append(f"Current Status: You are in week {current_week} with a weight of {current_weight} kg.")
        
        # Check for weight trends
        weight_data = user_context.get('tracking_data', {}).get('weight', [])
        if len(weight_data) >= 2:
            recent_weights = weight_data[-2:]  # Last 2 entries
            if len(recent_weights) == 2:
                weight_change = recent_weights[1]['weight'] - recent_weights[0]['weight']
                if weight_change > 0:
                    response_parts.append(f"Weight trend: You've gained {weight_change:.1f} kg recently.")
                elif weight_change < 0:
                    response_parts.append(f"Weight trend: You've lost {abs(weight_change):.1f} kg recently.")
                else:
                    response_parts.append("Weight trend: Your weight has been stable recently.")
    
    # Add weight records
    response_parts.append("\nWeight Records:")
    response_parts.extend(
        f"Week {r['week_number']}: {r['weight']}kg - {r['note']}" for r in rows
    )
    
    return "\n".join(response_parts)