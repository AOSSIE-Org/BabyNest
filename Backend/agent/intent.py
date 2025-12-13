# agent/intent.py
import re

def classify_intent(query: str) -> tuple[str, float]:
    """
    Classify user intent with confidence scoring.
    Returns: (intent, confidence_score)
    """
    if not query or not isinstance(query, str):
        return "general", 0.5
    
    query = query.lower()
    
    # Define intent patterns with weighted keywords
    intent_patterns = {
        "appointments": {
            "strong": ["schedule", "book", "appointment", "reschedule", "cancel appointment"],
            "medium": ["doctor", "checkup", "visit", "meeting"],
            "weak": ["when", "date", "time"]
        },
        "weight": {
            "strong": ["log weight", "record weight", "my weight", r"\d+\s*kg"],
            "medium": ["weight", "weigh", "gained", "lost"],
            "weak": ["heavy", "scale"]
        },
        "symptoms": {
            "strong": ["symptom", "feeling", "experiencing", "hurts", "pain"],
            "medium": ["nausea", "tired", "fatigue", "sick", "uncomfortable"],
            "weak": ["feel", "strange"]
        },
        "guidelines": {
            "strong": ["guideline", "recommend", "should i", "what tests", "advice"],
            "medium": ["vaccine", "nutrition", "exercise", "dos and don'ts"],
            "weak": ["help", "info", "tell me"]
        }
    }
    
    # Calculate confidence scores for each intent
    scores = {}
    for intent, patterns in intent_patterns.items():
        score = 0.0
        
        # Strong matches (weight: 1.0)
        for pattern in patterns["strong"]:
            if re.search(pattern, query):
                score += 1.0
        
        # Medium matches (weight: 0.6)
        for pattern in patterns["medium"]:
            if re.search(pattern, query):
                score += 0.6
        
        # Weak matches (weight: 0.3)
        for pattern in patterns["weak"]:
            if re.search(pattern, query):
                score += 0.3
        
        scores[intent] = score
    
    # Get best intent
    if scores:
        best_intent = max(scores, key=scores.get)
        confidence = min(scores[best_intent], 1.0)  # Cap at 1.0
        
        if confidence >= 0.5:
            return best_intent, confidence
    
    return "general", 0.3
