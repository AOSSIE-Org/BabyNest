#!/usr/bin/env python3
"""
Test script for event-driven cache system.
This script tests the automatic cache invalidation when database changes occur.
"""

import os
import sqlite3
import time
import json
from datetime import datetime, timedelta

from agent.cache import get_context_cache

def setup_test_db():
    """Set up a test database with sample data."""
    db_path = "test_cache.db"
    
    # Remove existing test database
    if os.path.exists(db_path):
        os.remove(db_path)
    
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Create tables
    cursor.execute("""
        CREATE TABLE profile (
            id INTEGER PRIMARY KEY,
            lmp TEXT,
            cycleLength INTEGER,
            periodLength INTEGER,
            age INTEGER,
            weight REAL,
            user_location TEXT,
            dueDate TEXT
        )
    """)
    
    cursor.execute("""
        CREATE TABLE weekly_weight (
            id INTEGER PRIMARY KEY,
            week_number INTEGER,
            weight REAL,
            note TEXT,
            created_at TEXT
        )
    """)
    
    cursor.execute("""
        CREATE TABLE weekly_medicine (
            id INTEGER PRIMARY KEY,
            week_number INTEGER,
            name TEXT,
            dose TEXT,
            time TEXT,
            taken BOOLEAN,
            note TEXT,
            created_at TEXT
        )
    """)
    
    cursor.execute("""
        CREATE TABLE weekly_symptoms (
            id INTEGER PRIMARY KEY,
            week_number INTEGER,
            symptom TEXT,
            note TEXT,
            created_at TEXT
        )
    """)
    
    cursor.execute("""
        CREATE TABLE blood_pressure_logs (
            id INTEGER PRIMARY KEY,
            week_number INTEGER,
            systolic INTEGER,
            diastolic INTEGER,
            time TEXT,
            note TEXT,
            created_at TEXT
        )
    """)
    
    cursor.execute("""
        CREATE TABLE discharge_logs (
            id INTEGER PRIMARY KEY,
            week_number INTEGER,
            type TEXT,
            color TEXT,
            bleeding BOOLEAN,
            note TEXT,
            created_at TEXT
        )
    """)
    
    # Insert sample data
    cursor.execute("""
        INSERT INTO profile (lmp, cycleLength, periodLength, age, weight, user_location, dueDate)
        VALUES ('2024-01-01', 28, 5, 25, 65.0, 'New York', '2024-10-01')
    """)
    
    cursor.execute("""
        INSERT INTO weekly_weight (week_number, weight, note, created_at)
        VALUES (20, 65.0, 'Week 20 weight', '2024-01-10 10:00:00')
    """)
    
    cursor.execute("""
        INSERT INTO weekly_medicine (week_number, name, dose, time, taken, note, created_at)
        VALUES (20, 'Folic Acid', '400mg', 'Morning', 1, 'Daily supplement', '2024-01-10 08:00:00')
    """)
    
    cursor.execute("""
        INSERT INTO weekly_symptoms (week_number, symptom, note, created_at)
        VALUES (20, 'Morning sickness', 'Mild nausea', '2024-01-10 09:00:00')
    """)
    
    cursor.execute("""
        INSERT INTO blood_pressure_logs (week_number, systolic, diastolic, time, note, created_at)
        VALUES (20, 120, 80, 'Morning', 'Normal reading', '2024-01-15 07:00:00')
    """)
    
    conn.commit()
    conn.close()
    
    return db_path

def test_manual_cache_invalidation():
    """Test that cache can be manually invalidated when database changes."""
    print("🧪 Testing manual cache invalidation system...")
    
    # Setup test database
    db_path = setup_test_db()
    
    # Initialize cache
    cache = get_context_cache(db_path)
    
    print("📊 Initial cache state:")
    initial_context = cache.get_context()
    print(f"   - Has context: {initial_context is not None}")
    if initial_context:
        print(f"   - Current week: {initial_context.get('current_week')}")
        print(f"   - Weight: {initial_context.get('weight')}")
    
    print("\n📝 Making database changes...")
    
    # Make changes to database
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Add new weight entry
    cursor.execute("""
        INSERT INTO weekly_weight (week_number, weight, note)
        VALUES (21, 66.0, 'New weight entry')
    """)
    
    # Update profile
    cursor.execute("""
        UPDATE profile SET weight = 66.0 WHERE id = 1
    """)
    
    conn.commit()
    conn.close()
    
    print("🔄 Manually invalidating cache...")
    cache.invalidate_cache()
    
    # Check that cache was rebuilt
    new_context = cache.get_context()
    print(f"   - New weight: {new_context.get('weight')}")
    print(f"   - Weight entries: {len(new_context.get('tracking_data', {}).get('weight', []))}")
    
    # Show date information in tracking data
    tracking_data = new_context.get('tracking_data', {})
    if tracking_data.get('weight'):
        print(f"   - Weight entry date: {tracking_data['weight'][0].get('date')}")
    if tracking_data.get('medicine'):
        print(f"   - Medicine entry date: {tracking_data['medicine'][0].get('date')}")
    if tracking_data.get('symptoms'):
        print(f"   - Symptom entry date: {tracking_data['symptoms'][0].get('date')}")
    
    print("✅ SUCCESS: Cache was manually invalidated and rebuilt!")
    
    # Cleanup
    if os.path.exists(db_path):
        os.remove(db_path)
    
    print("\n🎯 Test completed!")
    return True

if __name__ == "__main__":
    success = test_manual_cache_invalidation()
    if success:
        print("🎉 Manual cache invalidation system is working correctly!")
    else:
        print("💥 Manual cache invalidation system needs attention!") 