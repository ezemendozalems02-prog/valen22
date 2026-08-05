import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Debe coincidir con la constraint de supabase/migrations/…_create_funnel_tracking.sql */
const ALLOWED_EVENTS = new Set([
  "onboarding_started",
  "improvement_area_selected",
  "life_score_selected",
  "responsibility_selected",
  "onboarding_completed",
  "onboarding_restarted",
  "checkout_viewed",
  "checkout_initiated",
]);

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * POST /api/track-event
 *
 * Un paso del embudo de visitantes (onboarding, mirar el checkout, iniciar
 * el pago). visitorId es un UUID generado en el navegador (sessionStorage,
 * sin cookies de terceros) que permite armar el embudo sin guardar quién es
 * cada persona. Igual que /api/track-visit: si falla, no debe romper nada
 * en la landing.
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: true }); // no rompemos la navegación por esto
  }

  const b = body as { visitorId?: unknown; event?: unknown; meta?: unknown };
  const visitorId = typeof b.visitorId === "string" ? b.visitorId : "";
  const event = typeof b.event === "string" ? b.event : "";

  if (!UUID_RE.test(visitorId) || !ALLOWED_EVENTS.has(event)) {
    return NextResponse.json({ ok: true }); // payload inválido: se ignora en silencio
  }

  try {
    const supabase = getSupabaseAdmin();
    await supabase.from("analytics_events").insert({
      visitor_id: visitorId,
      event,
      meta: b.meta && typeof b.meta === "object" ? b.meta : null,
    });
  } catch (err) {
    console.error("[track-event] Error registrando evento:", (err as Error).message);
  }

  return NextResponse.json({ ok: true });
}
