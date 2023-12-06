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
file_path = os.environ.get("TEMPERATURE_FILE_PATH")
error_log_file = "error_log.txt"

# Error handling
def log_error(error_message):
    with open(error_log_file, "a") as file:
        file.write(error_message + "\n")

    # Check if the number of lines in error_log_file is a multiple of 5
    with open(error_log_file, "r") as file:
        line_count = sum(1 for line in file)
        if line_count % 5 == 0:
            restart_machine()

def reset_error_log():
    with open(error_log_file, "w"):
        pass

def restart_machine():
    os.system("shutdown -r now")

# Read contents of temperature recordings
try:
    with open(file_path, "r") as temperature_file:
        temperature_text = temperature_file.read()
except FileNotFoundError:
    log_error("Error: Temperature file not found.")
    exit()

if temperature_text:
    temperature_match = re.match("[\s\S]*t=(\d+)", temperature_text)
    if temperature_match:
        temperature_string = temperature_match.group(1)
        temperature = decimal.Decimal(temperature_string) / 1000

        api_url = '{}?t={}'.format(base_url, temperature)
        try:
            requests.get(api_url)
            reset_error_log()
        except Exception as exception:
            log_error(f"Error sending data to API: {str(exception)}")
    else:
        log_error("Error: Temperature data not found in the file.")
else:
    log_error("Error: Empty temperature file.")
