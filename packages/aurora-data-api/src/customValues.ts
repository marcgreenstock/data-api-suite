import * as RDSDataService from 'aws-sdk/clients/rdsdataservice'
import { CustomValue, SqlParameter } from './transformQueryParams'

type Json =
  | string
  | number
  | boolean
  | null
  | { [property: string]: Json }
  | Json[]

export class JSONValue implements CustomValue {
  public readonly value: Json
  public readonly typeHint?: RDSDataService.TypeHint

  constructor(value: Json, typeHint?: RDSDataService.TypeHint) {
    this.value = value
    this.typeHint = typeHint
  }

  public toSqlParameter(): SqlParameter {
    return {
      typeHint: this.typeHint || 'json',
      value: {
        stringValue: JSON.stringify(this.value),
      },
    }
  }
}

export class BlobValue implements CustomValue {
  public readonly value: RDSDataService._Blob
  public readonly typeHint?: RDSDataService.TypeHint

  constructor(value: RDSDataService._Blob, typeHint?: RDSDataService.TypeHint) {
    this.value = value
    this.typeHint = typeHint
  }

  public toSqlParameter(): SqlParameter {
    return {
      typeHint: this.typeHint,
      value: {
        blobValue: this.value,
      },
    }
  }
}
