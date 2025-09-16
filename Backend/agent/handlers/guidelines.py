from agent.guidelines_data import GUIDELINES

def handle(query: str, user_context=None):
    if not query or not isinstance(query, str):
        return "Invalid query. Please provide a valid string."
    
    try:
        if not GUIDELINES:
            return "No guidelines data available."
        
        response_parts = []
        
        if user_context:
            current_week = user_context.get('current_week', 'Unknown')
            location = user_context.get('location', 'India')
            response_parts.append(f"🩺 Pregnancy Guidelines for {location} (Week {current_week}):\n")
        else:
            response_parts.append("🩺 Pregnancy Guidelines (India):\n")
        
        for g in GUIDELINES:
            response_parts.append(f"- {g['title']} (Weeks: {g['week_range']})")
            response_parts.append(f"  Priority: {g['priority'].capitalize()} | Org: {', '.join(g['organization'])}")
            response_parts.append(f"  ➤ {g['purpose']}\n")
        
        return "\n".join(response_parts)
    
    except (KeyError, TypeError) as e:
        return f"Error processing guidelines data: {e}"
