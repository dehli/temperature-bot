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
and a cell-phone chip. Every 5 minutes it makes an api call to
AWS which results in the current temperature and timestamp stored in
Amazon DynamoDB. Additionally, every 5 minutes, CloudWatch triggers a
lambda function that does the following:

1. Query for the 3 most recent temperatures.
2. Ensure latest temperature was within the last 10 minutes.
3. Ensure all temperatures are above 4C (39F).
4. Send alert if any of the above aren't true.

## Commands

```shell
npm run deploy
```

## Setup on PI

1. Ensure all environment variables are set
2. Copy `./pi/main.py` onto device
3. Setup Cron (add the following line to `/etc/crontab`

```shell
*/5 *   * * *   user-name      . $HOME/.profile; python /home/path/to/main.py
```

Note:
`5` can be swapped out for another value depending on how
often you want to collect the temperature.

### Sensor Setup

![raspberry_pi](https://github.com/dehli/temperature-bot/assets/5856011/887df9a4-3190-4e0c-9160-0a157f1a0c56)

The temperature sensor should have:

- black on GND (eg: 39)
- yellow on GPIO4 (eg: 7)
- red on 3.3V PWR (eg: 1)
