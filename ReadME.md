# 🚆 GatiDrishti

### AI-Powered Real-Time Train ETA Prediction & Journey Intelligence System

**GatiDrishti** is an AI-driven railway intelligence platform designed to provide **real-time train tracking, station-wise ETA prediction, delay analysis, route visualization, and passenger-centric journey information**.

The system combines **historical railway data, live train running information, weather conditions, congestion indicators, operational features, and machine learning** to predict the expected arrival of a train at upcoming stations.

---

## 🎯 Problem Statement

Indian Railways operates one of the world's largest railway networks. Train delays can occur due to:

* Railway corridor congestion
* Signal and operational delays
* Unscheduled halts
* Weather conditions
* Delayed departure from previous stations
* Variations in running time between station segments
* Operational conditions affecting downstream stations

Traditional ETA systems may rely heavily on scheduled timings or simple delay propagation.

**GatiDrishti aims to provide a dynamic, data-driven ETA by continuously considering the train's current running state and operational context.**

---

# 💡 Our Solution

GatiDrishti predicts the train's arrival at the **next station** and recursively uses the predicted state to estimate arrival at subsequent stations.

### Core Prediction Flow

```text
Historical Data
      +
Live Train State
      +
Weather Data
      +
Traffic / Congestion
      +
Station & Route Information
      ↓
Feature Engineering
      ↓
Machine Learning Model
      ↓
Predicted Delay Change
      ↓
Predicted Next-Station Arrival
      ↓
Recursive ETA Prediction
      ↓
Complete Journey ETA
```

---

# ✨ Key Features

## 1. 🚆 Real-Time Train Tracking

GatiDrishti integrates live train-running information to identify:

* Current station
* Previous station
* Next station
* Train running status
* Current journey position
* Station-wise operational information

The live state is matched with the train's database route to maintain consistency between **live railway information and scheduled route data**.

---

## 2. 🤖 AI-Based ETA Prediction

The system uses a machine learning model to predict the expected delay at the next station.

The prediction considers multiple operational and contextual features such as:

* Current arrival delay
* Current departure delay
* Historical running patterns
* Station sequence
* Distance between stations
* Train speed
* Traffic ahead
* Traffic behind
* Headway
* Station halts
* Weather conditions
* Day/night information
* Encoded train and station characteristics

The predicted state is then propagated to subsequent stations.

---

## 3. 🔄 Recursive Station-Wise Prediction

Instead of predicting the entire journey as a single output, GatiDrishti performs **station-by-station prediction**.

```text
Current Station
      ↓
Predict Next Station
      ↓
Update Train State
      ↓
Predict Next Station
      ↓
Update Train State
      ↓
Continue...
```

This allows the system to dynamically propagate predicted delay throughout the remaining journey.

---

## 4. 🗺️ Interactive Route Visualization

The frontend provides a map-based visualization of the train journey.

It displays:

* Train route
* Stations
* Current train position
* Upcoming stations
* Route progression
* ETA information

The map is implemented using **Leaflet.js**.

---

## 5. 🌦️ Weather-Aware Prediction

Weather information is incorporated into the prediction pipeline.

Weather data mapped to railway stations provides additional contextual features for the ML model.

This allows the system to consider environmental conditions that may influence railway operations.

---

## 6. 🚦 Congestion & Operational Intelligence

GatiDrishti incorporates operational features representing railway traffic conditions.

Examples include:

* Traffic ahead
* Traffic behind
* Train headway
* Nearby train speeds
* Operational congestion
* Station halt information

These features help the model understand that a train's delay can depend not only on its own previous delay but also on surrounding railway traffic.

---

## 7. 📍 Intelligent Current-Station Detection

The system combines live train information with the database route.

The current station is identified using the live station code and the complete scheduled route.

If the live current station cannot be directly matched, the system can use the previous halt information as a fallback.

This helps maintain route continuity even when live railway information is incomplete.

---

## 8. 👨‍✈️ Coach Position Information

GatiDrishti provides coach-position information associated with the train route.

The coach-position display helps passengers understand the relative arrangement of coaches along the train formation.

Example:

```text
ENG - LPR - B1 - B2 - B3 - B4 - ... - A1 - A2 - ... - VP
```

---

## 9. 🎫 Passenger-Oriented Information

The platform brings multiple railway information components together, including:

* Train status
* ETA
* Route
* Station information
* Coach position
* Journey progress
* PNR-related interface

The passenger-facing interface is designed to keep important journey information accessible from a single platform.

---

# 🧠 Machine Learning Architecture

The prediction pipeline follows:

```text
Raw Railway Data
       ↓
Data Cleaning
       ↓
Station / Train Mapping
       ↓
Feature Engineering
       ↓
Historical Training Dataset
       ↓
Model Training
       ↓
Model Evaluation
       ↓
Saved ML Model
       ↓
Live Feature Generation
       ↓
Real-Time Prediction
```

### Model

The project uses **CatBoost** for the final ETA prediction pipeline.

