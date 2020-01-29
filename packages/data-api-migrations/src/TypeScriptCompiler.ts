import * as ts from 'typescript'
import * as fs from 'fs-extra'
import * as path from 'path'
import { Compiler } from './Compiler'

export class TypeScriptCompiler extends Compiler {
  public async compile (): Promise<string[]> {
    this.logger('Compiling with TypeScript...')
    const tsConfig = await this.getTypescriptCompilerOptions()
    const options = {
      ...tsConfig,
      sourceMap: false,
      listEmittedFiles: true
    }
    const files = 
      (await fs.readdir(this.migrationsPath))
      .map((fileName) => path.join(this.migrationsPath, fileName))
    const program = ts.createProgram(files, options)
    const result = program.emit()
    return result.emittedFiles
  }

  public async cleanup (): Promise<void> {
    this.logger('Cleaning up...')
    await fs.remove(this.buildPath)
  }

  private async getTypescriptCompilerOptions (): Promise<ts.CompilerOptions> {
    const configFilePath = path.join(this.cwd, 'tsconfig.json')
    if (fs.pathExists(configFilePath)) {
      this.logger('Using local tsconfig.json')
      const configFileText = (await fs.readFile(configFilePath)).toString()
      const result = ts.parseConfigFileTextToJson(configFilePath, configFileText)
      if (result.error) {
        throw new Error(JSON.stringify(result.error))
      }
      Object.assign(result.config.compilerOptions, {
        rootDir: this.migrationsPath,
        outDir: this.buildPath
      })
      const configParseResult = ts.parseJsonConfigFileContent(result.config, ts.sys, this.migrationsPath)
      if (configParseResult.errors.length > 0) {
        throw new Error(JSON.stringify(configParseResult.errors))
      }
      return configParseResult.options
    } else {
      return {
        preserveConstEnums: true,
        strictNullChecks: true,
        sourceMap: true,
        allowJs: true,
        target: ts.ScriptTarget.ES5,
        moduleResolution: ts.ModuleResolutionKind.NodeJs,
        lib: ['lib.es2015.d.ts'],
        rootDir: this.migrationsPath,
        outDir: this.buildPath
      }
    }
  }
}