from flask import Flask, jsonify
from flask_cors import CORS
from config.firebase_config import init_firebase
from routes.candidate_routes import create_candidate_routes
from routes.vote_routes import create_vote_routes

# Initialize Flask App
app = Flask(__name__)
CORS(app)

# Initialize Firebase
global db, auth
db, auth = init_firebase()

# Register Blueprints
candidate_bp = create_candidate_routes(db)
vote_bp = create_vote_routes(db)

app.register_blueprint(candidate_bp, url_prefix='/api')
app.register_blueprint(vote_bp, url_prefix='/api')

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({"status": "healthy"}), 200

if __name__ == '__main__':
    # In AI Studio preview, Flask cannot be run normally because port 3000 is occupied by React 
    # Use this code for exporting and running locally.
    app.run(host='0.0.0.0', port=5000, debug=True)
