import re

def _validate_weight_data(data: dict) -> bool:
    """Validate extracted weight data."""
    weight = data.get("weight")
    week = data.get("week")
    
    # Validate weight range (reasonable pregnancy weight range)
    if weight is not None and (weight <= 0 or weight > 300):
        return False
    
    # Validate week range (typical pregnancy is 1-42 weeks)
    if week is not None and (week < 1 or week > 42):
        return False
    
    return True

def extract_structured_data(query: str, intent: str) -> dict:
    """
    Extract structured data from query using simple pattern matching.
    This simulates what a properly prompted small LLM should do.
    """
    result = {"success": False, "data": {}, "confidence": 0.0}
    
    query_lower = query.lower()
    
    if intent == "weight":
        # Extract weight value - require explicit unit OR "weight" keyword near the number
        weight_match = re.search(
            r'(?:\bweight\b[^0-9]{0,10})?\b(\d+(?:\.\d+)?)\s*(?:kg|kilos?|kilograms?)\b',
            query_lower
        )
        week_match = re.search(r'(?:week|wk)\s*(\d+)', query_lower)
        
        if weight_match:
            result["data"]["weight"] = float(weight_match.group(1))
            result["data"]["week"] = int(week_match.group(1)) if week_match else None
            result["data"]["note"] = None
            
            # Validate extracted data
            if not _validate_weight_data(result["data"]):
                result["success"] = False
                result["data"] = {}
                result["confidence"] = 0.0
                return result
            
            result["success"] = True
            result["confidence"] = 0.9 if week_match else 0.7
    
    elif intent == "appointments":
        # Extract appointment components
        # Date patterns
        date_match = re.search(r'\b(today|tomorrow|next\s+week|\d{4}-\d{2}-\d{2}|\d{1,2}/\d{1,2}/\d{2,4})\b', query_lower)
        # Time patterns
        time_match = re.search(r'\b(\d{1,2}:\d{2}|\d{1,2}\s*(?:am|pm)|morning|afternoon|evening)\b', query_lower)
        # Action patterns
        action_match = re.search(r'\b(schedule|book|make|create|cancel|reschedule)\b', query_lower)
        
        if action_match:
            result["success"] = True
            result["data"]["action"] = action_match.group(1)
            result["data"]["date"] = date_match.group(1) if date_match else None
            result["data"]["time"] = time_match.group(1) if time_match else None
            result["confidence"] = 0.8 if (date_match or time_match) else 0.6
    
    elif intent == "symptoms":
        # Extract symptom information
        symptom_keywords = ['nausea', 'pain', 'tired', 'fatigue', 'headache', 'cramp', 'bleeding']
        found_symptoms = [s for s in symptom_keywords if s in query_lower]
        
        if found_symptoms:
            result["success"] = True
            result["data"]["symptoms"] = found_symptoms
            result["confidence"] = 0.8
    
    return result

def run_llm(prompt: str) -> str:
    """
    Run LLM inference. 
    
    For the offline BabyNest app:
    - This will be called from the frontend using Llama.rn
    - The frontend will handle the actual LLM inference
    - This function prepares the prompt for frontend processing
    
    Args:
        prompt: The formatted prompt with user context and query
        
    Returns:
        str: LLM response (will be replaced by frontend Llama.rn call)
    """
    # TODO: Replace with frontend Llama.rn integration
    # For now, return a structured response based on the prompt content
    
    if "weight" in prompt.lower():
        return """Based on your weight tracking data, you're showing a healthy pattern. 
        Your weight gain is within normal ranges for pregnancy. Continue monitoring weekly 
        and consult your healthcare provider if you notice any sudden changes."""
    
    elif "appointment" in prompt.lower():
        return """I can help you manage your appointments. Based on your current week, 
        you should focus on regular prenatal checkups. Would you like me to suggest 
        optimal scheduling times or help reschedule any missed appointments?"""
    
    elif "symptoms" in prompt.lower():
        return """I see you're tracking various symptoms. This is normal during pregnancy. 
        Continue monitoring and report any concerning symptoms to your healthcare provider. 
        Your tracking data helps identify patterns that may need attention."""
    
    else:
        return """I'm here to support your pregnancy journey! Based on your current week 
        and tracking data, you're doing well. Remember to stay hydrated, get adequate rest, 
        and maintain regular prenatal care. Is there anything specific you'd like to know 
        about your current pregnancy week?"""

def prepare_prompt_for_frontend(prompt: str) -> dict:
    """
    Prepare prompt for frontend Llama.rn processing.
    
    Args:
        prompt: The formatted prompt
        
    Returns:
        dict: Structured data for frontend LLM processing
    """
    return {
        "prompt": prompt,
        "max_tokens": 500,
        "temperature": 0.7,
        "system_message": "You are BabyNest, an empathetic pregnancy companion providing personalized, evidence-based guidance."
    }
