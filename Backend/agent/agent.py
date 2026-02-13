import os
import sys
import logging
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from agent.context import get_relevant_context_from_vector_store
from agent.intent import classify_intent
from agent.llm import run_llm
from agent.prompt import build_prompt
from agent.cache import get_context_cache
from agent.handlers import insights

from agent.handlers.appointment import handle as handle_appointments
from agent.handlers.weight import handle as handle_weight
from agent.handlers.symptoms import handle as handle_symptoms
from agent.handlers.guidelines import handle as handle_guidelines
from agent.handlers.medicine import handle as handle_medicine
from agent.handlers.blood_pressure import handle as handle_bp

from agent.vector_store import register_vector_store_updater, update_guidelines_in_vector_store

dispatch_intent = {
    "appointments": handle_appointments,
    "weight": handle_weight,
    "symptoms": handle_symptoms,
    "guidelines": handle_guidelines,
    "medicine": handle_medicine,
    "blood_pressure": handle_bp,
    "get_insights": insights.handle,
}

class BabyNestAgent:
    def __init__(self, db_path: str):
        self.db_path = db_path
        self.context_cache = get_context_cache(db_path)
        register_vector_store_updater(update_guidelines_in_vector_store)
    
    def get_user_context(self, user_id: str = "default"):
        return self.context_cache.get_context(user_id)
    
    def run(self, query: str, user_id: str = "default"):
        if not query or not isinstance(query, str):
            return "Invalid query."
        
        try:
            user_context = self.get_user_context(user_id) or {"current_week": 1}
            intent = classify_intent(query)
            logging.info("Detected Intent: %s", intent)
            
            if intent in dispatch_intent:
                return dispatch_intent[intent](query, user_context)
            
            context = get_relevant_context_from_vector_store(query)
            prompt = build_prompt(query, context, user_context)
            return run_llm(prompt)
        except Exception as e:
            logging.exception("Error processing query")
            return f"Error processing query: {e!s}"

_agent_instance = None
def get_agent(db_path: str) -> BabyNestAgent:
    global _agent_instance
    if _agent_instance is None:
        _agent_instance = BabyNestAgent(db_path)
    return _agent_instance