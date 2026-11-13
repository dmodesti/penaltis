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

// O jogo é pensado em 1280x720, mas o canvas é criado RES vezes maior em telas grandes/de alta
// densidade (a câmera dá zoom), para textos e botões continuarem nítidos em tela cheia.
const RES = Math.min(2, Math.max(1, Math.max(screen.width, screen.height) * (window.devicePixelRatio || 1) / W));
// As texturas desenhadas por código são geradas TEX vezes maiores e exibidas reduzidas.
const TEX = 2;

function textStyle(size, color = '#ffffff') {
  return { fontFamily: FONT, fontSize: size + 'px', color, stroke: '#000000', strokeThickness: Math.max(3, Math.round(size / 7)), align: 'center', resolution: RES };
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

// Formato do rosto: oval mais estreito no queixo. Usado no recorte da foto e no jogo.
const FACE = { w: 100, h: 128 };
function eggPoints(w, h, n = 48) {
  const pts = [];
  for (let i = 0; i < n; i++) {
    const t = (i / n) * Math.PI * 2;
    const c = Math.cos(t);
    const chin = 1 - 0.28 * Math.pow(Math.max(0, -c), 1.5);
    pts.push({ x: (w / 2) * Math.sin(t) * chin, y: -(h / 2) * c });
  }
  return pts;
}
const shift = (pts, dx, dy) => pts.map(p => ({ x: p.x + dx, y: p.y + dy }));

function faceKey(scene, p) {
  const key = 'face_' + p.id;
  if (scene.textures.exists(key)) return key;
  return p.cpu ? 'face_robot' : 'face_default';
}

const Art = {
  // Cada cena chama isto: a câmera mostra o mundo 1280x720 no canvas em alta resolução.
  setupCamera(scene) {
    scene.cameras.main.setZoom(RES).centerOn(W / 2, H / 2);
  },

  // Graphics que desenha em escala TEX, para gerar texturas nítidas.
  texGraphics(scene) {
    const g = scene.make.graphics({ add: false });
    g.scaleCanvas(TEX, TEX);
    return g;
  },

  // Bola: container com a imagem reduzida, para poder escalar/girar como uma imagem normal.
  ball(scene, x, y) {
    const c = scene.add.container(x, y);
    c.add(scene.add.image(0, 0, 'ball').setScale(1 / TEX));
    return c;
  },

  makeBase(scene) {
    // Bola
    let g = Art.texGraphics(scene);
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
    g.generateTexture('ball', 48 * TEX, 48 * TEX);
    g.destroy();

    // Rosto padrão (sem foto), no formato de rosto
    const fx = FACE.w / 2, fy = FACE.h / 2;
    g = Art.texGraphics(scene);
    g.fillStyle(0x4e342e); g.fillPoints(shift(eggPoints(FACE.w, FACE.h), fx, fy), true);
    g.fillStyle(SKIN); g.fillPoints(shift(eggPoints(FACE.w * 0.9, FACE.h * 0.8), fx, fy + FACE.h * 0.09), true);
    g.fillStyle(0x111111); g.fillCircle(fx - 18, fy + 2, 6); g.fillCircle(fx + 18, fy + 2, 6);
    g.lineStyle(5, 0x6d3b1e);
    g.beginPath(); g.arc(fx, fy + 22, 16, 0.2 * Math.PI, 0.8 * Math.PI); g.strokePath();
    g.generateTexture('face_default', FACE.w * TEX, FACE.h * TEX);
    g.destroy();

    // Rosto do computador (robô)
    g = Art.texGraphics(scene);
    g.fillStyle(0x90a4ae); g.fillPoints(shift(eggPoints(FACE.w, FACE.h), fx, fy), true);
    g.fillStyle(0x37474f); g.fillRoundedRect(fx - 38, fy - 20, 76, 36, 12);
    g.fillStyle(0x00e5ff); g.fillCircle(fx - 18, fy - 2, 9); g.fillCircle(fx + 18, fy - 2, 9);
    g.fillStyle(0x37474f);
    for (let i = 0; i < 5; i++) g.fillRect(fx - 28 + i * 12, fy + 28, 8, 12);
    g.generateTexture('face_robot', FACE.w * TEX, FACE.h * TEX);
    g.destroy();
  },

  // Corpo do jogador (batedor ou goleiro) na cor da camisa.
  bodyKey(scene, color, keeper) {
    const key = 'body_' + color + (keeper ? '_k' : '');
    if (scene.textures.exists(key)) return key;
    const w = keeper ? 180 : 120, h = keeper ? 190 : 150, top = keeper ? 50 : 10, cx = w / 2;
    const g = Art.texGraphics(scene);
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
    g.generateTexture(key, w * TEX, h * TEX);
    g.destroy();
    return key;
  },

  // Jogador completo: corpo + rosto (foto). A origem do container fica nos pés.
  player(scene, p, keeper) {
    const c = scene.add.container(0, 0);
    const body = scene.add.image(0, 0, Art.bodyKey(scene, p.color, keeper)).setOrigin(0.5, 1).setScale(1 / TEX);
    const head = Art.face(scene, 0, -172, p, 76, keeper ? 0x00c853 : 0xffffff);
    c.add([body, head]);
    return c;
  },

  // Rosto com contorno. Fotos novas têm formato de rosto; fotos antigas (quadradas) ficam redondas.
  face(scene, x, y, p, height, ringColor) {
    const c = scene.add.container(x, y);
    const key = faceKey(scene, p);
    const src = scene.textures.get(key).getSourceImage();
    const aspect = src.width / src.height;
    if (Math.abs(aspect - 1) < 0.05) {
      const d = height * 0.85;
      c.add(scene.add.circle(0, 0, d / 2 + 3, ringColor));
      c.add(scene.add.image(0, 0, key).setDisplaySize(d, d));
    } else {
      const w = height * aspect;
      const ring = scene.add.graphics();
      ring.fillStyle(ringColor);
      ring.fillPoints(eggPoints(w + 7, height + 7), true);
      c.add([ring, scene.add.image(0, 0, key).setDisplaySize(w, height)]);
    }
    return c;
  },

  // Fundo do cenário escolhido (desenhos em js/scenery.js).
  drawStadium(scene) {
    const g = scene.add.graphics();
    (Scenery[Storage.getScenery()] || Scenery.grass)(scene, g);
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
    // trave listrada de vermelho na quadra (futsal)
    if (Storage.getScenery() === 'court') {
      posts.fillStyle(0xe53935);
      for (let y = GOAL.top + 20; y < GOAL.bottom; y += 40) {
        posts.fillRect(GOAL.left - 6, y, 12, 20);
        posts.fillRect(GOAL.right - 6, y, 12, 20);
      }
      for (let x = GOAL.left + 20; x < GOAL.right - 10; x += 40) posts.fillRect(x, GOAL.top - 6, 20, 12);
    }
    return net;
  },

  button(scene, x, y, label, cb, opts = {}) {
    const w = opts.w || 440, h = opts.h || 78, color = opts.color || 0xffc107, size = opts.size || 30;
    const c = scene.add.container(x, y);
    const g = scene.add.graphics();
    g.fillStyle(0x000000, 0.35); g.fillRoundedRect(-w / 2 + 4, -h / 2 + 6, w, h, 18);
    g.fillStyle(color); g.fillRoundedRect(-w / 2, -h / 2, w, h, 18);
    g.lineStyle(4, 0x000000, 0.6); g.strokeRoundedRect(-w / 2, -h / 2, w, h, 18);
    const t = scene.add.text(0, 0, label, { fontFamily: FONT, fontSize: size + 'px', color: opts.textColor || '#1a1a1a', resolution: RES }).setOrigin(0.5);
    c.add([g, t]);
    c.label = t;
    c.setSize(w, h);
    c.setInteractive({ useHandCursor: true });
    c.on('pointerover', () => c.setScale(1.05));
    c.on('pointerout', () => c.setScale(1));
    // Tela cheia só pode ser pedida ao soltar o dedo (regra dos navegadores), por isso opts.onUp.
    c.on(opts.onUp ? 'pointerup' : 'pointerdown', () => { Sound.click(); cb(); });
    return c;
  },

  // Fundo escurecido para menus.
  dim(scene, alpha = 0.55) {
    return scene.add.rectangle(W / 2, H / 2, W, H, 0x000000, alpha);
  },
};
