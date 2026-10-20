import { BaseOptions } from './shared.types.js'

export interface MonolithOptions<T> extends BaseOptions<T> {
  prefix?: boolean
  validation?: boolean
  responseMap?: boolean
  errorMap?: boolean
  compression?: boolean
  rateLimit?: boolean
  cookie?: boolean
  cors?: boolean
  swagger?: boolean
}
