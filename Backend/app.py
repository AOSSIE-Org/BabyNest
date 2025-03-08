from flask import Flask
from flask_cors import CORS
from db.db import close_db
from routes.appointments import appointments_bp
from routes.tasks import tasks_bp

app = Flask(__name__)
CORS(app)

app.register_blueprint(appointments_bp)
app.register_blueprint(tasks_bp)

@app.teardown_appcontext
def teardown_db(exception):
    close_db(exception)

if __name__ == '__main__':
    app.run(debug=True, port=5000)
