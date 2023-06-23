import { Request, Response, NextFunction } from 'express'

function cors(obj: { origin: string }) {
  return function (req: Request, res: Response, next: NextFunction) {
    res.setHeader('Access-Control-Allow-Origin', obj.origin)
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
    res.setHeader('Access-Control-Allow-Credentials', 'true')

    next()
  }
}

export default cors