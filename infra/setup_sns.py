import boto3
import os
from dotenv import load_dotenv

load_dotenv()

TAGS = [
    {"Key": "aws-apn-id", "Value": "pc:8l8gcn23lmlgammd8572tk6va"},
    {"Key": "event",      "Value": "oneWithAI"},
]

def setup_sns_topic():
    print("[INFO] ChargeIQ NG - Setting Up SNS Notifications\n")
    
    region = os.getenv("AWS_REGION", "us-east-1")
    sns = boto3.client("sns", region_name=region)
    
    topic_name = "chargeiq-driver-notifications"
    
    try:
        # Create topic
        response = sns.create_topic(
            Name=topic_name,
            Tags=TAGS
        )
        topic_arn = response["TopicArn"]
        print(f"[SUCCESS] Created SNS Topic: {topic_name}")
        print(f"   ARN: {topic_arn}\n")
        
        # Save to .env
        with open(".env", "r") as f:
            env_lines = f.readlines()
            
        env_lines = [l for l in env_lines if not l.startswith("SNS_TOPIC_ARN=")]
        
        with open(".env", "w") as f:
            f.writelines(env_lines)
            f.write(f"SNS_TOPIC_ARN={topic_arn}\n")
            
        print("[INFO] SNS topic ARN saved to .env")
        return topic_arn
        
    except Exception as e:
        print(f"[ERROR] Failed to setup SNS: {e}")
        return None

if __name__ == "__main__":
    setup_sns_topic()
