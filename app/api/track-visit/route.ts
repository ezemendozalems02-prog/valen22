import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/track-visit
 *
 * Contador de visitas propio, gratis (no requiere el plan pago de Vercel
 * para poder leer los datos por API). El cliente lo llama una sola vez por
 * sessionStorage, así que cada fila es aproximadamente una sesión, no una
 * página vista. Sin datos personales: solo el path y el referrer.
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const path =
    typeof (body as { path?: unknown }).path === "string"
      ? (body as { path: string }).path.slice(0, 200)
      : "/";
  const referrer =
    typeof (body as { referrer?: unknown }).referrer === "string"
      ? (body as { referrer: string }).referrer.slice(0, 300)
      : null;
  const visitorIdRaw = (body as { visitorId?: unknown }).visitorId;
  const visitorId =
    typeof visitorIdRaw === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(visitorIdRaw)
      ? visitorIdRaw
      : null;

  try {
    const supabase = getSupabaseAdmin();
    // No es crítico: si falla, no debe romper la navegación de nadie.
    await supabase.from("page_visits").insert({ path, referrer, visitor_id: visitorId });
  } catch (err) {
    console.error("[track-visit] Error registrando visita:", (err as Error).message);
  }

  return NextResponse.json({ ok: true });
}
