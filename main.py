from monitor import get_metrics
from alerts import check_alerts

def main():
    metrics = get_metrics()
    alerts = check_alerts(metrics)

    print("System Metrics:", metrics)

    if alerts:
        print("Alerts:")
        for alert in alerts:
            print(alert)

if __name__ == "__main__":
    main()
