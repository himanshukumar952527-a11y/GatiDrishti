from flask import Flask, request, jsonify
from flask_cors import CORS
import os

from data_file import DUMMY_TRAINS

app = Flask(__name__)
# Allow your Vercel app to access the /api/ routes
CORS(app, resources={r"/api/*": {"origins": "https://gati-drishti.vercel.app"}})



@app.route('/api/trains', methods=['GET'])
def search_trains():
    query = request.args.get('search', '').strip().lower()
    
    if not query:
        return jsonify({"error": "Please provide a search term"}), 400

    # 1. Direct lookup using the outer dictionary key (e.g., "12951")
    if query in DUMMY_TRAINS:
        return jsonify(DUMMY_TRAINS[query]), 200

    # 2. Fallback: Search by train name if they typed text instead of a number
    for train_id, train_data in DUMMY_TRAINS.items():
        if query in train_data.get("name", "").lower():
            return jsonify(train_data), 200
            
    return jsonify({"error": "Train not found"}), 404

if __name__ == '__main__':
    # 1. Grab Render's assigned PORT automatically, or default to 5000 locally
    port = int(os.environ.get("PORT", 5000))
    
    # 2. Bind to 0.0.0.0 so it accepts outside traffic (required for Render)
    # 3. Keep debug=True for local testing (Gunicorn ignores this completely in production)
    app.run(host="0.0.0.0", port=port, debug=True)