# Guía de configuración y prueba — Mercado Pago Checkout Pro

Venta de entradas del evento **Estás Para Más** con Next.js + Supabase + Mercado Pago.

Flujo completo:

```
Formulario (landing) → POST /api/mercadopago/create-preference
  → inscripción "pending" en Supabase → preferencia en Mercado Pago
  → redirección a Checkout Pro → pago
  → Mercado Pago llama a POST /api/mercadopago/webhook
  → el webhook consulta el pago real, verifica monto/moneda y confirma
  → /pago/exitoso consulta /api/registrations/status y muestra el estado real
```

La entrada **solo** se confirma cuando el webhook verifica el pago contra la API
de Mercado Pago. Visitar `/pago/exitoso` a mano no confirma nada.

---

## 1. Crear la aplicación en Mercado Pago

1. Entrar a [Mercado Pago Developers](https://www.mercadopago.com.ar/developers/panel/app) con la cuenta que va a **cobrar**.
2. **Crear aplicación** → nombre `Estás Para Más`, producto **CheckoutPro**, modelo *Pagos online*.
3. Queda creada con dos juegos de credenciales: **Prueba** y **Producción**.

## 2. Obtener credenciales de prueba

En el panel de la app → **Credenciales de prueba**:

- `Access Token` (empieza con `TEST-`) → `MERCADO_PAGO_ACCESS_TOKEN`
- `Public Key` (empieza con `TEST-`) → `NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY`

> También conviene crear **cuentas de prueba** (panel → Cuentas de prueba): una
> "vendedor" y una "comprador". Con credenciales de prueba, el pago del checkout
> se hace logueado con la cuenta comprador de prueba.

## 3. Variables locales

```bash
cp .env.example .env.local
```

Completar en `.env.local`:

| Variable | Dónde sale |
|---|---|
| `MERCADO_PAGO_ACCESS_TOKEN` | Credenciales de prueba de MP |
| `NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY` | Credenciales de prueba de MP |
| `MERCADO_PAGO_WEBHOOK_SECRET` | Panel de la app → Webhooks (paso 6) |
| `NEXT_PUBLIC_SITE_URL` | `http://localhost:3000` (o la URL del túnel, paso 5) |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Project Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Project Settings → API (**secreta**) |

Nunca commitear `.env.local` (ya está en `.gitignore`).

## 4. Ejecutar la migración de Supabase

Opción A — CLI de Supabase:

```bash
supabase link --project-ref <ref-del-proyecto>
supabase db push
```

Opción B — a mano: abrir el **SQL Editor** del dashboard de Supabase y pegar el
contenido de [supabase/migrations/20260725120000_create_event_registrations.sql](supabase/migrations/20260725120000_create_event_registrations.sql).

La tabla queda con **RLS activado y sin policies**: solo el servidor (Service
Role Key) puede leerla o escribirla.

## 5. URL pública para el webhook (local)

Mercado Pago **no puede llamar a `localhost`**. Para probar webhooks en local
hace falta un túnel HTTPS:

```bash
# cualquiera de estos
ngrok http 3000
cloudflared tunnel --url http://localhost:3000
```

Copiar la URL pública (ej. `https://abc123.ngrok-free.app`) y ponerla en
`NEXT_PUBLIC_SITE_URL` de `.env.local`. Reiniciar `npm run dev` después de
cambiarla (la notification_url de cada preferencia se construye con esa
variable).

Alternativa sin túnel: usar un **deployment preview de Vercel** con las
variables de prueba cargadas y probar directo ahí.

## 6. Registrar el webhook y la clave secreta

1. Panel de la app en MP → **Webhooks** → *Configurar notificaciones*.
2. Modo **Pruebas** (y luego, aparte, modo **Producción** con la URL real).
3. URL: `https://<tu-url-publica>/api/mercadopago/webhook`
4. Evento: **Pagos** (`payment`).
5. Copiar la **clave secreta** que muestra el panel → `MERCADO_PAGO_WEBHOOK_SECRET`.

La validación de firma (`x-signature`, HMAC-SHA256 según la documentación
oficial) está implementada en el webhook. Si la variable no está configurada,
el webhook procesa igual pero loguea una advertencia — en **producción
configurala siempre**.

> Además del webhook configurado en el panel, cada preferencia lleva su propia
> `notification_url`, así que las notificaciones llegan aunque el panel no esté
> configurado. La clave secreta del panel sirve para ambas.

## 7. Usuarios y tarjetas de prueba

Con credenciales `TEST-`, abrir el checkout logueado con la **cuenta comprador
de prueba** y usar las [tarjetas de prueba oficiales](https://www.mercadopago.com.ar/developers/es/docs/checkout-pro/additional-content/your-integrations/test/cards):

| Tarjeta | Número | Resultado según nombre del titular |
|---|---|---|
| Mastercard | 5031 7557 3453 0604 | `APRO` aprueba · `OTHE` rechaza · `CONT` pendiente |
| Visa | 4509 9535 6623 3704 | ídem |

CVV `123`, vencimiento cualquier fecha futura, DNI `12345678`. El **nombre del
titular** decide el resultado (`APRO`, `OTHE`, `CONT`, `FUND`, `SECU`, etc.).

## 8. Qué probar

```bash
npm run dev
```

1. **Pago aprobado**: comprar con titular `APRO` → redirige a `/pago/exitoso` →
   la página muestra "verificando" y pasa a confirmado cuando llega el webhook.
   En Supabase: `status=confirmed`, `payment_status=approved`, `paid_at` seteado.
2. **Pago pendiente**: titular `CONT` (o pago en efectivo) → `/pago/pendiente`;
   la inscripción queda `pending`.
3. **Pago rechazado**: titular `OTHE` → `/pago/rechazado`; la inscripción queda
   `payment_failed`. Reintentar desde el botón crea una inscripción nueva.
4. **Webhook duplicado**: reenviar la misma notificación (panel de MP →
   Webhooks → historial → reenviar, o `curl` repetido). El registro no cambia,
   no se duplica nada y el email no se envía dos veces.
5. **Monto incorrecto**: simulable editando `total_amount` de una inscripción
   pendiente en Supabase antes de pagar → el webhook loguea `ALERTA` con
   `amount_mismatch` y NO confirma.
6. **Formulario inválido**: mandar email sin `@`, DNI con letras, etc. → errores
   debajo de cada campo; el servidor repite la validación (probar con `curl`
   directo a la API para verificar el lado servidor).
7. **Doble clic**: el botón se deshabilita al primer clic; no se crean dos
   preferencias.
8. **Visita manual a `/pago/exitoso`**: sin `ref` válida muestra error; con una
   `ref` pendiente muestra "procesando", nunca confirma por sí sola.

Webhook de prueba manual (nota: con `MERCADO_PAGO_WEBHOOK_SECRET` configurado
va a responder 401 por firma inválida — eso también es una prueba):

```bash
curl -X POST "http://localhost:3000/api/mercadopago/webhook?type=payment&data.id=<payment_id>" \
  -H "Content-Type: application/json" -d "{}"
```

## 9. Pasar a producción

1. En el panel de MP, completar los datos de la app y copiar las **credenciales
   de producción** (`APP_USR-...`).
2. Configurar el webhook en modo **Producción** con la URL real del dominio y
   copiar su clave secreta.
3. No hace falta tocar código: el servidor detecta credenciales de prueba por el
   prefijo `TEST-` (para elegir `sandbox_init_point`); con `APP_USR-` usa el
   checkout real.

## 10. Variables en Vercel

Project → Settings → Environment Variables (entorno **Production**):

```
MERCADO_PAGO_ACCESS_TOKEN          ← producción (APP_USR-...)
NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY← producción
MERCADO_PAGO_WEBHOOK_SECRET        ← clave del webhook de producción
NEXT_PUBLIC_SITE_URL               ← https://tudominio.com (sin barra final)
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
RESEND_API_KEY                     ← opcional (email de confirmación)
CONFIRMATION_EMAIL_FROM            ← opcional
```

En **Preview** cargar las credenciales de prueba para poder testear end-to-end
con URL pública.

## 11. Logs sin exponer credenciales

- Vercel → Deployment → **Functions/Logs**: ahí aparecen los `console.error`
  del servidor (`[create-preference]`, `[webhook]`, `[status]`, `[email]`).
- El código **nunca** loguea el Access Token, la Service Role Key ni datos de
  tarjeta; solo IDs de pago, referencias y mensajes de error.
- Si un log muestra `ALERTA ... amount_mismatch`, revisar esa inscripción a
  mano antes de dar la entrada por válida.

## Email de confirmación (opcional)

El webhook envía un correo la primera vez que un pago queda aprobado, **solo si**
`RESEND_API_KEY` y `CONFIRMATION_EMAIL_FROM` están configuradas (usa la API REST
de Resend, sin dependencias extra). El campo `confirmation_email_sent_at`
garantiza que no se envíe dos veces. Sin esas variables, el flujo de pago
funciona igual y queda una advertencia en los logs.

## Configuración del evento

Precio, fechas, cupo por compra y textos salen de un solo lugar:
[src/config/event.ts](src/config/event.ts). El salto de precio del 10/08
($45.000 → $65.000) está ahí (`earlyPriceDeadline`) y se calcula siempre en el
servidor.
