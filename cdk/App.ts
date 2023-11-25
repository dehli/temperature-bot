import { App, Stack } from "aws-cdk-lib";
import * as apigateway from "@aws-cdk/aws-apigatewayv2-alpha";
import * as apigateway_integrations from "@aws-cdk/aws-apigatewayv2-integrations-alpha";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as iam from "aws-cdk-lib/aws-iam";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as path from "path";

const app = new App();
const stack = new Stack(app, "TemperatureMonitor");

const table = new dynamodb.Table(stack, "TemperatureTable", {
  partitionKey: {
    name: "key",
    type: dynamodb.AttributeType.STRING,
  },
  sortKey: {
    name: "time",
    type: dynamodb.AttributeType.NUMBER,
  },
});

const user = new iam.User(stack, "WriteToTableUser");
user.addToPolicy(new iam.PolicyStatement({
  actions: ["dynamodb:PutItem"],
  resources: [table.tableArn],
}));

// Setup endpoint that we can call to to query for temperatures
const htmlLambda = new lambda.Function(stack, "TemperatureLambda", {
  handler: "index.handler",
  runtime: lambda.Runtime.PYTHON_3_9,
  code: lambda.Code.fromAsset(
    path.resolve(__dirname, "../api"),
  ),
  environment: {
    PARTITION_KEY: "in-his-wakes",
    TABLE_NAME: table.tableName,
  },
});
table.grantReadData(htmlLambda);

const api = new apigateway.HttpApi(stack, "TemperatureApi");
api.addRoutes({
  path: "/",
  integration: new apigateway_integrations.HttpLambdaIntegration(
    "TemperatureIntegration",
    htmlLambda,
  ),
});

app.synth();
