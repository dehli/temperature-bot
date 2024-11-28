import { App, Duration, Stack } from "aws-cdk-lib";
import * as acm from "aws-cdk-lib/aws-certificatemanager";
import * as apigwv2 from "aws-cdk-lib/aws-apigatewayv2";
import { HttpLambdaIntegration } from "aws-cdk-lib/aws-apigatewayv2-integrations";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as events from "aws-cdk-lib/aws-events";
import * as events_targets from "aws-cdk-lib/aws-events-targets";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as path from "path";
import env from "./environment";

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

// Setup endpoint that we can call to serve html
const htmlLambda = new lambda.Function(stack, "DisplayTemp", {
  code,
  environment: {
    PARTITION_KEY: env.PARTITION_KEY,
    TABLE_NAME: table.tableName,
  },
  handler: "index.handler",
  runtime: lambda.Runtime.NODEJS_20_X,
});
table.grantReadData(htmlLambda);

const domainName = new apigwv2.DomainName(stack, "TemperatureDomainName", {
  certificate: acm.Certificate.fromCertificateArn(
    stack,
    "Certificate",
    env.CERTIFICATE_ARN,
  ),
  domainName: env.DOMAIN_NAME,
});
const api = new apigwv2.HttpApi(stack, "TemperatureApi", {
  defaultDomainMapping: {
    domainName,
  },
  defaultIntegration: new HttpLambdaIntegration(
    "TemperatureIntegration",
    htmlLambda,
  ),
  disableExecuteApiEndpoint: true,
});

// Setup endpoint that we can call to save temperature
const saveTempLambda = new lambda.Function(stack, "SaveTemp", {
  code,
  environment: {
    PARTITION_KEY: env.PARTITION_KEY,
    TABLE_NAME: table.tableName,
  },
  handler: "save_temperature.handler",
  runtime: lambda.Runtime.NODEJS_20_X,
});
table.grantWriteData(saveTempLambda);
api.addRoutes({
  integration: new HttpLambdaIntegration("SaveTempIntegration", saveTempLambda),
  methods: [apigwv2.HttpMethod.GET],
  path: env.API_PATH,
});

// Setup CRON to ensure temperature stays valid
const checkTempLambda = new lambda.Function(stack, "CheckTemp", {
  code,
  environment: {
    PAGERDUTY_DISABLE: env.PAGERDUTY_DISABLE,
    PAGERDUTY_ROUTING_KEY: env.PAGERDUTY_ROUTING_KEY,
    PARTITION_KEY: env.PARTITION_KEY,
    TABLE_NAME: table.tableName,
    TEMPERATURE_LIMIT: env.TEMPERATURE_LIMIT,
    TIME_LIMIT: env.TIME_LIMIT,
  },
  handler: "check_temperature.handler",
  runtime: lambda.Runtime.NODEJS_20_X,
  timeout: Duration.seconds(10),
});
table.grantReadData(checkTempLambda);

new events.Rule(stack, "CheckTempRule", {
  schedule: events.Schedule.rate(Duration.minutes(5)),
  targets: [new events_targets.LambdaFunction(checkTempLambda)],
});

app.synth();
