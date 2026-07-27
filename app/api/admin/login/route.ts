import { NextResponse } from "next/server";
import { ADMIN_SESSION_COOKIE, createSessionToken, verifyCredentials } from "@/lib/admin-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Recibe el <form> de /admin/login (POST tradicional, sin JS). Si las
 * credenciales son correctas, crea la cookie de sesión y redirige a /admin;
 * si no, vuelve al login con ?error=1. No revela cuál de los dos campos
 * estuvo mal.
 */
export async function POST(request: Request) {
  const form = await request.formData();
  const username = String(form.get("username") ?? "");
  const password = String(form.get("password") ?? "");

  let valid = false;
  try {
    valid = await verifyCredentials(username, password);
  } catch (err) {
    console.error("[admin/login] Configuración incompleta:", (err as Error).message);
    return NextResponse.redirect(new URL("/admin/login?error=config", request.url));
  }

  if (!valid) {
    return NextResponse.redirect(new URL("/admin/login?error=1", request.url));
  }

  const token = await createSessionToken();
  const response = NextResponse.redirect(new URL("/admin", request.url));
  response.cookies.set(ADMIN_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 12, // 12 horas, igual que la validez del token
  });
  return response;
}
