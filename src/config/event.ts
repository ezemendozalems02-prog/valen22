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
  /** Precio fijo por entrada, sin fecha límite ni descuento por cantidad. */
  ticketPrice: 45000,
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

/** Precio por entrada, calculado siempre en el servidor. */
export function getTicketUnitPrice(): number {
  return eventConfig.ticketPrice;
}

/** Total para una cantidad dada, calculado siempre en el servidor. */
export function getOrderTotal(quantity: number): number {
  return eventConfig.ticketPrice * quantity;
}

/** Precio "por unidad" para guardar en la fila y para el ítem de Mercado Pago. */
export function getUnitPriceForOrder(quantity: number): number {
  return eventConfig.ticketPrice;
}
