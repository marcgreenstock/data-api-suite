import * as yargs from 'yargs'
import { dataApiLocal } from 'data-api-local'

export class ServeCommand implements yargs.CommandModule {
  command = 'serve <url>'
  describe = `Starts a local MySQL or PostgreSQL Data API
  Default local Data API: http://localhost:8080`

  async handler (args: yargs.Arguments) {
    dataApiLocal({
      logger: args.quiet ? undefined : console,
      logLevel: args.verbose ? 'INFO' : 'DEBUG',
      url: args['url'] as string,
      server: {
        hostname: args['host'] as string,
        port: args['port'] as number
      }
    })
  }

  builder (_args: yargs.Argv) {
    return yargs
      .positional('url', {
        type: 'string',
        describe: `Fully qualified URL of the database, e.g.
        postgresql://user:secret@localhost
        postgresql://user:secret@localhost:1234
        mysql://user:secret@127.0.0.1
        jdbc:mysql://user:secret@example.dev

        Note: The database name is not necessary
        `
      })
      .demandOption('url')
  }
}
