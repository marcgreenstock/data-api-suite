import * as yargs from 'yargs'
import { dataApiLocal } from 'data-api-local'

export class MySQLCommand implements yargs.CommandModule {
  command = 'mysql'
  aliases = ['ms']
  describe = `Starts a local MySQL Data API
  Default local Data API: http://localhost:8080
  Default MySQL server:   mysql://localhost:3306`

  async handler (args: yargs.Arguments): Promise<void> {
    await dataApiLocal({
      engine: 'mysql',
      logger: args.quiet ? undefined : console,
      server: {
        hostname: args.host as string,
        port: args.port as number
      },
      host: args['db-host'] as string,
      port: args['db-port'] as number,
      user: args['db-user'] as string,
      password: args['db-password'] as string
    })
  }

  builder (): yargs.Argv {
    return yargs
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
  }
}
