def check_alerts(metrics):
    alerts = []

    if metrics["cpu_usage"] > 80:
        alerts.append("High CPU usage detected")

    if metrics["memory_usage"] > 80:
        alerts.append("High memory usage detected")

    return alerts
