import json
import boto3
import os
import hashlib
from boto3.dynamodb.conditions import Key, Attr
from decimal import Decimal
from datetime import datetime, timedelta, timezone

dynamodb = boto3.resource("dynamodb", region_name="us-east-1")
table_name = os.getenv("DYNAMODB_STATIONS_TABLE", "chargeiq-stations")
table = dynamodb.Table(table_name)

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

        # Predict real-time wait time if no connectors are available
        available_connectors = int(station.get("availableConnectors", 0))
        if available_connectors == 0:
            try:
                # 1. Retrieve current Lagos/Abuja time (UTC+1)
                lagos_tz = timezone(timedelta(hours=1))
                now = datetime.now(lagos_tz)
                
                day_of_week = now.weekday()
                hour_of_day = now.hour
                
                # 2. Simulate traffic level based on rush hours (7-9 AM, 4-7 PM)
                is_rush_hour = (7 <= hour_of_day <= 9) or (16 <= hour_of_day <= 19)
                traffic_level = 2 if is_rush_hour else 1
                if hour_of_day >= 22 or hour_of_day <= 5:
                    traffic_level = 0
                    
                # 3. Simulate queue length using a stable hash value for consistent demo output
                hash_val = int(hashlib.md5(station_id.encode('utf-8')).hexdigest(), 16)
                base_queue = (hash_val % 3) + 1 # 1 to 3
                queue_length = base_queue + 1 if is_rush_hour else max(0, base_queue - 1)
                
                total_connectors = int(station.get("totalConnectors", 2))
                
                # 4. Invoke SageMaker Endpoint
                sagemaker_runtime = boto3.client("sagemaker-runtime", region_name="us-east-1")
                endpoint_name = os.getenv("SAGEMAKER_ENDPOINT_NAME", "chargeiq-wait-time-endpoint")
                
                payload = {
                    "day_of_week": day_of_week,
                    "hour_of_day": hour_of_day,
                    "traffic_level": traffic_level,
                    "total_connectors": total_connectors,
                    "available_connectors": available_connectors,
                    "queue_length": queue_length
                }
                
                sagemaker_response = sagemaker_runtime.invoke_endpoint(
                    EndpointName=endpoint_name,
                    ContentType="application/json",
                    Body=json.dumps(payload)
                )
                
                result = json.loads(sagemaker_response["Body"].read().decode())
                predicted_time = result.get("waitTimeMinutes", 0.0)
                
                # Format to 1 decimal place string or standard string representation
                station["waitTimeMinutes"] = str(round(float(predicted_time), 1))
                print(f"Predicted wait time: {station['waitTimeMinutes']} minutes for station {station_id}")
            except Exception as ml_err:
                print(f"SageMaker wait-time prediction fallback: {ml_err}")
                # Fallback to current DynamoDB stored value (which is already there)
        
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

        # Get the station's old status and details first
        response = table.get_item(Key={"stationId": station_id})
        station = response.get("Item")
        
        old_status = station.get("status") if station else None
        station_name = station.get("name") if station else "Unknown Station"
        area = station.get("area") if station else "Unknown Area"

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

        # Notify drivers via SNS when status changes from occupied/offline to active
        if status == "active" and old_status in ["occupied", "offline"]:
            sns = boto3.client("sns", region_name="us-east-1")
            topic_arn = os.getenv("SNS_TOPIC_ARN")
            if topic_arn:
                message = (
                    f"🌱 ChargeIQ Station Updates\n\n"
                    f"Great news! The charging station '{station_name}' in {area} is now available!\n"
                    f"Status: Available\n"
                    f"Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}"
                )
                try:
                    sns.publish(
                        TopicArn=topic_arn,
                        Message=message,
                        Subject=f"Station Available: {station_name}"
                    )
                    print(f"Published availability alert to SNS for {station_name}")
                except Exception as sns_err:
                    print(f"Failed to publish SNS alert: {sns_err}")

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