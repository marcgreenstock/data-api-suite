import { transformResult } from './transformResult'
import { QueryResult, types } from 'pg'

test('transformResult', () => {
  const now = new Date()
  const queryResult: QueryResult = {
    rowCount: 1,
    command: 'SELECT',
    oid: 0,
    rows: [
      [
        null,
        'example',
        true,
        'file',
        2,
        4,
        8,
        4.2,
        8.4,
        now.toISOString(),
        now.toISOString(),
        [true, false],
        [now.toISOString(), now.toISOString()],
        [1, 2],
        [1.1, 2.2],
        [
          ['foo', 'bar'],
          ['bar', 'foo'],
        ],
      ],
    ],
    fields: [
      {
        dataTypeID: types.builtins.VARCHAR,
        tableID: 0,
        columnID: 0,
        dataTypeModifier: -1,
        dataTypeSize: -1,
        name: 'value',
        format: 'TEXT',
      },
      {
        dataTypeID: types.builtins.VARCHAR,
        tableID: 0,
        columnID: 0,
        dataTypeModifier: -1,
        dataTypeSize: -1,
        name: 'value',
        format: 'TEXT',
      },
      {
        dataTypeID: types.builtins.BOOL,
        tableID: 0,
        columnID: 0,
        dataTypeModifier: -1,
        dataTypeSize: -1,
        name: 'value',
        format: 'TEXT',
      },
      {
        dataTypeID: types.builtins.BYTEA,
        tableID: 0,
        columnID: 0,
        dataTypeModifier: -1,
        dataTypeSize: -1,
        name: 'value',
        format: 'TEXT',
      },
      {
        dataTypeID: types.builtins.INT2,
        tableID: 0,
        columnID: 0,
        dataTypeModifier: -1,
        dataTypeSize: -1,
        name: 'value',
        format: 'TEXT',
      },
      {
        dataTypeID: types.builtins.INT4,
        tableID: 0,
        columnID: 0,
        dataTypeModifier: -1,
        dataTypeSize: -1,
        name: 'value',
        format: 'TEXT',
      },
      {
        dataTypeID: types.builtins.INT8,
        tableID: 0,
        columnID: 0,
        dataTypeModifier: -1,
        dataTypeSize: -1,
        name: 'value',
        format: 'TEXT',
      },
      {
        dataTypeID: types.builtins.FLOAT4,
        tableID: 0,
        columnID: 0,
        dataTypeModifier: -1,
        dataTypeSize: -1,
        name: 'value',
        format: 'TEXT',
      },
      {
        dataTypeID: types.builtins.FLOAT8,
        tableID: 0,
        columnID: 0,
        dataTypeModifier: -1,
        dataTypeSize: -1,
        name: 'value',
        format: 'TEXT',
      },
      {
        dataTypeID: types.builtins.TIMESTAMP,
        tableID: 0,
        columnID: 0,
        dataTypeModifier: -1,
        dataTypeSize: -1,
        name: 'value',
        format: 'TEXT',
      },
      {
        dataTypeID: types.builtins.TIMESTAMPTZ,
        tableID: 0,
        columnID: 0,
        dataTypeModifier: -1,
        dataTypeSize: -1,
        name: 'value',
        format: 'TEXT',
      },
      {
        dataTypeID: 1000,
        tableID: 0,
        columnID: 0,
        dataTypeModifier: -1,
        dataTypeSize: -1,
        name: 'value',
        format: 'TEXT',
      },
      {
        dataTypeID: 1115,
        tableID: 0,
        columnID: 0,
        dataTypeModifier: -1,
        dataTypeSize: -1,
        name: 'value',
        format: 'TEXT',
      },
      {
        dataTypeID: 1005,
        tableID: 0,
        columnID: 0,
        dataTypeModifier: -1,
        dataTypeSize: -1,
        name: 'value',
        format: 'TEXT',
      },
      {
        dataTypeID: 1021,
        tableID: 0,
        columnID: 0,
        dataTypeModifier: -1,
        dataTypeSize: -1,
        name: 'value',
        format: 'TEXT',
      },
      {
        dataTypeID: 1015,
        tableID: 0,
        columnID: 0,
        dataTypeModifier: -1,
        dataTypeSize: -1,
        name: 'value',
        format: 'TEXT',
      },
    ],
  }
  const result = transformResult(queryResult)
  expect(result).toMatchObject([
    [
      { isNull: true },
      { stringValue: 'example' },
      { booleanValue: true },
      { blobValue: 'file' },
      { longValue: 2 },
      { longValue: 4 },
      { longValue: 8 },
      { doubleValue: 4.2 },
      { doubleValue: 8.4 },
      { stringValue: now.toISOString() },
      { stringValue: now.toISOString() },
      {
        arrayValue: {
          booleanValues: [true, false],
        },
      },
      {
        arrayValue: {
          stringValues: [now.toISOString(), now.toISOString()],
        },
      },
      {
        arrayValue: {
          longValues: [1, 2],
        },
      },
      {
        arrayValue: {
          doubleValues: [1.1, 2.2],
        },
      },
      {
        arrayValue: {
          arrayValues: [
            {
              stringValues: ['foo', 'bar'],
            },
            {
              stringValues: ['bar', 'foo'],
            },
          ],
        },
      },
    ],
  ])
})
