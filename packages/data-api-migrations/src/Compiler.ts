export interface CompilerOptions {
  cwd: string
  migrationsPath: string
  buildPath: string
  logger: (message: string) => void
}
export abstract class CompilerBase {
  public readonly cwd: string
  public readonly migrationsPath: string
  public readonly buildPath: string
  public readonly logger: (message: string) => void

  constructor({ cwd, migrationsPath, buildPath, logger }: CompilerOptions) {
    this.cwd = cwd
    this.migrationsPath = migrationsPath
    this.buildPath = buildPath
    this.logger = logger
  }
}

export interface Compiler {
  compile: () => Promise<string[]>
  cleanup: () => Promise<void>
}

export type CompilerClass = new (options: CompilerOptions) => Compiler
