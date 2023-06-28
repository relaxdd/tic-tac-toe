import express from 'express'
import dotenv from 'dotenv'
import path from 'path'
import router from './router'
import { IConfig } from './@types/config'
import args, { showHelp } from './sys'

if (args.isHelp) showHelp()

const envArg = args.env as string | undefined
const envPath = envArg || (args.isProd ? '.env' : '../.env.development')

dotenv.config({
  path: path.resolve(__dirname, envPath),
})

const config: IConfig = {
  isProd: Boolean(args.isProd),
  port: Number(args?.port || process.env?.['PORT'] || 80),
  static: args?.static ? String(args.static) : process.env?.['STATIC'],
}

if (!config.static) {
  console.error('[Error]: The \'static\' directory is not specified')
  process.exit(0)
}

const __public = path.resolve(__dirname, config.static)

const server = express()

server.use(express.static(__public))
server.use('/api', router)

server.listen(config.port, () => {
  console.log(`[server]: Server is running at ${config.port} port`)
})