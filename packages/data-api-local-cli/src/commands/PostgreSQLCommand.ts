import * as yargs from 'yargs'
import { dataApiLocal } from 'data-api-local'

export class PostgreSQLCommand implements yargs.CommandModule {
  command = 'postgresql'
  aliases = ['postgres', 'pg']
  describe = `Starts a local PostgreSQL Data API
  Default local Data API:    http://localhost:8080
  Default PostgreSQL server: postgres://localhost:5432`

  async handler (args: yargs.Arguments) {
    dataApiLocal({
      engine: 'postgres',
      logger: args.quiet ? undefined : console,
      server: {
        hostname: args['host'] as string,
        port: args['port'] as number
      },
      host: args['db-host'] as string,
      port: args['db-port'] as number,
      user: args['db-user'] as string,
      password: args['db-password'] as string
    })
  }

  builder (_args: yargs.Argv) {
    return yargs
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
  }
}
