# Temperature Bot

## About

I use this project on my boat to ensure that during the winter
months, my boat doesn't get too cold. I have a heater near
my engine that automatically turns on any time it gets below 45F.

This project gives me extra safety so that if anything happens to
the heater, or electricity, I can appropriately respond before
too much damage occurs.

## Architecture

On the boat, there's a Raspberry PI that has a temperature sensor
and a cell-phone chip. Every 15 minutes it makes an api call to
AWS (via Lambda) which results in the current temperature being
stored in Amazon DynamoDB (along with the timestamp for when it
was collected). Every 1 hour, CloudWatch triggers a step function
that does the following.

1. Query for the most recent temperature
2. Check if temperature is more than 30 minutes ago.
  - If so, jump to step 5
3. Check if temperature is less than 35F.
  - If so, jump to step 5
4. Exit successfully
5. Send alert that something is wrong with boat.

## Commands

```shell
npm run deploy
```
