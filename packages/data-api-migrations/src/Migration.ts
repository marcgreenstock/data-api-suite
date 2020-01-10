import { QueryHelper } from './QueryHelper'

export class Migration {
  public readonly id: number
  public readonly name: string
  public readonly file: string
  public readonly isApplied: boolean
  public readonly isLocal: boolean
  public readonly queryHelper: QueryHelper

  constructor ({
    id,
    name,
    file,
    isApplied,
    isLocal,
    queryHelper
  }) {
    this.id = id
    this.name = name
    this.file = file
    this.isApplied = isApplied
    this.isLocal = isLocal
    this.queryHelper = queryHelper
  }

  public async apply (): Promise<void> {
    if (this.isApplied) { return }
    const { up } = await import(this.file)
    await up(this.queryHelper, this)
    await this.queryHelper.executeStatement({
      sql: 'INSERT INTO __migrations__ (id) VALUES (:id)',
      parameters: [{
        name: 'id',
        typeHint: 'int8',
        value: {
          stringValue: this.id.toString()
        }
      }]
    })
  }

  public async rollback (): Promise<void> {
    if (!this.isApplied) { return }
    const { down } = await import(this.file)
    await down(this.queryHelper, this)
    await this.queryHelper.executeStatement({
      sql: 'DELETE FROM __migrations__ WHERE id = :id',
      parameters: [{
        name: 'id',
        typeHint: 'int8',
        value: {
          stringValue: this.id.toString()
        }
      }]
    })
  }
}