import json
import os

try: 
    current_dir = os.path.dirname(os.path.abspath(__file__))
    guidelines_path = os.path.join(current_dir, "guidelines.json")

    with open(guidelines_path, "r", encoding="utf-8") as f:
        GUIDELINES = json.load(f)
        
except (FileNotFoundError, json.JSONDecodeError, OSError) as e:
    print(f"Warning: Could not load guidelines data: {e}")
    GUIDELINES = []
