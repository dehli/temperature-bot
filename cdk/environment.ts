const environmentVariables = [
  "API_PATH",
  "CERTIFICATE_ARN",
  "DOMAIN_NAME",
  "PAGERDUTY_ROUTING_KEY",
  "PARTITION_KEY",
  "TEMPERATURE_LIMIT",
  "TIME_LIMIT",
] as const;

export default environmentVariables.reduce(
  (acc, envName) => {
    const value = process.env[envName];
    if (!value) {
      throw new Error(`Missing environmnet variable: ${envName}`);
    }

    return { ...acc, [envName]: value };
  },
  {} as { [key in (typeof environmentVariables)[number]]: string },
);
