import os
import sqlite3
from db.db import open_db
from agent.agent import get_agent

# Standardized path for the SQLite database
DB_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "db", "database.db")

# --- Weight Service Functions ---

def save_weight(week, weight, note):
    """Inserts a new weight record and updates the AI agent cache."""
    db = open_db()
    db.execute(
        'INSERT INTO weekly_weight (week_number, weight, note) VALUES (?, ?, ?)',
        (week, weight, note)
    )
    db.commit()

    agent = get_agent(DB_PATH)
    agent.update_cache(data_type="weight", operation="create")
    return True

def get_all_weight_entries():
    """Fetches all weight records from the database."""
    db = open_db()
    weights = db.execute('SELECT * FROM weekly_weight').fetchall()
    return [dict(row) for row in weights]

def get_weight_by_week(week):
    """Fetches weight records filtered by week_number."""
    db = open_db()
    weights = db.execute('SELECT * FROM weekly_weight WHERE week_number = ?', (week,)).fetchall()
    return [dict(row) for row in weights]

def get_weight_by_id(entry_id):
    """Retrieves a single weight record by its primary ID."""
    db = open_db()
    return db.execute('SELECT * FROM weekly_weight WHERE id = ?', (entry_id,)).fetchone()

def update_weight_entry(entry_id, data, existing_entry):
    """Updates an existing weight entry with partial data support."""
    db = open_db()
    
    new_week = data.get('week_number', existing_entry['week_number'])
    new_weight = data.get('weight', existing_entry['weight'])
    new_note = data.get('note', existing_entry['note'])

    db.execute(
        'UPDATE weekly_weight SET week_number=?, weight=?, note=? WHERE id=?',
        (new_week, new_weight, new_note, entry_id)
    )
    db.commit()

    agent = get_agent(DB_PATH)
    agent.update_cache(data_type="weight", operation="update")
    return True

def delete_weight_entry(entry_id):
    """Deletes a weight entry and synchronizes the AI cache."""
    db = open_db()
    db.execute('DELETE FROM weekly_weight WHERE id = ?', (entry_id,))
    db.commit()

    agent = get_agent(DB_PATH)
    agent.update_cache(data_type="weight", operation="delete")
    return True

# --- Blood Pressure Service Functions ---

def save_bp_entry(week, systolic, diastolic, time, note):
    """Saves blood pressure logs with time and updates AI cache."""
    db = open_db()
    db.execute(
        '''INSERT INTO blood_pressure_logs (week_number, systolic, diastolic, time, note)
           VALUES (?, ?, ?, ?, ?)''',
        (week, systolic, diastolic, time, note)
    )
    db.commit()

    agent = get_agent(DB_PATH)
    agent.update_cache(data_type="blood_pressure", operation="create")
    return True

def get_all_bp_entries():
    """Fetches all blood pressure logs ordered by creation date."""
    db = open_db()
    rows = db.execute('SELECT * FROM blood_pressure_logs ORDER BY created_at DESC').fetchall()
    return [dict(row) for row in rows]

def get_bp_entries_by_week(week):
    """Fetches blood pressure logs for a specific week."""
    db = open_db()
    rows = db.execute('SELECT * FROM blood_pressure_logs WHERE week_number = ? ORDER BY created_at DESC', (week,)).fetchall()
    return [dict(row) for row in rows]

def get_bp_entry_by_id(entry_id):
    """Retrieves a single blood pressure record by ID."""
    db = open_db()
    return db.execute('SELECT * FROM blood_pressure_logs WHERE id = ?', (entry_id,)).fetchone()

def update_bp_entry(entry_id, data, existing_entry):
    """Updates blood pressure entry and synchronizes AI cache."""
    db = open_db()
    db.execute(
        '''UPDATE blood_pressure_logs SET week_number=?, systolic=?, diastolic=?, time=?, note=? WHERE id=?''',
        (
            data.get('week_number', existing_entry['week_number']),
            data.get('systolic', existing_entry['systolic']),
            data.get('diastolic', existing_entry['diastolic']),
            data.get('time', existing_entry['time']),
            data.get('note', existing_entry['note']),
            entry_id
        )
    )
    db.commit()

    agent = get_agent(DB_PATH)
    agent.update_cache(data_type="blood_pressure", operation="update")
    return True

def delete_bp_entry(entry_id):
    """Deletes blood pressure entry and synchronizes AI cache."""
    db = open_db()
    db.execute('DELETE FROM blood_pressure_logs WHERE id = ?', (entry_id,))
    db.commit()

    agent = get_agent(DB_PATH)
    agent.update_cache(data_type="blood_pressure", operation="delete")
    return True

