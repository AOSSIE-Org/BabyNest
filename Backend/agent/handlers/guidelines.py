from agent.guidelines_data import GUIDELINES

def handle(query: str):
    if not query or not isinstance(query, str):
        return "Invalid query. Please provide a valid string."
    
    try:
        if not GUIDELINES:
            return "No guidelines data available."
        
        response = "🩺 Pregnancy Guidelines (India):\n\n"
        for g in GUIDELINES:
            response += f"- {g['title']} (Weeks: {g['week_range']})\n"
            response += f"  Priority: {g['priority'].capitalize()} | Org: {', '.join(g['organization'])}\n"
            response += f"  ➤ {g['purpose']}\n\n"
        return response
    
    except (KeyError, TypeError) as e:
        return f"Error processing guidelines data: {e}"
