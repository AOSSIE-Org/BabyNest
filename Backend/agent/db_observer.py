import sqlite3
import threading
import time
from typing import Callable, List
import os

class DatabaseObserver:
    def __init__(self, db_path: str, cache_invalidator: Callable):
        self.db_path = db_path
        self.cache_invalidator = cache_invalidator
        self.observer_thread = None
        self.stop_observer = False
        self.last_modified_time = self._get_db_modified_time()
        
        # Tables to monitor for changes
        self.monitored_tables = [
            'profile',
            'weekly_weight', 
            'weekly_medicine',
            'weekly_symptoms',
            'blood_pressure_logs',
            'discharge_logs'
        ]
    
    def _get_db_modified_time(self) -> float:
        """Get the last modified time of the database file."""
        try:
            return os.path.getmtime(self.db_path)
        except OSError:
            return 0.0
    
    def _validate_table_name(self, table_name: str) -> bool:
        """Validate table name to prevent SQL injection."""
        import re
        return re.match(r'^[a-zA-Z0-9_]+$', table_name) is not None
    
    def _check_table_changes(self) -> bool:
        """Check if any monitored tables have changed by querying row counts and last modified times."""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            # Get current state of monitored tables
            current_state = {}
            
            for table in self.monitored_tables:
                if not self._validate_table_name(table):
                    print(f"Invalid table name: {table}")
                    continue

                try:
                    # Get row count
                    cursor.execute("SELECT COUNT(*) FROM " + table)
                    row_count = cursor.fetchone()[0]
                    
                    # Get last modified time (using max created_at if available)
                    try:
                        cursor.execute(f"SELECT MAX(created_at) FROM {table}")
                        last_modified = cursor.fetchone()[0]
                    except sqlite3.OperationalError:
                        # Table doesn't have created_at column, use row count as indicator
                        last_modified = row_count
                    
                    current_state[table] = {
                        'row_count': row_count,
                        'last_modified': last_modified
                    }
                except sqlite3.OperationalError:
                    # Table doesn't exist, skip
                    continue
            
            conn.close()
            
            # Compare with previous state (stored in file)
            state_file = f"{self.db_path}.state"
            previous_state = {}
            
            if os.path.exists(state_file):
                try:
                    with open(state_file, 'r') as f:
                        import json
                        previous_state = json.load(f)
                except (json.JSONDecodeError, FileNotFoundError):
                    pass
            
            # Check if state has changed
            has_changes = current_state != previous_state
            
            # Save current state
            try:
                with open(state_file, 'w') as f:
                    import json
                    json.dump(current_state, f, indent=2, default=str)
            except Exception:
                pass
            
            return has_changes
            
        except Exception as e:
            print(f"Error checking table changes: {e}")
            return False
    
    def _observer_loop(self):
        """Main observer loop that checks for database changes."""
        while not self.stop_observer:
            try:
                # Check file modification time first (faster)
                current_modified_time = self._get_db_modified_time()
                if current_modified_time > self.last_modified_time:
                    self.last_modified_time = current_modified_time
                    
                    # If file changed, check table changes
                    if self._check_table_changes():
                        print("Database changes detected, invalidating cache...")
                        self.cache_invalidator()
                
                # Sleep for a short interval
                time.sleep(2)  # Check every 2 seconds
                
            except Exception as e:
                print(f"Error in database observer: {e}")
                time.sleep(5)  # Wait longer on error
    
    def start(self):
        """Start the database observer."""
        if self.observer_thread is None or not self.observer_thread.is_alive():
            self.stop_observer = False
            self.observer_thread = threading.Thread(target=self._observer_loop, daemon=True)
            self.observer_thread.start()
            print("Database observer started")
    
    def stop(self):
        """Stop the database observer."""
        self.stop_observer = True
        if self.observer_thread and self.observer_thread.is_alive():
            self.observer_thread.join(timeout=5)
        print("Database observer stopped")
    
    def force_check(self):
        """Force a check for database changes."""
        if self._check_table_changes():
            self.cache_invalidator()

# Global observer instance
_db_observer = None

def get_db_observer(db_path: str, cache_invalidator: Callable) -> DatabaseObserver:
    """Get or create the global database observer instance."""
    global _db_observer
    if _db_observer is None:
        _db_observer = DatabaseObserver(db_path, cache_invalidator)
    return _db_observer 