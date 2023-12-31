import express from 'express'
import path from 'path'
import router from './includes/router'
import { IConfig } from './@types/config'
import args, { showHelp } from './includes/system'
import configure from './includes/configure'

if (args.isHelp) showHelp()

configure(args, __dirname)

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