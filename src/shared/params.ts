import { z } from "zod";

/** Accept native MCP booleans and explicit legacy string booleans, never truthiness. */
export function booleanParam() {
  return z
    .union([z.boolean(), z.enum(["true", "false"])])
    .transform((value) => value === true || value === "true");
}
