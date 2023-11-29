const { DynamoDBClient, QueryCommand } = require("@aws-sdk/client-dynamodb");

const { PARTITION_KEY, TABLE_NAME } = process.env;
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
    if (lowestTemp <= 4) {
      throw new Error(`Temperature too low (${lowestTemp})`);
    }
  } catch (e) {
    // TODO: send email with error message
    console.log(e.message);
  }
};
