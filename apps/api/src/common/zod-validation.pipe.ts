import { BadRequestException, type PipeTransform } from "@nestjs/common";
import type { ZodType } from "zod";

/** Every handler validates its input with a schema from @acte/contracts (apps/api/CLAUDE.md). */
export class ZodValidationPipe implements PipeTransform {
  constructor(private readonly schema: ZodType) {}

  transform(value: unknown) {
    const result = this.schema.safeParse(value);
    if (!result.success) {
      throw new BadRequestException({
        error: {
          code: "invalid_body",
          // Zod's enum and literal messages end with "received '<value>'": drop that part, so a
          // rejected body is never echoed back (API_CONTRACT.md, PRIVACY_MODEL.md).
          message: result.error.issues.map((i) => `${i.path.join(".")}: ${i.message.replace(/, received .*$/s, "")}`).join("; "),
        },
      });
    }
    return result.data;
  }
}
