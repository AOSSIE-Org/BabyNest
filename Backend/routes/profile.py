from flask import Blueprint, request, jsonify
from services import db_service

profile_bp = Blueprint('profile', __name__)

@profile_bp.route('/set_profile', methods=['POST'])
def set_profile():
    data = request.json
    lmp = data.get('lmp')
    location = data.get('location')

    if not lmp or not location:
        return jsonify({"error": "Last menstrual period and location are required"}), 400
    
    try:
        due_date = db_service.set_user_profile(
            lmp, data.get('cycleLength'), data.get('periodLength'),
            data.get('age'), data.get('weight'), location
        )
        return jsonify({
            "status": "success", 
            "message": "Profile set successfully",
            "dueDate": due_date
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@profile_bp.route('/get_profile', methods=['GET'])
def get_profile():
    try: 
        profile = db_service.get_profile_data()
        if profile is None:
            return jsonify({"error": "Profile not found"}), 404
        
        return jsonify({
            "due_date": profile[7], # dueDate index
            "location": profile[6]  # user_location index
        }), 200
    except Exception as e:
        return jsonify({"error": "Database Error", "details": str(e)}), 500

@profile_bp.route('/delete_profile', methods=['DELETE'])
def delete_profile():
    try:
        db_service.delete_user_profile()
        return jsonify({"status": "success", "message": "Profile deleted successfully"}), 200
    except Exception as e:
        return jsonify({"error": "Database Error", "details": str(e)}), 500    

@profile_bp.route('/update_profile', methods=['PUT'])
def update_profile():
    data = request.json
    if not data.get('lmp') or not data.get('location'):
        return jsonify({"error": "LMP and location are required"}), 400

    try: 
        db_service.update_user_profile(data)
        return jsonify({"status": "success", "message": "Profile updated successfully"}), 200
    except Exception as e:    
        return jsonify({"error": "Database Error", "details": str(e)}), 500