# --- Medicine Service Functions ---

def save_medicine_entry(week, name, dose, time, note):
    """Saves medicine logs and updates AI cache."""
    db = open_db()
    db.execute(
        'INSERT INTO weekly_medicine (week_number, name, dose, time, note) VALUES (?, ?, ?, ?, ?)',
        (week, name, dose, time, note)
    )
    db.commit()

    agent = get_agent(DB_PATH)
    agent.update_cache(data_type="medicine", operation="create")
    return True

def get_all_medicine_entries():
    """Fetches all medicine records."""
    db = open_db()
    rows = db.execute('SELECT * FROM weekly_medicine').fetchall()
    return [dict(row) for row in rows]

def get_medicine_by_week(week):
    """Fetches medicine records for a specific week."""
    db = open_db()
    rows = db.execute('SELECT * FROM weekly_medicine WHERE week_number = ?', (week,)).fetchall()
    return [dict(row) for row in rows]

def get_medicine_by_id(entry_id):
    """Retrieves a specific medicine record by ID."""
    db = open_db()
    return db.execute('SELECT * FROM weekly_medicine WHERE id = ?', (entry_id,)).fetchone()

def update_medicine_entry(entry_id, data, existing_entry):
    """Updates existing medicine entry and synchronizes AI cache."""
    db = open_db()
    db.execute(
        '''UPDATE weekly_medicine SET week_number=?, name=?, dose=?, time=?, note=? WHERE id=?''',
        (
            data.get('week_number', existing_entry['week_number']),
            data.get('name', existing_entry['name']),
            data.get('dose', existing_entry['dose']),
            data.get('time', existing_entry['time']),
            data.get('note', existing_entry['note']),
            entry_id
        )
    )
    db.commit()

    agent = get_agent(DB_PATH)
    agent.update_cache(data_type="medicine", operation="update")
    return True

def delete_medicine_entry(entry_id):
    """Deletes medicine entry and synchronizes AI cache."""
    db = open_db()
    db.execute('DELETE FROM weekly_medicine WHERE id = ?', (entry_id,))
    db.commit()

    agent = get_agent(DB_PATH)
    agent.update_cache(data_type="medicine", operation="delete")
    return True


# --- Appointments Service Functions ---

def get_all_appointments():
    """Fetches all appointments from the database."""
    db = open_db()
    rows = db.execute('SELECT * FROM appointments').fetchall()
    return [dict(row) for row in rows]

def get_appointment_by_id(appt_id):
    """Retrieves a specific appointment by its ID."""
    db = open_db()
    return db.execute('SELECT * FROM appointments WHERE id = ?', (appt_id,)).fetchone()

def save_appointment(title, content, date, time, location):
    """Inserts a new appointment with a default 'pending' status."""
    db = open_db()
    db.execute(
        '''INSERT INTO appointments 
           (title, content, appointment_date, appointment_time, appointment_location, appointment_status) 
           VALUES (?, ?, ?, ?, ?, ?)''',
        (title, content, date, time, location, 'pending')
    )
    db.commit()
    return True

def update_appointment_entry(appt_id, data, existing):
    """Updates an existing appointment using provided or existing data."""
    db = open_db()
    
    # Extract values with fallbacks to maintain data integrity
    title = data.get('title', existing['title'])
    content = data.get('content', existing['content'])
    date = data.get('appointment_date', existing['appointment_date'])
    time = data.get('appointment_time', existing['appointment_time'])
    loc = data.get('appointment_location', existing['appointment_location'])
    status = data.get('appointment_status', existing['appointment_status'])

    db.execute(
        '''UPDATE appointments SET 
           title = ?, content = ?, appointment_date = ?, appointment_time = ?, 
           appointment_location = ?, appointment_status = ? 
           WHERE id = ?''',
        (title, content, date, time, loc, status, appt_id)
    )
    db.commit()
    return True

def delete_appointment_entry(appt_id):
    """Removes an appointment record from the database."""
    db = open_db()
    db.execute('DELETE FROM appointments WHERE id = ?', (appt_id,))
    db.commit()
    return True


# --- Discharge Service Functions ---

def save_discharge_entry(week, entry_type, color, bleeding, note):
    """Saves discharge logs and updates AI agent cache."""
    db = open_db()
    db.execute(
        '''INSERT INTO discharge_logs (week_number, type, color, bleeding, note)
           VALUES (?, ?, ?, ?, ?)''',
        (week, entry_type, color, bleeding, note)
    )
    db.commit()

    agent = get_agent(DB_PATH)
    agent.update_cache(data_type="discharge", operation="create")
    return True

