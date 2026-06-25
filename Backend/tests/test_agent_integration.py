"""
Test script for the BabyNest agent integration.
This script tests the agent context system and API endpoints.
"""

import requests
import json
import time
import sys

BASE_URL = "http://localhost:5000"

def test_agent_context():
    """Test the agent context endpoint."""
    print("Testing agent context endpoint...")
    
    try:
        response = requests.get(f"{BASE_URL}/agent/context?user_id=default")
        print(f"Status: {response.status_code}")
        
        assert response.status_code == 200, f"Context endpoint failed: {response.text}"
        data = response.json()
        print("✅ Context endpoint working")
        print(f"Current week: {data.get('current_week', 'N/A')}")
        print(f"Has profile: {bool(data.get('profile'))}")
        return True
    except Exception as e:
        print(f"❌ Context endpoint error: {e}")
        raise AssertionError(f"Context endpoint failed: {e}")

def test_task_recommendations():
    """Test the task recommendations endpoint."""
    print("\nTesting task recommendations endpoint...")
    
    try:
        response = requests.get(f"{BASE_URL}/agent/tasks/recommendations?user_id=default&week=10")
        print(f"Status: {response.status_code}")
        
        assert response.status_code == 200, f"Recommendations endpoint failed: {response.text}"
        data = response.json()
        print("✅ Recommendations endpoint working")
        print(f"Current week: {data.get('current_week', 'N/A')}")
        print(f"Has recommendations: {bool(data.get('recommendations'))}")
        return True
    except Exception as e:
        print(f"❌ Recommendations endpoint error: {e}")
        raise AssertionError(f"Recommendations endpoint failed: {e}")

def test_cache_status():
    """Test the cache status endpoint."""
    print("\nTesting cache status endpoint...")
    
    try:
        response = requests.get(f"{BASE_URL}/agent/cache/status")
        print(f"Status: {response.status_code}")
        
        assert response.status_code == 200, f"Cache status endpoint failed: {response.text}"
        data = response.json()
        print("✅ Cache status endpoint working")
        print(f"Cache status: {data.get('cache_status', 'N/A')}")
        print(f"Has context: {data.get('has_context', False)}")
        return True
    except Exception as e:
        print(f"❌ Cache status endpoint error: {e}")
        raise AssertionError(f"Cache status endpoint failed: {e}")

def main():
    """Run all tests."""
    print("🧪 Testing BabyNest Agent Integration")
    print("=" * 50)
    
    tests = [
        test_agent_context,
        test_task_recommendations,
        test_cache_status
    ]
    
    passed = 0
    total = len(tests)
    
    for test in tests:
        try:
            if test():
                passed += 1
        except AssertionError as e:
            print(f"Assertion failed: {e}")
        time.sleep(1)  # Small delay between tests
    
    print("\n" + "=" * 50)
    print(f"📊 Test Results: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All tests passed! The agent integration is working correctly.")
        sys.exit(0)
    else:
        print("⚠️  Some tests failed. Please check the backend setup.")
        sys.exit(1)

if __name__ == "__main__":
    main() 