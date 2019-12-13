import * as RDSDataService from 'aws-sdk/clients/rdsdataservice'
import { QueryResult } from 'pg'

export const transformResult = (result: QueryResult): RDSDataService.Types.ExecuteStatementResponse => {
  const builtins = Object
    .entries<number>(result['_types']['_types']['builtins'])
    .reduce((result, [key, value]) => ({
      ...result,
      [value]: key
    }), {})
  const columnMetadata = result.fields.map((field) => {
    const builtin = builtins[field.dataTypeID]
    return {
      arrayBaseColumnType: 1,
      isAutoIncrement: false,
      isCaseSensitive: false,
      isCurrency: builtin === 'MONEY',
      isSigned: false,
      label: '',
      name: field.name,
      nullable: 1,
      precision: 0,
      scale: 0,
      schemaName: '',
      tableName: '',
      type: field.dataTypeID,
      typeName: builtin
    }
  })

  const records = result.rows.map((row) => {
    return Object.entries(row).map(([, value]) => {
      if (value === null) {
        return {
          isNull: true
        }
      } else {
        return {
          stringValue: value.toString()
        }
      }
    })
  })
  return {
    columnMetadata,
    records
  }
}
