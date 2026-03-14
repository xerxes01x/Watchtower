from monitor import get_metrics
from alerts import check_alerts
from logger import log_event

def main():
    metrics = get_metrics()
    alerts = check_alerts(metrics)

    print("System Metrics:", metrics)
    log_event(f"Metrics collected: {metrics}")

    if alerts:
        for alert in alerts:
            print(alert)
            log_event(alert)

if __name__ == "__main__":
    main()
