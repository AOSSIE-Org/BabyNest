from db.db import open_db, close_db, first_time_setup
import os
import io
import json
import re
import pytesseract
pytesseract.pytesseract.tesseract_cmd = r'/opt/homebrew/bin/tesseract'
from PIL import Image
from flask import Flask, request, jsonify
from flask_cors import CORS
import cv2
import numpy as np
from llama_cpp import Llama
import base64

# Route imports
from routes.appointments import appointments_bp
from routes.tasks import tasks_bp
from routes.profile import profile_bp
from routes.medicine import medicine_bp
from routes.symptoms import symptoms_bp
from routes.weight import weight_bp
from routes.blood_pressure import bp_bp
from routes.discharge import discharge_bp
from agent.agent import get_agent

# --- 1. APP CONFIGURATION ---
app = Flask(__name__)
CORS(app) 

# --- 1. MODEL CONFIGURATION (LAZY LOADING) ---
llm = None

import os
from llama_cpp import Llama

def get_llm():
    """
    Initializes and returns the Llama model with the GGUF adapter.
    Uses relative paths to ensure cross-platform compatibility.
    """
    global llm
    if llm is None:
        # Resolve absolute path to the models directory relative to this script
        base_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "models")
        m_path = os.path.join(base_dir, "qwen2-0_5b-instruct-q4_k_m.gguf")
        a_path = os.path.join(base_dir, "medical_adapter.gguf")

        try:
            # Initialize LLM with LoRA adapter
            llm = Llama(
                model_path=m_path,
                lora_path=a_path,
                n_ctx=1024,
                n_gpu_layers=0,  # Set to -1 for Metal/CUDA acceleration if available
                verbose=False
            )
        except Exception as e:
            # Fallback to base model if adapter fails to load
            print(f"Model Load Error: {e}")
            llm = Llama(model_path=m_path, n_ctx=1024, verbose=False)
    return llm

# Register Blueprints
app.register_blueprint(appointments_bp)
app.register_blueprint(tasks_bp)
app.register_blueprint(profile_bp)
app.register_blueprint(medicine_bp)
app.register_blueprint(symptoms_bp)
app.register_blueprint(weight_bp)
app.register_blueprint(bp_bp)
app.register_blueprint(discharge_bp)

# --- 2. MEDICAL REPORT OCR & EXTRACTION ---

