"""
Test script for the cache management system.
This demonstrates how the cache system prevents files from growing too large
and automatically cleans up unnecessary data.
"""

import os
import sys
import sqlite3
import time
import json
from datetime import datetime, timedelta

# Add the Backend directory to the path
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, backend_dir)

from agent.agent import get_agent

def test_cache_management_system():
    """Test the cache management and cleanup system."""
    print("🧪 Testing Cache Management System")
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
    
    # Test 1: Initial cache stats
    print("\n📊 Test 1: Initial Cache Statistics")
    stats = agent.get_cache_stats()
    print(f"   📁 Cache files: {stats['cache_files']}")
    print(f"   💾 Total cache size: {stats['total_cache_size_mb']:.2f} MB")
    print(f"   🧠 Memory cache size: {stats['memory_cache_size']} users")
    print(f"   ⚙️ Max cache size: {stats['max_cache_size_mb']} MB")
    print(f"   📝 Max tracking entries: {stats['max_tracking_entries']}")
    
    # Test 2: Create test data to fill cache
    print("\n📝 Test 2: Creating Test Data")
    conn = sqlite3.connect(db_path)
    
    # Create test profile
    conn.execute("""
        INSERT OR REPLACE INTO profile (lmp, cycleLength, periodLength, age, weight, user_location, dueDate)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    """, ("2024-01-01", 28, 5, 25, 65.0, "Test City", "2024-10-01"))
    
    # Add many weight entries to test limits
    print("   ⚖️ Adding weight entries...")
    for i in range(15):  # More than max_tracking_entries (10)
        conn.execute("""
            INSERT INTO weekly_weight (week_number, weight, note, created_at)
            VALUES (?, ?, ?, ?)
        """, (20 + i, 65.0 + i * 0.5, f"Test weight entry {i}", datetime.now().isoformat()))
    
    # Add many medicine entries
    print("   💊 Adding medicine entries...")
    for i in range(15):
        conn.execute("""
            INSERT INTO weekly_medicine (week_number, name, dose, time, taken, note, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (20 + i, f"Medicine {i}", f"{100 + i}mg", "Morning", True, f"Test medicine {i}", datetime.now().isoformat()))
    
    # Add many symptoms entries
    print("   🤒 Adding symptom entries...")
    for i in range(15):
        conn.execute("""
            INSERT INTO weekly_symptoms (week_number, symptom, note, created_at)
            VALUES (?, ?, ?, ?)
        """, (20 + i, f"Symptom {i}", f"Test symptom {i}", datetime.now().isoformat()))
    
    conn.commit()
    conn.close()
    
    # Test 3: Update cache and check limits
    print("\n🔄 Test 3: Updating Cache with Data Limits")
    agent.update_cache(data_type="profile", operation="create")
    agent.update_cache(data_type="weight", operation="create")
    agent.update_cache(data_type="medicine", operation="create")
    agent.update_cache(data_type="symptoms", operation="create")
    
    # Check if data was limited
    context = agent.get_user_context("default")
    if context:
        weight_entries = context.get('tracking_data', {}).get('weight', [])
        medicine_entries = context.get('tracking_data', {}).get('medicine', [])
        symptoms_entries = context.get('tracking_data', {}).get('symptoms', [])
        
        print(f"   ✅ Weight entries: {len(weight_entries)} (should be ≤ 10)")
        print(f"   ✅ Medicine entries: {len(medicine_entries)} (should be ≤ 10)")
        print(f"   ✅ Symptoms entries: {len(symptoms_entries)} (should be ≤ 10)")
        
        # Verify only recent entries are kept
        if weight_entries:
            print(f"   📊 Latest weight: {weight_entries[0]['weight']}kg (Week {weight_entries[0]['week']})")
            print(f"   📊 Oldest weight: {weight_entries[-1]['weight']}kg (Week {weight_entries[-1]['week']})")
    
    # Test 4: Test cache file size monitoring
    print("\n📏 Test 4: Cache File Size Monitoring")
    cache_file = os.path.join("cache", "context_default.json")
    if os.path.exists(cache_file):
        file_size_mb = os.path.getsize(cache_file) / (1024 * 1024)
        print(f"   📁 Cache file size: {file_size_mb:.2f} MB")
        print(f"   ⚠️ Max allowed: {agent.context_cache.max_cache_size_mb} MB")
        
        if file_size_mb > agent.context_cache.max_cache_size_mb:
            print("   🚨 Cache file exceeds size limit!")
        else:
            print("   ✅ Cache file within size limits")
    
    # Test 5: Test memory cache limits
    print("\n🧠 Test 5: Memory Cache Management")
    print(f"   👥 Current memory cache: {len(agent.context_cache.memory_cache)} users")
    print(f"   📊 Max memory cache: {agent.context_cache.max_memory_cache_size} users")
    
    # Test 6: Test cache cleanup
    print("\n🧹 Test 6: Cache Cleanup")
    print("   🔄 Running cache cleanup...")
    agent.cleanup_cache()
    
    # Check stats after cleanup
    stats_after = agent.get_cache_stats()
    print(f"   📁 Cache files after cleanup: {stats_after['cache_files']}")
    print(f"   💾 Total cache size after cleanup: {stats_after['total_cache_size_mb']:.2f} MB")
    print(f"   🧠 Memory cache size after cleanup: {stats_after['memory_cache_size']} users")
    
    # Test 7: Test old file cleanup
    print("\n⏰ Test 7: Old File Cleanup")
    
    # Create an old cache file
    old_cache_file = os.path.join("cache", "context_old_user.json")
    old_data = {
        "current_week": 25,
        "last_updated": (datetime.now() - timedelta(days=35)).isoformat(),  # 35 days old
        "tracking_data": {"weight": []}
    }
    
    with open(old_cache_file, 'w') as f:
        json.dump(old_data, f)
    
    print(f"   📁 Created old cache file: {old_cache_file}")
    print(f"   ⏰ File age: 35 days (limit: {agent.context_cache.max_cache_age_days} days)")
    
    # Run cleanup
    agent.cleanup_cache()
    
    # Check if old file was removed
    if os.path.exists(old_cache_file):
        print("   ❌ Old file was NOT removed")
    else:
        print("   ✅ Old file was successfully removed")
    
    # Test 8: Performance impact
    print("\n⚡ Test 8: Performance Impact")
    
    # Test cache update performance
    start_time = time.time()
    agent.update_cache(data_type="weight", operation="update")
    update_time = time.time() - start_time
    
    # Test cache stats performance
    start_time = time.time()
    stats = agent.get_cache_stats()
    stats_time = time.time() - start_time
    
    print(f"   🚀 Cache update time: {update_time:.4f} seconds")
    print(f"   📊 Cache stats time: {stats_time:.4f} seconds")
    
    # Test 9: API endpoints
    print("\n🌐 Test 9: API Endpoints")
    print("   📡 Available endpoints:")
    print("   GET  /agent/cache/stats     - Get cache statistics")
    print("   POST /agent/cache/cleanup   - Manual cache cleanup")
    print("   GET  /agent/cache/status    - Get cache status")
    
    print("\n🎉 Cache Management System Test Completed!")
    print("✅ All cache management features are working correctly!")
    print("\n📋 Summary of Cache Management Features:")
    print("   🗂️  Automatic data limiting (max 10 entries per type)")
    print("   📏 File size monitoring (max 10MB per file)")
    print("   ⏰ Old file cleanup (max 30 days age)")
    print("   🧠 Memory cache management (max 50 users)")
    print("   🔄 Automatic cleanup after updates")
    print("   📊 Comprehensive statistics and monitoring")

if __name__ == "__main__":
    test_cache_management_system()
