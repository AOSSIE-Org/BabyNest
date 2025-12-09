import os
import sys
from typing import Optional

# Ensure local imports work when running from repo root
BASE_DIR = os.path.abspath(os.path.dirname(__file__))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from db.db import open_db, close_db, first_time_setup
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


def _env_flag(name: str) -> bool:
    """Return True when env var is set to a truthy value."""
    return os.getenv(name, "").lower() in {"1", "true", "yes", "y"}
app.register_blueprint(discharge_bp)

@app.teardown_appcontext
def teardown_db(exception):
    close_db(exception)

SKIP_AGENT_INIT = _env_flag("SKIP_AGENT_INIT")
db_path = os.path.join(BASE_DIR, "db", "database.db")

agent = None  # type: Optional[object]
agent_init_error: Optional[str] = None

# Perform light-weight DB setup before agent initialization
first_time_setup()

if not SKIP_AGENT_INIT:
    try:
        agent = get_agent(db_path)
    except Exception as exc:  # keep startup running even if agent fails
        agent_init_error = str(exc)


def _ensure_agent():
    if agent is None:
        message = "Agent not initialized. Run without SKIP_AGENT_INIT to enable agent features."
        if agent_init_error:
            message = f"{message} Last error: {agent_init_error}"
        return jsonify({"error": message}), 503
    return None


@app.route("/health", methods=["GET"])
def health_check():
    return jsonify({
        "status": "ok",
        "agent_initialized": agent is not None,
        "agent_error": agent_init_error,
        "skip_agent_init": SKIP_AGENT_INIT,
    })

@app.route("/agent", methods=["POST"])
def run_agent():
    missing_agent = _ensure_agent()
    if missing_agent:
        return missing_agent

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
    """Get cache status information."""
    missing_agent = _ensure_agent()
    if missing_agent:
        return missing_agent
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
    """Get the current agent context for frontend use."""
    missing_agent = _ensure_agent()
    if missing_agent:
        return missing_agent
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
    """Get LLM-powered task recommendations based on current context."""
    missing_agent = _ensure_agent()
    if missing_agent:
        return missing_agent
    try:
        user_id = request.args.get("user_id", "default")
        week = request.args.get("week")
        
        # Get user context
        context = agent.get_user_context(user_id)
        if not context:
            return jsonify({"error": "No user context available"}), 404
        
        # Build query for task recommendations
        current_week = week or context.get('current_week', 1)
        query = f"What are the most important tasks and recommendations for week {current_week} of pregnancy? Consider the user's current health data and provide personalized recommendations."
        
        # Get LLM response
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
    """Get detailed cache statistics for monitoring."""
    missing_agent = _ensure_agent()
    if missing_agent:
        return missing_agent
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
    """Manually trigger cache cleanup."""
    missing_agent = _ensure_agent()
    if missing_agent:
        return missing_agent
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
    from routes.appointments import get_appointments
    from routes.tasks import get_tasks
    appointment_db =  get_appointments()
    task_db = get_tasks()
    return appointment_db

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)

   
