import os

os.environ["CELERY_ALWAYS_EAGER"] = "true"

from app.validators.http_validator import HTTPResponseData, JSONSchemaValidator, LatencyValidator, StatusCodeValidator


def test_status_code_validator_passes():
    response = HTTPResponseData(status_code=200, latency_ms=12.5, json_body=None)
    validator = StatusCodeValidator(expected_status=200)
    result = validator.validate(response)
    assert result.passed is True


def test_latency_validator_fails():
    response = HTTPResponseData(status_code=200, latency_ms=2500, json_body=None)
    validator = LatencyValidator(max_latency_ms=100)
    result = validator.validate(response)
    assert result.passed is False


def test_json_schema_validator_passes():
    response = HTTPResponseData(status_code=200, latency_ms=12.5, json_body={"name": "ok"})
    validator = JSONSchemaValidator(schema={"type": "object", "properties": {"name": {"type": "string"}}, "required": ["name"]})
    result = validator.validate(response)
    assert result.passed is True
