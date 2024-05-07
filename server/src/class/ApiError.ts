class ApiError extends Error {
  public constructor(
    message: string,
    public status: number,
    public details?: Record<string, any>,
  ) {
    super(message)
    this.name = 'ApiError'
  }

  public toObject() {
    return {
      message: this.message,
      details: this.details,
    }
  }

  public override toString() {
    return JSON.stringify(this.toObject())
  }
}

export default ApiError