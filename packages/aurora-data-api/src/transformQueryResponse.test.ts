import transformQueryResponse from './transformQueryResponse'

test('undefined records', () => {
  const result = transformQueryResponse({ numberOfRecordsUpdated: 0 })
  expect(result).toMatchObject({
    rows: null,
    metadata: null
  })
})

test('stringValue', () => {
  const result = transformQueryResponse({
    columnMetadata: [{
      name: 'example'
    }],
    records: [
      [{ stringValue: 'hello world' }]
    ]
  })
  expect(result).toMatchObject({
    metadata: {
      example: { name: 'example' }
    },
    rows: [{ example: 'hello world' }]
  })
})

test('booleanValue', () => {
  const result = transformQueryResponse({
    columnMetadata: [{
      name: 'example'
    }],
    records: [
      [{ booleanValue: true }]
    ]
  })
  expect(result).toMatchObject({
    metadata: {
      example: { name: 'example' }
    },
    rows: [{ example: true }]
  })
})

test('longValue', () => {
  const result = transformQueryResponse({
    columnMetadata: [{
      name: 'example'
    }],
    records: [
      [{ longValue: 43 }]
    ]
  })
  expect(result).toMatchObject({
    metadata: {
      example: { name: 'example' }
    },
    rows: [{ example: 43 }]
  })
})

test('doubleValue', () => {
  const result = transformQueryResponse({
    columnMetadata: [{
      name: 'example'
    }],
    records: [
      [{ doubleValue: 661.1 }]
    ]
  })
  expect(result).toMatchObject({
    metadata: {
      example: { name: 'example' }
    },
    rows: [{ example: 661.1 }]
  })
})

test('blobValue', () => {
  const result = transformQueryResponse({
    columnMetadata: [{
      name: 'example'
    }],
    records: [
      [{ blobValue: 'i am a blob' }]
    ]
  })
  expect(result).toMatchObject({
    metadata: {
      example: { name: 'example' }
    },
    rows: [{ example: 'i am a blob' }]
  })
})

test('unknown value', () => {
  const result = transformQueryResponse({
    columnMetadata: [{
      name: 'example'
    }],
    records: [
      [{ weirdValue: 'i am a blob' }]
    ]
  } as any)
  expect(result).toMatchObject({
    metadata: {
      example: { name: 'example' }
    },
    rows: [{ example: null }]
  })
})

test('missing name in metadata', () => {
  const result = transformQueryResponse({
    columnMetadata: [{ typeName: 'varchar' }, { typeName: 'int8' }],
    records: [
      [{ stringValue: 'hello world' }, { longValue: 7 }]
    ]
  })
  expect(result).toMatchObject({
    metadata: {
      $0: { typeName: 'varchar' },
      $1: { typeName: 'int8' }
    },
    rows: [{ $0: 'hello world', $1: 7 }]
  })
})

describe('arrayValue', () => {
  test('stringValues', () => {
    const result = transformQueryResponse({
      columnMetadata: [{
        name: 'example'
      }],
      records: [
        [{ 
          arrayValue: {
            stringValues: ['foo', 'bar'] 
          }
        }]
      ]
    })
    expect(result).toMatchObject({
      metadata: {
        example: { name: 'example' }
      },
      rows: [{ example: ['foo', 'bar'] }]
    })
  })

  test('longValues', () => {
    const result = transformQueryResponse({
      columnMetadata: [{
        name: 'example'
      }],
      records: [
        [{ 
          arrayValue: {
            longValues: [1, 2] 
          }
        }]
      ]
    })
    expect(result).toMatchObject({
      metadata: {
        example: { name: 'example' }
      },
      rows: [{ example: [1, 2] }]
    })
  })

  test('doubleValues', () => {
    const result = transformQueryResponse({
      columnMetadata: [{
        name: 'example'
      }],
      records: [
        [{ 
          arrayValue: {
            doubleValues: [1.1, 2.1] 
          }
        }]
      ]
    })
    expect(result).toMatchObject({
      metadata: {
        example: { name: 'example' }
      },
      rows: [{ example: [1.1, 2.1] }]
    })
  })

  test('booleanValues', () => {
    const result = transformQueryResponse({
      columnMetadata: [{
        name: 'example'
      }],
      records: [
        [{ 
          arrayValue: {
            booleanValues: [true, false] 
          }
        }]
      ]
    })
    expect(result).toMatchObject({
      metadata: {
        example: { name: 'example' }
      },
      rows: [{ example: [true, false] }]
    })
  })
  
  test('arrayValues', () => {
    const result = transformQueryResponse({
      columnMetadata: [{
        name: 'example'
      }],
      records: [
        [{ 
          arrayValue: {
            arrayValues: [{
              booleanValues: [true, false]
            }, {
              booleanValues: [false, true]
            }, {
              booleanValues: [false, false]
            }]
          }
        }]
      ]
    })
    expect(result).toMatchObject({
      metadata: {
        example: { name: 'example' }
      },
      rows: [{ example: [[true, false], [false, true], [false, false]] }]
    })
  })

  test('unknown arrayValue', () => {
    const result = transformQueryResponse({
      columnMetadata: [{
        name: 'example'
      }],
      records: [
        [{ 
          arrayValue: {
            weirdValues: ['foo', 'bar'] 
          }
        }]
      ]
    } as any)
    expect(result).toMatchObject({
      metadata: {
        example: { name: 'example' }
      },
      rows: [{ example: [] }]
    })
  })
})

describe('typeParsers', () => {
  test('json', () => {
    const result = transformQueryResponse({
      columnMetadata: [{
        name: 'example',
        typeName: 'json'
      }],
      records: [
        [{
          stringValue: '{"foo": "bar"}'
        }]
      ]
    })
    expect(result).toMatchObject({
      metadata: {
        example: { name: 'example', typeName: 'json' }
      },
      rows: [{ example: { foo: 'bar' } }]
    })
  })

  test('timestamp', () => {
    const result = transformQueryResponse({
      columnMetadata: [{
        name: 'example',
        typeName: 'timestamp'
      }],
      records: [
        [{
          stringValue: '2019-12-25 19:57:21'
        }]
      ]
    })
    expect(result).toMatchObject({
      metadata: {
        example: { name: 'example', typeName: 'timestamp' }
      },
      rows: [{ example: new Date('2019-12-25 19:57:21') }]
    })
  })
})