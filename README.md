# Estás Para Más — Landing del evento

Landing de una sola página para el evento presencial **Estás Para Más**, de Valentina Parodi.
Edición Buenos Aires, lunes 17 de agosto de 2026.

**Preview en vivo:** https://estasparamas-preview.netlify.app

> ⚠️ **Este sitio es un mockup de revisión, no está listo para publicarse.**
> Tiene placeholders visibles a propósito, esperando datos de la clienta.
> Ver la sección [Pendientes](#pendientes) antes de tocar nada.

---

## Cómo correrlo

No hay build, no hay dependencias, no hay npm. Es HTML, CSS y JavaScript vanilla
en un solo archivo.

```bash
# Abrirlo directo
open index.html

# O con un servidor local, si preferís
python3 -m http.server 8000
```

## Estructura

```
estas-para-mas-landing/
├── index.html          Todo el sitio: markup, estilos y scripts
├── netlify.toml        Configuración de deploy
├── assets/
│   └── img/            Las cuatro fotos del sitio
└── README.md
```

Las tipografías (Fraunces, DM Sans, DM Mono) se cargan desde Google Fonts por CDN.

## Deploy

El sitio está en Netlify, deployado por drag & drop. Para publicar cambios:

1. Entrar al panel del proyecto en Netlify
2. Arrastrar **la carpeta completa** al recuadro de *Production deploys*
3. La URL no cambia

No hay integración con Git configurada. Si se conecta este repositorio a Netlify,
el deploy pasa a ser automático en cada push a `main`.

---

## Pendientes

Cosas que faltan antes de que esto pueda salir a producción. Están marcadas dentro
del propio HTML con el símbolo ⚠ para que se vean en pantalla.

### Contenido que tiene que pasar Valentina

| Qué | Dónde | Estado |
|---|---|---|
| Foto del journal | Sección de captura de leads | Placeholder |
| Regalo 2 del lead magnet | Sección de captura de leads | Sin definir |
| Regalo 3 del lead magnet | Sección de captura de leads | Sin definir |
| Nombres, edades y ciudades de los testimonios | Sección Historias | Placeholder |
| Score de satisfacción y porcentajes | Sección Historias | Placeholder |
| Número de edición | Sección Historia, dato "1ª" | A confirmar |
| Link real de WhatsApp | Footer y CTAs | Va a `#` |
| Links de redes sociales | Footer | Van a `#` |

### Decisiones abiertas

**Contradicción sobre la "vida correcta".** En la sección Historia, el dato dice
"2024, año desde el que me dedico a esto" porque Valentina aclaró que nunca tuvo
una "vida correcta". Pero la cita destacada de esa misma sección dice justamente
lo contrario: *"También tuve una vida correcta: estable, aprobada por todos"*.
Una de las dos tiene que irse.

**Número de edición.** Figura como "1ª edición presencial en Buenos Aires" porque
la anterior fue en Córdoba. Falta confirmar si es correcto.

**Frase del footer.** Dice "Hay una forma de vivir que todavía no conocés", heredada
del sitio anterior. El brief cuestionaba ese enfoque por hablarle al después en vez
del ahora. Convive raro con el H1 de la página.

### Cosas técnicas

- **El formulario de leads no tiene backend.** Simula el envío y muestra un mensaje
  de éxito, pero no manda nada a ningún lado. Hay que conectarlo a Netlify Forms,
  Mailchimp o lo que use la clienta.
- **Los testimonios necesitan autorización escrita** de cada mujer antes de publicarse
  con nombre real.
- **La fecha del salto de precio está hardcodeada** en dos lugares: el texto visible
  y la constante `jump` del script al final del `index.html`. Si cambia, hay que
  tocar ambos.

---

## Datos del evento

Referencia rápida para verificar que nada quede desactualizado.

- **Fecha:** lunes 17 de agosto de 2026, feriado
- **Horario:** de 9:00 a 20:00
- **Lugar:** salón privado en Capital Federal, Buenos Aires (dirección exacta se envía al confirmar)
- **Capacidad:** 150 lugares
- **Precio:** $45.000 hasta el 10 de agosto, después $65.000
- **Pago:** cuotas con Mercado Pago; transferencia y dólares en un solo pago
- **Devoluciones:** no hay, pero la entrada es transferible a otra persona

### Los tres escalones del producto

1. **Estás Para Más** — el evento, $45.000
2. **Transformarte** — USD 300, 3 meses, 24 encuentros grupales
3. **Claridad Definitiva** — sin precio público, 6 meses, 1:1 + grupal, requiere entrevista previa
