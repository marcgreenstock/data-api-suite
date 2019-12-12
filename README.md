# Data API Local

![](https://github.com/marcgreenstock/data-api-local/workflows/master/badge.svg)

Data API Local is a [Aurora Serverless Data API](https://aws.amazon.com/blogs/aws/new-data-api-for-amazon-aurora-serverless/) emulator, its main purpose is to simplify the development of applications using the Data API by making it available offline and local, similar to [dynamodb-local](https://github.com/rynop/dynamodb-local) but for MySQL and PostgreSQL.

## BYO Database

With Data API Local, you bring your own database, it works with MySQL and PostgreSQL.

This library does not make any constraints on the supported versions of MySQL and PostgreSQL in Aurora Serverless, therefore, one should take care to locally install only database versions that are supported by Aurora Serverless.

# Packages

[![lerna](https://img.shields.io/badge/maintained%20with-lerna-cc00ff.svg)](https://lerna.js.org/)

This repository is a mono-repo consisting of 3 packages, documentation for each is contained in their respective package folder.

## [data-api-local](packages/data-api-local)

data-api-local is a node.js emulator for the AWS RDS Aurora Serverless Data API.

## [data-api-local-serverless](packages/data-api-local-serverless)

data-api-local-serverless is a [serverless](https://serverless.com/) plugin that plays nice with [serverless-ofline](https://github.com/dherault/serverless-offline).

## [data-api-local-cli](packages/data-api-local-cli)

The data-api-local-cli is a convenient command line interface.

---

# Contributing

## Installing

```sh
git clone git@github.com:marcgreenstock/data-api-local.git
cd data-api-local
npm install
npm run bootstrap # this runs lerna bootstrap to run npm install on each package and npm link the packages together.
```

## Testing

```sh
docker-compose up --build -d # start the test databases
docker ps -a # check the processes are running
npm test
```
