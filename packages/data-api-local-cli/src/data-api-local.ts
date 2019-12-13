#!/usr/bin/env node

import * as yargs from 'yargs'
import { ServeCommand } from './commands/ServeCommand'
import { MySQLCommand } from './commands/MySQLCommand'
import { PostgreSQLCommand } from './commands/PostgreSQLCommand'

yargs
  .scriptName('data-api-local')
  .usage('Usage: $0 <command> [options]')
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
  .command(new ServeCommand())
  .command(new MySQLCommand())
  .command(new PostgreSQLCommand())
  .demandCommand()
  .epilogue('for more information please visit https://github.com/marcgreenstock/data-api-local')
  .help()
  .wrap(Math.min(120, yargs.terminalWidth()))
  .argv
