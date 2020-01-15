import * as RDSDataService from 'aws-sdk/clients/rdsdataservice'

type Value = null | string | number | boolean
type FieldValue = Value | RDSDataService._Blob
type ArrayValue = Array<Value | ArrayValue>

export interface StringParser<T = unknown> {
  (value: unknown): T;
}

export interface StringParsers {
  [typeName: string]: StringParser;
}

export interface UnknownRow {
  [key: string]: unknown;
}

export interface Metadata {
  [name: string]: RDSDataService.ColumnMetadata;
}

export interface TransformQueryResponseOptions {
  stringParsers?: StringParsers;
}

export interface TransformedQueryResult<T> {
  rows: T[] | null;
  metadata: Metadata | null;
}

const timestampParser: StringParser<Date> = (value: string) => new Date(value)
const jsonParser: StringParser<JSON> = (value: string) => JSON.parse(value)

export const defaultStringParsers: StringParsers = {
  'date': timestampParser,
  'timestamp': timestampParser,
  'timestampz': timestampParser,
  'json': jsonParser,
  'jsonb': jsonParser
}

const transformArrayValue = (
  value: RDSDataService.ArrayValue
): ArrayValue => {
  if (value.stringValues !== undefined) { return value.stringValues }
  if (value.longValues !== undefined) { return value.longValues }
  if (value.doubleValues !== undefined) { return value.doubleValues }
  if (value.booleanValues !== undefined) { return value.booleanValues }
  if (value.arrayValues !== undefined) { 
    return value.arrayValues.map((arrayValue) => transformArrayValue(arrayValue))
  }
  return []
}

const transformFieldValue = (
  field: RDSDataService.Field
): FieldValue | ArrayValue => {
  if (field.stringValue !== undefined) { return field.stringValue }
  if (field.longValue !== undefined) { return field.longValue }
  if (field.doubleValue !== undefined) { return field.doubleValue }
  if (field.booleanValue !== undefined) { return field.booleanValue }
  if (field.blobValue !== undefined) { return field.blobValue }
  if (field.arrayValue !== undefined) { return transformArrayValue(field.arrayValue) }
  return null
}

export const transformQueryResponse = <T = UnknownRow>(
  result: RDSDataService.ExecuteStatementResponse,
  options: TransformQueryResponseOptions = {}
): TransformedQueryResult<T> => {
  const { records, columnMetadata } = result
  const stringParsers = {
    ...defaultStringParsers,
    ...options.stringParsers
  }

  if (records === undefined || columnMetadata === undefined) {
    return {
      rows: null,
      metadata: null
    }
  }

  const metadata = columnMetadata.reduce<Metadata>((result, metadatum, index) => {
    const name = metadatum.name || `$${index}`
    return {
      ...result,
      [name]: metadatum
    }
  }, {})

  const rows = records.map((fieldList) => {
    return fieldList.reduce((row, field, index) => {
      const metadatum = columnMetadata[index]
      const typeName = metadatum.typeName
      const name = metadatum.name || `$${index}`
      let value = transformFieldValue(field)
      if (typeName in stringParsers) {
        value = stringParsers[typeName](value)
      }
      return {
        ...row,
        [name]: value
      }
    }, {})
  }) as T[]

  return {
    rows,
    metadata
  }
}

export default transformQueryResponse