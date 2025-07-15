from agent.context import update_structured_context_in_vector_store, get_relevant_context_from_vector_store
from agent.intent import classify_intent
from agent.llm import run_llm
from agent.prompt import build_prompt

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
            # Step 1: Update the vector store with the latest structured data from the database.
            # This ensures the context is always fresh.
            update_structured_context_in_vector_store()

            # Step 2: Classify intent to see if a specialized handler should be used.
            intent = classify_intent(query)
            if intent in dispatch_intent:
                return dispatch_intent[intent](query)
            
            # Step 3: Retrieve relevant context from the vector store based on the query.
            context = get_relevant_context_from_vector_store(query)
            
            # Step 4: Build the prompt with the retrieved context and run the LLM.
            prompt = build_prompt(query, context) # Pass the single context string
            return run_llm(prompt)
            
        except Exception as e:
            return f"Error processing query: {e}"

