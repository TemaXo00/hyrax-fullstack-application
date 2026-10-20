import type { Type } from '@nestjs/common'

export interface EnvType {
  name: string
  variable: string
  isDisplayed: boolean
  required: boolean
}

export interface BaseOptions<T> {
  scope: string
  name: string
  module: Type<T>
  logs?: boolean
  envVariables?: EnvType[]
}

export interface ResponseType<T> {
  status: 'success' | 'error'
  date: string
  time: string
  data: T
  path?: string
}
