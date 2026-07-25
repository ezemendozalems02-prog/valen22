import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { eventConfig, getTicketUnitPrice } from "@/config/event";
import {
  getPreferenceClient,
  getSiteUrl,
  isTestCredential,
} from "@/lib/mercadopago";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { registrationSchema } from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/mercadopago/create-preference
 *
 * Recibe SOLO datos del asistente y cantidad. El precio se calcula acá, a
 * partir de src/config/event.ts — cualquier importe que mande el navegador
 * se ignora porque el schema no lo admite.
 *
 * Flujo: valida → crea inscripción `pending` en Supabase → crea la
 * preferencia en Mercado Pago → guarda el preference_id → devuelve la URL
 * de Checkout Pro.
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "El cuerpo de la petición no es JSON válido." },
      { status: 400 },
    );
  }

  const parsed = registrationSchema.safeParse(body);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "form");
      if (!fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return NextResponse.json(
      { error: "Revisá los datos del formulario.", fieldErrors },
      { status: 400 },
    );
  }

  const data = parsed.data;
  const now = new Date();
  const unitPrice = getTicketUnitPrice(now);
  const totalAmount = unitPrice * data.quantity;

  const registrationId = randomUUID();
  const externalReference = `epm-${registrationId}`;

  let siteUrl: string;
  let supabase;
  try {
    siteUrl = getSiteUrl();
    supabase = getSupabaseAdmin();
  } catch (err) {
    console.error("[create-preference] Configuración incompleta:", (err as Error).message);
    return NextResponse.json(
      { error: "El sistema de pagos no está configurado. Contactanos por WhatsApp." },
      { status: 500 },
    );
  }

  // 1. Registro pendiente en Supabase, antes de tocar Mercado Pago.
  const { error: insertError } = await supabase.from("event_registrations").insert({
    id: registrationId,
    event_id: eventConfig.id,
    first_name: data.firstName,
    last_name: data.lastName,
    email: data.email,
    phone: data.phone,
    document_number: data.documentNumber ?? null,
    quantity: data.quantity,
    unit_price: unitPrice,
    total_amount: totalAmount,
    currency: eventConfig.currency,
    status: "pending",
    payment_status: "pending",
    external_reference: externalReference,
  });

  if (insertError) {
    console.error("[create-preference] Error insertando inscripción:", insertError.message);
    return NextResponse.json(
      { error: "No pudimos registrar tu inscripción. Probá de nuevo en un minuto." },
      { status: 500 },
    );
  }

  // 2. Preferencia de Checkout Pro.
  try {
    const preference = await getPreferenceClient().create({
      body: {
        items: [
          {
            id: eventConfig.id,
            title: eventConfig.ticketName,
            description: eventConfig.name,
            quantity: data.quantity,
            unit_price: unitPrice,
            currency_id: eventConfig.currency,
          },
        ],
        payer: {
          name: data.firstName,
          surname: data.lastName,
          email: data.email,
          phone: { number: data.phone },
          ...(data.documentNumber
            ? { identification: { type: "DNI", number: data.documentNumber } }
            : {}),
        },
        external_reference: externalReference,
        back_urls: {
          success: `${siteUrl}/pago/exitoso?ref=${externalReference}`,
          pending: `${siteUrl}/pago/pendiente?ref=${externalReference}`,
          failure: `${siteUrl}/pago/rechazado?ref=${externalReference}`,
        },
        auto_return: "approved",
        notification_url: `${siteUrl}/api/mercadopago/webhook`,
        statement_descriptor: eventConfig.statementDescriptor,
        metadata: {
          registration_id: registrationId,
          event_id: eventConfig.id,
        },
      },
      requestOptions: { idempotencyKey: registrationId },
    });

    if (!preference.id || !preference.init_point) {
      throw new Error("Mercado Pago no devolvió id/init_point de la preferencia.");
    }

    // 3. Guardar el preference_id en la inscripción.
    const { error: updateError } = await supabase
      .from("event_registrations")
      .update({ mercadopago_preference_id: preference.id })
      .eq("id", registrationId);
    if (updateError) {
      // No es fatal: el webhook matchea por external_reference igualmente.
      console.error(
        "[create-preference] No se pudo guardar el preference_id:",
        updateError.message,
      );
    }

    // Con credenciales de prueba MP puede exigir el sandbox_init_point.
    const checkoutUrl =
      isTestCredential() && preference.sandbox_init_point
        ? preference.sandbox_init_point
        : preference.init_point;

    return NextResponse.json({
      checkoutUrl,
      reference: externalReference,
      quantity: data.quantity,
      unitPrice,
      totalAmount,
      currency: eventConfig.currency,
    });
  } catch (err) {
    console.error("[create-preference] Error creando preferencia:", err);
    // Dejar rastro controlado del fallo (no borramos: sirve para soporte).
    await supabase
      .from("event_registrations")
      .update({ status: "error", payment_status: "error" })
      .eq("id", registrationId);
    return NextResponse.json(
      { error: "Mercado Pago no respondió. Esperá un momento y volvé a intentar." },
      { status: 502 },
    );
  }
}
