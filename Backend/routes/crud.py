from flask import Blueprint, request, jsonify
from db.db import open_db
import os
import sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from agent.agent import get_agent
from error_handling.handlers import handle_db_errors
from error_handling.error_classes import NotFoundError

crud_bp = Blueprint('crud', __name__)

# Medicine endpoints
@crud_bp.route('/update_medicine', methods=['PUT'])
@handle_db_errors
def update_medicine():
    db = open_db()
    data = request.get_json()
    if not data or 'id' not in data:
        return jsonify({"error": "Medicine ID is required"}), 400
    
    entry = db.execute('SELECT * FROM weekly_medicine WHERE id = ?', (data['id'],)).fetchone()
    if not entry:
        raise NotFoundError(resource="Medicine entry", resource_id=data['id'])
    
    db.execute(
        'UPDATE weekly_medicine SET week_number=?, name=?, dose=?, time=?, note=? WHERE id=?',
        (
            data.get('week_number', entry['week_number']),
            data.get('name', entry['name']),
            data.get('dose', entry['dose']),
            data.get('time', entry['time']),
            data.get('note', entry['note']),
            data['id']
        )
    )
    db.commit()
    
    db_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "db", "database.db")
    agent = get_agent(db_path)
    agent.update_cache(data_type="medicine", operation="update")
    
    return jsonify({"status": "success", "message": "Medicine updated"}), 200

@crud_bp.route('/delete_medicine', methods=['DELETE'])
@handle_db_errors
def delete_medicine():
    db = open_db()
    data = request.get_json()
    if not data or 'id' not in data:
        return jsonify({"error": "Medicine ID is required"}), 400
    
    entry = db.execute('SELECT * FROM weekly_medicine WHERE id = ?', (data['id'],)).fetchone()
    if not entry:
        raise NotFoundError(resource="Medicine entry", resource_id=data['id'])
    
    db.execute('DELETE FROM weekly_medicine WHERE id = ?', (data['id'],))
    db.commit()
    
    db_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "db", "database.db")
    agent = get_agent(db_path)
    agent.update_cache(data_type="medicine", operation="delete")
    
    return jsonify({"status": "success", "message": "Medicine deleted"}), 200

# Blood Pressure endpoints
@crud_bp.route('/update_blood_pressure', methods=['PUT'])
@handle_db_errors
def update_blood_pressure():
    db = open_db()
    data = request.get_json()
    if not data or 'id' not in data:
        return jsonify({"error": "Blood pressure ID is required"}), 400
    
    entry = db.execute('SELECT * FROM blood_pressure_logs WHERE id = ?', (data['id'],)).fetchone()
    if not entry:
        raise NotFoundError(resource="Blood pressure entry", resource_id=data['id'])
    
    db.execute(
        'UPDATE blood_pressure_logs SET week_number=?, systolic=?, diastolic=?, time=?, note=? WHERE id=?',
        (
            data.get('week_number', entry['week_number']),
            data.get('systolic', entry['systolic']),
            data.get('diastolic', entry['diastolic']),
            data.get('time', entry['time']),
            data.get('note', entry['note']),
            data['id']
        )
    )
    db.commit()
    
    db_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "db", "database.db")
    agent = get_agent(db_path)
    agent.update_cache(data_type="blood_pressure", operation="update")
    
    return jsonify({"status": "success", "message": "Blood pressure updated"}), 200

@crud_bp.route('/delete_blood_pressure', methods=['DELETE'])
@handle_db_errors
def delete_blood_pressure():
    db = open_db()
    data = request.get_json()
    if not data or 'id' not in data:
        return jsonify({"error": "Blood pressure ID is required"}), 400
    
    entry = db.execute('SELECT * FROM blood_pressure_logs WHERE id = ?', (data['id'],)).fetchone()
    if not entry:
        raise NotFoundError(resource="Blood pressure entry", resource_id=data['id'])
    
    db.execute('DELETE FROM blood_pressure_logs WHERE id = ?', (data['id'],))
    db.commit()
    
    db_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "db", "database.db")
    agent = get_agent(db_path)
    agent.update_cache(data_type="blood_pressure", operation="delete")
    
    return jsonify({"status": "success", "message": "Blood pressure deleted"}), 200

# Discharge endpoints
@crud_bp.route('/update_discharge', methods=['PUT'])
@handle_db_errors
def update_discharge():
    db = open_db()
    data = request.get_json()
    if not data or 'id' not in data:
        return jsonify({"error": "Discharge ID is required"}), 400
    
    entry = db.execute('SELECT * FROM discharge_logs WHERE id = ?', (data['id'],)).fetchone()
    if not entry:
        raise NotFoundError(resource="Discharge entry", resource_id=data['id'])
    
    db.execute(
        'UPDATE discharge_logs SET week_number=?, type=?, color=?, bleeding=?, note=? WHERE id=?',
        (
            data.get('week_number', entry['week_number']),
            data.get('type', entry['type']),
            data.get('color', entry['color']),
            data.get('bleeding', entry['bleeding']),
            data.get('note', entry['note']),
            data['id']
        )
    )
    db.commit()
    
    db_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "db", "database.db")
    agent = get_agent(db_path)
    agent.update_cache(data_type="discharge", operation="update")
    
    return jsonify({"status": "success", "message": "Discharge updated"}), 200

