import * as Serverless from 'serverless'
import * as Plugin from 'serverless/classes/Plugin'
import * as express from 'express'
import * as DataAPILocal from 'data-api-local'

interface ExecuteSqlRequest {
  awsSecretStoreArn: string
  database: string
  dbClusterOrInstanceArn: string
  schema: string
  sqlStatements: string
}

interface Config {
  port: number
  host: string
  engine: 'mysql' | 'postgres'
  dbURL: string
}

class ServerlessDataAPILocal {
  serverless: Serverless
  options: Serverless.Options
  hooks: Plugin.Hooks
  commands: Plugin.Commands

  constructor (serverless: Serverless, options: Serverless.Options) {
    this.serverless = serverless
    this.options = options

    this.hooks = {
      'before:offline:start:init': this.startHandler.bind(this),
      'before:offline:start:end': this.endHandler.bind(this)
    }
  }

  config (): Config {
    if (this.serverless.service.custom !== undefined && this.serverless.service.custom.dataAPILocal !== undefined) {
      return this.serverless.service.custom.dataAPILocal
    }
  }

  client () {
    const { engine, dbURL } = this.config()
    if (engine === 'mysql') {
      const mysql = require('mysql')
      return mysql.createConnection(dbURL)
    } else if (engine === 'postgres') {
      const pg = require('pg')
      return new pg.Client(dbURL)
    }
  }

  async startHandler () {
    const { port, engine, dbURL } = this.config()
    const app = express()
    const { Client } = require('pg')
    const client = new Client()
    client.connect()
    app.post('/ExecuteSql', async (req, res) => {
      res.json({hello: 'world'})
    })
    app.listen(port, () => {
      this.serverless.cli.log(`serverless-data-api-local-plugin listening on port ${port}`)
    })
  }

  async endHandler () {

  }
}

export default ServerlessDataAPILocal
