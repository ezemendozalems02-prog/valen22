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
  /** Precio de 1 entrada. */
  ticketPrice: 65000,
  /** Precio del pack de 2 entradas juntas (no es el doble de ticketPrice). */
  twoPackPrice: 95000,
  currency: "ARS",
  /**
   * Tope de 2 por compra: es hasta donde está definido el precio en pack.
   * Para más lugares, se hace una segunda compra aparte. Si en algún
   * momento se define un precio para 3+, hay que extender getOrderTotal()
   * además de subir este número.
   */
  maxTicketsPerPurchase: 2,
  eventDate: "2026-08-17",
  eventTime: "09:00",
  location:
    "Salón privado en Capital Federal, Buenos Aires (la dirección exacta se envía al confirmar)",
  /** Aparece en el resumen de la tarjeta del comprador (máx. 22 caracteres). */
  statementDescriptor: "ESTASPARAMAS",
  contactEmail: "hola@estasparamas.com",
} as const;

/** Precio "de lista" por entrada (para mostrar "$65.000 c/u"). */
export function getTicketUnitPrice(): number {
  return eventConfig.ticketPrice;
}

/** Total real a cobrar para una cantidad dada, calculado siempre en el servidor. */
export function getOrderTotal(quantity: number): number {
  return quantity === 2 ? eventConfig.twoPackPrice : eventConfig.ticketPrice * quantity;
}

/**
 * Precio "por unidad" para guardar en la fila y para el ítem de Mercado
 * Pago (unit_price × quantity tiene que dar el total exacto). Con el pack
 * de 2 esto da 47.500, no 65.000 — es intencional.
 */
export function getUnitPriceForOrder(quantity: number): number {
  return getOrderTotal(quantity) / quantity;
}
