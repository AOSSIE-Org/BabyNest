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
            "strong": [r"\bschedule\b", r"\bbook\b", r"\bappointment\b", r"\breschedule\b", r"\bcancel appointment\b"],
            "medium": [r"\bdoctor\b", r"\bcheckup\b", r"\bvisit\b", r"\bmeeting\b"],
            "weak": []
        },
        "weight": {
            "strong": [r"\blog +weight\b", r"\brecord +weight\b", r"\bmy +weight\b", r"\d+(?:\.\d+)?\s*kg"],
            "medium": [r"\bweight\b", r"\bweigh\b", r"\bgained\b", r"\blost\b"],
            "weak": []
        },
        "symptoms": {
            "strong": [r"\bsymptom\b", r"\bfeeling\b", r"\bexperiencing\b", r"\bhurts\b", r"\bpain\b"],
            "medium": [r"\bnausea\b", r"\btired\b", r"\bfatigue\b", r"\bsick\b", r"\buncomfortable\b"],
            "weak": []
        },
        "guidelines": {
            "strong": [r"\bguideline\b", r"\brecommend\b", r"\bshould +i\b", r"\bwhat +tests\b", r"\badvice\b"],
            "medium": [r"\bvaccine\b", r"\bnutrition\b", r"\bexercise\b", r"\bdos +and +don'ts\b"],
            "weak": []
        }
    }
    
    # Calculate confidence scores for each intent
    scores = {}
    for intent, patterns in intent_patterns.items():
        strong_score = 0.0
        medium_score = 0.0
        weak_score = 0.0
        
        # Strong matches (weight: 1.0) - take max, not sum
        for pattern in patterns["strong"]:
            if re.search(pattern, query):
                strong_score = 1.0
                break
        
        # Medium matches (weight: 0.6) - take max, not sum
        for pattern in patterns["medium"]:
            if re.search(pattern, query):
                medium_score = 0.6
                break
        
        # Weak matches (weight: 0.3) - take max, not sum
        for pattern in patterns["weak"]:
            if re.search(pattern, query):
                weak_score = 0.3
                break
        
        score = strong_score + medium_score + weak_score
        scores[intent] = score
    
    # Get best intent
    if scores:
        best_intent = max(scores, key=scores.get)
        confidence = min(scores[best_intent], 1.0)  # Cap at 1.0
        
        if confidence >= 0.5:
            return best_intent, confidence
    
    return "general", 0.3
