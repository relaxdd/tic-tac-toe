import { ArgsParams } from './system'
import dotenv from 'dotenv'
import path from 'path'

export default function configure(args: ArgsParams, dir: string) {
  const envPath = args.env || (args.isProd ? '.env' : '../.env.development')

  dotenv.config({
    path: path.resolve(dir, envPath),
  })
}