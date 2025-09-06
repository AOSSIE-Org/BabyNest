import json
import os
import sqlite3
import threading
import time
from datetime import datetime, date
from typing import Dict, Optional, Any
import hashlib

class ContextCache:
    def __init__(self, db_path: str, cache_dir: str = "cache"):
        self.db_path = db_path
        self.cache_dir = cache_dir
        self.memory_cache: Dict[str, Dict[str, Any]] = {}
        self.cache_lock = threading.Lock()
        
        # Ensure cache directory exists
        os.makedirs(cache_dir, exist_ok=True)
        
        # Initialize cache
        self._load_cache()
    
    def _get_cache_file_path(self, user_id: str) -> str:
        """Get the cache file path for a specific user."""
        return os.path.join(self.cache_dir, f"context_{user_id}.json")
    
    def _load_cache(self):
        """Load cache from disk files."""
        if not os.path.exists(self.cache_dir):
            return
        
        for filename in os.listdir(self.cache_dir):
            if filename.startswith("context_") and filename.endswith(".json"):
                user_id = filename[8:-5]  # Remove "context_" prefix and ".json" suffix
                file_path = os.path.join(self.cache_dir, filename)
                
                try:
                    with open(file_path, 'r') as f:
                        cache_data = json.load(f)
                        self.memory_cache[user_id] = cache_data
                except (json.JSONDecodeError, FileNotFoundError):
                    continue
    
    def _save_cache(self, user_id: str, context_data: Dict[str, Any]):
        """Save context data to disk cache."""
        file_path = self._get_cache_file_path(user_id)
        try:
            with open(file_path, 'w') as f:
                json.dump(context_data, f, indent=2, default=str)
        except Exception as e:
            print(f"Error saving cache for user {user_id}: {e}")
    
    def _build_context(self) -> Dict[str, Any]:
        """Build context from database."""
        conn = None
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            # Get profile data
            cursor.execute("""
                SELECT lmp, cycleLength, periodLength, age, weight, user_location, dueDate
                FROM profile ORDER BY id DESC LIMIT 1
            """)
            profile = cursor.fetchone()
            
            if not profile:
                conn.close()
                return None
            
            lmp, cycle_length, period_length, age, weight, location, due_date = profile
            
            # Calculate current week
            if due_date:
                due_date_obj = datetime.strptime(due_date, "%Y-%m-%d").date()
                today = date.today()
                delta = due_date_obj - today
                weeks_left = delta.days // 7
                current_week = 40 - weeks_left
                current_week = max(1, min(current_week, 40))
            else:
                current_week = 1
            
            # Get recent tracking data with dates
            cursor.execute("""
                SELECT week_number, weight, note, created_at FROM weekly_weight 
                ORDER BY week_number DESC LIMIT 4
            """)
            weight_data = cursor.fetchall()
            
            cursor.execute("""
                SELECT week_number, name, dose, time, taken, note, created_at FROM weekly_medicine 
                ORDER BY week_number DESC LIMIT 4
            """)
            medicine_data = cursor.fetchall()
            
            cursor.execute("""
                SELECT week_number, symptom, note, created_at FROM weekly_symptoms 
                ORDER BY week_number DESC LIMIT 4
            """)
            symptoms_data = cursor.fetchall()
            
            cursor.execute("""
                SELECT week_number, systolic, diastolic, time, note, created_at FROM blood_pressure_logs 
                ORDER BY created_at DESC LIMIT 7
            """)
            bp_data = cursor.fetchall()
            
            cursor.execute("""
                SELECT week_number, type, color, bleeding, note, created_at FROM discharge_logs 
                ORDER BY created_at DESC LIMIT 7
            """)
            discharge_data = cursor.fetchall()
        
            # Build context
            context = {
                "current_week": current_week,
                "location": location,
                "age": age,
                "weight": weight,
                "due_date": due_date,
                "lmp": lmp,
                "cycle_length": cycle_length,
                "period_length": period_length,
                "tracking_data": {
                    "weight": [{"week": w, "weight": wt, "note": n, "date": d} for w, wt, n, d in weight_data],
                    "medicine": [{"week": w, "name": n, "dose": d, "time": t, "taken": tk, "note": nt, "date": dt} 
                            for w, n, d, t, tk, nt, dt in medicine_data],
                    "symptoms": [{"week": w, "symptom": s, "note": n, "date": d} for w, s, n, d in symptoms_data],
                    "blood_pressure": [{"week": w, "systolic": s, "diastolic": d, "time": t, "note": n, "date": dt} 
                                    for w, s, d, t, n, dt in bp_data],
                    "discharge": [{"week": w, "type": ty, "color": c, "bleeding": b, "note": n, "date": d} 
                                for w, ty, c, b, n, d in discharge_data]
                },
                "last_updated": datetime.now().isoformat()
            }
            
            return context
        
        finally:
            if conn:
                conn.close()
    
    def get_context(self, user_id: str = "default") -> Optional[Dict[str, Any]]:
        """Get user context from cache only. If not found, return None."""
        with self.cache_lock:
            # Check memory cache first
            if user_id in self.memory_cache:
                return self.memory_cache[user_id]
            
            # Check disk cache
            cache_file = self._get_cache_file_path(user_id)
            if os.path.exists(cache_file):
                try:
                    with open(cache_file, 'r') as f:
                        cache_data = json.load(f)
                        self.memory_cache[user_id] = cache_data
                        return cache_data
                except (json.JSONDecodeError, FileNotFoundError):
                    pass
            
            # Build context from database
            context_data = self._build_context()
            if context_data:
                # Save to both memory and disk cache
                self.memory_cache[user_id] = context_data
                self._save_cache(user_id, context_data)
                return context_data

        return None
    
    def invalidate_cache(self, user_id: str = None):
        """Invalidate cache for specific user or all users."""
        with self.cache_lock:
            if user_id:
                # Remove from memory cache
                if user_id in self.memory_cache:
                    del self.memory_cache[user_id]
                
                # Remove from disk cache
                cache_file = self._get_cache_file_path(user_id)
                if os.path.exists(cache_file):
                    os.remove(cache_file)
            else:
                # Clear all cache
                self.memory_cache.clear()
                for filename in os.listdir(self.cache_dir):
                    if filename.startswith("context_") and filename.endswith(".json"):
                        os.remove(os.path.join(self.cache_dir, filename))

# Global cache instance
_context_cache = None

def get_context_cache(db_path: str) -> ContextCache:
    """Get or create the global context cache instance."""
    global _context_cache
    if _context_cache is None:
        _context_cache = ContextCache(db_path)
    return _context_cache 