CatBoost is used for the structured railway dataset containing numerical, categorical, station-related, and operational features.

---

# 📊 Feature Set

The prediction pipeline uses features representing:

### Train State

* Arrival delay
* Departure delay
* Current total delay
* Predicted delay change

### Route

* Current station
* Next station
* Station sequence
* Distance
* Geographic coordinates

### Traffic

* Traffic ahead
* Traffic behind
* Headway
* Nearby train speed

### Station Operations

* Station halt information
* Historical halt patterns
* Station sequence characteristics

### Environment

* Temperature
* Weather-related features
* Day/night information

### Encoded Information

* Train encoding
* Station encoding
* Route-related encoding

---

# 📐 ETA Calculation

The system follows the following concept:

```text
Current Total Delay
        +
Predicted Delay Change
        ↓
Predicted Next Arrival Delay
```

Then:

```text
Scheduled Arrival Time
        +
Predicted Next Arrival Delay
        ↓
Predicted Arrival Time
```

In simplified form:

```text
current_total_delay
    = arrival_delay + departure_delay

predicted_next_arrival_delay
    = current_total_delay + predicted_delay_change

ETA
    = scheduled_arrival + predicted_next_arrival_delay
```

The predicted state can then be used for the next station.

---

# 🗄️ System Architecture

```text
                  ┌─────────────────────┐
                  │   Live Train Data   │
                  │     RailRadar       │
                  └──────────┬──────────┘
                             │
                             ▼
┌──────────────────┐   ┌─────────────────────┐
│ Railway Database │──▶│ Data Processing     │
│   PostgreSQL     │   │ & Route Matching    │
└──────────────────┘   └──────────┬──────────┘
                                  │
┌──────────────────┐              │
│ Weather Dataset  │──────────────┤
└──────────────────┘              │
                                  ▼
                         ┌─────────────────┐
                         │ Feature         │
                         │ Engineering     │
                         └────────┬────────┘
                                  │
                                  ▼
                         ┌─────────────────┐
                         │ CatBoost Model  │
                         └────────┬────────┘
                                  │
                                  ▼
                         ┌─────────────────┐
                         │ ETA Prediction  │
                         └────────┬────────┘
                                  │
                                  ▼
                    ┌─────────────────────────┐
                    │ Flask Backend / API     │
                    └────────────┬────────────┘
                                 │
                                 ▼
                    ┌─────────────────────────┐
                    │ Web Frontend            │
                    │ HTML / CSS / JavaScript │
                    │ Leaflet Map             │
                    └─────────────────────────┘
```

---

# 🛠️ Technology Stack

## Machine Learning

* Python
* Pandas
* NumPy
* Scikit-learn
* CatBoost

## Backend

* Python
* Flask
* Gunicorn

## Database

* PostgreSQL
* Supabase

## Frontend

* HTML
* CSS
* JavaScript
* Leaflet.js

## External / Live Data

* RailRadar live train information
* Open-Meteo weather data

## Deployment

* Vercel — Frontend
* Render — Backend
* Supabase — Database

---

# 📁 Project Structure

```text
GatiDrishti/
│
├── backend/
│   ├── app.py
│   ├── database_fetch.py
│   ├── prediction.py
│   ├── feature_engineering.py
│   └── ...
│
├── model/
│   ├── gatidrishti_catboost_final.cbm
│   └── gatidrishti_feature_columns.json
│
├── frontend/
│   ├── index.html
│   ├── script.js
│   ├── map.js
│   ├── other.js
│   └── ...
│
├── data/
│   └── ...
│
├── requirements.txt
└── README.md
```

> Folder names may vary depending on the deployed branch/version of the project.

---

# 🔬 Dataset & Data Processing

The project was developed using historical railway running data combined with station and weather information.

The data processing pipeline includes:

```text
Raw Data
   ↓
Cleaning
   ↓
Station Code Validation
   ↓
Journey Reconstruction
   ↓
Station Sequence Mapping
   ↓
Weather Mapping
   ↓
Operational Feature Generation
   ↓
Training Dataset
```

Station-code mapping is particularly important because railway data can contain inconsistent or missing station identifiers.

---

# 📈 Model Evaluation

Multiple machine-learning approaches were evaluated during development, including:

* Linear Regression
* Random Forest
* CatBoost

The final pipeline uses CatBoost for the structured ETA prediction task.

Evaluation focuses on regression metrics such as:

* MAE
* RMSE
* R²

The model is evaluated using historical station-level prediction data.

---

# 🔁 Live Prediction Pipeline

When a user requests the status of a train:

```text
User enters Train Number
          ↓
Backend fetches train information
          ↓
Live train state obtained
          ↓
Current station identified
          ↓
Database route retrieved
          ↓
Upcoming stations identified
          ↓
Live + historical + weather features generated
          ↓
ML model predicts delay
          ↓
ETA calculated
          ↓
Prediction propagated to next station
          ↓
Frontend displays results
```

---

# 🛡️ Data Handling & Prediction Guards

