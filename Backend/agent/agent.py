import os
import sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from agent.context import get_relevant_context_from_vector_store
from agent.intent import classify_intent
from agent.llm import run_llm
from agent.prompt import build_prompt
from agent.cache import get_context_cache

from agent.handlers.appointment import handle as handle_appointments
from agent.handlers.weight import handle as handle_weight
from agent.handlers.symptoms import handle as handle_symptoms
from agent.handlers.guidelines import handle as handle_guidelines

from agent.vector_store import register_vector_store_updater, update_guidelines_in_vector_store

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
        
        # Register embedding refresh
        register_vector_store_updater(update_guidelines_in_vector_store)
    
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
    
    def update_cache(self, user_id: str = "default", data_type: str = None, operation: str = "update"):
        """
        Intelligently update cache based on database changes.
        
        Args:
            user_id: User ID to update cache for
            data_type: Type of data that changed ('profile', 'weight', 'medicine', 'symptoms', 'blood_pressure', 'discharge')
            operation: Type of operation ('create', 'update', 'delete')
        """
        self.context_cache.update_cache(user_id, data_type, operation)
    
    def invalidate_cache(self, user_id: str = None):
        """Invalidate cache for specific user or all users."""
        self.context_cache.invalidate_cache(user_id)
    
    def refresh_cache_and_embeddings(self):
        """Manually refresh cache and regenerate embeddings after database changes."""
        print("🔄 Manually refreshing cache and regenerating embeddings...")
        self.context_cache.invalidate_cache()
        update_guidelines_in_vector_store()
    
    def get_cache_stats(self):
        """Get cache statistics for monitoring."""
        return self.context_cache.get_cache_stats()
    
    def cleanup_cache(self):
        """Manually trigger cache cleanup."""
        self.context_cache._cleanup_old_cache_files()
        self.context_cache._cleanup_memory_cache()
        print("🧹 Cache cleanup completed")

# Global agent instance
_agent_instance = None

def get_agent(db_path: str) -> BabyNestAgent:
    """Get or create the global agent instance."""
    global _agent_instance
    if _agent_instance is None:
        _agent_instance = BabyNestAgent(db_path)
    return _agent_instance

