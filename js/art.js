// Todos os gráficos do jogo são desenhados por código aqui.
// Para trocar por imagens de verdade depois, basta carregar PNGs com as mesmas chaves
// ('ball', 'face_default', 'body_...') no lugar destas funções.

const W = 1280, H = 720;
const GOAL = { left: 340, right: 940, top: 150, bottom: 400 };
GOAL.w = GOAL.right - GOAL.left;
GOAL.h = GOAL.bottom - GOAL.top;
const SPOT = { x: 640, y: 620 };
const FONT = '"Arial Black", "Arial Bold", Arial, sans-serif';
const SHIRT_COLORS = [0xe53935, 0x1e88e5, 0x43a047, 0xfdd835, 0x8e24aa, 0xfb8c00, 0x212121, 0xffffff];
const SKIN = 0xe0ac69;

function textStyle(size, color = '#ffffff') {
  return { fontFamily: FONT, fontSize: size + 'px', color, stroke: '#000000', strokeThickness: Math.max(3, Math.round(size / 7)), align: 'center' };
}

// Carrega as fotos dos jogadores como texturas ('face_<id>').
function loadFaces(scene, players) {
  return Promise.all(players.map(p => new Promise(resolve => {
    const key = 'face_' + p.id;
    if (scene.textures.exists(key)) scene.textures.remove(key);
    if (!p.face) return resolve();
    const img = new Image();
    img.onload = () => { scene.textures.addImage(key, img); resolve(); };
    img.onerror = () => resolve();
    img.src = p.face;
  })));
}

function faceKey(scene, p) {
  const key = 'face_' + p.id;
  if (scene.textures.exists(key)) return key;
  return p.cpu ? 'face_robot' : 'face_default';
}

