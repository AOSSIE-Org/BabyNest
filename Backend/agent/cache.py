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
        
        # Cache management settings
        self.max_cache_size_mb = 10  # Maximum cache file size in MB
        self.max_tracking_entries = 10  # Maximum entries per tracking type
        self.max_cache_age_days = 30  # Maximum cache age before cleanup
        self.max_memory_cache_size = 50  # Maximum number of users in memory cache
        
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
    
    def _save_cache(self, user_id:str, context_data: Dict[str, Any]):
        """Save context data to disk cache."""
        file_path = self._get_cache_file_path(user_id)
        try:
            with open(file_path, 'w') as f:
                json.dump(context_data, f, indent=2, default=str)
        except Exception as e:
            print(f"Error saving cache for user {user_id}: {e}")

    def _cache_update_handler(self, datatype:str, current_cache:dict) -> bool:
        """Handle specific datatype cache update."""
        if not current_cache or not datatype:
            return False
        # Updating data based on datatype
        valid_types = ['profile', 'weight', 'medicine', 'symptoms', 'blood_pressure', 'discharge']
        if datatype not in valid_types:
            return False
        print(f"   🔄 Updating {datatype} data...")
        data = self._get_specific_data(datatype)
        if data:
            if datatype == "profile":
                current_cache.update(data)
                print(f"   ✅ {datatype} data updated")
            else:
                current_cache["tracking_data"][datatype] = data
                print(f"   ✅ {datatype} data updated: {len(data)} entries")
            return True
    
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
    
    def _get_specific_data(self, data_type: str, limit: int = None) -> list:
        """Get specific data from database based on type."""
        conn = None
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            if data_type == "profile":
                cursor.execute("""
                    SELECT lmp, cycleLength, periodLength, age, weight, user_location, dueDate
                    FROM profile ORDER BY id DESC LIMIT 1
                """)
                result = cursor.fetchone()
                if result:
                    lmp, cycle_length, period_length, age, weight, location, due_date = result
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
                    
                    return {
                        "current_week": current_week,
                        "location": location,
                        "age": age,
                        "weight": weight,
                        "due_date": due_date,
                        "lmp": lmp,
                        "cycle_length": cycle_length,
                        "period_length": period_length
                    }
                return None
                
            elif data_type == "weight":
                limit = limit or self.max_tracking_entries
                cursor.execute("""
                    SELECT week_number, weight, note, created_at FROM weekly_weight 
                    ORDER BY week_number DESC LIMIT ?
                """, (limit,))
                data = [{"week": w, "weight": wt, "note": n, "date": d} for w, wt, n, d in cursor.fetchall()]
                return self._limit_tracking_data(data, "weight")
                
            elif data_type == "medicine":
                limit = limit or self.max_tracking_entries
                cursor.execute("""
                    SELECT week_number, name, dose, time, taken, note, created_at FROM weekly_medicine 
                    ORDER BY week_number DESC LIMIT ?
                """, (limit,))
                data = [{"week": w, "name": n, "dose": d, "time": t, "taken": tk, "note": nt, "date": dt} 
                        for w, n, d, t, tk, nt, dt in cursor.fetchall()]
                return self._limit_tracking_data(data, "medicine")
                
            elif data_type == "symptoms":
                limit = limit or self.max_tracking_entries
                cursor.execute("""
                    SELECT week_number, symptom, note, created_at FROM weekly_symptoms 
                    ORDER BY week_number DESC LIMIT ?
                """, (limit,))
                data = [{"week": w, "symptom": s, "note": n, "date": d} for w, s, n, d in cursor.fetchall()]
                return self._limit_tracking_data(data, "symptoms")
                
            elif data_type == "blood_pressure":
                limit = limit or self.max_tracking_entries
                cursor.execute("""
                    SELECT week_number, systolic, diastolic, time, note, created_at FROM blood_pressure_logs 
                    ORDER BY created_at DESC LIMIT ?
                """, (limit,))
                data = [{"week": w, "systolic": s, "diastolic": d, "time": t, "note": n, "date": dt} 
                        for w, s, d, t, n, dt in cursor.fetchall()]
                return self._limit_tracking_data(data, "blood_pressure")
                
            elif data_type == "discharge":
                limit = limit or self.max_tracking_entries
                cursor.execute("""
                    SELECT week_number, type, color, bleeding, note, created_at FROM discharge_logs 
                    ORDER BY created_at DESC LIMIT ?
                """, (limit,))
                data = [{"week": w, "type": ty, "color": c, "bleeding": b, "note": n, "date": d} 
                        for w, ty, c, b, n, d in cursor.fetchall()]
                return self._limit_tracking_data(data, "discharge")
            
            return []
            
        finally:
            if conn:
                conn.close()

    def update_cache(self, user_id: str = "default", data_type: str = None, operation: str = "update"):
        """
        Intelligently update cache based on database changes.
        
        Args:
            user_id: User ID to update cache for
            data_type: Type of data that changed ('profile', 'weight', 'medicine', 'symptoms', 'blood_pressure', 'discharge')
            operation: Type of operation ('create', 'update', 'delete')

            Note: The operation parameter is purely informational. The cache update logic is the same regardless of operation. 
        """
        with self.cache_lock:
            # Get current cache from memory or disk (without building from DB)
            current_cache = None
            
            # Check memory cache first
            if user_id in self.memory_cache:
                current_cache = self.memory_cache[user_id]
            else:
                # Check disk cache
                cache_file = self._get_cache_file_path(user_id)
                if os.path.exists(cache_file):
                    try:
                        with open(cache_file, 'r') as f:
                            current_cache = json.load(f)
                            self.memory_cache[user_id] = current_cache
                    except (json.JSONDecodeError, FileNotFoundError):
                        pass
            
            if not current_cache:
                # If no cache exists, build full context
                print("⚙️ No existing cache found, building full context...")
                context_data = self._build_context()
                print("✅ Full context built", context_data)
                if context_data:
                    self.memory_cache[user_id] = context_data
                    self._save_cache(user_id, context_data)
                    return

            if operation in ["update", "create", "delete"] :
                res = self._cache_update_handler(data_type, current_cache)
                # Update last updated timestamp
                if res:
                    current_cache["last_updated"] = datetime.now().isoformat()
                    # Save updated cache
                    self.memory_cache[user_id] = current_cache
                    self._save_cache(user_id, current_cache)
                    print(f"✅ Cache updated for user {user_id} - {data_type} data refreshed")
                    # Check if cache needs cleanup after update
                    self._check_and_cleanup_cache(user_id)

    def _cleanup_old_cache_files(self):
        """Clean up old cache files based on age and size."""
        if not os.path.exists(self.cache_dir):
            return
        
        current_time = time.time()
        max_age_seconds = self.max_cache_age_days * 24 * 60 * 60
        
        for filename in os.listdir(self.cache_dir):
            if filename.startswith("context_") and filename.endswith(".json"):
                file_path = os.path.join(self.cache_dir, filename)
                
                try:
                    # Check file age
                    file_age = current_time - os.path.getmtime(file_path)
                    if file_age > max_age_seconds:
                        os.remove(file_path)
                        print(f"🗑️ Removed old cache file: {filename} (age: {file_age/86400:.1f} days)")
                        continue
                    
                    # Check file size
                    file_size_mb = os.path.getsize(file_path) / (1024 * 1024)
                    if file_size_mb > self.max_cache_size_mb:
                        os.remove(file_path)
                        print(f"🗑️ Removed oversized cache file: {filename} (size: {file_size_mb:.1f}MB)")
                        continue
                        
                except (OSError, FileNotFoundError):
                    continue

    def _check_and_cleanup_cache(self, user_id: str):
        """Check if cache needs cleanup and perform it if necessary."""
        cache_file = self._get_cache_file_path(user_id)
        
        if not os.path.exists(cache_file):
            return
        
        try:
            # Check file size
            file_size_mb = os.path.getsize(cache_file) / (1024 * 1024)
            if file_size_mb > self.max_cache_size_mb:
                print(f"⚠️ Cache file too large ({file_size_mb:.1f}MB), cleaning up...")
                self._cleanup_large_cache_file(user_id)
                return
            
            # Check memory cache size
            if len(self.memory_cache) > self.max_memory_cache_size:
                print(f"⚠️ Memory cache too large ({len(self.memory_cache)} users), cleaning up...")
                self._cleanup_memory_cache()
                
        except (OSError, FileNotFoundError):
            pass

    def _cleanup_large_cache_file(self, user_id: str):
        """Clean up a cache file that has grown too large."""
        try:
            # Load current cache
            cache_file = self._get_cache_file_path(user_id)
            with open(cache_file, 'r') as f:
                cache_data = json.load(f)
            
            # Limit tracking data entries
            if 'tracking_data' in cache_data:
                for data_type in ['weight', 'medicine', 'symptoms', 'blood_pressure', 'discharge']:
                    if data_type in cache_data['tracking_data']:
                        entries = cache_data['tracking_data'][data_type]
                        if len(entries) > self.max_tracking_entries:
                            # Keep only the most recent entries
                            cache_data['tracking_data'][data_type] = entries[:self.max_tracking_entries]
                            print(f"✂️ Trimmed {data_type} entries to {self.max_tracking_entries}")
            
            # Save cleaned cache
            with open(cache_file, 'w') as f:
                json.dump(cache_data, f, indent=2, default=str)
            
            # Update memory cache
            if user_id in self.memory_cache:
                self.memory_cache[user_id] = cache_data
                
            print(f"✅ Cleaned up cache file for user {user_id}")
            
        except (json.JSONDecodeError, OSError, FileNotFoundError) as e:
            print(f"❌ Error cleaning up cache file: {e}")
            # If cleanup fails, remove the corrupted file
            try:
                os.remove(cache_file)
                if user_id in self.memory_cache:
                    del self.memory_cache[user_id]
            except OSError:
                pass

    def _cleanup_memory_cache(self):
        """Clean up memory cache by removing least recently used entries."""
        if len(self.memory_cache) <= self.max_memory_cache_size:
            return
        
        # Sort by last_updated timestamp (oldest first)
        sorted_users = sorted(
            self.memory_cache.items(),
            key=lambda x: x[1].get('last_updated', '1970-01-01')
        )
        
        # Remove oldest entries
        users_to_remove = len(self.memory_cache) - self.max_memory_cache_size
        for user_id, _ in sorted_users[:users_to_remove]:
            del self.memory_cache[user_id]
            print(f"🗑️ Removed user {user_id} from memory cache")

    def _limit_tracking_data(self, data: list, data_type: str) -> list:
        """Limit tracking data to prevent excessive growth."""
        if len(data) <= self.max_tracking_entries:
            return data
        
        # Keep only the most recent entries
        limited_data = data[:self.max_tracking_entries]
        print(f"✂️ Limited {data_type} data to {self.max_tracking_entries} entries")
        return limited_data

    def get_cache_stats(self) -> Dict[str, Any]:
        """Get cache statistics for monitoring."""
        stats = {
            "memory_cache_size": len(self.memory_cache),
            "max_memory_cache_size": self.max_memory_cache_size,
            "max_cache_size_mb": self.max_cache_size_mb,
            "max_tracking_entries": self.max_tracking_entries,
            "max_cache_age_days": self.max_cache_age_days,
            "cache_files": 0,
            "total_cache_size_mb": 0,
            "oldest_cache_file": None,
            "newest_cache_file": None
        }
        
        if not os.path.exists(self.cache_dir):
            return stats
        
        cache_files = []
        for filename in os.listdir(self.cache_dir):
            if filename.startswith("context_") and filename.endswith(".json"):
                file_path = os.path.join(self.cache_dir, filename)
                try:
                    file_size = os.path.getsize(file_path)
                    file_mtime = os.path.getmtime(file_path)
                    cache_files.append({
                        "filename": filename,
                        "size_mb": file_size / (1024 * 1024),
                        "modified": datetime.fromtimestamp(file_mtime).isoformat()
                    })
                except OSError:
                    continue
        
        if cache_files:
            stats["cache_files"] = len(cache_files)
            stats["total_cache_size_mb"] = sum(f["size_mb"] for f in cache_files)
            
            # Find oldest and newest files
            sorted_files = sorted(cache_files, key=lambda x: x["modified"])
            stats["oldest_cache_file"] = sorted_files[0]["modified"]
            stats["newest_cache_file"] = sorted_files[-1]["modified"]
        
        return stats

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
        # Cleanup old files after initialization
        _context_cache._cleanup_old_cache_files()
    return _context_cache