const { DynamoDBClient, QueryCommand } = require("@aws-sdk/client-dynamodb");
const fs = require("fs");
const path = require("path");

const { PAGERDUTY_DISABLE, PARTITION_KEY, TABLE_NAME } = process.env;
const client = new DynamoDBClient();

// How many 5 minute intervals in 24 hours
const Limit = 288;

const alarmStatus = PAGERDUTY_DISABLE === "true" ? "disabled" : "enabled";

const html = fs
  .readFileSync(path.resolve(__dirname, "index.html"))
  .toString()
  .replace("{{ALARM_STATUS}}", alarmStatus);

exports.handler = async () => {
  // query for recent temperatures
  const response = await client.send(
    new QueryCommand({
      KeyConditionExpression: "#key = :key",
      ExpressionAttributeNames: {
        "#key": "key",
      },
      ExpressionAttributeValues: {
        ":key": { S: PARTITION_KEY },
      },
      Limit,
      ScanIndexForward: false,
      TableName: TABLE_NAME,
    }),
  );

  const items = response.Items.map((i) => ({
    temperature: +i.temperature.N,
    time: +i.time.N,
  }));

  return {
    body: html.replace("data = []", `data = ${JSON.stringify(items)}`),
    headers: {
      "content-type": "text/html",
    },
    statusCode: 200,
  };
};
