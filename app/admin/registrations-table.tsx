"use client";

import { useMemo, useState } from "react";

type Row = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  quantity: number;
  total_amount: number;
  currency: string;
  status: string;
  payment_status: string;
  external_reference: string;
  paid_at: string | null;
  created_at: string;
};

const STATUS_LABEL: Record<string, string> = {
  confirmed: "Confirmado",
  pending: "Pendiente",
  payment_failed: "Rechazado",
  error: "Error",
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function RegistrationsTable({ rows }: { rows: Row[] }) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (status !== "all" && r.status !== status) return false;
      if (!q) return true;
      const haystack = `${r.first_name} ${r.last_name} ${r.email} ${r.phone} ${r.external_reference}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [rows, search, status]);

  return (
    <>
      <div className="admin-toolbar">
        <input
          type="search"
          placeholder="Buscar por nombre, email, WhatsApp o código..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Buscar inscripciones"
        />
        <select value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Filtrar por estado">
          <option value="all">Todos los estados</option>
          <option value="confirmed">Confirmado</option>
          <option value="pending">Pendiente</option>
          <option value="payment_failed">Rechazado</option>
          <option value="error">Error</option>
        </select>
      </div>

      <div className="admin-table-wrap">
        {filtered.length === 0 ? (
          <div className="admin-empty">
            {rows.length === 0 ? "Todavía no hay inscripciones." : "Nada coincide con ese filtro."}
          </div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Email</th>
                <th>WhatsApp</th>
                <th>Cant.</th>
                <th>Total</th>
                <th>Estado</th>
                <th>Código</th>
                <th>Fecha</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id}>
                  <td>
                    {r.first_name} {r.last_name}
                  </td>
                  <td>{r.email}</td>
                  <td>{r.phone}</td>
                  <td>{r.quantity}</td>
                  <td>
                    {Number(r.total_amount).toLocaleString("es-AR", {
                      style: "currency",
                      currency: r.currency,
                      maximumFractionDigits: 0,
                    })}
                  </td>
                  <td>
                    <span className={`admin-badge ${r.status}`}>
                      {STATUS_LABEL[r.status] ?? r.status}
                    </span>
                  </td>
                  <td>{r.external_reference}</td>
                  <td>{formatDate(r.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
