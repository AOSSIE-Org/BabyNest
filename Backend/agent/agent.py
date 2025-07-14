from agent.context import get_structured_context, get_unstructured_context
from agent.intent import classify_intent
from agent.llm import run_llm
from agent.prompt import build_prompt

# FIXED: no circular import
from agent.handlers.appointment import handle as handle_appointments
from agent.handlers.weight import handle as handle_weight
from agent.handlers.symptoms import handle as handle_symptoms
from agent.handlers.guidelines import handle as handle_guidelines

dispatch_intent = {
    "appointments": handle_appointments,
    "weight": handle_weight,
    "symptoms": handle_symptoms,
    "guidelines": handle_guidelines,
}

class BabyNestAgent:
    def run(self, query: str, user_id: str):
        if not query or not isinstance(query, str):
            return "Invalid query. Please provide a valid string."
        
        try:
            structured = get_structured_context()
            unstructured = get_unstructured_context(query)

            intent = classify_intent(query)
            if intent in dispatch_intent:
                return dispatch_intent[intent](query)

            prompt = build_prompt(query, structured, unstructured)
            return run_llm(prompt)
        
        except Exception as e:
            return f"Error processing query: {e}"