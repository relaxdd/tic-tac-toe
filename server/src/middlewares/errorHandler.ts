import { NextFunction, Request, Response } from 'express'
import ApiError from '../class/ApiError'

function errorHandler(err: Error, req: Request, res: Response, next: NextFunction) {
  if (err instanceof ApiError) {
    return res.status(err.status).json({
      message: err.message,
      details: err.details,
    })
  }

  return res.status(500).json({
    message: err.message,
    details: {
      name: err.name,
      stack: err.stack,
    }
  })
}

export default errorHandler