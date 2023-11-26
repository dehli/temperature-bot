import boto3
import json
import os
import time
from boto3.dynamodb.conditions import Key, Attr

# Environment variables
api_path = os.environ.get("API_PATH")
partition_key = os.environ.get("PARTITION_KEY")
table_name = os.environ.get("TABLE_NAME")

# AWS clients
dynamodb = boto3.resource("dynamodb")
table = dynamodb.Table(table_name)

script_dir = os.path.dirname(__file__)
file_path = os.path.join(script_dir, "index.html")
fptr = open(file_path)
html = fptr.read()
fptr.close()

def save_temperature(event):
    time_now = time.time()

    # Persist temperature to DynamoDB
    # table.put_item(
    #     Item={
    #         "key": partition_key,
    #         "time": int(time_now),
    #         "temperature": temperature
    #     },
    #     ConditionExpression="attribute_not_exists(#key)",
    #     ExpressionAttributeNames={
    #         "#key": "key"
    #     }
    # )

    return {
        "statusCode": 200,
        "body": json.dumps(event)
    }

def generate_index_html(event):
    # Determine timestamp for 24 hours ago (in seconds)
    timestamp = int(time.time() - 24 * 60 * 60)

    # Query for all temperatures since the above timestamp
    query_response = table.query(
        KeyConditionExpression=Key("key").eq(partition_key) & Key("time").gt(timestamp)
    )

    result = list(
        map(
            lambda x: { "temperature": float(x["temperature"]), "time": int(x["time"]) },
            query_response["Items"]
        )
    )

    # Return HTML w/ dynamo response
    return {
        "statusCode": 200,
        "body": html.replace("data = []", "data = " + json.dumps(result)),
        "headers": {
            "content-type": "text/html"
        }
    }

def handler(event, lambda_context):
    if event["rawPath"] == api_path:
        return save_temperature(event)
    else:
        return generate_index_html(event)
