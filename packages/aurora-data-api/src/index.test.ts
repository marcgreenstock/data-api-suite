import * as AuroraDataAPI from '.'
import * as Errors from './Errors'
import * as Transaction from './Transaction'
import { JSONValue, BlobValue } from './customValues'

test('exports', () => {
  expect(AuroraDataAPI).toBeInstanceOf(Function)
  expect(AuroraDataAPI.Errors).toMatchObject(Errors)
  expect(AuroraDataAPI.Transaction).toEqual(Transaction)
  expect(AuroraDataAPI.JSONValue).toEqual(JSONValue)
  expect(AuroraDataAPI.BlobValue).toEqual(BlobValue)
})
