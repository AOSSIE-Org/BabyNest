#!/usr/bin/env python3
"""
Quick test runner for BabyNest Backend APIs
Usage: python run_tests.py [options]
"""

import sys
import subprocess
import argparse
from pathlib import Path

def run_command(cmd, description):
    """Run a command and handle output"""
    print(f"\n{'='*60}")
    print(f"🔍 {description}")
    print(f"{'='*60}\n")
    
    try:
        result = subprocess.run(cmd, shell=True, check=True)
        print(f"\n✅ {description} - PASSED")
        return True
    except subprocess.CalledProcessError:
        print(f"\n❌ {description} - FAILED")
        return False

def main():
    parser = argparse.ArgumentParser(description='Run BabyNest Backend API Tests')
    parser.add_argument('--all', action='store_true', help='Run all tests')
    parser.add_argument('--appointments', action='store_true', help='Run appointments tests')
    parser.add_argument('--tasks', action='store_true', help='Run tasks tests')
    parser.add_argument('--profile', action='store_true', help='Run profile tests')
    parser.add_argument('--weight', action='store_true', help='Run weight tests')
    parser.add_argument('--medicine', action='store_true', help='Run medicine tests')
    parser.add_argument('--symptoms', action='store_true', help='Run symptoms tests')
    parser.add_argument('--bp', action='store_true', help='Run blood pressure tests')
    parser.add_argument('--discharge', action='store_true', help='Run discharge tests')
    parser.add_argument('--agent', action='store_true', help='Run agent tests')
    parser.add_argument('--coverage', action='store_true', help='Generate coverage report')
    parser.add_argument('--verbose', '-v', action='store_true', help='Verbose output')
    
    args = parser.parse_args()
    
    # Change to Backend directory
    backend_dir = Path(__file__).parent
    print(f"📂 Working directory: {backend_dir}")
    
    # Determine what tests to run
    run_all = args.all or not any([
        args.appointments, args.tasks, args.profile, args.weight,
        args.medicine, args.symptoms, args.bp, args.discharge, args.agent
    ])
    
    verbose = "-v" if args.verbose else ""
    coverage = "--cov=routes --cov=app --cov-report=html --cov-report=term" if args.coverage else ""
    
    results = []
    
    print("\n" + "="*60)
    print("🧪 BabyNest Backend API Test Suite")
    print("="*60)
    
    if run_all:
        cmd = f"python -m pytest tests/ {verbose} {coverage}"
        results.append(run_command(cmd, "All API Tests"))
    else:
        test_map = {
            'appointments': ('tests/test_api_appointments.py', 'Appointments API Tests'),
            'tasks': ('tests/test_api_tasks.py', 'Tasks API Tests'),
            'profile': ('tests/test_api_profile.py', 'Profile API Tests'),
            'weight': ('tests/test_api_weight.py', 'Weight API Tests'),
            'medicine': ('tests/test_api_medicine.py', 'Medicine API Tests'),
            'symptoms': ('tests/test_api_symptoms.py', 'Symptoms API Tests'),
            'bp': ('tests/test_api_blood_pressure.py', 'Blood Pressure API Tests'),
            'discharge': ('tests/test_api_discharge.py', 'Discharge API Tests'),
            'agent': ('tests/test_api_agent.py', 'Agent API Tests'),
        }
        
        for key, (test_file, description) in test_map.items():
            if getattr(args, key):
                cmd = f"python -m pytest {test_file} {verbose} {coverage}"
                results.append(run_command(cmd, description))
    
    # Print summary
    print("\n" + "="*60)
    print("📊 Test Summary")
    print("="*60)
    
    passed = sum(results)
    total = len(results)
    
    print(f"\n✅ Passed: {passed}/{total}")
    if passed < total:
        print(f"❌ Failed: {total - passed}/{total}")
    
    if args.coverage:
        print("\n📈 Coverage report generated at: htmlcov/index.html")
    
    print("\n" + "="*60 + "\n")
    
    # Exit with appropriate code
    sys.exit(0 if passed == total else 1)

if __name__ == '__main__':
    main()
