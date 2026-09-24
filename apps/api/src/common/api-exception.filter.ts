import { ArgumentsHost, Catch, type ExceptionFilter, HttpException, HttpStatus } from "@nestjs/common";
import type { Response } from "express";

/** Postgres SQLSTATE, whether postgres-js raised it directly or a wrapper kept it as `cause`. */
function pgCode(exception: unknown): string | undefined {
  const e = exception as { code?: unknown; cause?: { code?: unknown } } | null;
  const code = e?.code ?? e?.cause?.code;
  return typeof code === "string" ? code : undefined;
}

/**
 * Formats every error as `{ error: { code, message } }` (API_CONTRACT.md).
 * Never echoes the request body (PRIVACY_MODEL.md) — and never echoes an
 * unexpected error's own message either: a failed query's message carries
 * its SQL parameters.
 */
@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const res = host.switchToHttp().getResponse<Response>();

    // A malformed id in a route param (e.g. /v1/tasks/not-a-uuid) — nothing by that id exists.
    if (pgCode(exception) === "22P02") {
      res.status(HttpStatus.NOT_FOUND).json({ error: { code: "not_found", message: "Not found" } });
      return;
    }

    const status = exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
    const body = exception instanceof HttpException ? exception.getResponse() : null;

    let error: { code: string; message: string };
    if (body && typeof body === "object" && "error" in body) {
      error = (body as { error: { code: string; message: string } }).error;
    } else if (exception instanceof HttpException) {
      error = {
        code: status === HttpStatus.UNAUTHORIZED ? "unauthorized" : status === HttpStatus.NOT_FOUND ? "not_found" : "http_error",
        message: exception.message,
      };
    } else {
      if (!process.env.VERCEL && process.env.NODE_ENV !== "production") console.error(exception);
      else console.error(`[api] unhandled ${exception instanceof Error ? exception.name : typeof exception}${pgCode(exception) ? ` (pg ${pgCode(exception)})` : ""}`);
      error = { code: "internal_error", message: "Unexpected error" };
    }

    res.status(status).json({ error });
  }
}
