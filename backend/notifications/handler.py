import json
import boto3
import os

sns = boto3.client("sns", region_name="us-east-1")
topic_arn = os.getenv("SNS_TOPIC_ARN")

HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type,Authorization",
    "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
    "Content-Type": "application/json"
}

def subscribe_driver(event, context):
    try:
        if not topic_arn:
            return {
                "statusCode": 500,
                "headers": HEADERS,
                "body": json.dumps({"error": "SNS_TOPIC_ARN environment variable not configured"})
            }

        body = json.loads(event["body"])
        email = body.get("email")

        if not email:
            return {
                "statusCode": 400,
                "headers": HEADERS,
                "body": json.dumps({"error": "Email is required"})
            }

        # Subscribe email to SNS Topic
        response = sns.subscribe(
            TopicArn=topic_arn,
            Protocol="email",
            Endpoint=email
        )

        subscription_arn = response.get("SubscriptionArn")
        
        return {
            "statusCode": 200,
            "headers": HEADERS,
            "body": json.dumps({
                "message": "Subscription pending. Please check your email to confirm subscription.",
                "subscriptionArn": subscription_arn
            })
        }

    except Exception as e:
        print(f"Error subscribing driver: {e}")
        return {
            "statusCode": 500,
            "headers": HEADERS,
            "body": json.dumps({"error": str(e)})
        }
