import json
import boto3
from boto3.dynamodb.conditions import Key
from decimal import Decimal
from datetime import datetime

dynamodb = boto3.resource("dynamodb", region_name="us-east-1")
table = dynamodb.Table("chargeiq-availability")

HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type,Authorization",
    "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
    "Content-Type": "application/json"
}

def decimal_to_str(obj):
    if isinstance(obj, Decimal):
        return str(obj)
    if isinstance(obj, list):
        return [decimal_to_str(i) for i in obj]
    if isinstance(obj, dict):
        return {k: decimal_to_str(v) for k, v in obj.items()}
    return obj

def get_availability(event, context):
    try:
        station_id = event["pathParameters"]["stationId"]
        response = table.query(
            KeyConditionExpression=Key("stationId").eq(station_id),
            ScanIndexForward=False,
            Limit=24
        )
        return {
            "statusCode": 200,
            "headers": HEADERS,
            "body": json.dumps(decimal_to_str(response["Items"]))
        }
    except Exception as e:
        return {
            "statusCode": 500,
            "headers": HEADERS,
            "body": json.dumps({"error": str(e)})
        }

def log_availability(event, context):
    try:
        body = json.loads(event["body"])
        body["timestamp"] = datetime.utcnow().isoformat()
        table.put_item(Item=body)
        return {
            "statusCode": 201,
            "headers": HEADERS,
            "body": json.dumps({"message": "Availability logged"})
        }
    except Exception as e:
        return {
            "statusCode": 500,
            "headers": HEADERS,
            "body": json.dumps({"error": str(e)})
        }