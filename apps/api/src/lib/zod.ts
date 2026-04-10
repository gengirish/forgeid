import type { Context } from "hono";
import { zValidator } from "@hono/zod-validator";
import type { ZodSchema } from "zod";
import { ZodError } from "zod";
import { ERROR_CODES } from "@forgeid/shared";

const doc = (code: string) => `https://forgeid.ai/docs/errors/${code}`;

export function jsonValidationError(c: Context, message: string) {
  return c.json(
    {
      error: {
        code: ERROR_CODES.VALIDATION_ERROR,
        message,
        doc_url: doc(ERROR_CODES.VALIDATION_ERROR),
      },
    },
    400,
  );
}

export function zodValidatorJson<T extends ZodSchema>(schema: T) {
  return zValidator("json", schema, (result, c) => {
    if (!result.success) {
      const msg =
        result.error.flatten().fieldErrors &&
        Object.keys(result.error.flatten().fieldErrors).length > 0
          ? JSON.stringify(result.error.flatten().fieldErrors)
          : result.error.issues[0]?.message ?? "Validation failed";
      return jsonValidationError(c, msg);
    }
  });
}

export function zodValidatorQuery<T extends ZodSchema>(schema: T) {
  return zValidator("query", schema, (result, c) => {
    if (!result.success) {
      const msg =
        result.error.flatten().fieldErrors &&
        Object.keys(result.error.flatten().fieldErrors).length > 0
          ? JSON.stringify(result.error.flatten().fieldErrors)
          : result.error.issues[0]?.message ?? "Validation failed";
      return jsonValidationError(c, msg);
    }
  });
}

export function formatZodError(err: ZodError): string {
  return err.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
}

export { ZodError };
