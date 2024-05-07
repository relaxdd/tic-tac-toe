import { NextFunction, Request, Response } from 'express'
import ApiError from '../class/ApiError'

function errorHandler(err: Error, req: Request, res: Response, next: NextFunction) {
  const typeError = ['ClientError', 'ServerError']

  if (err instanceof ApiError) {
    return res.status(err.status).json({
      message: typeError[+(err.status >= 500)],
      error: err.message,
      details: err.details,
    })
  }

  return res.status(500).json({
    message: typeError[1],
    error: err.message,
    details: {
      name: err.name,
      stack: err.stack,
    }
  })
}

export default errorHandler
