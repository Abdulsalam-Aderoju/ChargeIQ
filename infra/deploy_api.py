import boto3
import json
import os
from dotenv import load_dotenv

load_dotenv()

apigateway = boto3.client("apigatewayv2", region_name="us-east-1")
lambda_client = boto3.client("lambda", region_name="us-east-1")
account_id = os.getenv("AWS_ACCOUNT_ID")
region = "us-east-1"

TAGS = {
    "aws-apn-id": "pc:8l8gcn23lmlgammd8572tk6va",
    "event": "oneWithAI"
}

def get_lambda_arn(function_name):
    response = lambda_client.get_function(FunctionName=function_name)
    return response["Configuration"]["FunctionArn"]

def add_lambda_permission(function_name, api_id):
    try:
        lambda_client.add_permission(
            FunctionName=function_name,
            StatementId=f"apigateway-{api_id}",
            Action="lambda:InvokeFunction",
            Principal="apigateway.amazonaws.com",
            SourceArn=f"arn:aws:execute-api:{region}:{account_id}:{api_id}/*/*"
        )
    except lambda_client.exceptions.ResourceConflictException:
        pass

if __name__ == "__main__":
    print("\n🚀 ChargeIQ NG — Deploying API Gateway\n")

    # Create HTTP API
    api = apigateway.create_api(
        Name="chargeiq-api",
        ProtocolType="HTTP",
        CorsConfiguration={
            "AllowOrigins": ["*"],
            "AllowMethods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            "AllowHeaders": ["Content-Type", "Authorization"]
        },
        Tags=TAGS
    )
    api_id = api["ApiId"]
    print(f"✅  Created API: chargeiq-api")
    print(f"    API ID: {api_id}\n")

    # Define routes and their Lambda functions
    routes = [
        {"method": "GET",  "path": "/stations",                    "function": "chargeiq-get-stations"},
        {"method": "GET",  "path": "/stations/{stationId}",        "function": "chargeiq-get-station-by-id"},
        {"method": "PUT",  "path": "/stations/{stationId}/status", "function": "chargeiq-update-station-status"},
        {"method": "POST", "path": "/stations",                    "function": "chargeiq-add-station"},
        {"method": "GET",  "path": "/stations/{stationId}/availability", "function": "chargeiq-get-availability"},
        {"method": "POST", "path": "/availability",                "function": "chargeiq-log-availability"},
        {"method": "POST", "path": "/query/nl",                    "function": "chargeiq-nl-query"},
    ]

    for route in routes:
        # Get Lambda ARN
        lambda_arn = get_lambda_arn(route["function"])

        # Create integration
        integration = apigateway.create_integration(
            ApiId=api_id,
            IntegrationType="AWS_PROXY",
            IntegrationUri=lambda_arn,
            PayloadFormatVersion="2.0"
        )
        integration_id = integration["IntegrationId"]

        # Create route
        apigateway.create_route(
            ApiId=api_id,
            RouteKey=f"{route['method']} {route['path']}",
            Target=f"integrations/{integration_id}"
        )

        # Grant API Gateway permission to invoke Lambda
        add_lambda_permission(route["function"], api_id)

        print(f"✅  {route['method']} {route['path']} → {route['function']}")

    # Create and deploy stage
    apigateway.create_stage(
        ApiId=api_id,
        StageName="prod",
        AutoDeploy=True,
        Tags=TAGS
    )

    api_url = f"https://{api_id}.execute-api.{region}.amazonaws.com/prod"

    # Save to .env
    with open(".env", "a") as f:
        f.write(f"\n# API Gateway\n")
        f.write(f"API_BASE_URL={api_url}\n")
        f.write(f"API_GATEWAY_ID={api_id}\n")

    print(f"\n🎉  API Gateway deployed!")
    print(f"    Base URL: {api_url}\n")
    print(f"📋  Send Rasheed this URL: {api_url}\n")
    print(f"    Test it: {api_url}/stations\n")