def get_all_discharge_entries():
    """Fetches all discharge logs ordered by creation date."""
    db = open_db()
    rows = db.execute('SELECT * FROM discharge_logs ORDER BY created_at DESC').fetchall()
    return [dict(row) for row in rows]

def get_discharge_entries_by_week(week):
    """Fetches discharge logs for a specific week."""
    db = open_db()
    rows = db.execute('SELECT * FROM discharge_logs WHERE week_number = ? ORDER BY created_at DESC', (week,)).fetchall()
    return [dict(row) for row in rows]

def get_discharge_entry_by_id(entry_id):
    """Retrieves a specific discharge record by ID."""
    db = open_db()
    return db.execute('SELECT * FROM discharge_logs WHERE id = ?', (entry_id,)).fetchone()

def update_discharge_entry(entry_id, data, existing_entry):
    """Updates existing discharge entry and synchronizes AI cache."""
    db = open_db()
    db.execute(
        '''UPDATE discharge_logs SET week_number=?, type=?, color=?, bleeding=?, note=? WHERE id=?''',
        (
            data.get('week_number', existing_entry['week_number']),
            data.get('type', existing_entry['type']),
            data.get('color', existing_entry['color']),
            data.get('bleeding', existing_entry['bleeding']),
            data.get('note', existing_entry['note']),
            entry_id
        )
    )
    db.commit()

    agent = get_agent(DB_PATH)
    agent.update_cache(data_type="discharge", operation="update")
    return True

def delete_discharge_entry(entry_id):
    """Deletes discharge record and synchronizes AI cache."""
    db = open_db()
    db.execute('DELETE FROM discharge_logs WHERE id = ?', (entry_id,))
    db.commit()

    agent = get_agent(DB_PATH)
    agent.update_cache(data_type="discharge", operation="delete")
    return True

from datetime import datetime, timedelta

# --- Utility Functions ---

def calculate_due_date(lmp_str, cycle_length):
    """Calculates pregnancy due date based on LMP and cycle length."""
    lmp_date = datetime.strptime(lmp_str, "%Y-%m-%d")
    # Standard: LMP + 280 days for 28-day cycle. Adjust if cycle differs
    adjustment = int(cycle_length) - 28 if cycle_length else 0
    due_date = lmp_date + timedelta(days=280 + adjustment)
    return due_date.strftime("%Y-%m-%d")

# --- Profile Service Functions ---

def get_profile_data():
    """Retrieves the single profile record from the database."""
    db = open_db()
    return db.execute('SELECT * FROM profile').fetchone()

def set_user_profile(lmp, cycle, period, age, weight, location):
    """Clears existing profile and sets a new one with a calculated due date."""
    db = open_db()
    due_date = calculate_due_date(lmp, cycle)
    
    db.execute('DELETE FROM profile')
    db.execute(
        '''INSERT INTO profile (lmp, cycleLength, periodLength, age, weight, user_location, dueDate) 
           VALUES (?, ?, ?, ?, ?, ?, ?)''',
        (lmp, cycle, period, age, weight, location, due_date)
    )
    db.commit()
    
    agent = get_agent(DB_PATH)
    agent.update_cache(data_type="profile", operation="create")
    return due_date

def delete_user_profile():
    """Deletes the user profile and updates AI cache."""
    db = open_db()
    db.execute('DELETE FROM profile')
    db.commit()
    
    agent = get_agent(DB_PATH)
    agent.update_cache(data_type="profile", operation="delete")
    return True

def update_user_profile(data):
    """Updates the profile fields and synchronizes AI cache."""
    db = open_db()
    # Note: Using the provided location and due date (LMP mapping in current route)
    db.execute(
        'UPDATE profile SET dueDate = ?, user_location = ?',
        (data.get('lmp'), data.get('location'))    
    )
    db.commit()
    
    agent = get_agent(DB_PATH)
    agent.update_cache(data_type="profile", operation="update")
    return True


# --- Symptoms Service Functions ---

def save_symptom_entry(week, symptom, note):
    """Persists a symptom log and synchronizes AI cache."""
    db = open_db()
    db.execute(
        'INSERT INTO weekly_symptoms (week_number, symptom, note) VALUES (?, ?, ?)',
        (week, symptom, note)
    )
    db.commit()

    agent = get_agent(DB_PATH)
    agent.update_cache(data_type="symptoms", operation="create")
    return True

