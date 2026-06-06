import boto3
import json
import zipfile
import os
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
    print(f"✅  Zipped: {zip_path}")

def deploy_function(function_name, zip_path, handler, description):
    with open(zip_path, "rb") as f:
        zip_bytes = f.read()

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
            Tags=TAGS
        )
        arn = response["FunctionArn"]
        print(f"✅  Created Lambda: {function_name}")
        print(f"    ARN: {arn}\n")
        return arn

    except lambda_client.exceptions.ResourceConflictException:
        response = lambda_client.update_function_code(
            FunctionName=function_name,
            ZipFile=zip_bytes
        )
        arn = response["FunctionArn"]
        print(f"⚡  Updated Lambda: {function_name}\n")
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
]

if __name__ == "__main__":
    print("\n🚀 ChargeIQ NG — Deploying Lambda Functions\n")

    if not LAMBDA_ROLE_ARN:
        print("❌  LAMBDA_ROLE_ARN not found in .env — run infra/setup.py first")
        exit(1)

    arns = {}
    for fn in functions:
        zip_function(fn["source"], fn["zip"])
        arn = deploy_function(fn["name"], fn["zip"], fn["handler"], fn["description"])
        arns[fn["name"]] = arn

    # Save Lambda ARNs to .env
    with open(".env", "a") as f:
        f.write("\n# Lambda ARNs\n")
        for name, arn in arns.items():
            key = name.upper().replace("-", "_")
            f.write(f"{key}_ARN={arn}\n")

    print("✅  All Lambda ARNs saved to .env\n")
    print("🎉  Lambda deployment complete!\n")