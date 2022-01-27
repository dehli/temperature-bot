import boto3
import json
import os
import time

from boto3.dynamodb.conditions import Key, Attr

dynamodb = boto3.resource("dynamodb")
table = dynamodb.Table(os.environ.get("TABLE_NAME"))
partition_key = os.environ.get("PARTITION_KEY")

script_dir = os.path.dirname(__file__)
file_path = os.path.join(script_dir, "index.html")
fptr = open(file_path)
html = fptr.read()
fptr.close()

def handler(event, lambda_context):
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