def get_all_symptom_entries():
    """Fetches all symptom logs ordered by creation date."""
    db = open_db()
    rows = db.execute('SELECT * FROM weekly_symptoms ORDER BY created_at DESC').fetchall()
    return [dict(row) for row in rows]

def get_symptom_entries_by_week(week):
    """Fetches symptom logs for a specific week."""
    db = open_db()
    rows = db.execute('SELECT * FROM weekly_symptoms WHERE week_number = ? ORDER BY created_at DESC', (week,)).fetchall()
    return [dict(row) for row in rows]

def get_symptom_by_id(entry_id):
    """Retrieves a specific symptom record by ID."""
    db = open_db()
    return db.execute('SELECT * FROM weekly_symptoms WHERE id = ?', (entry_id,)).fetchone()

def update_symptom_entry(entry_id, data, existing_entry):
    """Updates existing symptom entry and synchronizes AI cache."""
    db = open_db()
    db.execute(
        'UPDATE weekly_symptoms SET week_number=?, symptom=?, note=? WHERE id=?',
        (
            data.get('week_number', existing_entry['week_number']),
            data.get('symptom', existing_entry['symptom']),
            data.get('note', existing_entry['note']),
            entry_id
        )
    )
    db.commit()

    agent = get_agent(DB_PATH)
    agent.update_cache(data_type="symptoms", operation="update")
    return True

def delete_symptom_entry(entry_id):
    """Deletes symptom record and synchronizes AI cache."""
    db = open_db()
    db.execute('DELETE FROM weekly_symptoms WHERE id = ?', (entry_id,))
    db.commit()

    agent = get_agent(DB_PATH)
    agent.update_cache(data_type="symptoms", operation="delete")
    return True

# --- Tasks Service Functions ---

def get_all_tasks():
    """Fetches all tasks from the database."""
    db = open_db()
    tasks = db.execute('SELECT * FROM tasks').fetchall()
    return [dict(task) for task in tasks]

def get_task_by_id(task_id):
    """Retrieves a specific task by ID."""
    db = open_db()
    return db.execute('SELECT * FROM tasks WHERE id = ?', (task_id,)).fetchone()

def save_task(data):
    """Inserts a new task into the database."""
    db = open_db()
    db.execute(
        '''INSERT INTO tasks 
           (title, content, starting_week, ending_week, task_status, task_priority, isOptional, isAppointmentMade) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)''',
        (data['title'], data['content'], data['starting_week'], data['ending_week'],
         data.get('task_status', 'pending'), data.get('task_priority', 'low'), 
         int(data.get('isOptional', False)), int(data.get('isAppointmentMade', False)))
    )
    db.commit()
    return True

def update_task_entry(task_id, data, existing):
    """Updates an existing task with partial data support."""
    db = open_db()
    db.execute(
        '''UPDATE tasks SET 
           title = ?, content = ?, starting_week = ?, ending_week = ?, 
           task_status = ?, task_priority = ?, isOptional = ?, isAppointmentMade = ? 
           WHERE id = ?''',
        (data.get('title', existing['title']), data.get('content', existing['content']), 
         data.get('starting_week', existing['starting_week']), data.get('ending_week', existing['ending_week']), 
         data.get('task_status', existing['task_status']), data.get('task_priority', existing['task_priority']), 
         data.get('isOptional', existing['isOptional']), data.get('isAppointmentMade', existing['isAppointmentMade']), 
         task_id)
    )
    db.commit()
    return True

def delete_task_entry(task_id):
    """Deletes a task record."""
    db = open_db()
    db.execute('DELETE FROM tasks WHERE id = ?', (task_id,))
    db.commit()
    return True

def convert_task_to_appointment(task_id, appt_data, task_existing):
    """Marks a task as having an appointment and inserts record into appointments table."""
    db = open_db()
    
    # 1. Update the task status
    db.execute('UPDATE tasks SET isAppointmentMade = ? WHERE id = ?', (1, task_id))
    
    # 2. Insert into appointments table
    db.execute(
        '''INSERT INTO appointments 
           (title, content, appointment_date, appointment_time, appointment_location, appointment_status) 
           VALUES (?, ?, ?, ?, ?, ?)''',
        (appt_data.get('appointment_title', task_existing['title']), 
         appt_data.get('appointment_content', task_existing['content']), 
         appt_data['appointment_date'], appt_data['appointment_time'], 
         appt_data['appointment_location'], 'pending')
    )
    
    db.commit()
    return True