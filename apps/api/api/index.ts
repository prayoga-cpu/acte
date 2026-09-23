import "reflect-metadata";
import type { Request, Response } from "express";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "../src/app.module.js";
import { ApiExceptionFilter } from "../src/common/api-exception.filter.js";

/**
 * Vercel serverless entry point (beta/testing hosting only — see D-013 in
 * DECISIONS.md). `src/main.ts`'s `app.listen(port)` is the real entry point
 * for a long-running host (Scaleway); Vercel's Node.js runtime instead wants
 * a request-handler function, so this wraps the same Nest app and exposes
 * its underlying Express instance directly. `vercel.json` routes every
 * request here. Reused across warm invocations via the module-level
 * `appPromise` so Nest only bootstraps once per container.
 */
let appPromise: Promise<(req: Request, res: Response) => void> | null = null;

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalFilters(new ApiExceptionFilter());
  app.enableCors({ origin: process.env.WEB_ORIGIN ?? "http://localhost:3000", credentials: true });
  await app.init();
  return app.getHttpAdapter().getInstance();
}

export default async function handler(req: Request, res: Response) {
  if (!appPromise) appPromise = bootstrap();
  const server = await appPromise;
  server(req, res);
}
