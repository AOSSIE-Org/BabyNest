import sqlite3
import os
from flask import g

DATABASE = "db/database.db"
SCHEMA_FILE = "schema.sql"

def open_db():
    if "db" not in g:
        first_time_setup()
        g.db = sqlite3.connect(DATABASE)
        g.db.row_factory = sqlite3.Row
    return g.db

def close_db(e=None):
    db = g.pop("db", None) 
    if db is not None:
        db.close()

def first_time_setup():
    if not os.path.exists(DATABASE) or os.stat(DATABASE).st_size == 0:
        with sqlite3.connect(DATABASE) as db:
            with open(SCHEMA_FILE,"r") as f:
                db.executescript(f.read())
            db.commit()
