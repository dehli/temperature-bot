import * as cdk from "monocdk";
import * as path from "path";

const app = new cdk.App();
const stack = new cdk.Stack(app, "TemperatureMonitor");

const table = new cdk.aws_dynamodb.Table(stack, "TemperatureTable", {
  partitionKey: {
    name: "key",
    type: cdk.aws_dynamodb.AttributeType.STRING,
  },
  sortKey: {
    name: "time",
    type: cdk.aws_dynamodb.AttributeType.NUMBER,
  },
});

const user = new cdk.aws_iam.User(stack, "WriteToTableUser");
user.addToPolicy(new cdk.aws_iam.PolicyStatement({
  actions: ["dynamodb:PutItem"],
  resources: [table.tableArn],
}));

// Setup endpoint that we can call to to query for temperatures
const lambda = new cdk.aws_lambda.Function(stack, "TemperatureLambda", {
  handler: "index.handler",
  runtime: cdk.aws_lambda.Runtime.PYTHON_3_9,
  code: cdk.aws_lambda.Code.fromAsset(
    path.resolve(__dirname, "../api"),
  ),
  environment: {
    PARTITION_KEY: "in-his-wakes",
    TABLE_NAME: table.tableName,
  },
});
table.grantReadData(lambda);

const api = new cdk.aws_apigatewayv2.HttpApi(stack, "TemperatureApi", {
  corsPreflight: {
    allowMethods: [
      cdk.aws_apigatewayv2.CorsHttpMethod.OPTIONS,
      cdk.aws_apigatewayv2.CorsHttpMethod.GET,
    ],
    allowOrigins: ["*"],
  },
});

api.addRoutes({
  path: "/temperatures",
  integration: new cdk.aws_apigatewayv2_integrations.HttpLambdaIntegration(
    "TemperatureIntegration",
    lambda,
  ),
});

app.synth();
