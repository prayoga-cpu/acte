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
          message: result.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; "),
        },
      });
    }
    return result.data;
  }
}
