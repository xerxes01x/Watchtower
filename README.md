# WatchTower – Infrastructure Monitoring System

WatchTower is a lightweight infrastructure monitoring and alert management system built in Python.  
It monitors system metrics such as CPU and memory usage and triggers alerts when thresholds are exceeded.

## Features

- Real-time CPU and memory monitoring
- Threshold based alert system
- Modular monitoring architecture
- Lightweight and easy to extend

## Tech Stack

- Python
- psutil
- System monitoring tools

## Project Structure
watchtower/
│
├── main.py # Entry point for monitoring system
├── monitor.py # Collects system metrics
├── alerts.py # Alert logic
├── config.py # Configuration values
└── requirements.txt

## Running the Project

Install dependencies:


pip install -r requirements.txt


Run the monitoring script:


python main.py


## Future Improvements

- Real-time monitoring dashboard
- Email / Slack alerts
- Historical metrics storage
