import json
import boto3
import os

bedrock = boto3.client("bedrock-runtime", region_name="us-east-1")
dynamodb = boto3.resource("dynamodb", region_name="us-east-1")
stations_table_name = os.getenv("DYNAMODB_STATIONS_TABLE", "chargeiq-stations")
stations_table = dynamodb.Table(stations_table_name)

HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Content-Type": "application/json"
}

SYSTEM_PROMPT = """You are ChargeIQ NG, an AI assistant for Nigeria's EV charging network.
You help EV drivers find charging stations across Lagos and Abuja.

When a user asks for a charging station, respond with a JSON object only — no extra text:
{
  "response": "A helpful natural language response to the user",
  "filters": {
    "city": "Lagos or Abuja or null",
    "area": "specific area name or null",
    "connectorType": "CCS or Type2 or CHAdeMO or Type1 or null",
    "status": "available or null"
  }
}"""

def nl_query(event, context):
    try:
        body = json.loads(event["body"])
        user_query = body.get("query", "")

        # Call Bedrock Claude
        response = bedrock.invoke_model(
            modelId="anthropic.claude-3-haiku-20240307-v1:0",
            body=json.dumps({
                "anthropic_version": "bedrock-2023-05-31",
                "max_tokens": 500,
                "system": SYSTEM_PROMPT,
                "messages": [
                    {"role": "user", "content": user_query}
                ]
            })
        )

        result = json.loads(response["body"].read())
        ai_response = json.loads(result["content"][0]["text"])

        # Use filters to query DynamoDB
        filters = ai_response.get("filters", {})
        scan_kwargs = {}
        filter_expressions = []

        from boto3.dynamodb.conditions import Attr
        if filters.get("city"):
            filter_expressions.append(Attr("city").eq(filters["city"]))
        if filters.get("status"):
            # Map status filter to overall status values ('active', 'occupied', 'offline')
            db_status = "active" if filters["status"] == "available" else filters["status"]
            filter_expressions.append(Attr("status").eq(db_status))

        if filter_expressions:
            combined = filter_expressions[0]
            for f in filter_expressions[1:]:
                combined = combined & f
            scan_kwargs["FilterExpression"] = combined

        stations_response = stations_table.scan(**scan_kwargs)
        stations = stations_response["Items"]

        # Post-filter by area in python (case-insensitive sub-string match)
        if filters.get("area"):
            area_query = filters["area"].lower()
            stations = [
                s for s in stations
                if area_query in s.get("area", "").lower() or area_query in s.get("address", "").lower()
            ]

        # Post-filter by connector type in python
        if filters.get("connectorType"):
            conn_type = filters["connectorType"].lower()
            # Normalize connector type name variations
            if "type 2" in conn_type or "type2" in conn_type:
                target_type = "Type2"
            elif "type 1" in conn_type or "type1" in conn_type:
                target_type = "Type1"
            elif "ccs" in conn_type:
                target_type = "CCS"
            elif "chademo" in conn_type:
                target_type = "CHAdeMO"
            else:
                target_type = filters["connectorType"]

            stations = [
                s for s in stations
                if any(c.get("type") == target_type for c in s.get("connectors", []))
            ]

        # Limit to top 5 results
        stations = stations[:5]

        # Convert decimal values to strings for JSON compatibility
        from decimal import Decimal
        def decimal_to_str(obj):
            if isinstance(obj, Decimal):
                return str(obj)
            if isinstance(obj, list):
                return [decimal_to_str(i) for i in obj]
            if isinstance(obj, dict):
                return {k: decimal_to_str(v) for k, v in obj.items()}
            return obj

        stations = decimal_to_str(stations)

        return {
            "statusCode": 200,
            "headers": HEADERS,
            "body": json.dumps({
                "response": ai_response.get("response", "Here are some charging stations for you."),
                "stations": stations,
                "count": len(stations)
            })
        }

    except Exception as e:
        print(f"Error in Bedrock NL query: {e}")
        # Fallback — return all active stations
        try:
            from boto3.dynamodb.conditions import Attr
            response = stations_table.scan(
                FilterExpression=Attr("status").eq("active")
            )
            stations = response["Items"][:5]
            
            # Decimal formatting for fallback
            from decimal import Decimal
            def decimal_to_str(obj):
                if isinstance(obj, Decimal):
                    return str(obj)
                if isinstance(obj, list):
                    return [decimal_to_str(i) for i in obj]
                if isinstance(obj, dict):
                    return {k: decimal_to_str(v) for k, v in obj.items()}
                return obj
            stations = decimal_to_str(stations)
            
            return {
                "statusCode": 200,
                "headers": HEADERS,
                "body": json.dumps({
                    "response": "Here are some available charging stations near you.",
                    "stations": stations,
                    "count": len(stations)
                })
            }
        except Exception as fallback_error:
            return {
                "statusCode": 500,
                "headers": HEADERS,
                "body": json.dumps({"error": str(e)})
            }