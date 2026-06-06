import json
import boto3
from boto3.dynamodb.conditions import Key, Attr
from decimal import Decimal

dynamodb = boto3.resource("dynamodb", region_name="us-east-1")
table = dynamodb.Table("chargeiq-stations")

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

def get_all_stations(event, context):
    try:
        params = event.get("queryStringParameters") or {}
        city = params.get("city")

        if city:
            response = table.scan(
                FilterExpression=Attr("city").eq(city)
            )
        else:
            response = table.scan()

        stations = decimal_to_str(response["Items"])

        return {
            "statusCode": 200,
            "headers": HEADERS,
            "body": json.dumps({
                "stations": stations,
                "count": len(stations)
            })
        }
    except Exception as e:
        return {
            "statusCode": 500,
            "headers": HEADERS,
            "body": json.dumps({"error": str(e)})
        }

def get_station_by_id(event, context):
    try:
        station_id = event["pathParameters"]["stationId"]
        response = table.get_item(Key={"stationId": station_id})
        station = response.get("Item")

        if not station:
            return {
                "statusCode": 404,
                "headers": HEADERS,
                "body": json.dumps({"error": "Station not found"})
            }

        return {
            "statusCode": 200,
            "headers": HEADERS,
            "body": json.dumps(decimal_to_str(station))
        }
    except Exception as e:
        return {
            "statusCode": 500,
            "headers": HEADERS,
            "body": json.dumps({"error": str(e)})
        }

def update_station_status(event, context):
    try:
        station_id = event["pathParameters"]["stationId"]
        body = json.loads(event["body"])
        status = body.get("status")
        available_connectors = body.get("availableConnectors")
        wait_time = body.get("waitTimeMinutes")

        from datetime import datetime
        update_expr = "SET #s = :s, updatedAt = :t"
        expr_names = {"#s": "status"}
        expr_values = {
            ":s": status,
            ":t": datetime.utcnow().isoformat()
        }

        if available_connectors is not None:
            update_expr += ", availableConnectors = :ac"
            expr_values[":ac"] = str(available_connectors)

        if wait_time is not None:
            update_expr += ", waitTimeMinutes = :wt"
            expr_values[":wt"] = str(wait_time)

        table.update_item(
            Key={"stationId": station_id},
            UpdateExpression=update_expr,
            ExpressionAttributeNames=expr_names,
            ExpressionAttributeValues=expr_values
        )

        return {
            "statusCode": 200,
            "headers": HEADERS,
            "body": json.dumps({"message": "Station updated successfully"})
        }
    except Exception as e:
        return {
            "statusCode": 500,
            "headers": HEADERS,
            "body": json.dumps({"error": str(e)})
        }

def add_station(event, context):
    try:
        import uuid
        from datetime import datetime
        body = json.loads(event["body"])
        body["stationId"] = str(uuid.uuid4())
        body["createdAt"] = datetime.utcnow().isoformat()
        body["updatedAt"] = datetime.utcnow().isoformat()

        table.put_item(Item=body)

        return {
            "statusCode": 201,
            "headers": HEADERS,
            "body": json.dumps({
                "message": "Station created successfully",
                "stationId": body["stationId"]
            })
        }
    except Exception as e:
        return {
            "statusCode": 500,
            "headers": HEADERS,
            "body": json.dumps({"error": str(e)})
        }