import { TypeScriptCompiler } from './TypeScriptCompiler'
import * as fs from 'fs-extra'

jest.mock('typescript', () => {
  return {
    parseConfigFileTextToJson: jest.fn(() => {
      return {
        config: {
          "compilerOptions": {
            "module": "CommonJS",
            "moduleResolution": "Node",
            "target": "ES6",
            "sourceMap": true,
            "declaration": true,
          }
        },
        error: null
      }
    }),
    parseJsonConfigFileContent: jest.fn(() => {
      return {
        errors: [],
        options: {
          "module": "CommonJS",
          "moduleResolution": "Node",
          "target": "ES6",
          "sourceMap": true,
          "declaration": true
        }
      }
    }),
    createProgram: jest.fn(() => {
      return {
        emit: jest.fn(() => {
          return {
            emittedFiles: [
              '20200107142955_createUsers.js',
              '20200116113329_createProjects.js'
            ]
          }
        })
      }
    })
  }
})

jest.mock('fs-extra', () => {
  return {
    readdir: jest.fn().mockResolvedValue([
      '20200107142955_createUsers.ts',
      '20200116113329_createProjects.ts'
    ]),
    pathExists: jest.fn().mockResolvedValue(true),
    readFile: jest.fn().mockResolvedValue(`
    {
      "compilerOptions": {
        "module": "CommonJS",
        "moduleResolution": "Node",
        "target": "ES6",
        "sourceMap": true,
        "declaration": true,
      }
    }
    `),
    remove: jest.fn().mockResolvedValue(undefined)
  }
})

const compiler = new TypeScriptCompiler({
  cwd: process.cwd(),
  migrationsPath: `${process.cwd()}/migrations`,
  buildPath: `${process.cwd()}/.migrations`,
  logger: (): void => undefined
})

describe('TypeScriptCompiler#compile', () => {
  it ('returns the list of compiled files', async () => {
    const result = await compiler.compile()
    expect(result).toMatchObject([
      '20200107142955_createUsers.js',
      '20200116113329_createProjects.js'
    ])
  })
})

describe('TypeScriptCompiler#cleanup', () => {
  it ('calls fs#remove on the build folder', async () => {
    await compiler.cleanup()
    expect(fs.remove).toHaveBeenCalledWith(`${process.cwd()}/.migrations`)
  })
})