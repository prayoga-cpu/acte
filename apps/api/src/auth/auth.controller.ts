import { All, Controller, Req, Res } from "@nestjs/common";
import { toNodeHandler } from "better-auth/node";
import type { Request, Response } from "express";
import { auth } from "./auth.config.js";

const handler = toNodeHandler(auth);

/** Mounts better-auth's own router (signup, login, magic link, session, logout). */
@Controller("v1/auth")
export class AuthController {
  @All("*")
  async handleAll(@Req() req: Request, @Res() res: Response) {
    await handler(req, res);
  }
}
