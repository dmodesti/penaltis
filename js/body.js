// Corpo dos jogadores desenhado como um "esqueleto": cada pose diz onde ficam as juntas
// (pescoço, ombros, cotovelos, mãos, quadris, joelhos, tornozelos, pontas dos pés),
// em pixels a partir dos pés (0,0). y negativo = para cima. Sempre [esquerda, direita].

const BODY = { w: 200, h: 230, ox: 100, oy: 215 };  // tamanho da textura e onde ficam os pés

const LEGS_STAND = {
  hip: [[-11, -72], [11, -72]],
  kn: [[-12, -38], [12, -38]],
  an: [[-13, -9], [13, -9]],
  toe: [[-22, -4], [22, -4]],
};

const POSES = {
  // batedor parado
  stand: {
    neck: [0, -140],
    sh: [[-24, -133], [24, -133]],
    el: [[-31, -104], [31, -104]],
    ha: [[-32, -77], [32, -77]],
    ...LEGS_STAND,
  },
  // correndo: joelho esquerdo para cima
  run1: {
    neck: [0, -143],
    sh: [[-24, -136], [24, -136]],
    el: [[-36, -112], [33, -106]],
    ha: [[-28, -92], [40, -82]],
    hip: [[-11, -75], [11, -75]],
    kn: [[-16, -52], [12, -40]],
    an: [[-12, -26], [14, -10]],
    toe: [[-21, -22], [23, -5]],
  },
  // correndo: joelho direito para cima
  run2: {
    neck: [0, -143],
    sh: [[-24, -136], [24, -136]],
    el: [[-33, -106], [36, -112]],
    ha: [[-40, -82], [28, -92]],
    hip: [[-11, -75], [11, -75]],
    kn: [[-12, -40], [16, -52]],
    an: [[-14, -10], [12, -26]],
    toe: [[-23, -5], [21, -22]],
  },
  // chutando com a perna direita, braços abertos para equilibrar
  kick: {
    neck: [-6, -139],
    sh: [[-30, -131], [18, -134]],
    el: [[-52, -118], [38, -114]],
    ha: [[-68, -102], [54, -96]],
    hip: [[-13, -72], [9, -72]],
    kn: [[-15, -38], [30, -52]],
    an: [[-14, -9], [50, -34]],
    toe: [[-23, -4], [61, -31]],
  },
  // comemorando com os braços para cima
  cheer: {
    neck: [0, -142],
    sh: [[-24, -135], [24, -135]],
    el: [[-40, -160], [40, -160]],
    ha: [[-48, -188], [48, -188]],
    ...LEGS_STAND,
  },
  // goleiro agachado, braços abertos esperando
  ready: {
    neck: [0, -124],
    sh: [[-26, -117], [26, -117]],
    el: [[-50, -103], [50, -103]],
    ha: [[-60, -80], [60, -80]],
    hip: [[-13, -62], [13, -62]],
    kn: [[-28, -34], [28, -34]],
    an: [[-22, -9], [22, -9]],
    toe: [[-31, -4], [31, -4]],
  },
  // goleiro esticado no mergulho, braços acima da cabeça
  stretch: {
    neck: [0, -142],
    sh: [[-23, -135], [23, -135]],
    el: [[-28, -164], [28, -164]],
    ha: [[-30, -192], [30, -192]],
    hip: [[-10, -74], [10, -74]],
    kn: [[-9, -40], [9, -40]],
    an: [[-8, -9], [8, -9]],
    toe: [[-14, -2], [14, -2]],
  },
};

const OUTLINE = 0x1a1a1a;

function shade(c, f) {
  const ch = s => Math.min(255, Math.round(((c >> s) & 255) * f));
  return (ch(16) << 16) | (ch(8) << 8) | ch(0);
}

