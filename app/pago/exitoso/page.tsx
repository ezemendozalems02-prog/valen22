import type { Metadata } from "next";
import { VerificacionPago } from "./verificacion";

export const metadata: Metadata = {
  title: "Verificando tu pago — Estás Para Más",
};

/**
 * Llegar a esta URL NO confirma nada: la página consulta el estado real en
 * /api/registrations/status (que lee Supabase, actualizado solo por el
 * webhook) y recién ahí muestra la confirmación.
 */
export default async function PagoExitosoPage({
  searchParams,
}: {
  searchParams: Promise<{ ref?: string; external_reference?: string }>;
}) {
  const params = await searchParams;
  // Mercado Pago también reenvía external_reference en la back_url.
  const reference = params.ref ?? params.external_reference ?? null;

  return (
    <main className="pago-page">
      <span className="pago-logo">ESTÁS PARA MÁS</span>
      <VerificacionPago reference={reference} />
    </main>
  );
}
