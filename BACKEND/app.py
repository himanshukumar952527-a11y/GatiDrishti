from flask import Flask, request, jsonify
from flask_cors import CORS
import os

from data_file import DUMMY_TRAINS

app = Flask(__name__)
# Allow your Vercel app to access the /api/ routes
CORS(app, resources={r"/api/*": {"origins": "https://gati-drishti.vercel.app"}})



@app.route('/api/trains', methods=['GET'])
def search_trains():
    # 1. Extract the 'search' query from the URL (e.g., ?search=express)
    query = request.args.get('search', '').strip().lower()
    
    if not query:
        return jsonify({"error": "Please provide a search term"}), 400

    # 2. Search the mock database
    for train in DUMMY_TRAINS.values():
        if train["number"] == query or query in train["name"].lower():
            # 3. If a match is found, send the train dictionary back as JSON
            return jsonify(train), 200
            
    # 4. If the loop finishes without finding anything, return a 404 error
    return jsonify({"error": "Train not found"}), 404

if __name__ == '__main__':
    # 1. Grab Render's assigned PORT automatically, or default to 5000 locally
    port = int(os.environ.get("PORT", 5000))
    
    # 2. Bind to 0.0.0.0 so it accepts outside traffic (required for Render)
    # 3. Keep debug=True for local testing (Gunicorn ignores this completely in production)
    app.run(host="0.0.0.0", port=port, debug=True)