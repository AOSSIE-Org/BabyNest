def classify_intent(query: str) -> str:
    if not query or not isinstance(query, str):
        return "general"
    
    query = query.lower()
    
    if any(word in query for word in ["summary", "report", "insight", "dashboard", "track"]):
        return "get_insights"
    
    if "appointment" in query:
        return "appointments"
    elif "weight" in query:
        return "weight"
    elif "symptom" in query:
        return "symptoms"
    elif "medicine" in query or "took" in query or "tablet" in query or "pill" in query:
        return "medicine"
    elif "bp" in query or "blood pressure" in query or "/" in query:
        return "blood_pressure"
    elif "vaccine" in query or "guideline" in query or "what tests" in query or "recommend" in query:
        return "guidelines"
        
    return "general"