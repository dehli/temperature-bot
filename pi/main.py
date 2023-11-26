###
### main.py
###
### This script is responsible for checking the temperature of the PI sensors
### and writing the temperature to DynamoDB.
###

import decimal
import re
import requests
import os

# Pull out environment variables
base_url = os.environ.get("API_URL")
file_path  = os.environ.get("TEMPERATURE_FILE_PATH")

# Read contents of temperature recordings
temperature_file = open(file_path)
temperature_text = temperature_file.read()
temperature_file.close()

if temperature_text:
    temperature_string = re.match("[\s\S]*t=(\d+)", temperature_text).group(1)
    temperature = decimal.Decimal(temperature_string) / 1000

    api_url = '{}?t={}'.format(base_url, temperature)
    requests.get(api_url)
