import os
import logging
from flask import Flask, request, jsonify
from flask_cors import CORS
from db.db import first_time_setup
from agent.agent import get_agent

# Blueprint imports
from routes.appointments import appointments_bp
from routes.tasks import tasks_bp
from routes.profile import profile_bp
from routes.medicine import medicine_bp
from routes.symptoms import symptoms_bp
from routes.weight import weight_bp
from routes.blood_pressure import bp_bp
from routes.discharge import discharge_bp

app = Flask(__name__)
CORS(app)

app.register_blueprint(appointments_bp)
app.register_blueprint(tasks_bp)
app.register_blueprint(profile_bp)
app.register_blueprint(medicine_bp)
app.register_blueprint(symptoms_bp)
app.register_blueprint(weight_bp)
app.register_blueprint(bp_bp)
app.register_blueprint(discharge_bp)

db_path = os.path.join(os.path.dirname(__file__), "db", "database.db")

# Idempotent initialization: Only setup if DB file is missing
try:
    if not os.path.exists(db_path):
        first_time_setup() 
    agent = get_agent(db_path)
except Exception:
    logging.exception("Failed to initialize application")
    raise

@app.route("/agent", methods=["POST"])
def run_agent():
    if not request.is_json:
        return jsonify({"error": "Invalid JSON format"}), 400
    
    data = request.get_json()
    query = data.get("query")
    
    if not query or not isinstance(query, str):
        return jsonify({"error": "Query is required and must be a string"}), 400
        
    user_id = data.get("user_id", "default") 
    try:
        response = agent.run(query, user_id)
        return jsonify({"response": response})
    except Exception:
        logging.exception("Error in run_agent")
        return jsonify({"error": "Internal server error"}), 500

if __name__ == '__main__':
    debug_mode = os.environ.get('FLASK_DEBUG', 'false').lower() == 'true'
    app.run(host='127.0.0.1', port=5000, debug=debug_mode)