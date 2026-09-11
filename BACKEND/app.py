from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
# Enable CORS so your JavaScript frontend can make requests to this API without security blocks
CORS(app) 

# Your database (mocked as a Python dictionary for now)
DUMMY_TRAINS = {
    "101": {"number": "101", "name": "Sunrise Express", "eta": "10:30 AM", "status": "On Time"},
    "202": {"number": "202", "name": "Midnight Runner", "eta": "11:45 PM", "status": "Delayed"},
    "303": {"number": "303", "name": "Coastal Freight", "eta": "02:15 PM", "status": "On Time"}
}

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
    # Runs the server on http://localhost:5000
    app.run(debug=True, port=5000)