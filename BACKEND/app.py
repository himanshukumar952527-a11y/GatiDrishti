from flask import Flask, request, jsonify
from flask_cors import CORS
import os

import database_function

app = Flask(__name__)
# Allow your Vercel app to access the /api/ routes
CORS(app, resources={r"/api/*": {"origins": "https://gati-drishti.vercel.app"}})



@app.route('/api/trains', methods=['GET'])
def search_trains():
    query = request.args.get('search', '').strip()
    
    if not query:
        return jsonify({"error": "Please provide a search term"}), 400

    try:
        # Make the single function call to get the data
        train_data = fetch_train_data(query)
        
        if train_data:
            return jsonify(train_data), 200
        else:
            return jsonify({"error": "Train not found"}), 404

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/pnr/<pnr_number>", methods=["GET"])
def get_pnr(pnr_number):
    if len(pnr_number) != 10 or not pnr_number.isdigit():
        return jsonify({"error": "Invalid PNR format. Must be 10 digits."}), 400
        
    data = fetch_pnr_status(pnr_number)
    return jsonify(data)

if __name__ == "__main__":
    app.run(debug=True)




if __name__ == '__main__':
    # 1. Grab Render's assigned PORT automatically, or default to 5000 locally
    port = int(os.environ.get("PORT", 5000))
    
    # 2. Bind to 0.0.0.0 so it accepts outside traffic (required for Render)
    # 3. Keep debug=True for local testing (Gunicorn ignores this completely in production)
    app.run(host="0.0.0.0", port=port, debug=True)