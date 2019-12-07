#!/usr/bin/env node

import * as yargs from 'yargs'
import * as DataAPILocal from './DataAPILocal'

yargs
  .scriptName('data-api-local')
  .epilogue('for more information please visit https://github.com/marcgreenstock/data-api-local')
  .option('host', {
    describe: 'Host name to serve the local Data API on',
    default: 'localhost',
    alias: 'h',
    type: 'string'
  })
  .option('port', {
    describe: 'Port number to serve the local Data API on',
    default: 8080,
    alias: 'p',
    type: 'number'
  })
  .option('quiet', {
    describe: 'Quiet mode (no logging to STDOUT)',
    default: false,
    alias: 'q',
    type: 'boolean'
  })
  .option('verbose', {
    describe: 'Verbose mode (log everyting to STDOUT)',
    default: false,
    alias: 'v',
    type: 'boolean'
  })
  .command({
    command: 'serve <url>',
    describe: `Starts a local MySQL or PostgreSQL Data API
    Default local Data API: http://localhost:8080
    `,
    builder: (yargs) => (
      yargs
        .positional('url', {
          type: 'string',
          describe: `Fully qualified URL of the database, e.g.
          postgresql://user:secret@localhost/example
          postgresql://user:secret@localhost:1234/example
          mysql://user:secret@127.0.0.1/example
          jdbc:mysql://user:secret@example.dev/example
          `
        })
        .demandOption('url')
    ),
    handler: (argv) => {
      DataAPILocal.dataApiLocal({
        logger: argv.quiet ? undefined : console,
        logLevel: argv.verbose ? 'INFO' : 'DEBUG',
        url: argv['url'] as string,
        server: {
          hostname: argv['host'] as string,
          port: argv['port'] as number
        }
      })
    }
  })
  .command({
    command: 'mysql <database>',
    describe: `Starts a local MySQL Data API
    Default local Data API: http://localhost:8080
    Default MySQL server:   mysql://localhost:3306`,
    aliases: ['ms'],
    builder: (yargs) => (
      yargs
        .positional('database', {
          describe: 'The MySQL database name (aka schema)',
          type: 'string'
        })
        .demandOption('database')
        .option('db-host', {
          describe: 'The local MySQL server host name',
          default: 'localhost',
          type: 'string'
        })
        .option('db-port', {
          describe: 'The local MySQL server port number',
          default: 3306,
          type: 'number'
        })
        .option('db-user', {
          describe: 'The MySQL user to authenticate as',
          type: 'string'
        })
        .option('db-password', {
          describe: 'The password of that MySQL user',
          type: 'string'
        })
    ),
    handler: (argv) => {
      DataAPILocal.dataApiLocal({
        engine: 'mysql',
        logger: argv.quiet ? undefined : console,
        server: {
          hostname: argv['host'] as string,
          port: argv['port'] as number
        },
        host: argv['db-host'] as string,
        port: argv['db-port'] as number,
        user: argv['db-user'] as string,
        password: argv['db-password'] as string
      })
    }
  })
  .command({
    command: 'postgres <database>',
    describe: `Starts a local PostgreSQL Data API
    Default local Data API:    http://localhost:8080
    Default PostgreSQL server: postgres://localhost:5432`,
    aliases: ['postgresql', 'pg'],
    builder: (yargs) => (
      yargs
        .positional('database', {
          describe: 'The PostgreSQL database name',
          type: 'string'
        })
        .demandOption('database')
        .option('db-host', {
          describe: 'The local PostgreSQL server host name',
          default: 'localhost',
          type: 'string'
        })
        .option('db-port', {
          describe: 'The local PostgreSQL server port number',
          default: 5432,
          type: 'number'
        })
        .option('db-user', {
          describe: 'The PostgreSQL user to authenticate as',
          type: 'string'
        })
        .option('db-password', {
          describe: 'The password of that PostgreSQL user',
          type: 'string'
        })
  ),
  handler: (argv) => {
    DataAPILocal.dataApiLocal({
      engine: 'postgres',
      logger: argv.quiet ? undefined : console,
      server: {
        hostname: argv['host'] as string,
        port: argv['port'] as number
      },
      database: argv['database'] as string,
      port: argv['db-port'] as number,
      user: argv['db-user'] as string,
      password: argv['db-password'] as string
    })
  }})
  .demandCommand()
  .help()
  .wrap(Math.min(120, yargs.terminalWidth()))
  .argv
