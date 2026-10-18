/* =====================================================================
   Motor de prompts del probador con IA (FLUX.2 en Cloudflare Workers AI
   o Pollinations: edicion con dos imagenes de referencia)
   ---------------------------------------------------------------------
   Cada imagen tiene un papel distinto y explicito:
     image 1 = el cliente. De aqui sale la PERSONA: identidad, cara,
               complexion (estatura y proporciones), edad aparente y
               cabello, ademas del fondo.
     image 2 = la REFERENCIA de la prenda. De aqui salen la PRENDA (color
               exacto, material, textura, corte y detalles) y la POSE
               del modelo (postura, posicion de brazos y piernas, encuadre).
               Nunca su cara.
   El prompt describe SOLO en positivo la foto final ("el nino de la imagen 1
   lleva puesta la prenda de la imagen 2"). No menciona quitar, cambiar ni
   reemplazar ropa: con fotos de ninos ese lenguaje activa los filtros de
   seguridad (error 3030) o el modelo lo malinterpreta.
   Para el color se da el codigo hex de la base (los modelos FLUX.2 entienden
   colores hex) y para la tela el material guardado en products.material.
   Segun el tipo de prenda se describe que lleva puesto de la imagen 2 y que
   del resto del atuendo sigue siendo el de la imagen 1.
   ===================================================================== */

'use strict';

/* zona de la prenda: que lleva puesto de la imagen 2 y que de la imagen 1 */
const ZONAS = {
  completo: {
    wear: 'is wearing the complete outfit shown in image 2 (jacket, vest, shirt, trousers and the same neckwear as in image 2, exactly as shown)',
    rest: 'Footwear as shown in image 2 if visible there, otherwise the shoes from image 1.'
  },
  superior: {
    wear: 'is wearing the upper-body garment shown in image 2, over a shirt as in image 2',
    rest: 'Trousers or skirt and shoes as in image 1.'
  },
  inferior: {
    wear: 'is wearing the trousers shown in image 2',
    rest: 'Top and shoes as in image 1.'
  },
  vestido: {
    wear: 'is wearing the dress shown in image 2',
    rest: 'Shoes and accessories as in image 1 where visible.'
  },
  calzado: {
    wear: 'is wearing the shoes shown in image 2',
    rest: 'The rest of the outfit is exactly as in image 1.'
  },
  piernas: {
    wear: 'is wearing the socks or tights shown in image 2',
    rest: 'The rest of the outfit is exactly as in image 1.'
  },
  cabeza: {
    wear: 'is wearing the headband or hair accessory shown in image 2 in their hair',
    rest: 'Hairstyle and outfit as in image 1.'
  },
  tirantes: {
    wear: 'is wearing the suspenders shown in image 2 over their shirt, clipped to the trousers',
    rest: 'The rest of the outfit is as in image 1.'
  }
};

/* tipo de prenda (y nombre, para accesorios) -> zona */
function zonaDe(tipo, nombre) {
  const t = String(tipo || '').toLowerCase();
  const n = String(nombre || '').toLowerCase();
  if (/tirante/.test(n)) return 'tirantes';
  if (/vincha|diadema|lazo|moño/.test(n)) return 'cabeza';
  if (/panty|media|calcet|tights/.test(n)) return 'piernas';
  if (/zapato|calzado|zapatilla/.test(n) || t === 'calzado') return 'calzado';
  if (t === 'vestido') return 'vestido';
  if (t === 'pantalon' || t === 'pantalón') return 'inferior';
  if (t === 'blazer') return 'superior';
  return 'completo';   // terno, conjunto y lo que no se reconozca
}

/* los colores de la tienda estan en espanol; el modelo entiende mejor el ingles */
const COLORES = {
  'azul': 'blue', 'azul marino': 'navy blue', 'negro': 'black', 'gris': 'gray', 'blanco': 'white',
  'plateado': 'silver gray', 'jean claro': 'light blue denim', 'jean azul': 'blue denim',
  'jean oscuro': 'dark blue denim', 'jean y blanco': 'blue denim with white', 'marrón': 'brown',
  'marron': 'brown', 'caqui': 'khaki', 'beige': 'beige', 'rosa': 'pink', 'rojo': 'red',
  'fucsia': 'fuchsia pink', 'celeste': 'light sky blue', 'champagne': 'champagne', 'amarillo': 'yellow',
  'verde': 'green', 'mostaza': 'mustard yellow'
};
function colorEn(c) {
  const k = String(c || '').trim().toLowerCase();
  return COLORES[k] || c;
}
const HEX = /^#[0-9a-f]{6}$/i;

/* b = { prenda, color, hex, tipo, material } (de la base de datos) */
function buildPrompt(b) {
  const zona = ZONAS[zonaDe(b.tipo, b.prenda)];
  const color = b.color ? colorEn(b.color) : '';
  const hex = HEX.test(b.hex || '') ? b.hex.toLowerCase() : '';
  const colorTxt = color
    ? `The garment color is exactly ${color}${hex ? ` (hex ${hex})` : ''}, with the same hue, saturation and brightness as in image 2.`
    : 'The garment color is exactly as in image 2, with the same hue, saturation and brightness.';
  const materialTxt = b.material
    ? `Material and texture: ${b.material}. Reproduce this fabric faithfully — its weave or knit, sheen or matte finish, thickness, drape and stiffness.`
    : 'Reproduce the fabric faithfully as in image 2 — its weave or knit, sheen or matte finish, thickness, drape and stiffness.';

  return [
    'Wholesome, family-friendly photo for a children\'s fashion catalog, made from two reference images.',
    // persona (imagen 1)
    'The child is the exact same child as in image 1 — same face, facial features, identity, skin tone, expression, hair and age appearance,',
    'with the same height and proportions; the child does not look older, younger, thinner or bigger.',
    'Only the clothing and the pose come from image 2; the face, skin tone and hair of the child come only from image 1.',
    'Background and lighting as in image 1.',
    // pose (imagen 2)
    'The child stands in the same pose as the model in image 2 — same posture, head angle,',
    'arm and hand positions, leg and foot positions and framing.',
    // prenda (imagen 2), descrita en positivo
    `The child ${zona.wear}: "${b.prenda}".`,
    'The garment looks exactly as presented in image 2: same design, cut, length, silhouette, pattern or print, buttons, collar, pockets, trims and stitching.',
    colorTxt,
    materialTxt,
    'The garment fits naturally, with realistic folds, seams and shadows consistent with the lighting.',
    zona.rest,
    // lo que no se toma
    'The person in the photo is the child from image 1, recognizable by their own face, skin tone and hair; the model of image 2 does not appear. No text, logos, watermarks or extra people.'
  ].join(' ');
}

module.exports = { buildPrompt, zonaDe, ZONAS };
