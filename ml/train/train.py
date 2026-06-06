import os
import argparse
import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_squared_error, mean_absolute_error
import joblib

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    
    # SageMaker hyperparameters and container environment variables
    parser.add_argument("--n-estimators", type=int, default=100)
    parser.add_argument("--max-depth", type=int, default=10)
    
    # SageMaker input channels and directories
    parser.add_argument("--model-dir", type=str, default=os.environ.get("SM_MODEL_DIR"))
    parser.add_argument("--train", type=str, default=os.environ.get("SM_CHANNEL_TRAIN"))
    
    args, _ = parser.parse_known_args()
    
    print("Loading training dataset...")
    # Read training dataset from the S3 download path in the container
    data_path = os.path.join(args.train, "wait_time_data.csv")
    df = pd.read_csv(data_path)
    print(f"Dataset shape: {df.shape}")
    
    # Prepare features and labels
    features = ["day_of_week", "hour_of_day", "traffic_level", "total_connectors", "available_connectors", "queue_length"]
    target = "wait_time_minutes"
    
    X_train = df[features]
    y_train = df[target]
    
    print(f"Training Random Forest Regressor with n_estimators={args.n_estimators}, max_depth={args.max_depth}...")
    model = RandomForestRegressor(
        n_estimators=args.n_estimators,
        max_depth=args.max_depth,
        random_state=42,
        n_jobs=-1
    )
    
    model.fit(X_train, y_train)
    print("Model training complete!")
    
    # Evaluate model
    predictions = model.predict(X_train)
    mse = mean_squared_error(y_train, predictions)
    mae = mean_absolute_error(y_train, predictions)
    print(f"Evaluation Metrics on Training Set:")
    print(f"  Mean Squared Error (MSE): {mse:.4f}")
    print(f"  Mean Absolute Error (MAE): {mae:.4f}")
    
    # Save the model artifact to the model directory
    model_path = os.path.join(args.model_dir, "model.joblib")
    print(f"Saving model to {model_path}...")
    joblib.dump(model, model_path)
    print("Model saved successfully!")

# --- SageMaker Inference Handler Functions ---

def model_fn(model_dir):
    """
    Load the model from model_dir for hosting/prediction.
    """
    print(f"Loading model from directory: {model_dir}")
    model_path = os.path.join(model_dir, "model.joblib")
    model = joblib.load(model_path)
    return model

def input_fn(request_body, request_content_type):
    """
    Parse the input request payload and convert it into a pandas DataFrame.
    """
    import json
    print(f"Received request body content type: {request_content_type}")
    if request_content_type == "application/json":
        data = json.loads(request_body)
        # Handle dict or list format
        if isinstance(data, list):
            df = pd.DataFrame(data)
        elif isinstance(data, dict):
            df = pd.DataFrame([data])
        else:
            raise ValueError(f"Invalid input type: {type(data)}")
        
        # Ensure correct column ordering
        features = ["day_of_week", "hour_of_day", "traffic_level", "total_connectors", "available_connectors", "queue_length"]
        df = df[features]
        return df
    else:
        raise ValueError(f"Unsupported content type: {request_content_type}")

def predict_fn(input_data, model):
    """
    Perform the prediction on the parsed input data using the loaded model.
    """
    print(f"Performing prediction on input shape: {input_data.shape}")
    predictions = model.predict(input_data)
    return predictions

def output_fn(prediction, response_content_type):
    """
    Serialize the prediction results to JSON.
    """
    import json
    print(f"Serializing response as: {response_content_type}")
    if response_content_type == "application/json":
        # Convert numpy array to list
        pred_list = prediction.tolist()
        # Return the first prediction value if it is a single item, else return list
        result = pred_list[0] if len(pred_list) == 1 else pred_list
        return json.dumps({"waitTimeMinutes": result}), response_content_type
    else:
        return json.dumps({"prediction": prediction.tolist()}), "application/json"
