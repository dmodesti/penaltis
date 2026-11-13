// Cenários do jogo, todos desenhados por código no mundo 1280x720.
// A linha do gol fica em y=400 e o chão começa em y=370 em todos, para o jogo funcionar igual.

const SCENERIES = [
  { id: 'grass', label: 'Grama' },
  { id: 'court', label: 'Quadra' },
  { id: 'sand', label: 'Areia' },
  { id: 'street', label: 'Cimento' },
];

// Faixas no chão que vão aumentando, dando sensação de profundidade.
function groundBands(g, c1, c2) {
  let y = 370, hBand = 22, i = 0;
  while (y < H) {
    g.fillStyle(i % 2 ? c2 : c1);
    g.fillRect(0, y, W, hBand);
    y += hBand; hBand *= 1.18; i++;
  }
}

// Linha do gol, pequena área, grande área e marca do pênalti.
function fieldLines(g, color, alpha = 0.9) {
  g.lineStyle(4, color, alpha);
  g.lineBetween(0, GOAL.bottom, W, GOAL.bottom);
  g.strokePoints([{ x: 240, y: GOAL.bottom }, { x: 200, y: 460 }, { x: 1080, y: 460 }, { x: 1040, y: GOAL.bottom }]);
  g.strokePoints([{ x: 60, y: GOAL.bottom }, { x: -40, y: 560 }, { x: 1320, y: 560 }, { x: 1220, y: GOAL.bottom }]);
  g.fillStyle(color, alpha); g.fillEllipse(SPOT.x, SPOT.y + 16, 22, 8);
}

// Placas de publicidade atrás do gol.
function boards(scene, g, color, stripe, text, textColor = '#ffffff') {
  g.fillStyle(color); g.fillRect(0, 330, W, 40);
  g.fillStyle(stripe); g.fillRect(0, 330, W, 4);
  for (let x = 80; x < W; x += 320) {
    scene.add.text(x, 350, text, { fontFamily: FONT, fontSize: '20px', color: textColor, resolution: RES }).setOrigin(0.5).setAlpha(0.9);
  }
}

function crowd(g, n, y0, y1, alpha = 1) {
  const colors = [0xe53935, 0xffeb3b, 0x1e88e5, 0xffffff, 0x43a047, 0xfb8c00, 0xf48fb1, 0x8d6e63];
  for (let i = 0; i < n; i++) {
    g.fillStyle(colors[i % colors.length], (0.55 + Math.random() * 0.4) * alpha);
    g.fillCircle(Math.random() * W, y0 + Math.random() * (y1 - y0), 3 + Math.random() * 2.5);
  }
}

