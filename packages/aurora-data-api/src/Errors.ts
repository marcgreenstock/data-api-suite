namespace Errors {
  export class AuroraDataAPIError extends Error {}
  export class QueryParamError extends AuroraDataAPIError {
    public readonly paramName: string
    public readonly reason: Error

    constructor(paramName: string, reason: Error) {
      super(
        `Could not transform "${paramName}" to an SqlParameter. Reason: "${reason.message}"`
      )
      this.paramName = paramName
      this.reason = reason
    }
  }
}

export = Errors
