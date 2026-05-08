from flask import request, jsonify
from functools import wraps
from config.firebase_config import auth

def verify_token(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        auth_header = request.headers.get("Authorization")
        if not auth_header or not auth_header.startswith("Bearer "):
            return jsonify({"error": "Unauthorized"}), 401

        id_token = auth_header.split("Bearer ")[1]
        try:
            decoded_token = auth.verify_id_token(id_token)
            request.user = decoded_token
        except Exception as e:
            return jsonify({"error": "Invalid or expired token", "details": str(e)}), 401
            
        return f(*args, **kwargs)
    return decorated_function

def verify_admin(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        auth_header = request.headers.get("Authorization")
        if not auth_header or not auth_header.startswith("Bearer "):
            return jsonify({"error": "Unauthorized"}), 401

        id_token = auth_header.split("Bearer ")[1]
        try:
            decoded_token = auth.verify_id_token(id_token)
            request.user = decoded_token
            # Check if user is in 'admins' collection
            from app import db
            admin_doc = db.collection('admins').document(decoded_token['uid']).get()
            if not admin_doc.exists:
                return jsonify({"error": "Admin access required"}), 403
        except Exception as e:
            return jsonify({"error": "Invalid or expired token"}), 401
            
        return f(*args, **kwargs)
    return decorated_function
