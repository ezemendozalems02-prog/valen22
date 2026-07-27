import "server-only";

/**
 * Sesión de administrador con un único usuario fijo (ADMIN_USERNAME /
 * ADMIN_PASSWORD, por variables de entorno). Sin base de datos de sesiones:
 * la cookie es un token firmado con HMAC-SHA256 (Web Crypto, portable entre
 * el runtime de Node de las rutas y el Edge del middleware) que expira solo.
 */

export const ADMIN_SESSION_COOKIE = "epm_admin_session";
const SESSION_DURATION_MS = 12 * 60 * 60 * 1000; // 12 horas

function getSessionSecret(): string {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret) {
    throw new Error(
      "Falta la variable de entorno ADMIN_SESSION_SECRET. Ver .env.example.",
    );
  }
  return secret;
}

function toBase64Url(bytes: ArrayBuffer): string {
  return Buffer.from(bytes)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

async function hmac(data: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(data));
  return toBase64Url(signature);
}

/** Token de sesión: "<expiración-epoch-ms>.<firma>". */
export async function createSessionToken(): Promise<string> {
  const secret = getSessionSecret();
  const expiresAt = Date.now() + SESSION_DURATION_MS;
  const payload = String(expiresAt);
  const signature = await hmac(payload, secret);
  return `${payload}.${signature}`;
}

export async function isValidSessionToken(token: string | undefined | null): Promise<boolean> {
  if (!token) return false;
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return false;

  const expiresAt = Number(payload);
  if (!Number.isFinite(expiresAt) || Date.now() > expiresAt) return false;

  let secret: string;
  try {
    secret = getSessionSecret();
  } catch {
    return false;
  }
  const expected = await hmac(payload, secret);
  return timingSafeEqualString(expected, signature);
}

/** Comparación en tiempo constante sin depender de node:crypto (portable a Edge). */
function timingSafeEqualString(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

export async function verifyCredentials(username: string, password: string): Promise<boolean> {
  const expectedUser = process.env.ADMIN_USERNAME;
  const expectedPass = process.env.ADMIN_PASSWORD;
  if (!expectedUser || !expectedPass) {
    throw new Error(
      "Faltan ADMIN_USERNAME y/o ADMIN_PASSWORD en las variables de entorno.",
    );
  }
  // Igualamos longitudes con padding para no filtrar por timing la longitud real.
  const userOk = timingSafeEqualString(
    username.padEnd(64, "\0"),
    expectedUser.padEnd(64, "\0"),
  );
  const passOk = timingSafeEqualString(
    password.padEnd(64, "\0"),
    expectedPass.padEnd(64, "\0"),
  );
  return userOk && passOk;
}
