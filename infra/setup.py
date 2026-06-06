import boto3
import json

iam = boto3.client("iam", region_name="us-east-1")
sts = boto3.client("sts")
account_id = sts.get_caller_identity()["Account"]
region = "us-east-1"

TAGS = [
    {"Key": "aws-apn-id", "Value": "pc:8l8gcn23lmlgammd8572tk6va"},
    {"Key": "event",      "Value": "oneWithAI"},
]

LAMBDA_TRUST = json.dumps({
    "Version": "2012-10-17",
    "Statement": [{
        "Effect": "Allow",
        "Principal": {"Service": "lambda.amazonaws.com"},
        "Action": "sts:AssumeRole"
    }]
})

LAMBDA_POLICY = json.dumps({
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "dynamodb:GetItem", "dynamodb:PutItem", "dynamodb:UpdateItem",
                "dynamodb:DeleteItem", "dynamodb:Scan", "dynamodb:Query",
                "dynamodb:BatchWriteItem"
            ],
            "Resource": f"arn:aws:dynamodb:{region}:{account_id}:table/chargeiq-*"
        },
        {
            "Effect": "Allow",
            "Action": [
                "bedrock:InvokeModel",
                "bedrock:InvokeModelWithResponseStream"
            ],
            "Resource": "*"
        },
        {
            "Effect": "Allow",
            "Action": ["sagemaker:InvokeEndpoint"],
            "Resource": f"arn:aws:sagemaker:{region}:{account_id}:endpoint/chargeiq-*"
        },
        {
            "Effect": "Allow",
            "Action": ["sns:Publish"],
            "Resource": f"arn:aws:sns:{region}:{account_id}:chargeiq-*"
        },
        {
            "Effect": "Allow",
            "Action": [
                "logs:CreateLogGroup",
                "logs:CreateLogStream",
                "logs:PutLogEvents"
            ],
            "Resource": "*"
        },
        {
            "Effect": "Allow",
            "Action": ["s3:GetObject", "s3:PutObject", "s3:ListBucket"],
            "Resource": f"arn:aws:s3:::chargeiq-*/*"
        }
    ]
})

SAGEMAKER_TRUST = json.dumps({
    "Version": "2012-10-17",
    "Statement": [{
        "Effect": "Allow",
        "Principal": {"Service": "sagemaker.amazonaws.com"},
        "Action": "sts:AssumeRole"
    }]
})

SAGEMAKER_POLICY = json.dumps({
    "Version": "2012-10-17",
    "Statement": [{
        "Effect": "Allow",
        "Action": [
            "s3:GetObject", "s3:PutObject", "s3:ListBucket",
            "logs:CreateLogGroup", "logs:CreateLogStream",
            "logs:PutLogEvents", "ecr:GetDownloadUrlForLayer",
            "ecr:BatchGetImage", "ecr:GetAuthorizationToken"
        ],
        "Resource": "*"
    }]
})

def create_role(role_name, trust_policy, inline_policy_name, inline_policy, managed_arns=[]):
    try:
        r = iam.create_role(
            RoleName=role_name,
            AssumeRolePolicyDocument=trust_policy,
            Description=f"ChargeIQ NG - {role_name}",
            Tags=TAGS
        )
        arn = r["Role"]["Arn"]
        print(f"✅  Created role: {role_name}")
    except iam.exceptions.EntityAlreadyExistsException:
        arn = iam.get_role(RoleName=role_name)["Role"]["Arn"]
        print(f"⚡  Already exists: {role_name}")

    iam.put_role_policy(
        RoleName=role_name,
        PolicyName=inline_policy_name,
        PolicyDocument=inline_policy
    )

    for managed_arn in managed_arns:
        iam.attach_role_policy(RoleName=role_name, PolicyArn=managed_arn)
        print(f"    Attached: {managed_arn.split('/')[-1]}")

    print(f"    ARN: {arn}\n")
    return arn

def create_s3_buckets():
    s3 = boto3.client("s3", region_name=region)
    buckets = [
        f"chargeiq-raw-data-{account_id}",
        f"chargeiq-model-artifacts-{account_id}",
        f"chargeiq-static-assets-{account_id}",
    ]
    for bucket in buckets:
        try:
            s3.create_bucket(Bucket=bucket)
            s3.put_bucket_tagging(
                Bucket=bucket,
                Tagging={"TagSet": TAGS}
            )
            print(f"✅  Created S3 bucket: {bucket}")
        except s3.exceptions.BucketAlreadyOwnedByYou:
            print(f"⚡  Bucket already exists: {bucket}")
    return buckets

if __name__ == "__main__":
    print("\n🚀 ChargeIQ NG — Infrastructure Setup\n")

    lambda_role_arn = create_role(
        role_name="chargeiq-lambda-role",
        trust_policy=LAMBDA_TRUST,
        inline_policy_name="chargeiq-lambda-policy",
        inline_policy=LAMBDA_POLICY,
        managed_arns=[
            "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
        ]
    )

    sagemaker_role_arn = create_role(
        role_name="chargeiq-sagemaker-role",
        trust_policy=SAGEMAKER_TRUST,
        inline_policy_name="chargeiq-sagemaker-policy",
        inline_policy=SAGEMAKER_POLICY,
        managed_arns=[
            "arn:aws:iam::aws:policy/AmazonSageMakerFullAccess"
        ]
    )

    buckets = create_s3_buckets()

    # Save everything to .env
    with open(".env", "w") as f:
        f.write(f"AWS_REGION=us-east-1\n")
        f.write(f"AWS_ACCOUNT_ID={account_id}\n")
        f.write(f"LAMBDA_ROLE_ARN={lambda_role_arn}\n")
        f.write(f"SAGEMAKER_ROLE_ARN={sagemaker_role_arn}\n")
        f.write(f"RAW_DATA_BUCKET=chargeiq-raw-data-{account_id}\n")
        f.write(f"MODEL_ARTIFACTS_BUCKET=chargeiq-model-artifacts-{account_id}\n")
        f.write(f"DYNAMODB_STATIONS_TABLE=chargeiq-stations\n")
        f.write(f"DYNAMODB_AVAILABILITY_TABLE=chargeiq-availability\n")
        f.write(f"DYNAMODB_SESSIONS_TABLE=chargeiq-sessions\n")
        f.write(f"TAG_APN_ID=pc:8l8gcn23lmlgammd8572tk6va\n")
        f.write(f"TAG_EVENT=oneWithAI\n")

    print("✅  All ARNs and config saved to .env\n")
    print("🎉  Infrastructure setup complete!\n")