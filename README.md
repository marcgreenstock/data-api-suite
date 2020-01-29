# Data API for Aurora Serverless Suite

[![tests](https://github.com/marcgreenstock/data-api-suite/workflows/master/badge.svg)](https://github.com/marcgreenstock/data-api-suite/actions) [![codecov](https://codecov.io/gh/marcgreenstock/data-api-suite/branch/master/graph/badge.svg)](https://codecov.io/gh/marcgreenstock/data-api-suite)
 [![lerna](https://img.shields.io/badge/maintained%20with-lerna-cc00ff.svg)](https://lerna.js.org/)

The **Data API for Aurora Serverless Suite** is a [Monorepo](https://en.wikipedia.org/wiki/Monorepo) that includes libraries, [Serverless Framework](https://serverless.com/) plugins and development tools to simplity and enhance the development, deployment and use of the [Data API for Aurora Serverless](https://aws.amazon.com/blogs/aws/new-data-api-for-amazon-aurora-serverless/) on Amazon Web Services.

## Packages

Each package has its own `README` with independent documentation.

### Node.js Libraries

| Name                                                | Description                                                  |
| --------------------------------------------------- | ------------------------------------------------------------ |
| [Aurora Data API Client`](packages/aurora-data-api) | [![NPM](https://img.shields.io/npm/v/aurora-data-api.svg)](https://www.npmjs.com/package/aurora-data-api)<br />An abstraction of the [RDSDataService](https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/RDSDataService.html) that implements the [Data API for Aurora Serverless](https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/data-api.html) and simplifies the request and response payloads. |

### Serverless Framework Plugins

The following libraries are designed to work with the [Serverless Framework](https://serverless.com/).

| Name                                                         | Description                                                  |
| ------------------------------------------------------------ | ------------------------------------------------------------ |
| [Data API Local Serverless Plugin](packages/data-api-local-serverless) | [![NPM](https://img.shields.io/npm/v/data-api-local-serverless.svg)](https://www.npmjs.com/package/data-api-local-serverless)<br />A Serverless plugin to start a local Aurora Serverless Data API emulator for offline development that plays nice with [`serverless-ofline`](https://github.com/dherault/serverless-offline). |
| [Data API Migrations Serverless Plugin](packages/data-api-migrations-serverless) | [![NPM](https://img.shields.io/npm/v/data-api-migrations-serverless.svg)](https://www.npmjs.com/package/data-api-migrations-serverless)<br />A Serverless plugin to generate, apply and rollback migrations on the Data API for Aurora Serverless. Plays nice with [Data API Local Serverless](packages/data-api-local-serverless). |

### Node.js Local Development Tools

The following libraries are designed to be used in a node.js environment.

| Package Name | Description |
| ---- | ----------- |
| [Data API Local](packages/data-api-local) | [![NPM](https://img.shields.io/npm/v/data-api-local.svg)](https://www.npmjs.com/package/data-api-local)<br />This is the core library for Data API Local Serverless Plugin. Use this libary if you're not using Serverless and need to programatically start an emulator in your node.js application. |
| [Data API Migrations](packages/data-api-migrations) | [![NPM](https://img.shields.io/npm/v/data-api-migrations.svg)](https://www.npmjs.com/package/data-api-migrations)<br />This is the foundation library for the Data API Migrations Serverless Plugin. Use this library if you're not using Serverless. |

## Example

Take a look at the [example folder](https://github.com/marcgreenstock/data-api-suite/tree/master/example) for a complete example app that uses all the **Data API for Aurora Serverless Suite** packages.

## Contributing

### Installing

```sh
$ git clone git@github.com:marcgreenstock/data-api-local.git
$ cd data-api-local
$ npm install
$ npm run bootstrap # this runs lerna bootstrap to run npm install on each package and npm link the packages together.
```

### Testing

We're using [docker-compose.yml](docker-compose.yml) to create a local MySQL and PostgreSQL database with seed data from the files in the [initdb](initdb) directory.

```sh
$ docker-compose up --build -d # start the test databases
$ docker ps -a # check the processes are running
$ npm test
```

## MIT License

Copyright (c) 2020 Marc Greenstock

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
