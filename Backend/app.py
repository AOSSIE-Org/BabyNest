from db.db import open_db,close_db,first_time_setup
import os
from flask import Flask, request, jsonify
from flask_cors import CORS
from routes.appointments import appointments_bp
from routes.tasks import tasks_bp
from routes.profile import profile_bp
from routes.medicine import medicine_bp
from routes.symptoms import symptoms_bp
from routes.weight import weight_bp
from routes.blood_pressure import bp_bp
from routes.discharge import discharge_bp
from agent.agent import get_agent

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

@app.teardown_appcontext
def teardown_db(exception):
    close_db(exception)

# Initialize agent with database path
db_path = os.path.join(os.path.dirname(__file__), "db", "database.db")
first_time_setup() # This needs to be called before initializing the agent

agent = get_agent(db_path)

@app.route("/agent", methods=["POST"])
def run_agent():
    if not request.is_json:
        return jsonify({"error": "Invalid JSON format"}), 400
    
    data = request.get_json()
    if not data:
        return jsonify({"error": "No data provided"}), 400
    
    query = data.get("query")
    if not query:
        return jsonify({"error": "Query is required"}), 400
    
    user_id = data.get("user_id", "default") 
    try:
        response = agent.run(query, user_id)
        return jsonify({"response": response})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/agent/refresh", methods=["POST"])
def refresh_agent_context():
    """Force refresh the agent's context cache."""
    try:
        data = request.get_json() or {}
        user_id = data.get("user_id", "default")
        context = agent.force_refresh_context(user_id)
        return jsonify({
            "message": "Context refreshed successfully",
            "context": context
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/agent/cache/status", methods=["GET"])
def get_cache_status():
    """Get cache status information."""
    try:
        user_context = agent.get_user_context()
        return jsonify({
            "cache_status": "active",
            "has_context": user_context is not None,
            "context_week": user_context.get('current_week') if user_context else None,
            "context_location": user_context.get('location') if user_context else None
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/')
def index():
    from routes.appointments import get_appointments
    from routes.tasks import get_tasks
    appointment_db =  get_appointments()
    task_db = get_tasks()
    return appointment_db

if __name__ == '__main__':
   app.run(host='0.0.0.0', port=5000, debug=True)

   
