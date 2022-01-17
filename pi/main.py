###
### main.py
###
### This script is responsible for checking the temperature of the PI sensors
### and writing the temperature to DynamoDB.
###

import boto3
import decimal
import re
import os
import time

# Pull out environment variables
aws_region = os.environ.get("AWS_REGION")
device_key = os.environ.get("TEMPERATURE_DEVICE_KEY")
file_path  = os.environ.get("TEMPERATURE_FILE_PATH")
table_name = os.environ.get("TEMPERATURE_TABLE_NAME")

# Read contents of temperature recordings
temperature_file = open(file_path)
temperature_text = temperature_file.read()
temperature_file.close()

if temperature_text:
    time_now = time.time()
    temperature_string = re.match("[\s\S]*t=(\d+)", temperature_text).group(1)
    temperature = decimal.Decimal(temperature_string) / 1000

    # Setup AWS Clients
    dynamodb = boto3.resource("dynamodb", region_name=aws_region)
    table = dynamodb.Table(table_name)

    # Persist temperature to DynamoDB
    table.put_item(
        Item={
            "key": device_key,
            "time": int(time_now),
            "temperature": temperature
        },
        ConditionExpression="attribute_not_exists(#key)",
        ExpressionAttributeNames={
            "#key": "key"
        }
    )
