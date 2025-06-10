from flask import Flask
from flask_cors import CORS
from db.db import close_db
from routes.appointments import appointments_bp
from routes.tasks import tasks_bp
from routes.profile import profile_bp
from routes.medicine import medicine_bp
from routes.symptoms import symptoms_bp
from routes.weight import weight_bp
from routes.blood_pressure import bp_bp
from routes.discharge import discharge_bp

app = Flask(__name__)
CORS(app)

app.register_blueprint(appointments_bp)
app.register_blueprint(tasks_bp)
app.register_blueprint(profile_bp)
app.register_blueprint(medicine_bp)
app.register_blueprint(symptoms_bp)
app.register_blueprint(weight_bp)
app.register_blueprint(bp_bp)
app.register_blueprint(discharge_bp)

@app.teardown_appcontext
def teardown_db(exception):
    close_db(exception)

@app.route('/')
def index():
    from routes.appointments import get_appointments
    from routes.tasks import get_tasks
    appointment_db =  get_appointments()
    task_db = get_tasks()
    return appointment_db

if __name__ == '__main__':
   app.run(host='0.0.0.0', port=5000, debug=True)

   
