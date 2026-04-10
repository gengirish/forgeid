import { SignJWT, exportJWK, generateKeyPair, importSPKI, jwtVerify, type JWTPayload, type KeyLike } from "jose";
import { createHash, randomBytes } from "node:crypto";
import { customAlphabet } from "nanoid";
import { API_KEY_PREFIX } from "@forgeid/shared";

const alphabet = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
const nano = customAlphabet(alphabet, 21);
const nano32 = customAlphabet(alphabet, 32);

export type SigningMaterial = {
  privateKey: KeyLike;
  publicKey: KeyLike;
  kid: string;
};

let signingMaterial: SigningMaterial | null = null;

export async function initSigningMaterial(): Promise<SigningMaterial> {
  const { publicKey, privateKey } = await generateKeyPair("RS256", { modulusLength: 4096 });
  const kid = nano();
  signingMaterial = { publicKey, privateKey, kid };
  return signingMaterial;
}

export function getSigningMaterial(): SigningMaterial {
  if (!signingMaterial) {
    throw new Error("Signing keys not initialized; call initSigningMaterial() at startup");
  }
  return signingMaterial;
}

export async function getJwks(): Promise<{ keys: Record<string, unknown>[] }> {
  const { publicKey, kid } = getSigningMaterial();
  const jwk = { ...(await exportJWK(publicKey)), kid, use: "sig" as const, alg: "RS256" as const };
  return { keys: [jwk as unknown as Record<string, unknown>] };
}

export async function signJwt(
  payload: Record<string, unknown>,
  privateKey: KeyLike,
  kid: string,
  options: { issuer: string; audience: string; subject: string; expiresInSeconds: number; jti: string },
): Promise<string> {
  const jwt = await new SignJWT(payload)
    .setProtectedHeader({ alg: "RS256", kid })
    .setIssuer(options.issuer)
    .setAudience(options.audience)
    .setSubject(options.subject)
    .setJti(options.jti)
    .setIssuedAt()
    .setExpirationTime(Math.floor(Date.now() / 1000) + options.expiresInSeconds)
    .sign(privateKey);
  return jwt;
}

export async function verifyJwt(
  token: string,
  publicKey: KeyLike,
  options: { issuer: string; audience: string },
): Promise<JWTPayload> {
  const { payload } = await jwtVerify(token, publicKey, {
    issuer: options.issuer,
    audience: options.audience,
  });
  return payload;
}

export async function verifyJwtWithPem(
  token: string,
  publicKeyPem: string,
  options: { issuer: string; audience: string },
): Promise<JWTPayload> {
  const key = await importSPKI(publicKeyPem, "RS256");
  return verifyJwt(token, key, options);
}

export function hashApiKey(key: string): string {
  return createHash("sha256").update(key, "utf8").digest("hex");
}

export function generateApiKey(): string {
  return `${API_KEY_PREFIX}${nano32()}`;
}

/** Prefixed identifier, e.g. `generateId('org_')`, `generateId('usr_')`. */
export function generateId(prefix: string): string {
  return `${prefix}${nano()}`;
}

export function generateRawSecret(bytes = 32): string {
  return randomBytes(bytes).toString("base64url");
}
