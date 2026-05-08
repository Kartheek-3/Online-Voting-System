from flask import Blueprint, request, jsonify
from middleware.auth_middleware import verify_token, verify_admin
from google.cloud import firestore
import datetime

def create_vote_routes(db):
    vote_bp = Blueprint('vote_routes', __name__)

    @vote_bp.route('/vote', methods=['POST'])
    @verify_token
    def submit_vote():
        try:
            data = request.json
            user_id = request.user['uid']
            candidate_id = data.get('candidateId')
            
            if not candidate_id:
                return jsonify({"error": "candidateId is required"}), 400

            # Execute transaction to ensure one vote per user
            transaction = db.transaction()
            vote_ref = db.collection('votes').document(user_id)
            candidate_ref = db.collection('candidates').document(candidate_id)
            
            @firestore.transactional
            def update_in_transaction(transaction, vote_ref, candidate_ref):
                vote_doc = vote_ref.get(transaction=transaction)
                if vote_doc.exists:
                    raise Exception("User has already voted")
                
                candidate_doc = candidate_ref.get(transaction=transaction)
                if not candidate_doc.exists:
                    raise Exception("Candidate does not exist")
                    
                # Update candidate votes
                current_votes = candidate_doc.to_dict().get('votes', 0)
                transaction.update(candidate_ref, {'votes': current_votes + 1})
                
                # Register vote
                transaction.set(vote_ref, {
                    'candidateId': candidate_id,
                    'timestamp': firestore.SERVER_TIMESTAMP
                })

            update_in_transaction(transaction, vote_ref, candidate_ref)

            return jsonify({"message": "Vote submitted successfully"}), 200
        except Exception as e:
            if "already voted" in str(e):
                return jsonify({"error": "User has already voted"}), 409
            return jsonify({"error": str(e)}), 500

    @vote_bp.route('/results', methods=['GET'])
    @verify_token
    def get_results():
        try:
            # Reusing candidate list logic but formatting for results chart
            candidates_ref = db.collection('candidates')
            docs = candidates_ref.stream()
            results = [{"name": doc.to_dict().get("name"), "votes": doc.to_dict().get("votes", 0)} for doc in docs]
            
            total_votes = sum(r["votes"] for r in results)
            
            # Calculate percentages
            for r in results:
                r["percentage"] = round((r["votes"] / total_votes * 100), 1) if total_votes > 0 else 0
            
            return jsonify({
                "results": results,
                "total_votes": total_votes
            }), 200
        except Exception as e:
            return jsonify({"error": str(e)}), 500

    return vote_bp
