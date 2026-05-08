from flask import Blueprint, request, jsonify
from middleware.auth_middleware import verify_token, verify_admin
from google.cloud import firestore

def create_candidate_routes(db):
    candidate_bp = Blueprint('candidate_routes', __name__)

    @candidate_bp.route('/candidates', methods=['GET'])
    @verify_token
    def get_candidates():
        try:
            candidates_ref = db.collection('candidates')
            docs = candidates_ref.stream()
            candidates = [{"id": doc.id, **doc.to_dict()} for doc in docs]
            return jsonify(candidates), 200
        except Exception as e:
            return jsonify({"error": str(e)}), 500

    @candidate_bp.route('/candidate', methods=['POST'])
    @verify_admin
    def add_candidate():
        try:
            data = request.json
            if not data or 'name' not in data:
                return jsonify({"error": "Candidate name is required"}), 400
            
            new_candidate = {
                "name": data.get("name"),
                "description": data.get("description", ""),
                "imageUrl": data.get("imageUrl", ""),
                "votes": 0
            }
            
            doc_ref = db.collection('candidates').document()
            doc_ref.set(new_candidate)
            
            return jsonify({"id": doc_ref.id, "message": "Candidate added correctly"}), 201
        except Exception as e:
            return jsonify({"error": str(e)}), 500

    @candidate_bp.route('/candidate/<candidate_id>', methods=['DELETE'])
    @verify_admin
    def delete_candidate(candidate_id):
        try:
            db.collection('candidates').document(candidate_id).delete()
            return jsonify({"message": "Candidate deleted successfully"}), 200
        except Exception as e:
            return jsonify({"error": str(e)}), 500

    return candidate_bp
