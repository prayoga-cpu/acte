import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import type { Request } from "express";
import type { FirmContext } from "../data-access/firm-context.js";

/** Use on any route guarded by SessionGuard to get the caller's firm/member id. */
export const CurrentFirm = createParamDecorator((_: unknown, ctx: ExecutionContext): FirmContext => {
  const req = ctx.switchToHttp().getRequest<Request>();
  return req.firmContext!;
});
