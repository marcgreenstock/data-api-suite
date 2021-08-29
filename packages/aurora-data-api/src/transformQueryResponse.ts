import * as RDSDataService from 'aws-sdk/clients/rdsdataservice'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type _JSON = Record<string | number, any>
type BasicValue = null | string | number | boolean
type FieldValue = BasicValue | RDSDataService._Blob
type ArrayValue = Array<BasicValue | ArrayValue>
type Value = FieldValue | ArrayValue
type TransformedValue = Value | _JSON | _JSON[] | Date | Date[]

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type UnknownRow = Record<string | number, any>

export interface Metadata {
  [name: string]: RDSDataService.ColumnMetadata
}

export type ValueTransformer = (
  value: Value,
  metadata: RDSDataService.ColumnMetadata,
  nextFn: () => TransformedValue
) => TransformedValue

export interface TransformedQueryResult<T> {
  rows: T[] | null
  metadata: Metadata | null
}

const defaultValueTransformer = (
  value: Value,
  metadata: RDSDataService.ColumnMetadata
): TransformedValue => {
  if (Array.isArray(value)) {
    return value.map((v) => defaultValueTransformer(v, metadata))
  } else if (typeof value === 'string') {
    switch (metadata.typeName) {
      case 'json':
      case 'json[]':
      case 'jsonb':
      case 'jsonb[]':
        return JSON.parse(value)
      case 'timestamp':
      case 'timestamp[]':
      case 'timestampz':
      case 'timestampz[]':
        return new Date(value)
    }
  }
  return value
}

const transformArrayValue = (value: RDSDataService.ArrayValue): ArrayValue => {
  if (value.stringValues !== undefined) {
    return value.stringValues
  }
  if (value.longValues !== undefined) {
    return value.longValues
  }
  if (value.doubleValues !== undefined) {
    return value.doubleValues
  }
  if (value.booleanValues !== undefined) {
    return value.booleanValues
  }
  if (value.arrayValues !== undefined) {
    return value.arrayValues.map((arrayValue) =>
      transformArrayValue(arrayValue)
    )
  }
  return []
}

const transformFieldValue = (
  field: RDSDataService.Field
): FieldValue | ArrayValue => {
  if (field.stringValue !== undefined) {
    return field.stringValue
  }
  if (field.longValue !== undefined) {
    return field.longValue
  }
  if (field.doubleValue !== undefined) {
    return field.doubleValue
  }
  if (field.booleanValue !== undefined) {
    return field.booleanValue
  }
  if (field.blobValue !== undefined) {
    return field.blobValue
  }
  if (field.arrayValue !== undefined) {
    return transformArrayValue(field.arrayValue)
  }
  return null
}

export const transformQueryResponse = <T = UnknownRow>(
  result: RDSDataService.ExecuteStatementResponse,
  valueTransformer?: ValueTransformer
): TransformedQueryResult<T> => {
  const { records, columnMetadata } = result

  if (records === undefined || columnMetadata === undefined) {
    return {
      rows: null,
      metadata: null,
    }
  }

  const metadata = columnMetadata.reduce<Metadata>(
    (result, metadatum, index) => {
      const key = metadatum.name || index
      return {
        ...result,
        [key]: metadatum,
      }
    },
    {}
  )

  const rows = records.map((fieldList) => {
    return fieldList.reduce((row, field, index) => {
      const metadatum = columnMetadata[index]
      const key = metadatum.name || index
      const value = transformFieldValue(field)

      if (typeof valueTransformer === 'function') {
        const nextFn = () => defaultValueTransformer(value, metadatum)
        return {
          ...row,
          [key]: valueTransformer(value, metadatum, nextFn),
        }
      } else {
        return {
          ...row,
          [key]: defaultValueTransformer(value, metadatum),
        }
      }
    }, {})
  }) as T[]

  return {
    rows,
    metadata,
  }
}