const Art = {
  makeBase(scene) {
    // Bola
    let g = scene.make.graphics({ add: false });
    g.fillStyle(0xffffff); g.fillCircle(24, 24, 22);
    g.fillStyle(0x111111);
    const pent = (cx, cy, r, rot) => {
      const pts = [];
      for (let i = 0; i < 5; i++) {
        const a = rot + i * Math.PI * 2 / 5;
        pts.push({ x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r });
      }
      g.fillPoints(pts, true);
    };
    pent(24, 24, 7, -Math.PI / 2);
    for (let i = 0; i < 5; i++) {
      const a = -Math.PI / 2 + i * Math.PI * 2 / 5;
      pent(24 + Math.cos(a) * 18, 24 + Math.sin(a) * 18, 5, a + Math.PI);
    }
    g.lineStyle(2, 0x222222); g.strokeCircle(24, 24, 22);
    g.generateTexture('ball', 48, 48);
    g.destroy();

    // Rosto padrão (sem foto)
    g = scene.make.graphics({ add: false });
    g.fillStyle(0x4e342e); g.fillCircle(64, 64, 64);
    g.fillStyle(SKIN); g.fillEllipse(64, 76, 108, 100);
    g.fillStyle(0x111111); g.fillCircle(44, 68, 7); g.fillCircle(84, 68, 7);
    g.lineStyle(6, 0x6d3b1e);
    g.beginPath(); g.arc(64, 82, 22, 0.2 * Math.PI, 0.8 * Math.PI); g.strokePath();
    g.generateTexture('face_default', 128, 128);
    g.destroy();

    // Rosto do computador (robô)
    g = scene.make.graphics({ add: false });
    g.fillStyle(0x90a4ae); g.fillCircle(64, 64, 64);
    g.fillStyle(0x37474f); g.fillRoundedRect(22, 40, 84, 40, 14);
    g.fillStyle(0x00e5ff); g.fillCircle(46, 60, 10); g.fillCircle(82, 60, 10);
    g.fillStyle(0x37474f);
    for (let i = 0; i < 5; i++) g.fillRect(36 + i * 12, 92, 8, 12);
    g.generateTexture('face_robot', 128, 128);
    g.destroy();
  },

  // Corpo do jogador (batedor ou goleiro) na cor da camisa.
  bodyKey(scene, color, keeper) {
    const key = 'body_' + color + (keeper ? '_k' : '');
    if (scene.textures.exists(key)) return key;
    const w = keeper ? 180 : 120, h = keeper ? 190 : 150, top = keeper ? 50 : 10, cx = w / 2;
    const g = scene.make.graphics({ add: false });
    // pernas, meiões, chuteiras
    g.fillStyle(SKIN); g.fillRect(cx - 20, top + 80, 14, 32); g.fillRect(cx + 6, top + 80, 14, 32);
    g.fillStyle(color); g.fillRect(cx - 21, top + 108, 16, 22); g.fillRect(cx + 5, top + 108, 16, 22);
    g.fillStyle(0x111111); g.fillEllipse(cx - 14, top + 132, 24, 12); g.fillEllipse(cx + 14, top + 132, 24, 12);
    // calção
    g.fillStyle(keeper ? 0x222222 : 0xffffff); g.fillRoundedRect(cx - 26, top + 64, 52, 26, 6);
    // braços
    if (keeper) {
      g.lineStyle(14, color);
      g.lineBetween(cx - 24, top + 12, cx - 62, top - 28);
      g.lineBetween(cx + 24, top + 12, cx + 62, top - 28);
      g.fillStyle(0xfafafa); g.fillCircle(cx - 66, top - 33, 12); g.fillCircle(cx + 66, top - 33, 12);
      g.lineStyle(3, 0x00c853); g.strokeCircle(cx - 66, top - 33, 12); g.strokeCircle(cx + 66, top - 33, 12);
    } else {
      g.fillStyle(color); g.fillRoundedRect(cx - 42, top + 4, 14, 44, 6); g.fillRoundedRect(cx + 28, top + 4, 14, 44, 6);
      g.fillStyle(SKIN); g.fillCircle(cx - 35, top + 54, 7); g.fillCircle(cx + 35, top + 54, 7);
    }
    // camisa
    g.fillStyle(color); g.fillRoundedRect(cx - 30, top, 60, 70, 12);
    g.lineStyle(2, 0x000000, 0.25); g.strokeRoundedRect(cx - 30, top, 60, 70, 12);
    g.fillStyle(color === 0xffffff ? 0x222222 : 0xffffff, 0.9); g.fillRect(cx - 8, top, 16, 6);
    g.generateTexture(key, w, h);
    g.destroy();
    return key;
  },

  // Jogador completo: corpo + rosto (foto). A origem do container fica nos pés.
  player(scene, p, keeper) {
    const c = scene.add.container(0, 0);
    const body = scene.add.image(0, 0, Art.bodyKey(scene, p.color, keeper)).setOrigin(0.5, 1);
    const ring = scene.add.circle(0, -166, 35, keeper ? 0x00c853 : 0xffffff);
    const head = scene.add.image(0, -166, faceKey(scene, p)).setDisplaySize(64, 64);
    c.add([body, ring, head]);
    return c;
  },

  drawStadium(scene) {
    const g = scene.add.graphics();
    // céu e arquibancada
    g.fillGradientStyle(0x0d1b3e, 0x0d1b3e, 0x1d3a6e, 0x1d3a6e, 1);
    g.fillRect(0, 0, W, 120);
    g.fillStyle(0x1b2333); g.fillRect(0, 90, W, 250);
    const crowd = [0xe53935, 0xffeb3b, 0x1e88e5, 0xffffff, 0x43a047, 0xfb8c00, 0xf48fb1, 0x8d6e63];
    for (let i = 0; i < 900; i++) {
      g.fillStyle(crowd[i % crowd.length], 0.55 + Math.random() * 0.4);
      g.fillCircle(Math.random() * W, 100 + Math.random() * 228, 3 + Math.random() * 2.5);
    }
    // refletores
    g.fillStyle(0xffffff, 0.08); g.fillCircle(120, 40, 90); g.fillCircle(1160, 40, 90);
    // placas de publicidade
    g.fillStyle(0x0b5394); g.fillRect(0, 330, W, 40);
    g.fillStyle(0xffc107); g.fillRect(0, 330, W, 4);
    for (let x = 80; x < W; x += 320) {
      scene.add.text(x, 350, 'PÊNALTIS FC', { fontFamily: FONT, fontSize: '20px', color: '#ffffff' }).setOrigin(0.5).setAlpha(0.85);
    }
    // gramado listrado
    let y = 370, hBand = 22, i = 0;
    while (y < H) {
      g.fillStyle(i % 2 ? 0x34901f : 0x3a9d23);
      g.fillRect(0, y, W, hBand);
      y += hBand; hBand *= 1.18; i++;
    }
    // linhas do campo
    g.lineStyle(4, 0xffffff, 0.9);
    g.lineBetween(0, GOAL.bottom, W, GOAL.bottom);
    g.strokePoints([{ x: 240, y: GOAL.bottom }, { x: 200, y: 460 }, { x: 1080, y: 460 }, { x: 1040, y: GOAL.bottom }]);
    g.strokePoints([{ x: 60, y: GOAL.bottom }, { x: -40, y: 560 }, { x: 1320, y: 560 }, { x: 1220, y: GOAL.bottom }]);
    g.fillStyle(0xffffff); g.fillEllipse(SPOT.x, SPOT.y + 16, 22, 8);
    return g;
  },

  // Desenha o gol; devolve a rede (container) para animar quando sai gol.
  drawGoal(scene) {
    const net = scene.add.container(W / 2, GOAL.top + GOAL.h / 2).setDepth(1);
    const g = scene.add.graphics();
    const hw = GOAL.w / 2, hh = GOAL.h / 2, inset = 22;
    g.fillStyle(0xffffff, 0.08); g.fillRect(-hw + inset, -hh + inset, GOAL.w - inset * 2, GOAL.h - inset);
    g.lineStyle(1.5, 0xffffff, 0.35);
    for (let x = -hw + inset; x <= hw - inset; x += 18) g.lineBetween(x, -hh + inset, x, hh);
    for (let y = -hh + inset; y <= hh; y += 18) g.lineBetween(-hw + inset, y, hw - inset, y);
    // laterais e teto da rede
    for (let t = 0; t <= 1; t += 0.2) {
      g.lineBetween(-hw, -hh + GOAL.h * t, -hw + inset, -hh + inset + (GOAL.h - inset) * t);
      g.lineBetween(hw, -hh + GOAL.h * t, hw - inset, -hh + inset + (GOAL.h - inset) * t);
      g.lineBetween(-hw + GOAL.w * t, -hh, -hw + inset + (GOAL.w - inset * 2) * t, -hh + inset);
    }
    net.add(g);

    const posts = scene.add.graphics().setDepth(2);
    posts.lineStyle(14, 0x000000, 0.25);
    posts.strokePoints([{ x: GOAL.left + 4, y: GOAL.bottom + 4 }, { x: GOAL.left + 4, y: GOAL.top + 4 }, { x: GOAL.right + 4, y: GOAL.top + 4 }, { x: GOAL.right + 4, y: GOAL.bottom + 4 }]);
    posts.lineStyle(12, 0xffffff);
    posts.strokePoints([{ x: GOAL.left, y: GOAL.bottom }, { x: GOAL.left, y: GOAL.top }, { x: GOAL.right, y: GOAL.top }, { x: GOAL.right, y: GOAL.bottom }]);
    return net;
  },

  button(scene, x, y, label, cb, opts = {}) {
    const w = opts.w || 440, h = opts.h || 78, color = opts.color || 0xffc107, size = opts.size || 30;
    const c = scene.add.container(x, y);
    const g = scene.add.graphics();
    g.fillStyle(0x000000, 0.35); g.fillRoundedRect(-w / 2 + 4, -h / 2 + 6, w, h, 18);
    g.fillStyle(color); g.fillRoundedRect(-w / 2, -h / 2, w, h, 18);
    g.lineStyle(4, 0x000000, 0.6); g.strokeRoundedRect(-w / 2, -h / 2, w, h, 18);
    const t = scene.add.text(0, 0, label, { fontFamily: FONT, fontSize: size + 'px', color: opts.textColor || '#1a1a1a' }).setOrigin(0.5);
    c.add([g, t]);
    c.label = t;
    c.setSize(w, h);
    c.setInteractive({ useHandCursor: true });
    c.on('pointerover', () => c.setScale(1.05));
    c.on('pointerout', () => c.setScale(1));
    c.on('pointerdown', () => { Sound.click(); cb(); });
    return c;
  },

  // Fundo escurecido para menus.
  dim(scene, alpha = 0.55) {
    return scene.add.rectangle(W / 2, H / 2, W, H, 0x000000, alpha);
  },
};
