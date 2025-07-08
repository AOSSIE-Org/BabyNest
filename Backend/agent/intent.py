# agent/intent.py
def classify_intent(query: str) -> str:
    query = query.lower()
    if "appointment" in query:
        return "appointments"
    elif "weight" in query:
        return "weight"
    elif "symptom" in query:
        return "symptoms"
    elif "vaccine" in query or "guideline" in query or "what tests" in query or "recommend" in query:
        return "guidelines"
    return "general"
