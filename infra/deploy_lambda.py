import boto3
import json
import zipfile
import os
import time
from dotenv import load_dotenv

load_dotenv()

lambda_client = boto3.client("lambda", region_name="us-east-1")
LAMBDA_ROLE_ARN = os.getenv("LAMBDA_ROLE_ARN")

TAGS = {
    "aws-apn-id": "pc:8l8gcn23lmlgammd8572tk6va",
    "event": "oneWithAI"
}

def zip_function(source_file, zip_path):
    with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zf:
        zf.write(source_file, "handler.py")
    print(f"[INFO] Zipped: {zip_path}")

def deploy_function(function_name, zip_path, handler, description):
    with open(zip_path, "rb") as f:
        zip_bytes = f.read()

    env_vars = {
        "DYNAMODB_STATIONS_TABLE": os.getenv("DYNAMODB_STATIONS_TABLE", "chargeiq-stations"),
        "DYNAMODB_AVAILABILITY_TABLE": os.getenv("DYNAMODB_AVAILABILITY_TABLE", "chargeiq-availability"),
        "SNS_TOPIC_ARN": os.getenv("SNS_TOPIC_ARN", ""),
        "SAGEMAKER_ENDPOINT_NAME": os.getenv("SAGEMAKER_ENDPOINT_NAME", "chargeiq-wait-time-endpoint")
    }

    try:
        response = lambda_client.create_function(
            FunctionName=function_name,
            Runtime="python3.11",
            Role=LAMBDA_ROLE_ARN,
            Handler=handler,
            Code={"ZipFile": zip_bytes},
            Description=description,
            Timeout=30,
            MemorySize=256,
            Tags=TAGS,
            Environment={"Variables": env_vars}
        )
        arn = response["FunctionArn"]
        print(f"[SUCCESS] Created Lambda: {function_name}")
        print(f"    ARN: {arn}\n")
        return arn

    except lambda_client.exceptions.ResourceConflictException:
        # Update function code
        response = lambda_client.update_function_code(
            FunctionName=function_name,
            ZipFile=zip_bytes
        )
        
        # Wait for the update to complete before updating configuration
        print(f"[INFO] Waiting for code update of {function_name} to finish...")
        try:
            waiter = lambda_client.get_waiter("function_updated")
            waiter.wait(FunctionName=function_name)
        except Exception:
            # Fallback simple sleep if waiter fails or has issues
            time.sleep(5)
            
        # Update function configuration to update env vars
        lambda_client.update_function_configuration(
            FunctionName=function_name,
            Environment={"Variables": env_vars}
        )
        
        # Wait again for the configuration update to complete
        try:
            waiter.wait(FunctionName=function_name)
        except Exception:
            time.sleep(2)
            
        arn = response["FunctionArn"]
        print(f"[SUCCESS] Updated Lambda Code and Config: {function_name}\n")
        return arn

functions = [
    {
        "name": "chargeiq-get-stations",
        "source": "backend/stations/handler.py",
        "zip": "backend/stations/function.zip",
        "handler": "handler.get_all_stations",
        "description": "Get all charging stations with optional filters"
    },
    {
        "name": "chargeiq-get-station-by-id",
        "source": "backend/stations/handler.py",
        "zip": "backend/stations/function_id.zip",
        "handler": "handler.get_station_by_id",
        "description": "Get single station by ID"
    },
    {
        "name": "chargeiq-update-station-status",
        "source": "backend/stations/handler.py",
        "zip": "backend/stations/function_update.zip",
        "handler": "handler.update_station_status",
        "description": "Operator updates station status"
    },
    {
        "name": "chargeiq-add-station",
        "source": "backend/stations/handler.py",
        "zip": "backend/stations/function_add.zip",
        "handler": "handler.add_station",
        "description": "Operator adds new station"
    },
    {
        "name": "chargeiq-get-availability",
        "source": "backend/availability/handler.py",
        "zip": "backend/availability/function.zip",
        "handler": "handler.get_availability",
        "description": "Get availability history for a station"
    },
    {
        "name": "chargeiq-log-availability",
        "source": "backend/availability/handler.py",
        "zip": "backend/availability/function_log.zip",
        "handler": "handler.log_availability",
        "description": "Log availability update"
    },
    {
        "name": "chargeiq-nl-query",
        "source": "backend/nl_query/handler.py",
        "zip": "backend/nl_query/function.zip",
        "handler": "handler.nl_query",
        "description": "Bedrock NL query for station search"
    },
    {
        "name": "chargeiq-subscribe-driver",
        "source": "backend/notifications/handler.py",
        "zip": "backend/notifications/function_subscribe.zip",
        "handler": "handler.subscribe_driver",
        "description": "Subscribe driver to SNS notifications"
    }
]

if __name__ == "__main__":
    print("\n[INFO] ChargeIQ NG - Deploying Lambda Functions\n")

    if not LAMBDA_ROLE_ARN:
        print("[ERROR] LAMBDA_ROLE_ARN not found in .env - run infra/setup.py first")
        exit(1)

    # Clean up old zipped files to ensure clean deployment packages
    for fn in functions:
        if os.path.exists(fn["zip"]):
            try:
                os.remove(fn["zip"])
            except Exception:
                pass

    arns = {}
    for fn in functions:
        zip_function(fn["source"], fn["zip"])
        arn = deploy_function(fn["name"], fn["zip"], fn["handler"], fn["description"])
        arns[fn["name"]] = arn

    # Save Lambda ARNs to .env
    with open(".env", "r") as f:
        env_lines = f.readlines()

    # Remove existing Lambda ARN lines (only those starting with CHARGEIQ_ and containing _ARN=)
    env_lines = [l for l in env_lines if not (l.strip().startswith("CHARGEIQ_") and "_ARN=" in l)]

    with open(".env", "w") as f:
        f.writelines(env_lines)
        f.write("\n# Lambda ARNs\n")
        for name, arn in arns.items():
            key = name.upper().replace("-", "_")
            f.write(f"{key}_ARN={arn}\n")

    print("[SUCCESS] All Lambda ARNs saved to .env\n")
    print("[SUCCESS] Lambda deployment complete!\n")