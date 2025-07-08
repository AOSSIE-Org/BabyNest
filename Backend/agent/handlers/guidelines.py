from agent.guidelines_data import GUIDELINES

def handle(query: str):
    response = "🩺 Pregnancy Guidelines (India):\n\n"
    for g in GUIDELINES:
        response += f"- {g['title']} (Weeks: {g['week_range']})\n"
        response += f"  Priority: {g['priority'].capitalize()} | Org: {', '.join(g['organization'])}\n"
        response += f"  ➤ {g['purpose']}\n\n"
    return response
