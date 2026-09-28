import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common'
import { Prisma } from '@prisma/client'
import type { Request, Response } from 'express'

/* ── Error shape ───────────────────────────────────────────────────────────
   Every error leaves the API as { statusCode, code, message, fields? }.
   Nothing else — no stack, no Prisma text, no SQL. Unexpected errors are
   logged with the request id and answered with a generic 500.
   ------------------------------------------------------------------------ */

type ErrorBody = {
  statusCode: number
  code: string
  message: string
  fields?: Record<string, string>
}

const CODE_BY_STATUS: Record<number, string> = {
  400: 'bad_request',
  401: 'unauthorized',
  403: 'forbidden',
  404: 'not_found',
  409: 'conflict',
  413: 'payload_too_large',
  415: 'unsupported_media_type',
  422: 'validation_failed',
  429: 'too_many_requests',
}

@Catch()
export class AppExceptionFilter implements ExceptionFilter {
  private readonly log = new Logger('http')

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp()
    const res = ctx.getResponse<Response>()
    const req = ctx.getRequest<Request & { id?: string }>()
    const body = this.toBody(exception)

    if (body.statusCode >= 500) {
      this.log.error(
        { reqId: req.id, method: req.method, url: req.url, err: exception },
        'unhandled error',
      )
    }
    res.status(body.statusCode).json(body)
  }

  private toBody(exception: unknown): ErrorBody {
    if (exception instanceof HttpException) {
      const status = exception.getStatus()
      const payload = exception.getResponse()
      if (typeof payload === 'object' && payload !== null && 'code' in payload) {
        return { statusCode: status, ...(payload as Omit<ErrorBody, 'statusCode'>) }
      }
      const message =
        typeof payload === 'string'
          ? payload
          : ((payload as { message?: string | string[] }).message ?? exception.message)
      return {
        statusCode: status,
        code: CODE_BY_STATUS[status] ?? 'error',
        message: Array.isArray(message) ? message.join('; ') : message,
      }
    }

    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      if (exception.code === 'P2002')
        return { statusCode: 409, code: 'conflict', message: 'That value is already in use.' }
      if (exception.code === 'P2025')
        return { statusCode: 404, code: 'not_found', message: 'Not found.' }
    }

    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      code: 'internal_error',
      message: 'Something went wrong on our side.',
    }
  }
}
