from db.db import open_db,close_db,first_time_setup
import os
from flask import Flask, request, jsonify
from flask_cors import CORS
from werkzeug.exceptions import BadRequest, UnsupportedMediaType
from routes.appointments import appointments_bp
from routes.tasks import tasks_bp
from routes.profile import profile_bp
from routes.medicine import medicine_bp
from routes.symptoms import symptoms_bp
from routes.weight import weight_bp
from routes.blood_pressure import bp_bp
from routes.discharge import discharge_bp
from routes.mood import mood_bp
from routes.sleep import sleep_bp
from routes.analytics import analytics_bp
from routes.crud import crud_bp
from error_handling.handlers import handle_missing_field_error, handle_not_found_error
from error_handling.error_classes import MissingFieldError, NotFoundError
from agent.agent import get_agent
import argparse


# To enable context-aware error handling
parser = argparse.ArgumentParser(description="Run the Flask backend server.")
parser.add_argument("--env", type=str, default="development", choices=["development", "production"])


app = Flask(__name__)
CORS(app)

app.config['ENV'] = os.getenv('FLASK_ENV', 'development')

app.register_blueprint(appointments_bp)
app.register_blueprint(tasks_bp)
app.register_blueprint(profile_bp)
app.register_blueprint(medicine_bp)
app.register_blueprint(symptoms_bp)
app.register_blueprint(weight_bp)
app.register_blueprint(bp_bp)
app.register_blueprint(discharge_bp)
app.register_blueprint(mood_bp)
app.register_blueprint(sleep_bp)
app.register_blueprint(analytics_bp)
app.register_blueprint(crud_bp)

# Register error handlers

app.register_error_handler(MissingFieldError, handle_missing_field_error)
app.register_error_handler(NotFoundError, handle_not_found_error)

@app.errorhandler(Exception)
def handle_generic_exception(e):
    """Handle generic exceptions."""
    mode = app.config.get('ENV', 'development')
    if mode == 'development':
        response = {"error": "Internal Server Error", "details": str(e)}
    else:
        response = {"error": "Something went very wrong. Try again later!"}
    return jsonify(response), 500

@app.errorhandler(BadRequest)
def handle_bad_request(e):
    mode = app.config.get('ENV', 'development')
    if mode == 'development':
        return jsonify({
            "error": "Bad request",
            "details": e.description
        }), 400
    else:
        return jsonify({
            "error": "Invalid request"
        }), 400
    
@app.errorhandler(UnsupportedMediaType)
# This handles cases where Content-Type is not application/json
# This error is raised by the get_json() method of the request object
def handle_unsupported_media(e):
    return jsonify({
        "error": "Content-Type must be application/json"
    }), 415


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



@app.route("/agent/cache/status", methods=["GET"])
def get_cache_status():
    """Get cache status information."""
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

@app.route("/agent/refresh", methods=["POST"])
def refresh_agent_context():
    """Refresh the agent context for a user."""
    try:
        if not request.is_json:
            return jsonify({"error": "Invalid JSON format"}), 400
        
        data = request.get_json()
        user_id = data.get("user_id", "default")
        
        agent.update_cache(data_type="all", operation="refresh")
        
        return jsonify({
            "status": "success",
            "message": "Context refreshed successfully",
            "user_id": user_id
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/agent/context", methods=["GET"])
def get_agent_context():
    """Get the current agent context for frontend use."""
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

@app.route("/undo_last_action", methods=["POST"])
def undo_last_action():
    """Undo the last action performed by the agent."""
    try:
        if not request.is_json:
            return jsonify({"error": "Invalid JSON format"}), 400
        
        data = request.get_json()
        action_type = data.get("action_type")
        record_id = data.get("record_id")
        
        if not action_type or not record_id:
            return jsonify({"error": "action_type and record_id are required"}), 400
        
        db = open_db()
        
        if action_type == "create_appointment":
            db.execute("DELETE FROM appointments WHERE id = ?", (record_id,))
        elif action_type == "add_weight":
            db.execute("DELETE FROM weekly_weight WHERE id = ?", (record_id,))
        elif action_type == "log_mood":
            db.execute("DELETE FROM mood_logs WHERE id = ?", (record_id,))
        elif action_type == "log_sleep":
            db.execute("DELETE FROM sleep_logs WHERE id = ?", (record_id,))
        elif action_type == "add_medicine":
            db.execute("DELETE FROM weekly_medicine WHERE id = ?", (record_id,))
        elif action_type == "add_symptom":
            db.execute("DELETE FROM weekly_symptoms WHERE id = ?", (record_id,))
        elif action_type == "log_bp":
            db.execute("DELETE FROM blood_pressure_logs WHERE id = ?", (record_id,))
        elif action_type == "log_discharge":
            db.execute("DELETE FROM discharge_logs WHERE id = ?", (record_id,))
        else:
            return jsonify({"error": f"Unknown action type: {action_type}"}), 400
        
        db.commit()
        
        agent.update_cache(data_type=action_type, operation="delete")
        
        return jsonify({
            "status": "success",
            "message": f"Action {action_type} with ID {record_id} undone successfully"
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/')
def index():
    return jsonify({"status": "ok", "message": "BabyNest API is running"})

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description="Run the Flask backend server.")
    parser.add_argument("--env", type=str, default="development", choices=["development", "production"])
    args = parser.parse_args()
    app.config['ENV'] = args.env
    port = os.getenv("DEV_PORT", 5000) if app.config['ENV'] == 'development' else os.getenv("PROD_PORT", 8000)
    app.run(host='0.0.0.0', port=port, debug=(app.config['ENV'] == 'development'))
