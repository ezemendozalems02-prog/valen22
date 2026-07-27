import type { Metadata } from "next";
import { getSupabaseAdmin, type RegistrationRow } from "@/lib/supabase-admin";
import { RegistrationsTable } from "./registrations-table";

export const metadata: Metadata = {
  title: "Panel — Estás Para Más",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("event_registrations")
    .select(
      "id, first_name, last_name, email, phone, quantity, total_amount, currency, status, payment_status, external_reference, paid_at, created_at",
    )
    .order("created_at", { ascending: false })
    .returns<
      Pick<
        RegistrationRow,
        | "id"
        | "first_name"
        | "last_name"
        | "email"
        | "phone"
        | "quantity"
        | "total_amount"
        | "currency"
        | "status"
        | "payment_status"
        | "external_reference"
        | "paid_at"
        | "created_at"
      >[]
    >();

  if (error) {
    console.error("[admin] Error consultando inscripciones:", error.message);
  }

  const rows = data ?? [];
  const confirmed = rows.filter((r) => r.status === "confirmed");
  const pending = rows.filter((r) => r.status === "pending");
  const failed = rows.filter((r) => r.status === "payment_failed" || r.status === "error");
  const revenue = confirmed.reduce((sum, r) => sum + Number(r.total_amount), 0);

  return (
    <main className="admin-page">
      <div className="admin-header">
        <span className="pago-logo">ESTÁS PARA MÁS · Panel</span>
        <form method="POST" action="/api/admin/logout">
          <button type="submit" className="admin-logout">
            Cerrar sesión
          </button>
        </form>
      </div>

      <div className="admin-stats">
        <div className="admin-stat">
          <b>{confirmed.length}</b>
          <span>Entradas confirmadas</span>
        </div>
        <div className="admin-stat">
          <b>{revenue.toLocaleString("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 })}</b>
          <span>Recaudado</span>
        </div>
        <div className="admin-stat">
          <b>{pending.length}</b>
          <span>Pagos pendientes</span>
        </div>
        <div className="admin-stat">
          <b>{failed.length}</b>
          <span>Fallidos / con error</span>
        </div>
      </div>

      <RegistrationsTable rows={rows} />
    </main>
  );
}
