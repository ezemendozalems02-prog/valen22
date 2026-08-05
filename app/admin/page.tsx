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

  // Contador de visitas propio (ver /api/track-visit): no depende de la API
  // paga de Vercel. "Hoy" y "7 días" son ventanas de tiempo, no días de
  // calendario, para no complicarse con zonas horarias.
  const now = Date.now();
  const since24h = new Date(now - 24 * 60 * 60 * 1000).toISOString();
  const since7d = new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString();

  const [visitsTotalRes, visits24hRes, visits7dRes] = await Promise.all([
    supabase.from("page_visits").select("id", { count: "exact", head: true }),
    supabase.from("page_visits").select("id", { count: "exact", head: true }).gte("created_at", since24h),
    supabase.from("page_visits").select("id", { count: "exact", head: true }).gte("created_at", since7d),
  ]);

  const visitsTotal = visitsTotalRes.count ?? 0;
  const visits24h = visits24hRes.count ?? 0;
  const visits7d = visits7dRes.count ?? 0;
  const conversionRate = visitsTotal > 0 ? (confirmed.length / visitsTotal) * 100 : null;

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

      <div className="admin-stats admin-stats-visits">
        <div className="admin-stat">
          <b>{visits24h}</b>
          <span>Visitas últimas 24 hs</span>
        </div>
        <div className="admin-stat">
          <b>{visits7d}</b>
          <span>Visitas últimos 7 días</span>
        </div>
        <div className="admin-stat">
          <b>{visitsTotal}</b>
          <span>Visitas totales</span>
        </div>
        <div className="admin-stat">
          <b>{conversionRate !== null ? `${conversionRate.toFixed(1)}%` : "—"}</b>
          <span>Conversión (compran / visitan)</span>
        </div>
      </div>

      <RegistrationsTable rows={rows} />
    </main>
  );
}
