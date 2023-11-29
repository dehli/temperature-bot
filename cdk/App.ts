import { App, Duration, Stack } from "aws-cdk-lib";
import * as acm from "aws-cdk-lib/aws-certificatemanager";
import * as apigwv2 from "@aws-cdk/aws-apigatewayv2-alpha";
import { HttpLambdaIntegration } from "@aws-cdk/aws-apigatewayv2-integrations-alpha";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as events from "aws-cdk-lib/aws-events";
import * as events_targets from "aws-cdk-lib/aws-events-targets";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as path from "path";

// Environment variables
const { API_PATH, CERTIFICATE_ARN, DOMAIN_NAME, PARTITION_KEY } = process.env;
if (!API_PATH || !CERTIFICATE_ARN || !DOMAIN_NAME || !PARTITION_KEY) {
  throw new Error("Missing env vars");
}

const app = new App();
const stack = new Stack(app, "TemperatureMonitor");
const code = lambda.Code.fromAsset(path.resolve(__dirname, "../api"));

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

// Setup endpoint that we can call to to query for temperatures
const htmlLambda = new lambda.Function(stack, "TemperatureLambda", {
  code,
  environment: {
    API_PATH,
    PARTITION_KEY,
    TABLE_NAME: table.tableName,
  },
  handler: "index.handler",
  runtime: lambda.Runtime.PYTHON_3_9,
});
table.grantReadWriteData(htmlLambda);

const domainName = new apigwv2.DomainName(stack, "TemperatureDomainName", {
  certificate: acm.Certificate.fromCertificateArn(
    stack,
    "Certificate",
    CERTIFICATE_ARN,
  ),
  domainName: DOMAIN_NAME,
});
new apigwv2.HttpApi(stack, "TemperatureApi", {
  defaultDomainMapping: {
    domainName,
  },
  defaultIntegration: new HttpLambdaIntegration(
    "TemperatureIntegration",
    htmlLambda,
  ),
  disableExecuteApiEndpoint: true,
});

// Setup CRON to ensure temperature stays valid
const checkTempLambda = new lambda.Function(stack, "CheckTemp", {
  code,
  environment: {
    PARTITION_KEY,
    TABLE_NAME: table.tableName,
  },
  handler: "check_temperature.handler",
  runtime: lambda.Runtime.NODEJS_20_X,
});
table.grantReadData(checkTempLambda);

new events.Rule(stack, "CheckTempRule", {
  schedule: events.Schedule.rate(Duration.minutes(5)),
  targets: [new events_targets.LambdaFunction(checkTempLambda)],
});

app.synth();
