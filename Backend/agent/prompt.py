def build_prompt(query, context, user_context=None):
    """
    Build a comprehensive prompt with user context and retrieved knowledge.
    
    Args:
        query: User's question
        context: Retrieved knowledge from vector store
        user_context: User's profile and tracking data from cache
    """
    
    # Build user context section
    user_context_section = ""
    if user_context:
        user_context_section = f"""
User Profile & Current Status:
- Pregnancy Week: {user_context.get('current_week', 'Unknown')}
- Location: {user_context.get('location', 'Unknown')}
- Age: {user_context.get('age', 'Unknown')}
- Current Weight: {user_context.get('weight', 'Unknown')} kg
- Due Date: {user_context.get('due_date', 'Unknown')}

Recent Tracking Data:
- Weight Tracking: {len(user_context.get('tracking_data', {}).get('weight', []))} recent entries
- Medicine Taken: {len(user_context.get('tracking_data', {}).get('medicine', []))} recent entries
- Symptoms: {len(user_context.get('tracking_data', {}).get('symptoms', []))} recent entries
- Blood Pressure: {len(user_context.get('tracking_data', {}).get('blood_pressure', []))} recent entries
- Discharge: {len(user_context.get('tracking_data', {}).get('discharge', []))} recent entries

Detailed Tracking:
{_format_tracking_data(user_context.get('tracking_data', {}))}
"""
    
    return f"""
You are BabyNest, an inclusive, empathetic, and knowledgeable pregnancy companion. You provide personalized, evidence-based guidance while being culturally sensitive and supportive.

{user_context_section}

User Query: {query}

Relevant Knowledge Base Information:
{context}

Instructions:
1. Consider the user's current pregnancy week and location when providing advice
2. Be inclusive, supportive, and culturally sensitive
3. Provide structured, actionable responses
4. If the user's tracking data shows concerning patterns, address them gently
5. Always prioritize safety and recommend consulting healthcare providers when appropriate
6. Use a warm, caring tone while being informative

Please provide a comprehensive, personalized response:
"""

def _format_tracking_data(tracking_data):
    """Format tracking data for the prompt."""
    if not tracking_data:
        return "No recent tracking data available."
    
    formatted = []
    
    # Weight data
    weight_data = tracking_data.get('weight', [])
    if weight_data:
        formatted.append("Weight Tracking:")
        for entry in weight_data[-3:]:  # Last 3 entries
            formatted.append(f"  Week {entry['week']}: {entry['weight']} kg - {entry['note']}")
    
    # Medicine data
    medicine_data = tracking_data.get('medicine', [])
    if medicine_data:
        formatted.append("Medicine Tracking:")
        for entry in medicine_data[-3:]:  # Last 3 entries
            status = "✓ Taken" if entry['taken'] else "✗ Missed"
            formatted.append(f"  Week {entry['week']}: {entry['name']} ({entry['dose']}) at {entry['time']} - {status}")
    
    # Symptoms data
    symptoms_data = tracking_data.get('symptoms', [])
    if symptoms_data:
        formatted.append("Recent Symptoms:")
        for entry in symptoms_data[-3:]:  # Last 3 entries
            formatted.append(f"  Week {entry['week']}: {entry['symptom']} - {entry['note']}")
    
    # Blood pressure data
    bp_data = tracking_data.get('blood_pressure', [])
    if bp_data:
        formatted.append("Blood Pressure:")
        for entry in bp_data[-3:]:  # Last 3 entries
            formatted.append(f"  Week {entry['week']}: {entry['systolic']}/{entry['diastolic']} at {entry['time']} - {entry['note']}")
    
    return "\n".join(formatted) if formatted else "No recent tracking data available."
