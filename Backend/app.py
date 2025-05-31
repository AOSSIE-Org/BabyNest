from flask import Flask
from flask_cors import CORS
from db.db import close_db
from routes.appointments import appointments_bp
from routes.tasks import tasks_bp
from routes.profile import profile_bp
app = Flask(__name__)
CORS(app)

app.register_blueprint(appointments_bp)
app.register_blueprint(tasks_bp)
app.register_blueprint(profile_bp)

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

   
