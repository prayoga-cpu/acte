import { ArgumentsHost, Catch, type ExceptionFilter, HttpException, HttpStatus } from "@nestjs/common";
import type { Response } from "express";

/**
 * Formats every error as `{ error: { code, message } }` (API_CONTRACT.md).
 * Never echoes the request body (PRIVACY_MODEL.md).
 */
@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const res = host.switchToHttp().getResponse<Response>();
    const status = exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
    const body = exception instanceof HttpException ? exception.getResponse() : null;

    const error =
      body && typeof body === "object" && "error" in body
        ? (body as { error: { code: string; message: string } }).error
        : {
            code: status === HttpStatus.UNAUTHORIZED ? "unauthorized" : status === HttpStatus.NOT_FOUND ? "not_found" : "internal_error",
            message: exception instanceof Error ? exception.message : "Unexpected error",
          };

    res.status(status).json({ error });
  }
}
