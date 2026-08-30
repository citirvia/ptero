import { test } from "node:test";
import assert from "node:assert/strict";

process.env.AUTH_ADMIN_PASSWORD ??= "test-admin-password";

const {
  hashPassword,
  verifyPassword,
  sha256,
  randomToken,
  encryptSecret,
  decryptSecret,
} = await import("./crypto.js");

test("password hashing round-trips and rejects wrong password", async () => {
  const hash = await hashPassword("s3cret-password");
  assert.ok(hash.startsWith("scrypt$"));
  assert.equal(await verifyPassword("s3cret-password", hash), true);
  assert.equal(await verifyPassword("wrong", hash), false);
});

test("password hashes are salted (two hashes differ)", async () => {
  const a = await hashPassword("same");
  const b = await hashPassword("same");
  assert.notEqual(a, b);
  assert.equal(await verifyPassword("same", a), true);
  assert.equal(await verifyPassword("same", b), true);
});

test("sha256 is deterministic", () => {
  assert.equal(sha256("abc"), sha256("abc"));
  assert.notEqual(sha256("abc"), sha256("abd"));
});

test("randomToken produces unique url-safe tokens", () => {
  const a = randomToken();
  const b = randomToken();
  assert.notEqual(a, b);
  assert.match(a, /^[A-Za-z0-9_-]+$/);
});

test("encryptSecret / decryptSecret round-trips", () => {
  const secret = "ptlc_supersecret_api_key_value";
  const enc = encryptSecret(secret);
  assert.notEqual(enc, secret);
  assert.equal(decryptSecret(enc), secret);
});

test("decryptSecret rejects tampered ciphertext", () => {
  const enc = encryptSecret("hello");
  const parts = enc.split(":");
  parts[2] = Buffer.from("tampered").toString("base64");
  assert.throws(() => decryptSecret(parts.join(":")));
});
