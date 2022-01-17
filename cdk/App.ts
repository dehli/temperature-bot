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

const user = new cdk.aws_iam.User(stack, "WriteToTableUser");
table.grantWriteData(user);

app.synth();