// Desenha em duas passadas: primeiro todos os contornos, depois os preenchimentos.
// Assim o boneco fica com uma borda escura só por fora.
function drawBody(g, ox, oy, pose, color, keeper) {
  const P = p => ({ x: ox + p[0], y: oy + p[1] });
  const lerp = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
  const add = (a, dx, dy) => [a[0] + dx, a[1] + dy];
  const mid = (a, b) => lerp(a, b, 0.5);
  const shorts = keeper ? 0x222222 : color === 0xffffff ? 0x1e3a8a : 0xffffff;
  const trim = color === 0xffffff ? 0x1e3a8a : color === 0xfdd835 ? 0x222222 : 0xffffff;
  const ops = [];

  // "cápsula": membro arredondado de a até b
  const cap = (a, b, w, col) => ops.push(outline => {
    const p1 = P(a), p2 = P(b), ww = outline ? w + 4 : w, cc = outline ? OUTLINE : col;
    g.lineStyle(ww, cc); g.lineBetween(p1.x, p1.y, p2.x, p2.y);
    g.fillStyle(cc); g.fillCircle(p1.x, p1.y, ww / 2); g.fillCircle(p2.x, p2.y, ww / 2);
  });
  const poly = (pts, col, alpha = 1, withOutline = true) => ops.push(outline => {
    const ps = pts.map(P);
    if (outline) {
      if (withOutline) { g.lineStyle(4, OUTLINE); g.strokePoints(ps, true); g.fillStyle(OUTLINE); g.fillPoints(ps, true); }
    } else {
      g.fillStyle(col, alpha); g.fillPoints(ps, true);
    }
  });
  const dot = (a, r, col, rim) => ops.push(outline => {
    const p = P(a);
    if (outline) { g.fillStyle(OUTLINE); g.fillCircle(p.x, p.y, r + 2); return; }
    g.fillStyle(col); g.fillCircle(p.x, p.y, r);
    if (rim) { g.lineStyle(3, rim); g.strokeCircle(p.x, p.y, r - 1.5); }
  });

  // pernas: coxa, canela, meião e chuteira
  for (let i = 0; i < 2; i++) {
    const hip = pose.hip[i], kn = pose.kn[i], an = pose.an[i], toe = pose.toe[i];
    cap(hip, kn, 15, SKIN);
    cap(kn, an, 12, SKIN);
    cap(lerp(kn, an, 0.35), an, 13, color);
    cap(lerp(kn, an, 0.35), lerp(kn, an, 0.42), 13, trim);
    cap(an, toe, 12, 0x111111);
  }

  // calção
  const [hL, hR] = pose.hip, [kL, kR] = pose.kn;
  const mL = lerp(hL, kL, 0.45), mR = lerp(hR, kR, 0.45);
  poly([add(hL, -9, -6), add(hR, 9, -6), add(mR, 10, 0), add(mR, -7, 3), add(mid(hL, hR), 0, 9), add(mL, 7, 3), add(mL, -10, 0)], shorts);

  // braços (atrás do tronco só no contorno; o preenchimento vem por cima)
  const [sL, sR] = pose.sh;
  for (let i = 0; i < 2; i++) {
    const sh = pose.sh[i], el = pose.el[i], ha = pose.ha[i];
    if (keeper) {
      cap(sh, el, 14, shade(color, 0.85));      // manga comprida do goleiro
      cap(el, ha, 12, shade(color, 0.85));
      dot(ha, 11, 0xfafafa, 0x00c853);          // luvas
    } else {
      cap(sh, el, 11, SKIN);
      cap(el, ha, 10, SKIN);
      cap(sh, lerp(sh, el, 0.55), 15, color);   // manga curta
      cap(lerp(sh, el, 0.5), lerp(sh, el, 0.55), 15, trim);
      dot(ha, 6.5, SKIN);
    }
  }

  // pescoço e tronco
  cap(pose.neck, add(pose.neck, 0, 10), 14, SKIN);
  const top = add(mid(sL, sR), 0, -3), waist = add(mid(hL, hR), 0, -4);
  poly([add(sL, -6, -3), add(sR, 6, -3), add(hR, 9, -4), add(hL, -9, -4)], color);
  // sombra do lado direito e brilho no peito, para dar volume
  poly([top, add(sR, 6, -3), add(hR, 9, -4), waist], 0x000000, 0.13, false);
  poly([add(sL, 2, 4), add(top, -2, 4), add(lerp(top, waist, 0.45), -4, 0), add(lerp(sL, hL, 0.45), 4, 0)], 0xffffff, 0.12, false);
  // gola em V
  poly([add(pose.neck, -10, 2), add(pose.neck, 10, 2), add(pose.neck, 0, 15)], trim, 1, false);
  poly([add(pose.neck, -6, 2), add(pose.neck, 6, 2), add(pose.neck, 0, 10)], SKIN, 1, false);
  // barra da camisa
  poly([add(hL, -9, -9), add(hR, 9, -9), add(hR, 9, -4), add(hL, -9, -4)], shade(color, 0.8), 1, false);

  ops.forEach(op => op(true));
  ops.forEach(op => op(false));
}
