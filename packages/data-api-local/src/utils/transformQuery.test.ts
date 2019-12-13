/* eslint-env jest */

import { transformQuery } from './transformQuery'
import * as RDSDataService from 'aws-sdk/clients/rdsdataservice'

test('transformQuery', () => {
  const query = ':a :b :c :d :e :f :a :g :h :i :j :k :l'
  const properties: RDSDataService.Types.SqlParametersList = [{
    name: 'a',
    value: {
      stringValue: 'example'
    }
  }, {
    name: 'b',
    value: {
      booleanValue: true
    }
  }, {
    name: 'c',
    value: {
      doubleValue: 44.4
    }
  }, {
    name: 'd',
    value: {
      isNull: true
    }
  }, {
    name: 'e',
    value: {
      isNull: false
    }
  }, {
    name: 'f',
    value: {
      longValue: 35
    }
  }, {
    name: 'g',
    value: {
      arrayValue: {
        booleanValues: [true, false, true]
      }
    }
  }, {
    name: 'h',
    value: {
      arrayValue: {
        doubleValues: [12.2, 23.0]
      }
    }
  }, {
    name: 'i',
    value: {
      arrayValue: {
        longValues: [12, 22, 24]
      }
    }
  }, {
    name: 'j',
    value: {
      arrayValue: {
        stringValues: ['foo', 'bar']
      }
    }
  }, {
    name: 'k',
    value: {
      arrayValue: {
        arrayValues: [{
          stringValues: ['a', 'b']
        }, {
          longValues: [1, 2]
        }]
      }
    }
  }, {
    name: 'l',
    value: {
      blobValue: 'foo'
    }
  }]
  const result = transformQuery(query, properties)
  expect(result).toStrictEqual({
    query: '$1 $2 $3 $4 $5 $6 $1 $7 $8 $9 $10 $11 $12',
    values: [
      'example',
      true,
      44.4,
      'IS NULL',
      'IS NOT NULL',
      35,
      [true, false, true],
      [12.2, 23.0],
      [12, 22, 24],
      ['foo', 'bar'],
      [['a', 'b'], [1, 2]],
      'foo'
    ]
  })
})
