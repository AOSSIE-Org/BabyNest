from db.db import open_db, close_db, first_time_setup
import os
from flask import Flask, request, jsonify
from flask_cors import CORS
from routes.appointments import appointments_bp, get_appointments
from routes.tasks import tasks_bp, get_tasks
from routes.profile import profile_bp
from routes.medicine import medicine_bp
from routes.symptoms import symptoms_bp
from routes.weight import weight_bp
from routes.blood_pressure import bp_bp
from routes.discharge import discharge_bp
from agent.agent import get_agent

app = Flask(__name__)
CORS(app)

# Register blueprints
app.register_blueprint(appointments_bp)
app.register_blueprint(tasks_bp)
app.register_blueprint(profile_bp)
app.register_blueprint(medicine_bp)
app.register_blueprint(symptoms_bp)
app.register_blueprint(weight_bp)
app.register_blueprint(bp_bp)
app.register_blueprint(discharge_bp)

# Database teardown
@app.teardown_appcontext
def teardown_db(exception):
    close_db(exception)

# Initialize database and agent
db_path = os.path.join(os.path.dirname(__file__), "db", "database.db")
first_time_setup()  # Must be called before initializing the agent

AGENT_INITIALIZED = False

if not os.getenv("SKIP_AGENT_INIT"):
    agent = get_agent(db_path)
    AGENT_INITIALIZED = True
else:
    agent = None

# -----------------------
# Agent routes
# -----------------------

@app.route("/agent", methods=["POST"])
def run_agent():
    if not AGENT_INITIALIZED:
        return jsonify({"error": "Agent not initialized"}), 500

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


@app.route("/agent/cache/status", methods=["GET"])
def get_cache_status():
    if not AGENT_INITIALIZED:
        return jsonify({"error": "Agent not initialized"}), 500
    try:
        user_id = request.args.get("user_id", "default")
        user_context = agent.get_user_context(user_id)
        return jsonify({
            "cache_system": "event_driven",
            "cache_status": "active",
            "auto_update": True,
            "has_context": user_context is not None,
            "context_week": user_context.get('current_week') if user_context else None,
            "context_location": user_context.get('location') if user_context else None,
            "last_updated": user_context.get('last_updated') if user_context else None,
            "monitored_tables": [
                'profile', 'weekly_weight', 'weekly_medicine', 
                'weekly_symptoms', 'blood_pressure_logs', 'discharge_logs'
            ],
            "note": "Cache automatically updates when database changes are detected"
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/agent/context", methods=["GET"])
def get_agent_context():
    if not AGENT_INITIALIZED:
        return jsonify({"error": "Agent not initialized"}), 500
    try:
        user_id = request.args.get("user_id", "default")
        context = agent.get_user_context(user_id)
        if not context:
            return jsonify({"error": "No context available"}), 404
        return jsonify({
            "context": context,
            "timestamp": context.get('timestamp'),
            "current_week": context.get('current_week'),
            "profile": context.get('profile'),
            "recent_data": {
                "weight": context.get('recent_weight'),
                "symptoms": context.get('recent_symptoms'),
                "medicine": context.get('recent_medicine'),
                "blood_pressure": context.get('recent_blood_pressure'),
                "discharge": context.get('recent_discharge')
            }
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/agent/tasks/recommendations", methods=["GET"])
def get_task_recommendations():
    if not AGENT_INITIALIZED:
        return jsonify({"error": "Agent not initialized"}), 500
    try:
        user_id = request.args.get("user_id", "default")
        week = request.args.get("week")
        context = agent.get_user_context(user_id)
        if not context:
            return jsonify({"error": "No user context available"}), 404
        
        current_week = week or context.get('current_week', 1)
        query = f"What are the most important tasks and recommendations for week {current_week} of pregnancy? Consider the user's current health data and provide personalized recommendations."
        response = agent.run(query, user_id)
        return jsonify({
            "recommendations": response,
            "current_week": current_week,
            "context_used": {
                "weight": context.get('recent_weight'),
                "symptoms": context.get('recent_symptoms'),
                "medicine": context.get('recent_medicine')
            }
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/agent/cache/stats", methods=["GET"])
def get_cache_statistics():
    if not AGENT_INITIALIZED:
        return jsonify({"error": "Agent not initialized"}), 500
    try:
        stats = agent.get_cache_stats()
        return jsonify({
            "cache_management": "enabled",
            "statistics": stats,
            "limits": {
                "max_cache_size_mb": stats["max_cache_size_mb"],
                "max_tracking_entries": stats["max_tracking_entries"],
                "max_cache_age_days": stats["max_cache_age_days"],
                "max_memory_cache_size": stats["max_memory_cache_size"]
            },
            "current_usage": {
                "memory_cache_size": stats["memory_cache_size"],
                "cache_files": stats["cache_files"],
                "total_cache_size_mb": round(stats["total_cache_size_mb"], 2)
            }
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/agent/cache/cleanup", methods=["POST"])
def cleanup_cache():
    if not AGENT_INITIALIZED:
        return jsonify({"error": "Agent not initialized"}), 500
    try:
        agent.cleanup_cache()
        stats = agent.get_cache_stats()
        return jsonify({
            "status": "success",
            "message": "Cache cleanup completed",
            "statistics": stats
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/')
def index():
    appointment_db = get_appointments()
    task_db = get_tasks()
    return appointment_db


@app.route("/health", methods=["GET"])
def health():
    return {"status": "ok", "agent_initialized": AGENT_INITIALIZED}


# Run server
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)



   
