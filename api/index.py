import boto3
import os
import time

from boto3.dynamodb.conditions import Key, Attr

dynamodb = boto3.resource("dynamodb")
table = dynamodb.Table(os.environ.get("TABLE_NAME"))
partition_key = os.environ.get("PARTITION_KEY")

def handler(event, lambda_context):
    # Determine timestamp for 24 hours ago (in seconds)
    timestamp = int(time.time() - 24 * 60 * 60)

    # Query for all temperatures since the above timestamp
    query_response = table.query(
        KeyConditionExpression=Key("key").eq(partition_key) & Key("time").gt(timestamp)
    )

    result = map(
        lambda x: { "temperature": x["temperature"], "time": x["time"] },
        query_response["Items"]
    )

    return list(result)
