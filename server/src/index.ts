import bodyParser from 'body-parser'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import express from 'express'
import fs from 'fs'
import path from 'path'
import apiRouter from './includes/apiRouter'
import configureEnv from './includes/configureEnv'
import { errors } from 'celebrate'
import errorHandler from './middlewares/errorHandler'

export const ENV = configureEnv([process.cwd(), __dirname])

if (!ENV.WITH_PUBLIC && !fs.existsSync(path.join(ENV.ROOT_DIR, 'public'))) {
  console.error('[Error]: The \'public\' directory is not specified')
  process.exit(1)
}

const listenCb = () => {
  console.log(`[Express]: Server is running at ${ENV.PORT} port`)
}

function main() {
  const app = express()
  const clientUrl = process.env?.['CLIENT_URL']
  const publicDir = path.join(ENV.ROOT_DIR, 'public')

  if (clientUrl) app.use(cors({ origin: clientUrl }))
  if (fs.existsSync(publicDir)) app.use(express.static(publicDir))

  app.use(bodyParser.json())
  app.use(cookieParser())
  app.use('/api', apiRouter())
  app.use(errors())
  app.use(errorHandler)

  if (!ENV.EXPOSE) app.listen(ENV.PORT, listenCb)
  else app.listen(ENV.PORT, '0.0.0.0', listenCb)
}

try {
  main()
} catch (err) {
  console.error(err)
  process.exit(1)
}
