from flask import Blueprint, request, jsonify, session
from functools import wraps
from services import db_service

medicine_bp = Blueprint('medicine', __name__)

def require_auth(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            return jsonify({"error": "Authentication required"}), 401
        return f(*args, **kwargs)
    return decorated_function

# Create
@medicine_bp.route('/set_medicine', methods=['POST'])
def add_medicine():
    data = request.json
    week = data.get('week_number')
    name = data.get('name')
    dose = data.get('dose')
    time = data.get('time')
    note = data.get('note')

    if not all([week, name, dose, time]):
        return jsonify({"error": "Missing fields"}), 400

    # Validation logic remains in the route to catch bad inputs early
    try:
       week = int(week)
       if week < 1 or week > 52:
           return jsonify({"error": "Week number must be between 1 and 52"}), 400
    except (ValueError, TypeError):
       return jsonify({"error": "Week number must be a valid integer"}), 400
   
    if not isinstance(name, str) or len(name.strip()) == 0:
       return jsonify({"error": "Medicine name must be a non-empty string"}), 400

    try:
        db_service.save_medicine_entry(week, name, dose, time, note)
        return jsonify({"status": "success", "message": "Medicine added"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Read all
@medicine_bp.route('/get_medicine', methods=['GET'])
def get_all_medicine():
    logs = db_service.get_all_medicine_entries()
    return jsonify(logs), 200

# Read by week
@medicine_bp.route('/medicine/week/<int:week>', methods=['GET'])
@require_auth
def get_week_medicine(week):
    logs = db_service.get_medicine_by_week(week)
    return jsonify(logs), 200

# Read by ID
@medicine_bp.route('/medicine/<int:id>', methods=['GET'])
@require_auth
def get_medicine(id):
    entry = db_service.get_medicine_by_id(id)
    if not entry:
        return jsonify({"error": "Entry not found"}), 404
    return jsonify(dict(entry)), 200

# Update by ID
@medicine_bp.route('/medicine/<int:id>', methods=['PUT'])
@require_auth
def update_medicine(id):
    data = request.json
    entry = db_service.get_medicine_by_id(id)
    
    if not entry:
        return jsonify({"error": "Entry not found"}), 404

    # Delegates logic to service layer
    db_service.update_medicine_entry(id, data, entry)
    return jsonify({"status": "success", "message": "Medicine updated"}), 200

# Delete by ID
@medicine_bp.route('/medicine/<int:id>', methods=['DELETE'])
@require_auth
def delete_medicine(id):
    entry = db_service.get_medicine_by_id(id)
    if not entry:
        return jsonify({"error": "Entry not found"}), 404

    db_service.delete_medicine_entry(id)
    return jsonify({"status": "success", "message": "Medicine entry deleted"}), 200