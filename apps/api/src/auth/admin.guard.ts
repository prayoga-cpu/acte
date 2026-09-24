import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import type { Request } from "express";

/**
 * D-004 interim decision (DECISIONS.md, working default pending Yann's
 * sign-off): the admin console is role-gated, enforced here — not only in
 * the UI. Runs after SessionGuard, which populates req.firmContext.
 */
@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();
    if (!req.firmContext?.isAdmin) {
      throw new ForbiddenException({ error: { code: "not_admin", message: "Admin access required" } });
    }
    return true;
  }
}