@app.route('/api/ocr-scan', methods=['POST'])
def ocr_scan():
    """
    Endpoint to process base64 images, perform OCR, and extract structured medical data.
    """
    try:
        data = request.get_json()
        img_data = base64.b64decode(data['image'])
        nparr = np.frombuffer(img_data, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        # Image preprocessing for improved OCR accuracy
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        gray = cv2.resize(gray, None, fx=2, fy=2, interpolation=cv2.INTER_CUBIC)
        binary = cv2.adaptiveThreshold(gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 11, 2)
        
        # Extract raw text using Tesseract
        raw_text = pytesseract.image_to_string(binary, config='--psm 3')

        model = get_llm()

        # Construct prompt with few-shot examples for structured extraction
        prompt = (
            f"<|im_start|>system\nYou are a Medical Assistant, a medical assistant. Extract vitals from OCR text as JSON.\n"
            "Examples:\n"
            "Input: 'Wt: 80kg BP: 120/80 Date: 25 Jan'\n"
            "Output: {{\"weight\": \"80\", \"blood_pressure\": \"120/80\", \"next_appointment_date\": \"25 Jan\"}}\n"
            "<|im_end|>\n"
            f"<|im_start|>user\nText: {raw_text.strip()}<|im_end|>\n"
            "<|im_start|>assistant\n{{\"weight\":"
        )
        
        # Generate model response
        output = model(prompt, max_tokens=150, stop=["}"], temperature=0)
        result_text = '{"weight":' + output['choices'][0]['text'].strip()
        if not result_text.endswith("}"): 
            result_text += "}"
        
        # Parse extracted JSON and map to frontend schema
        try:
            # Backup: Regex extraction in case of malformed LLM JSON
            w = re.search(r'"weight":\s*"([^"]+)"', result_text)
            bp = re.search(r'"blood_pressure":\s*"([^"]+)"', result_text)
            date = re.search(r'"next_appointment_date":\s*"([^"]+)"', result_text)

            extracted_values = {
                "weight": w.group(1) if w else "N/A",
                "bp": bp.group(1) if bp else "N/A",
                "appointment": date.group(1) if date else "N/A"
            }
        except Exception:
            extracted_values = {"weight": "N/A", "bp": "N/A", "appointment": "N/A"}

        return jsonify({
            "status": "success", 
            "extracted_values": extracted_values
        })

    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

# --- 3. DATABASE SAVING ROUTES ---

@app.route('/api/weight', methods=['POST'])
def save_weight():
    data = request.json
    weight_val = data.get('weight')
    user_id = data.get('user_id', 'default') 
    db = open_db()
    cursor = db.cursor()
    cursor.execute("INSERT INTO weekly_weight (user_id, weight, date) VALUES (?, ?, CURRENT_TIMESTAMP)", (user_id, weight_val))
    db.commit()
    return jsonify({"status": "success"})

@app.route('/api/blood-pressure', methods=['POST'])
def save_bp():
    data = request.json
    bp_val = data.get('bp') 
    user_id = data.get('user_id', 'default')
    db = open_db()
    cursor = db.cursor()
    cursor.execute("INSERT INTO blood_pressure_logs (user_id, reading, date) VALUES (?, ?, CURRENT_TIMESTAMP)", (user_id, bp_val))
    db.commit()
    return jsonify({"status": "success"})

# --- 4. DATABASE & AI AGENT CORE ---

@app.teardown_appcontext
def teardown_db(exception):
    close_db(exception)

db_path = os.path.join(os.path.dirname(__file__), "db", "database.db")
first_time_setup() 
agent = get_agent(db_path)

@app.route("/agent", methods=["POST"])
def run_agent():
    if not request.is_json:
        return jsonify({"error": "Invalid JSON format"}), 400
    data = request.get_json()
    query = data.get("query")
    user_id = data.get("user_id", "default") 
    try:
        response = agent.run(query, user_id)
        return jsonify({"response": response})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/agent/cache/status", methods=["GET"])
def get_cache_status():
    try:
        user_id = request.args.get("user_id", "default")
        user_context = agent.get_user_context(user_id)
        return jsonify({
            "cache_system": "event_driven",
            "cache_status": "active",
            "has_context": user_context is not None,
            "monitored_tables": ['profile', 'weekly_weight', 'weekly_medicine', 'weekly_symptoms', 'blood_pressure_logs', 'discharge_logs'],
            "last_updated": user_context.get('last_updated') if user_context else None
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/agent/context", methods=["GET"])
def get_agent_context():
    try:
        user_id = request.args.get("user_id", "default")
        context = agent.get_user_context(user_id)
        if not context:
            return jsonify({"error": "No context available"}), 404
        return jsonify({"context": context})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/agent/tasks/recommendations", methods=["GET"])
def get_task_recommendations():
    try:
        user_id = request.args.get("user_id", "default")
        context = agent.get_user_context(user_id)
        current_week = request.args.get("week") or context.get('current_week', 1)
        query = f"Provide health tasks for week {current_week} based on recent logs."
        response = agent.run(query, user_id)
        return jsonify({"recommendations": response, "current_week": current_week})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/agent/cache/stats", methods=["GET"])
def get_cache_statistics():
    try:
        stats = agent.get_cache_stats()
        return jsonify({"statistics": stats})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/agent/cache/cleanup", methods=["POST"])
def cleanup_cache():
    try:
        agent.cleanup_cache()
        return jsonify({"status": "success", "message": "Cache cleanup completed"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/')
def index():
    from routes.appointments import get_appointments
    return get_appointments()

if __name__ == '__main__':
   app.run(host='0.0.0.0', port=5050, debug=True)