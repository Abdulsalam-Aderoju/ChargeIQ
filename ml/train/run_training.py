import os
import sys

# Monkeypatch to force LF (\n) line endings on Windows for SageMaker-generated shell scripts
import builtins
original_open = builtins.open
def custom_open(*args, **kwargs):
    # If opening a file for writing in text mode, force newline to be LF (\n)
    if len(args) > 1 and "w" in args[1] and "b" not in args[1]:
        if "newline" not in kwargs:
            kwargs["newline"] = "\n"
    return original_open(*args, **kwargs)
builtins.open = custom_open
os.linesep = "\n"

import sagemaker
from sagemaker.train import ModelTrainer
from sagemaker.train.configs import SourceCode, Compute, InputData
from sagemaker.core.image_uris import retrieve
import boto3
from dotenv import load_dotenv

# Ensure we can import generate_dataset.py
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
from dataset.generate_dataset import generate_wait_time_dataset

load_dotenv()

def run_sagemaker_training():
    print("[INFO] ChargeIQ NG - Starting ML Training Pipeline (SageMaker v3 with CRLF patch)\n")
    
    # 1. Generate dataset and upload to S3
    dataset_path = "ml/dataset/wait_time_data.csv"
    generate_wait_time_dataset(dataset_path)
    
    # 2. Check environment variables
    role = os.getenv("SAGEMAKER_ROLE_ARN")
    bucket = os.getenv("RAW_DATA_BUCKET")
    artifacts_bucket = os.getenv("MODEL_ARTIFACTS_BUCKET")
    region = os.getenv("AWS_REGION", "us-east-1")
    
    if not all([role, bucket, artifacts_bucket]):
        print("[ERROR] Missing required environment variables. Run infra/setup.py first.")
        sys.exit(1)
        
    print(f"\nConfiguration:")
    print(f"  SageMaker Role: {role}")
    print(f"  Data S3 Bucket: {bucket}")
    print(f"  Artifacts Bucket: {artifacts_bucket}")
    print(f"  AWS Region: {region}\n")
    
    # 3. Retrieve prebuilt sklearn image URI
    image_uri = retrieve(
        framework="sklearn",
        region=region,
        version="1.2-1",
        py_version="py3",
        instance_type="ml.m5.xlarge",
        image_scope="training"
    )
    print(f"Using Training Image: {image_uri}")
    
    # 4. Define configs
    compute_config = Compute(
        instance_type="ml.m5.xlarge",
        instance_count=1,
        volume_size_in_gb=30
    )
    
    source_code = SourceCode(
        source_dir="ml/train",
        entry_script="train.py"
    )
    
    train_data = InputData(
        channel_name="train",
        data_source=f"s3://{bucket}/train/"
    )
    
    # 5. Initialize ModelTrainer
    print("[INFO] Initializing ModelTrainer...")
    trainer = ModelTrainer(
        training_image=image_uri,
        role=role,
        compute=compute_config,
        source_code=source_code,
        output_data_config={"s3_output_path": f"s3://{artifacts_bucket}/output/"},
        hyperparameters={
            "n-estimators": "100",
            "max-depth": "10"
        }
    )
    
    # 6. Start training job
    print("[INFO] Submitting training job to SageMaker (this will block until complete)...")
    training_job = trainer.train(
        input_data_config=[train_data]
    )
    
    job_name = training_job.training_job_name
    model_artifact = training_job.model_artifacts.s3_model_artifacts
    
    print(f"\n[SUCCESS] Training job completed successfully!")
    print(f"  Job Name: {job_name}")
    print(f"  Model Artifact S3 Path: {model_artifact}")
    
    # Save training job details to .env
    with open(".env", "r") as f:
        env_lines = f.readlines()
        
    env_lines = [l for l in env_lines if not l.startswith("SAGEMAKER_JOB_NAME=") and not l.startswith("MODEL_ARTIFACT_PATH=")]
    
    with open(".env", "w") as f:
        f.writelines(env_lines)
        f.write(f"SAGEMAKER_JOB_NAME={job_name}\n")
        f.write(f"MODEL_ARTIFACT_PATH={model_artifact}\n")
        
    print("[INFO] Saved training job details to .env")

if __name__ == "__main__":
    run_sagemaker_training()
