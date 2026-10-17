# Probador IA · componente reutilizable de Angular

**No es una página.** Es el bloque del probador con IA que se incrusta dentro del
detalle de producto de la página única `../Angibell creaciones.html`.

## Archivos

- `probador-ia.component.ts` / `.html` / `.css` — el componente.

## Uso

```html
<app-probador-ia
  [prenda]="prendaSeleccionada"
  [imgBase]="'assets/prendas/'"
  [endpoint]="''">   <!-- URL de tu backend; vacío = vista previa simulada -->
</app-probador-ia>
```

```ts
readonly prendaSeleccionada: PrendaProbador = {
  name: 'Terno para niños color verde olivo',
  price: 'S/ 250.00',
  img: 'FL-63E73D38',
  eyebrow: 'Novedades',   // opcional
};
```

El componente expone:

| Miembro | Descripción |
|---|---|
| `consent` | `true` cuando el usuario marcó el aviso (al desmarcarlo se borra la foto) |
| `photo` / `fileName` | Foto cargada (data URL) y su nombre |
| `result` | Imagen "después" (del backend o simulada) |
| `generating` | `true` durante la generación |
| `showResult` | `true` cuando ya se puede ver el antes/después |
| `demo` | `true` si el resultado es la simulación local |
| `sliderPos` | Posición del deslizador (0-100, empieza en 50) |
| `reset()` | Limpia el estado al cambiar de prenda |

Flujo: marcar el consentimiento → subir la foto (clic o arrastrar) → aparece
directamente el recuadro antes/después con el deslizador al medio. El deslizador
se mueve con mouse, dedo o flechas del teclado.

## Módulos que necesita

- **`CommonModule`** — para `*ngIf`.
- El botón del CTA usa clases propias (`.pw-btn`, `.pw-btn--primary`), no `RouterLink`.

## Imágenes

`imgBase` (por defecto `assets/prendas/`) apunta a la carpeta donde copias los
archivos de `Angibell creaciones_files/`. Los nombres son los que aparecen en
`prenda.img` (p. ej. `FL-63E73D38`).

## Lo que aun no esta en Angular

El componente cubre **solo la herramienta de IA**. La pagina HTML (`../Angibell creaciones.html`)
ademas tiene en su JavaScript: rutas `#/inicio`, `#/prenda/N`, `#/categoria/(todo|ninas|ninos|personalizados)`,
`#/buscar/<texto>`, `#/carrito`, `#/checkout` y `#/reclamaciones`; selector de talla con stock, carrito con
promo "compra 2 y lleva 3" (`PROMO_3X2`), checkout con datos de entrega y pago, envio del pedido por
WhatsApp, libro de reclamaciones y generacion del JSON del pedido (`window.__angibellPedidos`).

Si lo portas a Angular, serian tres piezas mas:

| Pieza | Responsabilidad |
|---|---|
| Vista de producto | precio, tallas con unidades, cantidad, agregar al carrito |
| Vista de carrito + checkout | items, cantidades, promo 3x2, datos del cliente, total |
| Servicio de pedido | arma el JSON (`buildOrder`) y lo envia a `CONFIG_PEDIDOS.endpoint` |

El servicio de carrito puede apoyarse en `localStorage` con la misma clave
(`angibell_carrito_v1`) para no perder el contenido entre recargas.

## Sobre Gemini

Sin `endpoint` el "después" es una **vista previa simulada** en el navegador (la
prenda superpuesta sobre el torso). Para el resultado real necesitas una API key
de Google AI Studio y un backend: desde el navegador la llamada a Gemini está
bloqueada por CORS y la key quedaría expuesta.

El componente (y la página HTML) envían un `POST multipart/form-data` con:

| Campo | Contenido |
|---|---|
| `foto` | archivo de la foto del cliente |
| `prenda` | URL absoluta de la foto de la prenda |
| `sku` | código de la prenda |

y esperan como respuesta **la imagen generada** (PNG/JPG). Si el backend falla,
se muestra la simulación para no dejar al usuario sin resultado.

En la página HTML se activa definiendo, antes del script principal:

```html
<script>window.CONFIG_PROBADOR = { endpoint: 'https://TU-BACKEND/probar' };</script>
```
