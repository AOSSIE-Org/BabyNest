import os
import sqlite3
from db.db import open_db
from agent.agent import get_agent

# define path of database
DB_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "db", "database.db")

def save_weight(week,weight,note):
    """save weight in database and updates AI cache memory"""
    db=open_db()

    # SQL operation
    db.execute(
        'INSERT INTO weekly_weight (week_number,weight,note) VALUES (?, ?, ?)',
        (week,weight,note)
    )
    db.commit()

    # AI agent sync
    agent=get_agent(DB_PATH)
    agent.update_cache(data_type="weight", operation="create")

    return True

def get_all_weight_entries():
    """"fetches all the weights and convert them into dictionary format and then return it."""
    db=open_db()
    weights=db.execute('SELECT * FROM weekly_weights').fetchall()
    return [dict(row) for row in weights]

def get_weight_by_id(entry_id):
    df=open_db()
    return db.execute('SELECT * FROM weekly_weights WHERE id = ?' , (entry_id,)).fetchone

def update_weight_entry(entry_id, data, existing_entry):
    db=open_db()

    #Safe update
    new_week=data.get('week_number',existing_entry['week_number'])
    new_weight=data.get('weight',existing_entry['weight'])
    new_note=data.get('note',existing_entry['note'])

    db.execute(
        'UPDATE weekly_weight SET week_number=?, weight=?, note=? WHERE id=?',
        (new_week, new_weight, new_note, entry_id)
    )

    db.commit()

    # AI sync
    agent=get_agent(DB_PATH)
    agent.update_cache(data_type="weight",operation="update")
    return True

def delete_weight_entry(entry_id):
    db=open_db()

    db.execute('DELTE FROM weekly_weight WHERE id=?', (entry_id,))
    db.commit()

    # AI sync
    agent=get_agent(DB_PATH)
    agent.update_cache(data_type="weight",operation="delte")
    return True