const Scenery = {
  // Estádio com gramado
  grass(scene, g) {
    g.fillGradientStyle(0x0d1b3e, 0x0d1b3e, 0x1d3a6e, 0x1d3a6e, 1);
    g.fillRect(0, 0, W, 120);
    g.fillStyle(0x1b2333); g.fillRect(0, 90, W, 250);
    crowd(g, 900, 100, 328);
    g.fillStyle(0xffffff, 0.08); g.fillCircle(120, 40, 90); g.fillCircle(1160, 40, 90);
    boards(scene, g, 0x0b5394, 0xffc107, 'PÊNALTIS FC');
    groundBands(g, 0x3a9d23, 0x34901f);
    fieldLines(g, 0xffffff);
  },

  // Ginásio de futsal com piso de madeira
  court(scene, g) {
    // teto e luzes
    g.fillStyle(0x263238); g.fillRect(0, 0, W, 100);
    for (let x = 80; x < W; x += 230) {
      g.fillStyle(0xffffff, 0.12); g.fillEllipse(x + 40, 34, 170, 50);
      g.fillStyle(0xfffde7); g.fillRoundedRect(x, 26, 80, 14, 6);
    }
    // arquibancada em degraus
    for (let i = 0; i < 8; i++) {
      g.fillStyle(i % 2 ? 0x546e7a : 0x607d8b);
      g.fillRect(0, 100 + i * 26, W, 26);
    }
    crowd(g, 420, 104, 300, 0.9);
    // parede e proteção acolchoada
    g.fillStyle(0xeceff1); g.fillRect(0, 308, W, 22);
    boards(scene, g, 0x1565c0, 0xffffff, 'GINÁSIO');
    // piso de madeira com tábuas
    groundBands(g, 0xd39a5b, 0xcb9050);
    g.lineStyle(1, 0x8d5a2b, 0.3);
    let y = 370, hBand = 22;
    while (y < H) {
      for (let k = 0; k < 9; k++) {
        const x = Math.random() * W;
        g.lineBetween(x, y, x, y + hBand);
      }
      y += hBand; hBand *= 1.18;
    }
    // linhas: linha do gol, área em "D" do futsal e marca do pênalti
    g.lineStyle(4, 0xffffff, 0.9);
    g.lineBetween(0, GOAL.bottom, W, GOAL.bottom);
    const arc = [];
    for (let i = 0; i <= 32; i++) {
      const t = Math.PI * i / 32;
      arc.push({ x: SPOT.x + Math.cos(t) * 470, y: GOAL.bottom + Math.sin(t) * 150 });
    }
    g.strokePoints(arc);
    g.fillStyle(0xffffff, 0.9); g.fillEllipse(SPOT.x, SPOT.y + 16, 22, 8);
  },

  // Futebol de areia na praia
  sand(scene, g) {
    // céu, sol e nuvens
    g.fillGradientStyle(0x4fc3f7, 0x4fc3f7, 0xb3e5fc, 0xb3e5fc, 1);
    g.fillRect(0, 0, W, 250);
    g.fillStyle(0xfff59d, 0.35); g.fillCircle(1080, 80, 70);
    g.fillStyle(0xfff176); g.fillCircle(1080, 80, 46);
    [[200, 70], [520, 50], [820, 95]].forEach(([x, y]) => {
      g.fillStyle(0xffffff, 0.9);
      g.fillEllipse(x, y, 120, 34); g.fillEllipse(x - 40, y + 8, 80, 26); g.fillEllipse(x + 45, y + 6, 90, 28);
    });
    // mar com ondas
    g.fillStyle(0x0288d1); g.fillRect(0, 230, W, 100);
    g.fillStyle(0x29b6f6); g.fillRect(0, 230, W, 14);
    g.lineStyle(3, 0xffffff, 0.5);
    for (let i = 0; i < 40; i++) {
      const x = Math.random() * W, wy = 255 + Math.random() * 65;
      g.lineBetween(x, wy, x + 20 + Math.random() * 30, wy);
    }
    // coqueiros
    [[90, 1], [1190, -1]].forEach(([x, dir]) => {
      g.lineStyle(16, 0x8d6e63);
      const pts = [];
      for (let i = 0; i <= 10; i++) pts.push({ x: x + dir * Math.sin(i / 10 * 1.2) * 40, y: 370 - i * 20 });
      g.strokePoints(pts);
      const top = pts[pts.length - 1];
      g.fillStyle(0x2e7d32);
      for (let i = 0; i < 7; i++) {
        const a = -Math.PI + i * Math.PI / 6;
        const tx = top.x + Math.cos(a) * 95, ty = top.y + Math.sin(a) * 45 + 30;
        const nx = -Math.sin(a) * 12, ny = Math.cos(a) * 12;
        g.fillTriangle(top.x + nx, top.y + ny, top.x - nx, top.y - ny, tx, ty);
      }
      g.fillStyle(0x6d4c41); g.fillCircle(top.x - 8, top.y + 10, 8); g.fillCircle(top.x + 8, top.y + 12, 8);
    });
    boards(scene, g, 0xff7043, 0xffeb3b, 'PRAIA');
    // areia com pontinhos e pegadas
    groundBands(g, 0xf3d9a4, 0xeed09a);
    for (let i = 0; i < 500; i++) {
      g.fillStyle(0xc9a76a, 0.5); g.fillCircle(Math.random() * W, 372 + Math.random() * 348, 1.5);
    }
    for (let i = 0; i < 40; i++) {
      g.fillStyle(0xd9b97c, 0.7); g.fillEllipse(Math.random() * W, 420 + Math.random() * 300, 14, 7);
    }
    // linhas de fita azul
    fieldLines(g, 0x1e88e5, 0.95);
  },

  // Quadra de cimento na rua
  street(scene, g) {
    // céu de fim de tarde e prédios
    g.fillGradientStyle(0xff8a65, 0xff8a65, 0x5c6bc0, 0x5c6bc0, 1);
    g.fillRect(0, 0, W, 210);
    const tops = [80, 40, 120, 60, 100, 30, 90, 70];
    tops.forEach((t, i) => {
      const x = i * 165 - 10;
      g.fillStyle(0x37474f); g.fillRect(x, t, 150, 210 - t);
      g.fillStyle(0xffe082, 0.8);
      for (let wy = t + 14; wy < 195; wy += 26) {
        for (let wx = x + 14; wx < x + 140; wx += 30) if (Math.random() < 0.55) g.fillRect(wx, wy, 14, 12);
      }
    });
    // muro de tijolos
    g.fillStyle(0xa0522d); g.fillRect(0, 200, W, 170);
    g.lineStyle(2, 0x6d3a1f, 0.6);
    for (let row = 0, wy = 200; wy < 370; row++, wy += 17) {
      g.lineBetween(0, wy, W, wy);
      for (let wx = (row % 2) * 24; wx < W; wx += 48) g.lineBetween(wx, wy, wx, wy + 17);
    }
    // alambrado
    g.lineStyle(1.5, 0xcfd8dc, 0.4);
    for (let x = -200; x < W + 200; x += 22) {
      g.lineBetween(x, 90, x + 150, 240);
      g.lineBetween(x + 150, 90, x, 240);
    }
    g.lineStyle(5, 0x455a64);
    g.lineBetween(0, 90, W, 90);
    for (let x = 0; x <= W; x += 256) g.lineBetween(x, 90, x, 240);
    // grafites
    const graf = (x, y, txt, color, angle) => scene.add.text(x, y, txt, {
      fontFamily: FONT, fontSize: '54px', color, stroke: '#1a1a1a', strokeThickness: 8, resolution: RES,
    }).setOrigin(0.5).setAngle(angle).setAlpha(0.9);
    graf(200, 300, 'GOL!', '#ff4081', -8);
    graf(1080, 295, 'CRAQUE', '#00e5ff', 6);
    // meio-fio e chão de cimento
    g.fillStyle(0x757575); g.fillRect(0, 362, W, 10);
    groundBands(g, 0x9e9e9e, 0x979797);
    for (let i = 0; i < 18; i++) {
      g.fillStyle(0x424242, 0.12); g.fillEllipse(Math.random() * W, 420 + Math.random() * 290, 60 + Math.random() * 90, 18 + Math.random() * 20);
    }
    g.lineStyle(2, 0x616161, 0.8);
    for (let i = 0; i < 8; i++) {
      let x = Math.random() * W, y = 400 + Math.random() * 300;
      const pts = [{ x, y }];
      for (let k = 0; k < 5; k++) { x += Math.random() * 40 - 20; y += Math.random() * 20 + 4; pts.push({ x, y }); }
      g.strokePoints(pts);
    }
    // linhas pintadas de amarelo
    fieldLines(g, 0xfdd835, 0.85);
  },
};
