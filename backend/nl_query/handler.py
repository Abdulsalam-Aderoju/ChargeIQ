import json
import boto3
import os

bedrock = boto3.client("bedrock-runtime", region_name="us-east-1")
dynamodb = boto3.resource("dynamodb", region_name="us-east-1")
stations_table = dynamodb.Table("chargeiq-stations")

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
    "connectorType": "CCS or Type2 or CHAdeMO or null",
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
            filter_expressions.append(Attr("status").eq(filters["status"]))

        if filter_expressions:
            combined = filter_expressions[0]
            for f in filter_expressions[1:]:
                combined = combined & f
            scan_kwargs["FilterExpression"] = combined

        stations_response = stations_table.scan(**scan_kwargs)
        stations = stations_response["Items"]

        # Limit to top 5 results
        stations = stations[:5]

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
        # Fallback — return all available stations
        try:
            from boto3.dynamodb.conditions import Attr
            response = stations_table.scan(
                FilterExpression=Attr("status").eq("active")
            )
            stations = response["Items"][:5]
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