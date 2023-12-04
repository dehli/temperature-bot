const { DynamoDBClient, PutItemCommand } = require("@aws-sdk/client-dynamodb");

const { PARTITION_KEY, TABLE_NAME } = process.env;

const client = new DynamoDBClient();

const isNumber = (str) =>
  typeof str === "string" && str.length > 0 && !isNaN(Number(str));

exports.handler = async (event) => {
  const timeInSeconds = Math.floor(Date.now() / 1000);
  const temperature = event.queryStringParameters?.t;

  if (isNumber(temperature)) {
    await client.send(
      new PutItemCommand({
        TableName: TABLE_NAME,
        Item: {
          key: { S: PARTITION_KEY },
          time: { N: timeInSeconds },
          temperature: { N: temperature },
        },
        ConditionExpression: "attribute_not_exists(#key)",
        ExpressionAttributeNames: {
          "#key": "key",
        },
      }),
    );

    return { statusCode: 200 };
  }

  return { statusCode: 400 };
};
