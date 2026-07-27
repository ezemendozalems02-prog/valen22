import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Ingresar — Panel Estás Para Más",
  robots: { index: false, follow: false },
};

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <main className="pago-page">
      <span className="pago-logo">ESTÁS PARA MÁS</span>
      <section className="pago-card" style={{ maxWidth: 400 }}>
        <p className="pago-eyebrow">Panel privado</p>
        <h1 style={{ fontSize: "1.6rem" }}>Ingresar</h1>

        {error === "config" && (
          <p role="alert" style={{ color: "#B0473E", fontSize: ".85rem", marginBottom: 14 }}>
            El panel no está configurado del lado del servidor. Avisale a quien mantiene el sitio.
          </p>
        )}
        {error === "1" && (
          <p role="alert" style={{ color: "#B0473E", fontSize: ".85rem", marginBottom: 14 }}>
            Usuario o contraseña incorrectos.
          </p>
        )}

        <form method="POST" action="/api/admin/login" style={{ textAlign: "left" }}>
          <div className="field">
            <label htmlFor="username">Usuario</label>
            <input id="username" name="username" type="text" autoComplete="username" required autoFocus />
          </div>
          <div className="field">
            <label htmlFor="password">Contraseña</label>
            <input id="password" name="password" type="password" autoComplete="current-password" required />
          </div>
          <button type="submit" className="btn btn-primary btn-block" style={{ marginTop: 10 }}>
            Ingresar
          </button>
        </form>
      </section>
    </main>
  );
}
