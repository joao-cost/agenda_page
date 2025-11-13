import { describe, expect, it } from "vitest";
import { comparePassword, hashPassword } from "./password";

describe("password utils", () => {
  it("gera hash diferente da senha original", async () => {
    const plain = "segredo123";
    const hash = await hashPassword(plain);
    expect(hash).not.toBe(plain);
    expect(hash).toMatch(/^\$2[aby]\$/);
  });

  it("compara hash corretamente", async () => {
    const plain = "minhaSenha!";
    const hash = await hashPassword(plain);
    await expect(comparePassword(plain, hash)).resolves.toBe(true);
    await expect(comparePassword("senhaErrada", hash)).resolves.toBe(false);
  });
});


