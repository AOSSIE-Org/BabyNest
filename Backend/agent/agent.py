import os
import sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from agent.context import get_relevant_context_from_vector_store
from agent.intent import classify_intent
from agent.llm import run_llm
from agent.prompt import build_prompt
from agent.cache import get_context_cache
from agent.db_observer import get_db_observer

from agent.handlers.appointment import handle as handle_appointments
from agent.handlers.weight import handle as handle_weight
from agent.handlers.symptoms import handle as handle_symptoms
from agent.handlers.guidelines import handle as handle_guidelines

from agent.vector_store import register_vector_store_updater, update_vector_store

dispatch_intent = {
    "appointments": handle_appointments,
    "weight": handle_weight,
    "symptoms": handle_symptoms,
    "guidelines": handle_guidelines,
}

class BabyNestAgent:
    def __init__(self, db_path: str):
        self.db_path = db_path
        self.context_cache = get_context_cache(db_path)
        
        # Set up database observer for automatic cache invalidation
        def cache_invalidator():
            self.context_cache.invalidate_cache()
        
        # Register embedding refresh
        register_vector_store_updater(update_vector_store)

        # Set up database observer
        def cache_invalidator():
            print("🔄 DB change detected → invalidating context + regenerating embeddings")
            self.context_cache.invalidate_cache()
            update_vector_store()

        self.db_observer = get_db_observer(db_path, cache_invalidator)
        self.db_observer.start()
    
    def get_user_context(self, user_id: str = "default"):
        """Get user context from cache."""
        return self.context_cache.get_context(user_id)
    
    def run(self, query: str, user_id: str = "default"):
        if not query or not isinstance(query, str):
            return "Invalid query. Please provide a valid string."
        
        try:
            # Step 1: Get user context from cache (no DB hit if cache is valid)
            user_context = self.get_user_context(user_id)
            if not user_context:
                return "User profile not found. Please complete your profile setup first."
            
            # Step 2: Classify intent to see if a specialized handler should be used.
            intent = classify_intent(query)
            if intent in dispatch_intent:
                # Pass user context to handlers
                return dispatch_intent[intent](query, user_context)
            
            # Step 3: Retrieve relevant context from the vector store based on the query.
            context = get_relevant_context_from_vector_store(query)
            
            # Step 4: Build the prompt with the retrieved context and user context, then run the LLM.
            prompt = build_prompt(query, context, user_context)
            return run_llm(prompt)
            
        except Exception as e:
            return f"Error processing query: {e}"
    
    def force_refresh_context(self, user_id: str = "default"):
        """Force refresh the context cache for a user."""
        return self.context_cache.force_refresh(user_id)
    
    def invalidate_cache(self, user_id: str = None):
        """Invalidate cache for specific user or all users."""
        self.context_cache.invalidate_cache(user_id)
    
    def stop(self):
        """Stop the database observer."""
        self.db_observer.stop()

# Global agent instance
_agent_instance = None

def get_agent(db_path: str) -> BabyNestAgent:
    """Get or create the global agent instance."""
    global _agent_instance
    if _agent_instance is None:
        _agent_instance = BabyNestAgent(db_path)
    return _agent_instance

