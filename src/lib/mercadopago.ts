import "server-only";
import { MercadoPagoConfig, Preference, Payment } from "mercadopago";

const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;

function getClient(): MercadoPagoConfig {
  if (!accessToken) {
    throw new Error(
      "Falta la variable de entorno MERCADO_PAGO_ACCESS_TOKEN. " +
        "Cargala en .env.local (ver MERCADOPAGO_SETUP.md).",
    );
  }
  return new MercadoPagoConfig({ accessToken });
}

/** true cuando se está usando una credencial de prueba (TEST-...). */
export function isTestCredential(): boolean {
  return Boolean(accessToken?.startsWith("TEST-"));
}

export function getPreferenceClient(): Preference {
  return new Preference(getClient());
}

export function getPaymentClient(): Payment {
  return new Payment(getClient());
}

/** URL base pública del sitio, sin barra final ni espacios accidentales. */
export function getSiteUrl(): string {
  const url = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!url) {
    throw new Error("Falta la variable de entorno NEXT_PUBLIC_SITE_URL.");
  }
  return url.replace(/\/+$/, "");
}
