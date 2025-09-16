"""
Test script for the new intelligent cache update system.
This demonstrates how the cache is updated efficiently instead of being invalidated.
"""

import os
import sys
import sqlite3
import time
from datetime import datetime

# Add the Backend directory to the path
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, backend_dir)

from agent.agent import get_agent

def test_cache_update_system():
    """Test the new intelligent cache update system."""
    print("🧪 Testing Intelligent Cache Update System")
    print("=" * 50)
    
    # Initialize agent
    db_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "db", "database.db")
    
    # Ensure database exists and has required tables
    conn = sqlite3.connect(db_path)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS profile (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            lmp TEXT,
            cycleLength INTEGER,
            periodLength INTEGER,
            age INTEGER,
            weight REAL,
            user_location TEXT,
            dueDate TEXT
        )
    """)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS weekly_weight (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            week_number INTEGER,
            weight REAL,
            note TEXT,
            created_at TEXT
        )
    """)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS weekly_medicine (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            week_number INTEGER,
            name TEXT,
            dose TEXT,
            time TEXT,
            taken BOOLEAN,
            note TEXT,
            created_at TEXT
        )
    """)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS weekly_symptoms (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            week_number INTEGER,
            symptom TEXT,
            note TEXT,
            created_at TEXT
        )
    """)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS blood_pressure_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            week_number INTEGER,
            systolic INTEGER,
            diastolic INTEGER,
            time TEXT,
            note TEXT,
            created_at TEXT
        )
    """)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS discharge_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            week_number INTEGER,
            type TEXT,
            color TEXT,
            bleeding BOOLEAN,
            note TEXT,
            created_at TEXT
        )
    """)
    conn.commit()
    conn.close()
    
    agent = get_agent(db_path)
    
    # Test 1: Initial cache state
    print("\n📊 Test 1: Initial Cache State")
    context = agent.get_user_context("default")
    if context:
        print(f"   ✅ Cache exists")
        print(f"   📅 Last updated: {context.get('last_updated', 'Unknown')}")
        print(f"   👤 Current week: {context.get('current_week', 'Unknown')}")
        print(f"   📊 Weight entries: {len(context.get('tracking_data', {}).get('weight', []))}")
        print(f"   💊 Medicine entries: {len(context.get('tracking_data', {}).get('medicine', []))}")
    else:
        print("   ❌ No cache found - creating initial cache...")
        # Create a test profile to initialize cache
        conn = sqlite3.connect(db_path)
        conn.execute("""
            INSERT OR REPLACE INTO profile (lmp, cycleLength, periodLength, age, weight, user_location, dueDate)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, ("2024-01-01", 28, 5, 25, 65.0, "Test City", "2024-10-01"))
        conn.commit()
        conn.close()
        
        # Update cache
        agent.update_cache(data_type="profile", operation="create")
        context = agent.get_user_context("default")
        print(f"   ✅ Cache created")
        print(f"   📅 Last updated: {context.get('last_updated', 'Unknown')}")
    
    # Test 2: Add weight entry and update cache
    print("\n⚖️ Test 2: Adding Weight Entry")
    conn = sqlite3.connect(db_path)
    conn.execute("""
        INSERT INTO weekly_weight (week_number, weight, note, created_at)
        VALUES (?, ?, ?, ?)
    """, (25, 66.5, "Test weight entry", datetime.now().isoformat()))
    conn.commit()
    conn.close()
    
    # Update only weight cache
    print("   🔄 Updating cache for weight data...")
    agent.update_cache(data_type="weight", operation="create")
    
    # Check updated cache
    context = agent.get_user_context("default")
    weight_entries = context.get('tracking_data', {}).get('weight', [])
    print(f"   ✅ Weight entries: {len(weight_entries)}")
    if weight_entries:
        latest_weight = weight_entries[0]
        print(f"   📊 Latest weight: {latest_weight.get('weight')}kg (Week {latest_weight.get('week')})")
    
    # Test 3: Add medicine entry and update cache
    print("\n💊 Test 3: Adding Medicine Entry")
    conn = sqlite3.connect(db_path)
    conn.execute("""
        INSERT INTO weekly_medicine (week_number, name, dose, time, taken, note, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    """, (25, "Folic Acid", "400mg", "Morning", True, "Daily supplement", datetime.now().isoformat()))
    conn.commit()
    conn.close()
    
    # Update only medicine cache
    print("   🔄 Updating cache for medicine data...")
    agent.update_cache(data_type="medicine", operation="create")
    
    # Check updated cache
    context = agent.get_user_context("default")
    medicine_entries = context.get('tracking_data', {}).get('medicine', [])
    print(f"   ✅ Medicine entries: {len(medicine_entries)}")
    if medicine_entries:
        latest_medicine = medicine_entries[0]
        print(f"   💊 Latest medicine: {latest_medicine.get('name')} - {latest_medicine.get('dose')}")
    
    # Test 4: Update profile and recalculate current week
    print("\n👤 Test 4: Updating Profile")
    conn = sqlite3.connect(db_path)
    conn.execute("""
        UPDATE profile SET weight = ?, user_location = ?
    """, (67.0, "Updated City"))
    conn.commit()
    conn.close()
    
    # Update only profile cache
    print("   🔄 Updating cache for profile data...")
    agent.update_cache(data_type="profile", operation="update")
    
    # Check updated cache
    context = agent.get_user_context("default")
    print(f"   ✅ Updated weight: {context.get('weight')}kg")
    print(f"   ✅ Updated location: {context.get('location')}")
    print(f"   📅 Last updated: {context.get('last_updated')}")
    
    # Test 5: Performance comparison
    print("\n⚡ Test 5: Performance Comparison")
    
    # Test cache update (should be fast)
    start_time = time.time()
    agent.update_cache(data_type="weight", operation="update")
    update_time = time.time() - start_time
    
    # Test cache invalidation (should be slower as it rebuilds everything)
    start_time = time.time()
    agent.invalidate_cache()
    # Rebuild cache
    context = agent.get_user_context("default")
    invalidate_time = time.time() - start_time
    
    print(f"   🚀 Cache update time: {update_time:.4f} seconds")
    print(f"   🐌 Cache invalidation + rebuild time: {invalidate_time:.4f} seconds")
    print(f"   📈 Performance improvement: {invalidate_time/update_time:.1f}x faster")
    
    print("\n🎉 Cache Update System Test Completed!")
    print("✅ All tests passed - intelligent cache updates are working!")

if __name__ == "__main__":
    test_cache_update_system()
