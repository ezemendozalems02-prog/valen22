/**
 * Fuente única de verdad del evento.
 *
 * El precio NUNCA viaja desde el frontend: toda ruta de servidor que necesite
 * calcular importes debe usar `getTicketUnitPrice()`. La landing muestra el
 * precio consultando GET /api/event, que también sale de acá.
 */

export const eventConfig = {
  id: "estas-para-mas-bsas-2026",
  name: "Estás Para Más — Edición Buenos Aires 2026",
  ticketName: "Entrada general",
  /** Precio vigente hasta `earlyPriceDeadline` (inclusive). */
  earlyPrice: 45000,
  /** Precio después del salto del 10 de agosto. */
  ticketPrice: 65000,
  /** Último instante en que rige `earlyPrice`, hora de Argentina (UTC-3). */
  earlyPriceDeadline: "2026-08-10T23:59:59-03:00",
  currency: "ARS",
  maxTicketsPerPurchase: 5,
  eventDate: "2026-08-17",
  eventTime: "09:00",
  location:
    "Salón privado en Capital Federal, Buenos Aires (la dirección exacta se envía al confirmar)",
  /** Aparece en el resumen de la tarjeta del comprador (máx. 22 caracteres). */
  statementDescriptor: "ESTASPARAMAS",
  contactEmail: "hola@estasparamas.com",
} as const;

/** Precio unitario vigente, calculado siempre en el servidor. */
export function getTicketUnitPrice(now: Date = new Date()): number {
  const deadline = new Date(eventConfig.earlyPriceDeadline);
  return now.getTime() <= deadline.getTime()
    ? eventConfig.earlyPrice
    : eventConfig.ticketPrice;
}

/** Total para una cantidad dada, calculado siempre en el servidor. */
export function getOrderTotal(quantity: number, now: Date = new Date()): number {
  return getTicketUnitPrice(now) * quantity;
}
