import * as cdk from "monocdk";

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

const role = new cdk.aws_iam.Role(stack, "WriteToTableRole", {
  assumedBy: new cdk.aws_iam.AccountRootPrincipal(),
});

table.grantWriteData(role);

app.synth();
