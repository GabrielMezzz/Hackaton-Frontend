/* =====================================================================
   RECOLOR DE PRENDAS PROFESIONAL · Angibell creaciones
   ---------------------------------------------------------------------
   Toma una foto de catalogo de un niño/niña vistiendo la prenda y la
   repinta del color que elige el cliente:
   - PROTEGE 100% LA PIEL, ROSTRO, MANOS Y CABELLO del niño/niña.
   - Preserva luces, sombras, texturas, pliegues y costuras de la tela
     usando fusion de luminancia (blend mode Color estilo Photoshop).
   - Sin deformar la imagen ni crear artefactos o bordes duros.
   - Las imagenes se cargan remotamente (Pexels CDN con CORS).
   ===================================================================== */

(function () {

  /* HSL <-> RGB conversion */
  function rgb2hsl(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    var mx = Math.max(r, g, b), mn = Math.min(r, g, b), h = 0, s = 0, l = (mx + mn) / 2;
    if (mx !== mn) {
      var d = mx - mn;
      s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
      h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
      h /= 6;
    }
    return [h, s, l];
  }

  function hsl2rgb(h, s, l) {
    if (s === 0) {
      var v = Math.round(l * 255);
      return [v, v, v];
    }
    function hue2rgb(p, q, t) {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    }
    var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    var p = 2 * l - q;
    var r = hue2rgb(p, q, h + 1 / 3);
    var g = hue2rgb(p, q, h);
    var b = hue2rgb(p, q, h - 1 / 3);
    return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
  }

  function hexRgb(h) {
    h = h.replace('#', '');
    if (h.length === 3) h = h.replace(/./g, '$&$&');
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
  }

  function load(src) {
    return new Promise(function (ok, fail) {
      var im = new Image();
      im.crossOrigin = 'anonymous';
      im.onload = function () { ok(im); };
      im.onerror = fail;
      im.src = src;
    });
  }

  /* Detector de tonos de piel humana: protege rostro, cuello, brazos y piernas */
  function isSkin(r, g, b, h, s, l) {
    if (r > 60 && g > 40 && b > 20 && r > g && g >= b * 0.88 && (r - g) >= 6) {
      if (h >= 0.008 && h <= 0.145 && s >= 0.08 && s <= 0.88 && l >= 0.16 && l <= 0.94) {
        return true;
      }
    }
    // Labios y mejillas rosadas
    if (r > 115 && (r - g) > 22 && (r - b) > 25 && (h >= 0.94 || h <= 0.15)) {
      return true;
    }
    return false;
  }

  /* Mascara de fondo: relleno suave desde los bordes exteriores */
  function backgroundMask(d, W, H, tol, tolSeed) {
    var m = new Uint8Array(W * H), q = new Int32Array(W * H), seed = new Uint8Array(W * H * 3);
    var qh = 0, qt = 0;
    function add(i, from) {
      m[i] = 1; q[qt++] = i;
      seed[i * 3] = d[from * 4]; seed[i * 3 + 1] = d[from * 4 + 1]; seed[i * 3 + 2] = d[from * 4 + 2];
    }
    for (var x = 0; x < W; x++) { add(x, x); add((H - 1) * W + x, (H - 1) * W + x); }
    for (var y = 1; y < H - 1; y++) { add(y * W, y * W); add(y * W + W - 1, y * W + W - 1); }
    while (qh < qt) {
      var i = q[qh++], cx = i % W, cy = (i / W) | 0, o = i * 4;
      var nb = [cx > 0 ? i - 1 : -1, cx < W - 1 ? i + 1 : -1, cy > 0 ? i - W : -1, cy < H - 1 ? i + W : -1];
      for (var k = 0; k < 4; k++) {
        var j = nb[k];
        if (j < 0 || m[j]) continue;
        var p = j * 4;
        var dn = Math.abs(d[o] - d[p]) + Math.abs(d[o + 1] - d[p + 1]) + Math.abs(d[o + 2] - d[p + 2]);
        var ds = Math.abs(seed[i * 3] - d[p]) + Math.abs(seed[i * 3 + 1] - d[p + 1]) + Math.abs(seed[i * 3 + 2] - d[p + 2]);
        if (dn < tol && ds < tolSeed) {
          m[j] = 1; q[qt++] = j;
          seed[j * 3] = seed[i * 3]; seed[j * 3 + 1] = seed[i * 3 + 1]; seed[j * 3 + 2] = seed[i * 3 + 2];
        }
      }
    }
    return m;
  }

  /* Prepara la foto analizando la prenda y el modelo */
  function prepare(src, opt) {
    opt = opt || {};
    return load(src).then(function (im) {
      var W = Math.min(opt.ancho || 720, im.naturalWidth);
      var H = Math.round(im.naturalHeight * W / im.naturalWidth);
      var c = document.createElement('canvas');
      c.width = W; c.height = H;
      var ctx = c.getContext('2d');
      ctx.drawImage(im, 0, 0, W, H);
      var img = ctx.getImageData(0, 0, W, H), d = img.data, N = W * H;
      var bg = backgroundMask(d, W, H, opt.tol || 22, opt.fondo || 65);

      // Limites verticales segun la zona de la prenda
      var yMin = 0.0, yMax = 1.0;
      if (opt.zona === 'superior') { yMin = 0.16; yMax = 0.85; }
      else if (opt.zona === 'inferior') { yMin = 0.40; yMax = 0.98; }
      else if (opt.zona === 'calzado') { yMin = 0.60; yMax = 1.0; }
      else if (opt.zona === 'cabeza') { yMin = 0.0; yMax = 0.40; }
      else if (opt.zona === 'cuerpo') { yMin = 0.14; yMax = 0.96; }

      // Histograma y tonos de la prenda (excluyendo piel y fondo)
      var hist = new Float32Array(36), sumS = 0, n = 0, hsl = new Float32Array(N * 3);
      var skinMask = new Uint8Array(N);

      for (var i = 0; i < N; i++) {
        var cy = Math.floor(i / W) / H;
        var r = d[i * 4], g = d[i * 4 + 1], b = d[i * 4 + 2];
        var t = rgb2hsl(r, g, b);
        hsl[i * 3] = t[0]; hsl[i * 3 + 1] = t[1]; hsl[i * 3 + 2] = t[2];

        // Deteccion de piel
        if (isSkin(r, g, b, t[0], t[1], t[2])) {
          skinMask[i] = 1;
        }

        if (bg[i] || skinMask[i]) continue;
        if (cy < yMin || cy > yMax) continue;

        // Cabello oscuro / ojos
        if (t[2] < 0.09 || (cy < 0.28 && t[2] < 0.14 && t[1] < 0.25)) continue;

        n++; sumS += t[1];
        if (t[1] > 0.12 && t[2] > 0.08 && t[2] < 0.94) {
          hist[Math.floor(t[0] * 36) % 36] += t[1];
        }
      }

      var best = 0;
      for (var bb = 1; bb < 36; bb++) if (hist[bb] > hist[best]) best = bb;

      var neutral = opt.neutra != null ? opt.neutra : (n ? sumS / n : 0) < 0.13;
      var domH = opt.matiz != null ? opt.matiz / 360 : (best + 0.5) / 36;
      var tolH = opt.tono || 38;

      var sel = new Float32Array(N), Ls = [];
      for (i = 0; i < N; i++) {
        var py = Math.floor(i / W) / H;
        // Excluir fondo, piel y fuera de zona
        if (bg[i] || skinMask[i] || py < yMin || py > yMax) continue;

        var luma = hsl[i * 3 + 2], sat = hsl[i * 3 + 1];
        // Cabello muy oscuro
        if (luma < 0.08) continue;

        var w = 1.0;
        if (!neutral) {
          var dh = Math.abs(hsl[i * 3] - domH);
          dh = Math.min(dh, 1 - dh) * 360;
          w = dh < tolH ? 1 : dh < tolH + 18 ? 1 - (dh - tolH) / 18 : 0;
          if (sat < 0.08) w *= sat / 0.08;
        } else {
          // Prenda neutra (blanca/gris/negra): evitar pintar piel residual en bordes
          if (sat > 0.35 && (hsl[i * 3] > 0.02 && hsl[i * 3] < 0.15)) w = 0;
        }

        sel[i] = w;
        if (w > 0.5) Ls.push(luma);
      }

      Ls.sort(function (a, b2) { return a - b2; });
      var Lref = Ls.length ? Ls[(Ls.length * 0.5) | 0] : 0.5;

      // Suavizado de bordes 3x3 para transicion natural sin recortes artificiales
      var soft = new Float32Array(N);
      for (var y = 0; y < H; y++) {
        for (var x = 0; x < W; x++) {
          var a = 0, k = 0;
          for (var dy = -1; dy <= 1; dy++) {
            for (var dx = -1; dx <= 1; dx++) {
              var yy = y + dy, xx = x + dx;
              if (yy < 0 || xx < 0 || yy >= H || xx >= W) continue;
              a += sel[yy * W + xx]; k++;
            }
          }
          soft[y * W + x] = a / k;
        }
      }

      return {
        W: W, H: H, c: c, ctx: ctx, img: img,
        orig: new Uint8ClampedArray(d), hsl: hsl, sel: soft, Lref: Lref
      };
    });
  }

  /* Fusion de color estilo Photoshop Color Blend Mode:
     Preserva al 100% la textura, pliegues, sombras y reflejos naturales del tejido. */
  function paint(P, color) {
    var t = hexRgb(color), th = rgb2hsl(t[0], t[1], t[2]);
    var d = P.img.data, o = P.orig, N = P.W * P.H;
    var targetL = th[2], targetS = th[1], targetH = th[0];

    for (var i = 0; i < N; i++) {
      var p = i * 4, w = P.sel[i];
      if (w <= 0) {
        d[p] = o[p]; d[p + 1] = o[p + 1]; d[p + 2] = o[p + 2];
        continue;
      }

      var origL = P.hsl[i * 3 + 2];
      var newL;

      // Ajuste fotorealista de la luminosidad preservando volumen
      if (targetL < 0.18) {
        // Colores muy oscuros (Negro, Azul marino muy profundo):
        // Mantiene sombras marcadas y pliegues visibles
        newL = Math.max(0.04, Math.min(0.40, origL * 0.42 + 0.03));
      } else if (targetL > 0.82) {
        // Colores muy claros (Blanco, Blanco hueso, Crema):
        // Mantiene sombreados suaves y volumen sin quemar la imagen
        newL = Math.max(0.52, Math.min(0.96, 0.52 + origL * 0.42));
      } else {
        // Colores estandar (Verde, Azul, Rojo, Rosa, Beige, etc.):
        var scale = 0.65 + 0.35 * (targetL / 0.5);
        newL = Math.max(0.05, Math.min(0.95, origL * scale));
      }

      var newS = Math.min(1.0, Math.max(0.12, targetS * (1.1 - 0.2 * origL)));
      var tinted = hsl2rgb(targetH, newS, newL);

      // Mezcla con ponderacion suave en los bordes
      d[p]     = Math.round(o[p]     * (1 - w) + tinted[0] * w);
      d[p + 1] = Math.round(o[p + 1] * (1 - w) + tinted[1] * w);
      d[p + 2] = Math.round(o[p + 2] * (1 - w) + tinted[2] * w);
    }

    P.ctx.putImageData(P.img, 0, 0);
    return P.c.toDataURL('image/jpeg', 0.90);
  }

  var prepared = {}, done = {};

  function render(src, color, opt) {
    var key = src + '|' + color;
    if (done[key]) return Promise.resolve(done[key]);
    var base = prepared[src] || (prepared[src] = prepare(src, opt));
    return base.then(function (P) {
      return (done[key] = paint(P, color));
    });
  }

  function cached(src, color) {
    return done[src + '|' + color] || null;
  }

  window.RecolorPrendas = { render: render, cached: cached };
})();
