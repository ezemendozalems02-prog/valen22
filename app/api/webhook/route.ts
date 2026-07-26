import { NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "node:crypto";
import { getPaymentClient } from "@/lib/mercadopago";
import { getSupabaseAdmin, type RegistrationRow } from "@/lib/supabase-admin";
import { sendConfirmationEmail } from "@/lib/confirmation-email";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/webhook
 *
 * Nunca confía en el contenido de la notificación: usa el ID recibido para
 * consultar el pago directamente a Mercado Pago y decide solo con esa
 * respuesta. Es idempotente: la misma notificación puede llegar N veces sin
 * duplicar confirmaciones, emails ni pisar un pago aprobado.
 */
export async function POST(request: Request) {
  const url = new URL(request.url);

  let body: Record<string, unknown> = {};
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    // MP a veces manda body vacío en notificaciones legacy; los datos van en la query.
  }

  // Formato nuevo: ?data.id=123&type=payment · body { type, data: { id } }
  // Formato legacy: ?topic=payment&id=123
  const type =
    url.searchParams.get("type") ??
    url.searchParams.get("topic") ??
    (typeof body.type === "string" ? body.type : null);
  const dataId =
    url.searchParams.get("data.id") ??
    url.searchParams.get("id") ??
    (typeof body.data === "object" && body.data !== null
      ? String((body.data as { id?: unknown }).id ?? "")
      : "");

  // Verificación de firma (docs de MP: header x-signature con ts= y v1=).
  const signatureCheck = verifySignature(request, dataId);
  if (signatureCheck === "invalid") {
    console.warn("[webhook] Firma x-signature inválida; notificación descartada.");
    return NextResponse.json({ error: "invalid signature" }, { status: 401 });
  }
  if (signatureCheck === "unconfigured") {
    console.warn(
      "[webhook] MERCADO_PAGO_WEBHOOK_SECRET no está configurado: la firma no se " +
        "valida. Configurala en producción (ver MERCADOPAGO_SETUP.md).",
    );
  }

  // Solo procesamos pagos; todo lo demás se responde 200 para que MP no reintente.
  if (type !== "payment" || !dataId) {
    return NextResponse.json({ received: true });
  }

  try {
    await processPayment(dataId);
  } catch (err) {
    console.error(`[webhook] Error procesando pago ${dataId}:`, err);
    // 500 hace que Mercado Pago reintente más tarde.
    return NextResponse.json({ error: "processing error" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

type SignatureResult = "valid" | "invalid" | "unconfigured";

function verifySignature(request: Request, dataId: string): SignatureResult {
  const secret = process.env.MERCADO_PAGO_WEBHOOK_SECRET;
  if (!secret) return "unconfigured";

  const signatureHeader = request.headers.get("x-signature");
  const requestId = request.headers.get("x-request-id");
  if (!signatureHeader || !requestId) return "invalid";

  const parts = Object.fromEntries(
    signatureHeader.split(",").map((part) => {
      const [key, ...rest] = part.split("=");
      return [key?.trim(), rest.join("=").trim()];
    }),
  ) as { ts?: string; v1?: string };
  if (!parts.ts || !parts.v1) return "invalid";

  // Template oficial: id:[data.id];request-id:[x-request-id];ts:[ts];
  // (data.id en minúsculas si es alfanumérico, según la documentación de MP)
  const manifest = `id:${dataId.toLowerCase()};request-id:${requestId};ts:${parts.ts};`;
  const expected = createHmac("sha256", secret).update(manifest).digest("hex");

  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(parts.v1, "utf8");
  return a.length === b.length && timingSafeEqual(a, b) ? "valid" : "invalid";
}

async function processPayment(paymentId: string): Promise<void> {
  // Fuente de verdad: el pago consultado directamente a Mercado Pago.
  const payment = await getPaymentClient().get({ id: paymentId });

  const externalReference = payment.external_reference;
  const status = payment.status ?? "pending";
  const statusDetail = payment.status_detail ?? null;
  const transactionAmount = payment.transaction_amount ?? 0;
  const currencyId = payment.currency_id ?? "";
  const dateApproved = payment.date_approved ?? null;

  if (!externalReference) {
    console.warn(`[webhook] Pago ${paymentId} sin external_reference; se ignora.`);
    return;
  }

  const supabase = getSupabaseAdmin();
  const { data: registration, error: fetchError } = await supabase
    .from("event_registrations")
    .select("*")
    .eq("external_reference", externalReference)
    .maybeSingle<RegistrationRow>();

  if (fetchError) {
    throw new Error(`Supabase: ${fetchError.message}`);
  }
  if (!registration) {
    console.warn(
      `[webhook] Pago ${paymentId} referencia ${externalReference} sin inscripción; se ignora.`,
    );
    return;
  }

  // Idempotencia: mismo pago, mismo estado → nada que hacer.
  if (
    registration.mercadopago_payment_id === String(paymentId) &&
    registration.mercadopago_status === status
  ) {
    return;
  }

  // Nunca degradar una inscripción ya aprobada (webhooks fuera de orden o
  // duplicados). Solo contracargos/devoluciones pueden tocarla.
  if (
    registration.payment_status === "approved" &&
    !["refunded", "charged_back"].includes(status)
  ) {
    console.warn(
      `[webhook] Inscripción ${registration.id} ya aprobada; se ignora estado "${status}" del pago ${paymentId}.`,
    );
    return;
  }

  // Verificación de importe y moneda contra lo registrado en el servidor.
  const amountMatches = Number(transactionAmount) === Number(registration.total_amount);
  const currencyMatches = currencyId === registration.currency;
  if (status === "approved" && (!amountMatches || !currencyMatches)) {
    console.error(
      `[webhook] ALERTA pago ${paymentId}: importe/moneda no coinciden ` +
        `(pagado ${transactionAmount} ${currencyId}, esperado ` +
        `${registration.total_amount} ${registration.currency}). NO se confirma.`,
    );
    await supabase
      .from("event_registrations")
      .update({
        mercadopago_payment_id: String(paymentId),
        mercadopago_status: status,
        mercadopago_status_detail: `amount_mismatch:${transactionAmount}:${currencyId}`,
      })
      .eq("id", registration.id);
    return;
  }

  const mpFields = {
    mercadopago_payment_id: String(paymentId),
    mercadopago_status: status,
    mercadopago_status_detail: statusDetail,
  };

  if (status === "approved") {
    const { error } = await supabase
      .from("event_registrations")
      .update({
        ...mpFields,
        status: "confirmed",
        payment_status: "approved",
        paid_at: dateApproved,
      })
      .eq("id", registration.id);
    if (error) throw new Error(`Supabase update: ${error.message}`);

    await maybeSendConfirmationEmail(registration);
    return;
  }

  if (["pending", "in_process", "authorized", "in_mediation"].includes(status)) {
    const { error } = await supabase
      .from("event_registrations")
      .update({ ...mpFields, status: "pending", payment_status: status })
      .eq("id", registration.id);
    if (error) throw new Error(`Supabase update: ${error.message}`);
    return;
  }

  // rejected, cancelled, refunded, charged_back
  const { error } = await supabase
    .from("event_registrations")
    .update({ ...mpFields, status: "payment_failed", payment_status: status })
    .eq("id", registration.id);
  if (error) throw new Error(`Supabase update: ${error.message}`);
}

/**
 * Envía el email de confirmación exactamente una vez: el UPDATE condicional
 * sobre confirmation_email_sent_at IS NULL actúa de lock — si dos webhooks
 * llegan a la vez, solo uno obtiene la fila y envía.
 */
async function maybeSendConfirmationEmail(registration: RegistrationRow): Promise<void> {
  const supabase = getSupabaseAdmin();
  const { data: claimed, error } = await supabase
    .from("event_registrations")
    .update({ confirmation_email_sent_at: new Date().toISOString() })
    .eq("id", registration.id)
    .is("confirmation_email_sent_at", null)
    .select("id")
    .maybeSingle();

  if (error) {
    console.error("[webhook] No se pudo reservar el envío de email:", error.message);
    return;
  }
  if (!claimed) return; // otro webhook ya lo envió

  const result = await sendConfirmationEmail(registration);
  if (!result.sent && result.reason !== "email_not_configured") {
    // Liberar el lock para que un próximo webhook pueda reintentar el envío.
    await supabase
      .from("event_registrations")
      .update({ confirmation_email_sent_at: null })
      .eq("id", registration.id);
  }
}
