import boto3
import json
import os
from dotenv import load_dotenv

load_dotenv()

def deploy_monitoring():
    print("[INFO] ChargeIQ NG - Deploying CloudWatch Monitoring\n")
    
    region = os.getenv("AWS_REGION", "us-east-1")
    cw = boto3.client("cloudwatch", region_name=region)
    
    api_id = os.getenv("API_GATEWAY_ID")
    endpoint_name = os.getenv("SAGEMAKER_ENDPOINT_NAME", "chargeiq-wait-time-endpoint")
    
    # 1. Define Dashboard Body
    dashboard_body = {
        "widgets": [
            # Row 1: Lambda Metrics
            {
                "type": "metric",
                "x": 0,
                "y": 0,
                "width": 12,
                "height": 6,
                "properties": {
                    "metrics": [
                        ["AWS/Lambda", "Invocations", "FunctionName", "chargeiq-get-stations"],
                        ["...", "Errors", "FunctionName", "chargeiq-get-stations"],
                        ["AWS/Lambda", "Invocations", "FunctionName", "chargeiq-get-station-by-id"],
                        ["...", "Errors", "FunctionName", "chargeiq-get-station-by-id"],
                        ["AWS/Lambda", "Invocations", "FunctionName", "chargeiq-nl-query"],
                        ["...", "Errors", "FunctionName", "chargeiq-nl-query"]
                    ],
                    "view": "timeSeries",
                    "stacked": False,
                    "region": region,
                    "title": "Core Lambdas - Invocations & Errors"
                }
            },
            {
                "type": "metric",
                "x": 12,
                "y": 0,
                "width": 12,
                "height": 6,
                "properties": {
                    "metrics": [
                        ["AWS/Lambda", "Duration", "FunctionName", "chargeiq-get-stations", {"stat": "Average"}],
                        ["AWS/Lambda", "Duration", "FunctionName", "chargeiq-get-station-by-id", {"stat": "Average"}],
                        ["AWS/Lambda", "Duration", "FunctionName", "chargeiq-nl-query", {"stat": "Average"}]
                    ],
                    "view": "timeSeries",
                    "stacked": False,
                    "region": region,
                    "title": "Lambda Durations (Average)"
                }
            }
        ]
    }
    
    # Add API Gateway metrics if API ID is present
    if api_id:
        dashboard_body["widgets"].extend([
            # Row 2: API Gateway Metrics
            {
                "type": "metric",
                "x": 0,
                "y": 6,
                "width": 12,
                "height": 6,
                "properties": {
                    "metrics": [
                        ["AWS/ApiGateway", "Latency", "ApiId", api_id, {"stat": "Average"}],
                        ["AWS/ApiGateway", "IntegrationLatency", "ApiId", api_id, {"stat": "Average"}]
                    ],
                    "view": "timeSeries",
                    "stacked": False,
                    "region": region,
                    "title": "API Gateway Latency (Average)"
                }
            },
            {
                "type": "metric",
                "x": 12,
                "y": 6,
                "width": 12,
                "height": 6,
                "properties": {
                    "metrics": [
                        ["AWS/ApiGateway", "Count", "ApiId", api_id],
                        ["AWS/ApiGateway", "4xx", "ApiId", api_id],
                        ["AWS/ApiGateway", "5xx", "ApiId", api_id]
                    ],
                    "view": "timeSeries",
                    "stacked": False,
                    "region": region,
                    "title": "API Gateway Request Count & Errors"
                }
            }
        ])
        
    # Add SageMaker metrics
    dashboard_body["widgets"].extend([
        # Row 3: SageMaker Metrics
        {
            "type": "metric",
            "x": 0,
            "y": 12,
            "width": 12,
            "height": 6,
            "properties": {
                "metrics": [
                    ["AWS/SageMaker", "Invocations", "EndpointName", endpoint_name]
                ],
                "view": "timeSeries",
                "stacked": False,
                "region": region,
                "title": "SageMaker Endpoint Invocations"
            }
        },
        {
            "type": "metric",
            "x": 12,
            "y": 12,
            "width": 12,
            "height": 6,
            "properties": {
                "metrics": [
                    ["AWS/SageMaker", "ModelLatency", "EndpointName", endpoint_name, {"stat": "Average"}],
                    ["AWS/SageMaker", "OverheadLatency", "EndpointName", endpoint_name, {"stat": "Average"}]
                ],
                "view": "timeSeries",
                "stacked": False,
                "region": region,
                "title": "SageMaker Endpoint Latencies (Average)"
            }
        }
    ])
    
    # Put dashboard
    try:
        cw.put_dashboard(
            DashboardName="chargeiq-monitoring",
            DashboardBody=json.dumps(dashboard_body)
        )
        print("[SUCCESS] CloudWatch Dashboard 'chargeiq-monitoring' deployed successfully.")
    except Exception as e:
        print(f"[ERROR] Failed to deploy dashboard: {e}")
        
    # 2. Deploy CloudWatch Alarms
    try:
        # Alarm 1: SageMaker Latency Alarm
        cw.put_metric_alarm(
            AlarmName="chargeiq-sagemaker-latency-alarm",
            AlarmDescription="Alert if SageMaker endpoint average model latency exceeds 500ms (500,000 microseconds)",
            ActionsEnabled=False, # We don't attach action for demo, SNS or OpsGenie could be attached
            MetricName="ModelLatency",
            Namespace="AWS/SageMaker",
            Statistic="Average",
            Dimensions=[{"Name": "EndpointName", "Value": endpoint_name}],
            Period=300,
            EvaluationPeriods=1,
            Threshold=500000.0,
            ComparisonOperator="GreaterThanThreshold",
            TreatMissingData="notBreaching"
        )
        print("[SUCCESS] CloudWatch Alarm 'chargeiq-sagemaker-latency-alarm' deployed successfully.")
    except Exception as e:
        print(f"[ERROR] Failed to deploy SageMaker latency alarm: {e}")

    try:
        # Alarm 2: Lambda Errors Alarm
        cw.put_metric_alarm(
            AlarmName="chargeiq-lambda-errors-alarm",
            AlarmDescription="Alert if total lambda errors exceed 5 in a 5-minute period",
            ActionsEnabled=False,
            MetricName="Errors",
            Namespace="AWS/Lambda",
            Statistic="Sum",
            Period=300,
            EvaluationPeriods=1,
            Threshold=5.0,
            ComparisonOperator="GreaterThanThreshold",
            TreatMissingData="notBreaching"
        )
        print("[SUCCESS] CloudWatch Alarm 'chargeiq-lambda-errors-alarm' deployed successfully.")
    except Exception as e:
        print(f"[ERROR] Failed to deploy Lambda errors alarm: {e}")

if __name__ == "__main__":
    deploy_monitoring()
