import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Endpoint TEMPORAL de diagnóstico de configuración. No expone secretos:
 * solo indica qué variables existen y datos ya públicos (site URL, app id).
 * BORRAR después de diagnosticar.
 */
export async function GET() {
  const mp = process.env.MERCADO_PAGO_ACCESS_TOKEN ?? "";
  return NextResponse.json({
    siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? null,
    mpTokenPresent: Boolean(mp),
    mpAppId: mp ? mp.split("-")[1] ?? null : null,
    supabaseUrlPresent: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
    supabaseServicePresent: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
    adminUserPresent: Boolean(process.env.ADMIN_USERNAME),
    adminPassPresent: Boolean(process.env.ADMIN_PASSWORD),
    adminSecretPresent: Boolean(process.env.ADMIN_SESSION_SECRET),
    webhookSecretPresent: Boolean(process.env.MERCADO_PAGO_WEBHOOK_SECRET),
  });
}
