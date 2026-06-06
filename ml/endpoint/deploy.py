import os
import boto3
import time
from dotenv import load_dotenv

load_dotenv()

def deploy_sagemaker_endpoint():
    print("[INFO] ChargeIQ NG - Deploying SageMaker Endpoint\n")

    role = os.getenv("SAGEMAKER_ROLE_ARN")
    model_artifact = os.getenv("MODEL_ARTIFACT_PATH")
    region = os.getenv("AWS_REGION", "us-east-1")

    if not role or not model_artifact:
        print("[ERROR] Missing SAGEMAKER_ROLE_ARN or MODEL_ARTIFACT_PATH in .env. Run training first.")
        return

    model_name     = "chargeiq-wait-time-model"
    config_name    = "chargeiq-wait-time-config"
    endpoint_name  = "chargeiq-wait-time-endpoint"
    image_uri      = f"683313688378.dkr.ecr.{region}.amazonaws.com/sagemaker-scikit-learn:1.2-1-cpu-py3"

    print(f"  Model Name:      {model_name}")
    print(f"  Config Name:     {config_name}")
    print(f"  Endpoint Name:   {endpoint_name}")
    print(f"  Image URI:       {image_uri}")
    print(f"  Model Artifact:  {model_artifact}\n")

    sm = boto3.client("sagemaker", region_name=region)

    # 1. Delete existing model if present
    try:
        sm.delete_model(ModelName=model_name)
        print(f"[INFO] Deleted existing model: {model_name}")
    except sm.exceptions.ClientError:
        pass

    # 2. Create Model
    print(f"Creating Model: {model_name} ...")
    sm.create_model(
        ModelName=model_name,
        PrimaryContainer={
            "Image": image_uri,
            "ModelDataUrl": model_artifact,
            "Environment": {
                "SAGEMAKER_PROGRAM": "train.py",
                "SAGEMAKER_SUBMIT_DIRECTORY": model_artifact,
            },
        },
        ExecutionRoleArn=role,
    )
    print("[SUCCESS] Model created.")

    # 3. Delete existing endpoint config if present
    try:
        sm.delete_endpoint_config(EndpointConfigName=config_name)
        print(f"[INFO] Deleted existing endpoint config: {config_name}")
    except sm.exceptions.ClientError:
        pass

    # 4. Create EndpointConfig
    print(f"Creating EndpointConfig: {config_name} ...")
    sm.create_endpoint_config(
        EndpointConfigName=config_name,
        ProductionVariants=[{
            "VariantName": "AllTraffic",
            "ModelName": model_name,
            "InitialInstanceCount": 1,
            "InstanceType": "ml.m5.xlarge",
        }],
    )
    print("[SUCCESS] EndpointConfig created.")

    # 5. Delete existing endpoint if present and wait for deletion
    try:
        sm.delete_endpoint(EndpointName=endpoint_name)
        print(f"[INFO] Deleting existing endpoint: {endpoint_name} — waiting...")
        while True:
            try:
                sm.describe_endpoint(EndpointName=endpoint_name)
                time.sleep(10)
            except sm.exceptions.ClientError:
                break
        print("[INFO] Old endpoint deleted.")
    except sm.exceptions.ClientError:
        pass

    # 6. Create Endpoint
    print(f"Creating Endpoint: {endpoint_name} ...")
    sm.create_endpoint(
        EndpointName=endpoint_name,
        EndpointConfigName=config_name,
    )

    # 7. Poll until InService
    print("Waiting for endpoint to become InService (3–5 min) ...")
    while True:
        resp = sm.describe_endpoint(EndpointName=endpoint_name)
        status = resp["EndpointStatus"]
        print(f"  Status: {status}")
        if status == "InService":
            break
        if status == "Failed":
            reason = resp.get("FailureReason", "unknown")
            raise RuntimeError(f"Endpoint creation failed: {reason}")
        time.sleep(20)

    print(f"\n[SUCCESS] Endpoint '{endpoint_name}' is InService and ready!")

    # 8. Persist endpoint name to .env
    with open(".env", "r") as f:
        lines = f.readlines()
    lines = [l for l in lines if not l.startswith("SAGEMAKER_ENDPOINT_NAME=")]
    with open(".env", "w") as f:
        f.writelines(lines)
        f.write(f"SAGEMAKER_ENDPOINT_NAME={endpoint_name}\n")
    print("[INFO] SAGEMAKER_ENDPOINT_NAME saved to .env")


if __name__ == "__main__":
    deploy_sagemaker_endpoint()
