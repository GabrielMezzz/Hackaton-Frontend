/* =====================================================================
   INVENTARIO · Angibell creaciones
   ---------------------------------------------------------------------
   Archivo EDITABLE: cambia las cantidades y recarga la pagina.

   La clave de cada prenda es el ARCHIVO de su foto (ej. 'FL-63E73D38'),
   no el nombre, para que los acentos del catálogo no rompan la busqueda.

   Formato de cada prenda:
     sku        codigo unico
     tipo      Vestido | Terno | Blazer | Pantalon | Conjunto | Calzado | Accesorio
     publico    ninas | ninos | bebes
     sizes      { talla: unidades disponibles }
                 usa 0 para marcar una talla como agotada
     variantes  colores disponibles de esa prenda
   ===================================================================== */

window.INVENTARIO = {

  currency: 'PEN',
  updatedAt: '2026-10-17',
  note: 'Cantidades de ejemplo. Reemplazar con las reales antes de publicar.',

  items: {

    /* ---------------- Ternos ---------------- */
    'FL-63E73D38': {
      sku: 'TER-001', tipo: 'Terno', publico: 'ninos',
      variantes: ['Verde oliva'],
      sizes: { '0': 3, '2': 4, '4': 5, '6': 4, '8': 2, '10': 3, '12': 1, '14': 0 }
    },
    'FL-95675A2E': {
      sku: 'TER-002', tipo: 'Terno', publico: 'ninos',
      variantes: ['Beige'],
      sizes: { '0': 2, '2': 3, '4': 3, '6': 5, '8': 4, '10': 2, '12': 2, '14': 1 }
    },
    'FL-D5D758B5': {
      sku: 'BLA-001', tipo: 'Blazer', publico: 'ninos',
      variantes: ['Azul noche'],
      sizes: { '2': 2, '4': 4, '6': 4, '8': 3, '10': 2, '12': 0, '14': 2 }
    },

    /* ---------------- Ropa de niños ---------------- */
    'FL-7A5767B6': {
      sku: 'CON-001', tipo: 'Conjunto', publico: 'ninos',
      variantes: ['Jean azul'],
      sizes: { '6': 3, '8': 3, '10': 2, '12': 2, '14': 1 }
    },
    'FL-87A6368E': {
      sku: 'PAN-001', tipo: 'Pantalon', publico: 'ninos',
      variantes: ['Jean'],
      sizes: { '6': 4, '8': 5, '10': 4, '12': 3, '14': 2 }
    },
    'FL-87A63626': {
      sku: 'TIR-001', tipo: 'Accesorio', publico: 'ninos',
      variantes: ['Azul', 'Negro', 'Gris'],
      sizes: { '2': 5, '4': 6, '6': 4, '8': 3 }
    },
    'FL-63E7A7ED': {
      sku: 'CAL-001', tipo: 'Calzado', publico: 'ninos',
      variantes: ['Charol negro'],
      sizes: { '8': 2, '10': 3, '12': 2, '14': 1 }
    },
    'FL-63E7A7A9': {
      sku: 'PAN-002', tipo: 'Pantalon', publico: 'ninos',
      variantes: ['Blanco'],
      sizes: { '6': 3, '8': 3, '10': 4, '12': 3, '14': 0 }
    },

    /* ---------------- Vestidos de niña ---------------- */
    'FL-87858D22': {
      sku: 'VES-001', tipo: 'Vestido', publico: 'ninas',
      variantes: ['Blanco'],
      sizes: { '2': 2, '4': 2, '6': 3, '8': 2, '10': 1, '12': 0, '14': 1 }
    },
    'FL-7A57A352': {
      sku: 'VES-002', tipo: 'Vestido', publico: 'ninas',
      variantes: ['Rojo floreado'],
      sizes: { '2': 3, '4': 4, '6': 4, '8': 3, '10': 2, '12': 2, '14': 1 }
    },
    'FL-9567552E': {
      sku: 'VES-003', tipo: 'Vestido', publico: 'ninas',
      variantes: ['Gasa de seda'],
      sizes: { '2': 1, '4': 2, '6': 2, '8': 2, '10': 1, '12': 1, '14': 0 }
    },
    'FL-B8D98B59': {
      sku: 'VES-004', tipo: 'Vestido', publico: 'ninas',
      variantes: ['Azul floreado'],
      sizes: { '2': 2, '4': 3, '6': 3, '8': 2, '10': 2, '12': 1, '14': 1 }
    },

    /* ---------------- Conjuntos y calzado de niña ---------------- */
    'FL-956759D3': {
      sku: 'CON-002', tipo: 'Conjunto', publico: 'ninas',
      variantes: ['Cargo + polo'],
      sizes: { '6': 2, '8': 3, '10': 3, '12': 2, '14': 1 }
    },
    'FL-579576AE': {
      sku: 'CON-003', tipo: 'Conjunto', publico: 'ninas',
      variantes: ['Cargo verde + polo negro'],
      sizes: { '6': 2, '8': 2, '10': 3, '12': 2, '14': 1 }
    },
    'FL-7A57A382': {
      sku: 'CAL-002', tipo: 'Calzado', publico: 'ninas',
      variantes: ['Gamuza'],
      sizes: { '8': 2, '10': 2, '12': 1 }
    },

    /* ---------------- Accesorios ---------------- */
    'FL-B8D98A58': {
      sku: 'ACC-001', tipo: 'Accesorio', publico: 'ninas',
      variantes: ['Blanco', 'Negro', 'Rosa', 'Celeste'],
      sizes: { 'S': 6, 'M': 5 }
    },
    'FL-D5D75B98': {
      sku: 'ACC-002', tipo: 'Accesorio', publico: 'ninas',
      variantes: ['Blanco', 'Rosa', 'Celeste'],
      sizes: { 'S': 4, 'M': 4 }
    },
    'FL-D5D75A8B': {
      sku: 'ACC-003', tipo: 'Accesorio', publico: 'ninas',
      variantes: ['Blanco'],
      sizes: { 'Unica': 8 }
    }

  }
};
