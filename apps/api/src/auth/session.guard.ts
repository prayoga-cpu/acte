import { CanActivate, ExecutionContext, Inject, Injectable, UnauthorizedException } from "@nestjs/common";
import { fromNodeHeaders } from "better-auth/node";
import type { Request } from "express";
import { MembersRepository } from "../data-access/members.repository.js";
import type { FirmContext } from "../data-access/firm-context.js";
import { auth } from "./auth.config.js";

declare module "express" {
  interface Request {
    firmContext?: FirmContext;
  }
}

/** Resolves the better-auth session cookie into a FirmContext for every guarded route. */
@Injectable()
export class SessionGuard implements CanActivate {
  constructor(@Inject(MembersRepository) private readonly members: MembersRepository) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request>();
    const result = await auth.api.getSession({ headers: fromNodeHeaders(req.headers) });
    if (!result?.user) {
      throw new UnauthorizedException();
    }

    const firmContext = await this.members.toFirmContext(result.user.id);
    if (!firmContext) {
      throw new UnauthorizedException("No firm membership for this account");
    }

    req.firmContext = firmContext;
    return true;
  }
}