The system contains safeguards to prevent incorrect ETA information from being displayed.

Examples include:

* Avoiding predictions before a train has started its journey
* Avoiding predictions after journey completion
* Preventing future actual arrival/departure values from being displayed
* Separating scheduled and actual timings
* Maintaining route consistency between live and database data
* Handling missing live station information
* Handling non-halt/pass-through stations

For example, live actual arrival/departure values are merged only when the RailRadar record indicates that the station is an actual halt; pass-through records do not overwrite scheduled-stop actual timing fields.

---

# 🚀 Getting Started

## 1. Clone the Repository

```bash
git clone <YOUR_REPOSITORY_URL>
cd GatiDrishti
```

## 2. Create a Virtual Environment

```bash
python -m venv venv
```

### Windows

```bash
venv\Scripts\activate
```

### Linux / macOS

```bash
source venv/bin/activate
```

## 3. Install Dependencies

```bash
pip install -r requirements.txt
```

## 4. Configure Environment Variables

Create a `.env` file:

```env
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key
```

Add any additional API credentials required by the live-data integration.

## 5. Run the Backend

```bash
python app.py
```

The local backend will typically be available at:

```text
http://127.0.0.1:5000
```

## 6. Run the Frontend

Open the frontend through your local development server or deploy it to your preferred hosting platform.

---

# 🌐 Deployment

### Frontend

```text
Vercel
```

### Backend

```text
Render
```

### Database

```text
Supabase PostgreSQL
```

---

# 🎯 Target Use Cases

GatiDrishti can be used for:

* Real-time train ETA estimation
* Passenger journey planning
* Railway operational monitoring
* Delay propagation analysis
* Train route visualization
* Station-wise train status
* Railway traffic intelligence
* Data-driven railway decision support

---

# 🔮 Future Improvements

The future development of GatiDrishti will focus on improving prediction accuracy, real-time intelligence, scalability, and passenger experience.

* **🌐 Network-Wide ETA Prediction**
  Extend the current corridor-based prediction system to support a larger portion of the Indian Railways network.

* **📡 Improved Real-Time Data Integration**
  Integrate more reliable and granular live railway data sources for continuously updated train states.

* **🚦 Signal-Level & Operational Features**
  Incorporate signal aspects, block-section occupancy, platform availability, operational restrictions, and other railway-control parameters into the prediction pipeline.

* **🧠 Advanced Delay Propagation Modelling**
  Develop a dedicated delay-propagation model capable of understanding how delays of nearby trains can affect the target train.

* **🤖 AI-Powered Railway Chatbot**
  Integrate an intelligent conversational assistant that allows passengers to interact with GatiDrishti using natural language. The chatbot could answer queries related to train status, predicted ETA, upcoming stations, delays, route information, coach position, and other journey-related information.

* **📊 Probabilistic ETA & Confidence Range**
  Instead of providing only a single ETA, generate an expected arrival window along with a confidence level.

* **🔄 Continuous Online Learning**
  Enable the model to learn from newly completed journeys and continuously adapt to changing railway operating patterns.

* **⚡ Real-Time Event Streaming**
  Introduce a streaming architecture using technologies such as Redis/Kafka to process live railway events with lower latency.

* **🗺️ Advanced Railway Network Visualization**
  Expand the current map into a network-level visualization showing train movement, congestion, delays, and affected railway sections.

* **📱 Mobile Application**
  Develop dedicated Android/iOS applications providing live ETA, journey tracking, route information, and passenger notifications.

* **🔔 Intelligent Passenger Alerts**
  Provide notifications for significant delays, approaching stations, schedule changes, and major changes in predicted ETA.

* **🏗️ Scalable Cloud Architecture**
  Improve the backend architecture to support a large number of simultaneous train-tracking and prediction requests.

* **📈 Railway Analytics Dashboard**
  Build dashboards for analysing historical delays, recurring congestion patterns, station performance, and corridor-level operational trends.

* **🎯 Model Optimization**
  Explore advanced models and ensemble approaches to further improve station-level ETA prediction accuracy while maintaining low inference latency.

* **🔐 Production-Grade Security & Reliability**
  Introduce stronger API security, authentication, monitoring, logging, fault tolerance, and automated health checks for production deployment.

---

# 👥 Team

## Team RailNova

**Project:** GatiDrishti

Developed as an AI/ML-based railway intelligence solution for **Smart India Hackathon 2026**.

---

# 🏆 Smart India Hackathon

GatiDrishti was developed with the objective of demonstrating how **Artificial Intelligence, Machine Learning, real-time data, and railway operational information** can be combined to improve train journey information and ETA prediction.

---

# 📌 Project Status

```text
🚧 Active Development
```

Current focus areas:

* Real-time train-state integration
* Station-wise ETA prediction
* Recursive prediction
* Route visualization
* Database integration
* Frontend/backend integration
* Operational feature integration

---

# ⭐ GatiDrishti

> **From train tracking to intelligent ETA prediction — making railway journeys more predictable.**
