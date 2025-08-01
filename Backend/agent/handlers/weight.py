from db.db import open_db

def handle(query: str, user_context=None):
    if not query or not isinstance(query, str):
        return "Invalid query. Please provide a valid string."
    
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