@crud_bp.route('/delete_discharge', methods=['DELETE'])
@handle_db_errors
def delete_discharge():
    db = open_db()
    data = request.get_json()
    if not data or 'id' not in data:
        return jsonify({"error": "Discharge ID is required"}), 400
    
    entry = db.execute('SELECT * FROM discharge_logs WHERE id = ?', (data['id'],)).fetchone()
    if not entry:
        raise NotFoundError(resource="Discharge entry", resource_id=data['id'])
    
    db.execute('DELETE FROM discharge_logs WHERE id = ?', (data['id'],))
    db.commit()
    
    db_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "db", "database.db")
    agent = get_agent(db_path)
    agent.update_cache(data_type="discharge", operation="delete")
    
    return jsonify({"status": "success", "message": "Discharge deleted"}), 200

# Symptoms endpoints
@crud_bp.route('/update_symptoms', methods=['PUT'])
@handle_db_errors
def update_symptoms():
    db = open_db()
    data = request.get_json()
    if not data or 'id' not in data:
        return jsonify({"error": "Symptom ID is required"}), 400
    
    entry = db.execute('SELECT * FROM weekly_symptoms WHERE id = ?', (data['id'],)).fetchone()
    if not entry:
        raise NotFoundError(resource="Symptom entry", resource_id=data['id'])
    
    db.execute(
        'UPDATE weekly_symptoms SET week_number=?, symptom=?, note=? WHERE id=?',
        (
            data.get('week_number', entry['week_number']),
            data.get('symptom', entry['symptom']),
            data.get('note', entry['note']),
            data['id']
        )
    )
    db.commit()
    
    db_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "db", "database.db")
    agent = get_agent(db_path)
    agent.update_cache(data_type="symptoms", operation="update")
    
    return jsonify({"status": "success", "message": "Symptom updated"}), 200

@crud_bp.route('/delete_symptoms', methods=['DELETE'])
@handle_db_errors
def delete_symptoms():
    db = open_db()
    data = request.get_json()
    if not data or 'id' not in data:
        return jsonify({"error": "Symptom ID is required"}), 400
    
    entry = db.execute('SELECT * FROM weekly_symptoms WHERE id = ?', (data['id'],)).fetchone()
    if not entry:
        raise NotFoundError(resource="Symptom entry", resource_id=data['id'])
    
    db.execute('DELETE FROM weekly_symptoms WHERE id = ?', (data['id'],))
    db.commit()
    
    db_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "db", "database.db")
    agent = get_agent(db_path)
    agent.update_cache(data_type="symptoms", operation="delete")
    
    return jsonify({"status": "success", "message": "Symptom deleted"}), 200

# Weight endpoints
@crud_bp.route('/update_weight', methods=['PUT'])
@handle_db_errors
def update_weight():
    db = open_db()
    data = request.get_json()
    if not data or 'id' not in data:
        return jsonify({"error": "Weight ID is required"}), 400
    
    entry = db.execute('SELECT * FROM weekly_weight WHERE id = ?', (data['id'],)).fetchone()
    if not entry:
        raise NotFoundError(resource="Weight entry", resource_id=data['id'])
    
    db.execute(
        'UPDATE weekly_weight SET week_number=?, weight=?, note=? WHERE id=?',
        (
            data.get('week_number', entry['week_number']),
            data.get('weight', entry['weight']),
            data.get('note', entry['note']),
            data['id']
        )
    )
    db.commit()
    
    db_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "db", "database.db")
    agent = get_agent(db_path)
    agent.update_cache(data_type="weight", operation="update")
    
    return jsonify({"status": "success", "message": "Weight updated"}), 200

@crud_bp.route('/delete_weight', methods=['DELETE'])
@handle_db_errors
def delete_weight():
    db = open_db()
    data = request.get_json()
    if not data or 'id' not in data:
        return jsonify({"error": "Weight ID is required"}), 400
    
    entry = db.execute('SELECT * FROM weekly_weight WHERE id = ?', (data['id'],)).fetchone()
    if not entry:
        raise NotFoundError(resource="Weight entry", resource_id=data['id'])
    
    db.execute('DELETE FROM weekly_weight WHERE id = ?', (data['id'],))
    db.commit()
    
    db_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "db", "database.db")
    agent = get_agent(db_path)
    agent.update_cache(data_type="weight", operation="delete")
    
    return jsonify({"status": "success", "message": "Weight deleted"}), 200
