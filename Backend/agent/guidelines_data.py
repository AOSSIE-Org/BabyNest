# agent/guidelines_data.py
import json

with open("agent/guidelines.json", "r", encoding="utf-8") as f:
    GUIDELINES = json.load(f)
