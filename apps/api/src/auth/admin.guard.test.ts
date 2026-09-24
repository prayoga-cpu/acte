import { describe, expect, it } from "vitest";
import { ForbiddenException, type ExecutionContext } from "@nestjs/common";
import { AdminGuard } from "./admin.guard.js";

function contextWith(firmContext: unknown): ExecutionContext {
  return { switchToHttp: () => ({ getRequest: () => ({ firmContext }) }) } as unknown as ExecutionContext;
}

describe("AdminGuard (D-004 interim: server-enforced role gating)", () => {
  const guard = new AdminGuard();

  it("lets an admin through", () => {
    expect(guard.canActivate(contextWith({ firmId: "f", memberId: "m", isAdmin: true }))).toBe(true);
  });

  it("rejects a non-admin member", () => {
    expect(() => guard.canActivate(contextWith({ firmId: "f", memberId: "m", isAdmin: false }))).toThrow(ForbiddenException);
  });

  it("rejects when no session context was resolved", () => {
    expect(() => guard.canActivate(contextWith(undefined))).toThrow(ForbiddenException);
  });
});
