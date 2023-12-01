const { DynamoDBClient, QueryCommand } = require("@aws-sdk/client-dynamodb");

const { PAGERDUTY_ROUTING_KEY, PARTITION_KEY, TABLE_NAME, TEMPERATURE_LIMIT } =
  process.env;
const client = new DynamoDBClient();

exports.handler = async () => {
  try {
    // query for recent temperatures
    const { Items } = await client.send(
      new QueryCommand({
        KeyConditionExpression: "#key = :key",
        ExpressionAttributeNames: {
          "#key": "key",
        },
        ExpressionAttributeValues: {
          ":key": { S: PARTITION_KEY },
        },
        Limit: 3,
        ScanIndexForward: false,
        TableName: TABLE_NAME,
      }),
    );

    // check if temperature reading is too old
    const latestAgeInSeconds = Date.now() / 1000 - Items[0].time.N;
    if (latestAgeInSeconds >= 600) {
      throw new Error(`Temperature not recent (${latestAgeInSeconds} seconds)`);
    }

    // check if temperature reading is too cold
    const lowestTemp = Math.min(...Items.map((i) => +i.temperature.N));
    if (lowestTemp <= TEMPERATURE_LIMIT) {
      throw new Error(`Temperature too low (${lowestTemp})`);
    }
  } catch (e) {
    // send alert with error message
    console.log(e.message);

    await fetch("https://events.pagerduty.com/v2/enqueue", {
      body: JSON.stringify({
        event_action: "trigger",
        payload: {
          summary: e.message,
          severity: "critical",
          source: "Temperature Bot",
        },
        routing_key: PAGERDUTY_ROUTING_KEY,
      }),
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
    });
  }
};
