import pandas as pd
import numpy as np
import random
import os
import boto3
from dotenv import load_dotenv

load_dotenv()

def generate_wait_time_dataset(filename="wait_time_data.csv", num_samples=5000):
    print(f"Generating synthetic wait-time dataset with {num_samples} samples...")
    
    np.random.seed(42)
    random.seed(42)
    
    data = []
    
    for _ in range(num_samples):
        # Features
        day_of_week = random.randint(0, 6) # 0 = Monday, 6 = Sunday
        hour_of_day = random.randint(0, 23)
        total_connectors = random.choice([2, 3, 4])
        
        # Rush hours in Nigeria: morning (7-9 AM), evening (4-7 PM)
        is_rush_hour = (7 <= hour_of_day <= 9) or (16 <= hour_of_day <= 19)
        
        # Traffic level simulation
        if is_rush_hour:
            traffic_level = random.choice([1, 2, 2]) # Leans towards high
        else:
            traffic_level = random.choice([0, 0, 1]) # Leans towards low/medium
            
        # Availability simulation
        # If rush hour, higher probability that all connectors are occupied
        if is_rush_hour:
            available_connectors = random.choice([0, 0, 0, 1])
        else:
            available_connectors = random.randint(0, total_connectors)
            
        # Constrain available connectors to be within total
        available_connectors = min(available_connectors, total_connectors)
        
        # Queue length simulation
        if available_connectors > 0:
            queue_length = 0
        else:
            # If all connectors are occupied, we simulate a queue
            if is_rush_hour:
                queue_length = random.randint(1, 5)
            else:
                queue_length = random.randint(0, 2)
                
        # Target: wait_time_minutes
        if available_connectors > 0:
            wait_time = 0.0
        else:
            # Base wait time per vehicle in queue (e.g. 15-20 minutes)
            wait_time_per_vehicle = 25.0 / total_connectors
            base_wait = (queue_length + 1) * wait_time_per_vehicle
            
            # Modifiers
            traffic_factor = 1.0 + 0.3 * traffic_level
            rush_factor = 1.2 if is_rush_hour else 1.0
            
            # Combine factors and add random noise
            wait_time = base_wait * traffic_factor * rush_factor
            noise = np.random.normal(0, 2.0) # Standard deviation of 2 minutes
            wait_time = max(1.0, wait_time + noise) # Wait time must be at least 1 minute
            
        data.append({
            "day_of_week": day_of_week,
            "hour_of_day": hour_of_day,
            "traffic_level": traffic_level,
            "total_connectors": total_connectors,
            "available_connectors": available_connectors,
            "queue_length": queue_length,
            "wait_time_minutes": round(wait_time, 2)
        })
        
    df = pd.DataFrame(data)
    
    # Ensure directory exists
    os.makedirs(os.path.dirname(filename), exist_ok=True)
    df.to_csv(filename, index=False)
    print(f"[SUCCESS] Generated {filename} containing {len(df)} records.")
    
    # Upload to S3 if RAW_DATA_BUCKET env is present
    bucket = os.getenv("RAW_DATA_BUCKET")
    if bucket:
        s3 = boto3.client("s3")
        s3_key = "train/wait_time_data.csv"
        print(f"[INFO] Uploading dataset to S3: s3://{bucket}/{s3_key}...")
        s3.upload_file(filename, bucket, s3_key)
        print("[SUCCESS] Dataset uploaded successfully to S3.")
    else:
        print("[WARNING] RAW_DATA_BUCKET not set in env. Dataset not uploaded to S3.")

if __name__ == "__main__":
    generate_wait_time_dataset("ml/dataset/wait_time_data.csv")
