from flask import Blueprint, request, jsonify
from db.db import open_db
from datetime import datetime, timedelta

analytics_bp = Blueprint('analytics', __name__)

@analytics_bp.route('/get_analytics', methods=['GET'])
def get_analytics():
    db = open_db()
    week = request.args.get('week')
    
    analytics = {}
    
    if week:
        week_filter = 'WHERE week_number = ?'
        params = (week,)
    else:
        week_filter = ''
        params = ()
    
    weight_data = db.execute(f'SELECT * FROM weekly_weight {week_filter} ORDER BY week_number', params).fetchall()
    analytics['weight'] = [dict(row) for row in weight_data]
    
    mood_data = db.execute(f'SELECT * FROM mood_logs {week_filter} ORDER BY week_number', params).fetchall()
    analytics['mood'] = [dict(row) for row in mood_data]
    
    sleep_data = db.execute(f'SELECT * FROM sleep_logs {week_filter} ORDER BY week_number', params).fetchall()
    analytics['sleep'] = [dict(row) for row in sleep_data]
    
    symptoms_data = db.execute(f'SELECT * FROM weekly_symptoms {week_filter} ORDER BY week_number', params).fetchall()
    analytics['symptoms'] = [dict(row) for row in symptoms_data]
    
    bp_data = db.execute(f'SELECT * FROM blood_pressure_logs {week_filter} ORDER BY week_number', params).fetchall()
    analytics['blood_pressure'] = [dict(row) for row in bp_data]
    
    appointments_data = db.execute('SELECT * FROM appointments ORDER BY appointment_date').fetchall()
    analytics['appointments'] = [dict(row) for row in appointments_data]
    
    return jsonify(analytics), 200


@analytics_bp.route('/get_weight_entries', methods=['GET'])
def get_weight_entries():
    db = open_db()
    week = request.args.get('week')
    
    if week:
        rows = db.execute('SELECT * FROM weekly_weight WHERE week_number = ? ORDER BY week_number', (week,)).fetchall()
    else:
        rows = db.execute('SELECT * FROM weekly_weight ORDER BY week_number').fetchall()
    
    return jsonify([dict(row) for row in rows]), 200


@analytics_bp.route('/get_mood_entries', methods=['GET'])
def get_mood_entries():
    db = open_db()
    week = request.args.get('week')
    
    if week:
        rows = db.execute('SELECT * FROM mood_logs WHERE week_number = ? ORDER BY week_number', (week,)).fetchall()
    else:
        rows = db.execute('SELECT * FROM mood_logs ORDER BY week_number').fetchall()
    
    return jsonify([dict(row) for row in rows]), 200


@analytics_bp.route('/get_sleep_entries', methods=['GET'])
def get_sleep_entries():
    db = open_db()
    week = request.args.get('week')
    
    if week:
        rows = db.execute('SELECT * FROM sleep_logs WHERE week_number = ? ORDER BY week_number', (week,)).fetchall()
    else:
        rows = db.execute('SELECT * FROM sleep_logs ORDER BY week_number').fetchall()
    
    return jsonify([dict(row) for row in rows]), 200
