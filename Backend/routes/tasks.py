from flask import Blueprint, request, jsonify
from services import db_service

tasks_bp = Blueprint('tasks', __name__)

@tasks_bp.route('/get_tasks', methods=['GET'])
def get_tasks():
    try:
        tasks = db_service.get_all_tasks()
        return jsonify(tasks), 200
    except Exception as e:
        return jsonify({"error": "Database Error", "details": str(e)}), 500
        
@tasks_bp.route('/get_task/<int:task_id>', methods=['GET'])
def get_task(task_id):
    try:
        task = db_service.get_task_by_id(task_id)
        if not task:
            return jsonify({"error": "Task not found"}), 404
        return jsonify(dict(task)), 200
    except Exception as e:
        return jsonify({"error": "Database Error", "details": str(e)}), 500

@tasks_bp.route('/add_task', methods=['POST'])
def add_task():
    try:
        db_service.save_task(request.json)
        return jsonify({"status": "success", "message": "Task added"}), 201
    except Exception as e:
        return jsonify({"error": "Database Error", "details": str(e)}), 500

@tasks_bp.route('/update_task/<int:task_id>', methods=['PUT'])
def update_task(task_id):
    try:
        existing = db_service.get_task_by_id(task_id)
        if not existing:
            return jsonify({"error": "Task not found"}), 404
            
        db_service.update_task_entry(task_id, request.json, existing)
        return jsonify({"status": "success", "message": "Task updated"}), 200
    except Exception as e:
        return jsonify({"error": "Database Error", "details": str(e)}), 500

@tasks_bp.route('/delete_task/<int:task_id>', methods=['DELETE'])    
def delete_task(task_id):
    try:
        db_service.delete_task_entry(task_id)
        return jsonify({"status": "success", "message": "Task deleted"}), 200
    except Exception as e:
        return jsonify({"error": "Database Error", "details": str(e)}), 500

@tasks_bp.route('/move_to_appointment/<int:task_id>', methods=['PUT'])
def move_to_appointment(task_id):
    try:
        task = db_service.get_task_by_id(task_id)
        if task is None:
            return jsonify({"error": "Task not found"}), 404
        
        data = request.json
        if not all([data.get('appointment_date'), data.get('appointment_time'), data.get('appointment_location')]):
            return jsonify({"error": "Missing appointment details"}), 400
        
        db_service.convert_task_to_appointment(task_id, data, task)
        return jsonify({"status": "success", "message": "Task moved to appointment"}), 200
    except Exception as e:
        return jsonify({"error": "Database Error", "details": str(e)}), 500