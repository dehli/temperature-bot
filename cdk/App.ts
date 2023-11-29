import { App, Stack } from "aws-cdk-lib";
import * as acm from "aws-cdk-lib/aws-certificatemanager";
import * as apigwv2 from "@aws-cdk/aws-apigatewayv2-alpha";
import { HttpLambdaIntegration } from "@aws-cdk/aws-apigatewayv2-integrations-alpha";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as path from "path";

// Environment variables
const { API_PATH, CERTIFICATE_ARN, DOMAIN_NAME } = process.env;
if (!API_PATH || !CERTIFICATE_ARN || !DOMAIN_NAME) {
  throw new Error("Missing env vars");
}

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

// Setup endpoint that we can call to to query for temperatures
const htmlLambda = new lambda.Function(stack, "TemperatureLambda", {
  handler: "index.handler",
  runtime: lambda.Runtime.PYTHON_3_9,
  code: lambda.Code.fromAsset(path.resolve(__dirname, "../api")),
  environment: {
    API_PATH,
    PARTITION_KEY: "in-his-wakes",
    TABLE_NAME: table.tableName,
  },
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

app.synth();
