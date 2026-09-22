import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import { ActivationKeysRepository } from "../data-access/activation-keys.repository.js";
import { MembersRepository } from "../data-access/members.repository.js";
import type { FirmContext } from "../data-access/firm-context.js";

@Injectable()
export class KeysService {
  constructor(
    @Inject(ActivationKeysRepository) private readonly keys: ActivationKeysRepository,
    @Inject(MembersRepository) private readonly members: MembersRepository,
  ) {}

  list(ctx: FirmContext) {
    return this.keys.list(ctx);
  }

  async create(ctx: FirmContext) {
    const member = await this.members.findById(ctx.firmId, ctx.memberId);
    if (!member) throw new NotFoundException();
    return this.keys.create(ctx, member.initials);
  }

  async revoke(ctx: FirmContext, id: string) {
    const revoked = await this.keys.revoke(ctx, id);
    if (!revoked) {
      throw new NotFoundException({ error: { code: "key_not_found", message: "Key not found or already revoked" } });
    }
    return revoked;
  }
}
