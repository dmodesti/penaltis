// O gol é dividido em 6 zonas: col 0..2 (esquerda, meio, direita) e row 0 = baixo, 1 = alto.
const DIFF = {
  easy:   { read: 0.05, cpuMiss: 0.25, reactMs: 3200 },
  normal: { read: 0.20, cpuMiss: 0.12, reactMs: 2300 },
  hard:   { read: 0.35, cpuMiss: 0.05, reactMs: 1500 },
};
const ZONE_W = GOAL.w / 3, ZONE_H = GOAL.h / 2;

function zoneCenter(z) {
  return {
    x: GOAL.left + ZONE_W * (z.col + 0.5),
    y: z.row === 1 ? GOAL.top + ZONE_H * 0.5 : GOAL.top + ZONE_H * 1.5,
  };
}

function weighted(weights) {
  let r = Math.random() * weights.reduce((a, b) => a + b, 0);
  for (let i = 0; i < weights.length; i++) { r -= weights[i]; if (r <= 0) return i; }
  return weights.length - 1;
}

class MatchScene extends Phaser.Scene {
  constructor() { super('Match'); }

  init(data) {
    this.data_ = data;
    this.mode = data.mode;
    this.teams = [data.a, data.b];
    this.diff = DIFF[data.diff] || DIFF.normal;
    this.kicks = [[], []];
    this.turn = 0;
  }

  create() {
    Art.drawStadium(this);
    this.net = Art.drawGoal(this);

    this.ballShadow = this.add.ellipse(SPOT.x, SPOT.y + 18, 40, 12, 0x000000, 0.3).setDepth(19);
    this.ball = this.add.image(SPOT.x, SPOT.y, 'ball').setDepth(20);
    this.aimG = this.add.graphics().setDepth(30);
    this.timerG = this.add.graphics().setDepth(41);
    this.hint = this.add.circle(SPOT.x, SPOT.y, 18, 0xffffff, 0.7).setDepth(31).setVisible(false);

    this.buildScoreboard();
    this.msg = this.add.text(W / 2, 114, '', textStyle(28)).setOrigin(0.5).setDepth(50);
    this.big = this.add.text(W / 2, 300, '', textStyle(96, '#ffeb3b')).setOrigin(0.5).setDepth(60).setAlpha(0);
    this.buildZones();

    Art.button(this, 70, 46, 'Sair', () => this.scene.start('Menu'), { w: 110, h: 50, size: 22, color: 0xffffff });

    this.input.on('pointerdown', p => this.onDown(p));
    this.input.on('pointermove', p => this.onMove(p));
    this.input.on('pointerup', p => this.onUp(p));

    Sound.whistle();
    this.time.delayedCall(500, () => this.startTurn());
  }

  isHuman(team) { return this.mode === '2p' || team === 0; }

  setMsg(t) { this.msg.setText(t); }

  // ---------------- Placar ----------------
  buildScoreboard() {
    const g = this.add.graphics().setDepth(49);
    g.fillStyle(0x000000, 0.7); g.fillRoundedRect(190, 8, 900, 78, 16);
    this.sbNames = [];
    this.teams.forEach((p, side) => {
      const fx = side === 0 ? 232 : 1048;
      this.add.circle(fx, 47, 31, p.color).setDepth(50);
      this.add.image(fx, 47, faceKey(this, p)).setDisplaySize(56, 56).setDepth(50);
      const nx = side === 0 ? 272 : 1008;
      const t = this.add.text(nx, 30, p.name, { fontFamily: FONT, fontSize: '22px', color: '#ffffff' })
        .setOrigin(side === 0 ? 0 : 1, 0.5).setDepth(50);
      this.sbNames.push(t);
    });
    this.sbScore = this.add.text(W / 2, 47, '0 - 0', textStyle(44)).setOrigin(0.5).setDepth(50);
    this.sbDots = this.add.graphics().setDepth(50);
  }

  goals(side) { return this.kicks[side].filter(Boolean).length; }

  updateScoreboard() {
    this.sbScore.setText(`${this.goals(0)} - ${this.goals(1)}`);
    const g = this.sbDots;
    g.clear();
    const count = Math.max(5, this.kicks[0].length, this.kicks[1].length);
    const start = Math.max(0, count - 7);
    for (let side = 0; side < 2; side++) {
      for (let i = start; i < count; i++) {
        const k = this.kicks[side][i];
        const x = side === 0 ? 284 + (i - start) * 30 : 996 - (i - start) * 30;
        g.fillStyle(k === undefined ? 0x9e9e9e : k ? 0x43a047 : 0xe53935);
        g.fillCircle(x, 64, 11);
        g.lineStyle(2, 0xffffff); g.strokeCircle(x, 64, 11);
      }
      this.sbNames[side].setColor(side === this.turn % 2 ? '#ffc107' : '#ffffff');
    }
  }

  // Regras: 5 cobranças cada; acaba antes se não der mais para alcançar; depois, morte súbita.
  decide() {
    const [a, b] = this.kicks, ga = this.goals(0), gb = this.goals(1);
    if (a.length <= 5 && b.length <= 5) {
      if (ga > gb + (5 - b.length)) return 0;
      if (gb > ga + (5 - a.length)) return 1;
      return null;
    }
    if (a.length === b.length && ga !== gb) return ga > gb ? 0 : 1;
    return null;
  }

  // ---------------- Turno ----------------
  startTurn() {
    const k = this.turn % 2, g = 1 - k;
    this.k = k;
    this.resetBall();
    if (this.kicker) this.kicker.destroy();
    if (this.keeper) this.keeper.destroy();
    this.kicker = Art.player(this, this.teams[k], false).setPosition(520, 712).setScale(1.15).setDepth(25);
    this.keeper = Art.player(this, this.teams[g], true).setPosition(W / 2, GOAL.bottom).setScale(0.95).setDepth(10);
    this.idle = this.tweens.add({ targets: this.keeper, x: W / 2 + 14, duration: 500, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    this.updateScoreboard();

    const kName = this.teams[k].name, gName = this.teams[g].name;
    const kh = this.isHuman(k), gh = this.isHuman(g);
    const suddenDeath = this.kicks[k].length >= 5 ? '  (morte súbita)' : '';

    if (kh && !gh) {
      this.setMsg(`${kName}: arraste a bola em direção ao gol!${suddenDeath}`);
      this.enableSwipe(shot => this.resolve(shot, this.cpuKeeper(shot)));
    } else if (!kh && gh) {
      this.setMsg(`${gName}: toque onde você vai pular!${suddenDeath}`);
      this.enableZones(this.diff.reactMs, zone => this.resolve(this.cpuShot(), zone));
    } else {
      this.setMsg(`Goleiro ${gName}: escolha o canto em segredo!${suddenDeath}`);
      this.enableZones(0, zone => {
        this.passDevice(kName, () => {
          this.setMsg(`${kName}: arraste a bola em direção ao gol!`);
          this.enableSwipe(shot => this.resolve(shot, zone));
        });
      });
    }
  }

  resetBall() {
    this.ball.setPosition(SPOT.x, SPOT.y).setScale(1).setAlpha(1).setAngle(0).setDepth(20);
    this.ballShadow.setPosition(SPOT.x, SPOT.y + 18).setScale(1).setAlpha(1);
  }

  // ---------------- Chute (arrastar) ----------------
  enableSwipe(cb) {
    this.swipeCb = cb;
    this.drag = null;
    this.hint.setVisible(true).setPosition(SPOT.x, SPOT.y).setAlpha(0.7);
    this.hintTween = this.tweens.add({ targets: this.hint, y: SPOT.y - 140, alpha: 0, duration: 900, repeat: -1 });
  }

  onDown(p) {
    if (!this.swipeCb || p.y < GOAL.bottom + 30) return;
    this.drag = { x: p.x, y: p.y };
  }

  onMove(p) {
    if (!this.drag) return;
    const dx = p.x - this.drag.x, dy = p.y - this.drag.y;
    const len = Math.min(Math.hypot(dx, dy), 420);
    this.aimG.clear();
    if (dy > -10 || len < 15) return;
    const ang = Math.atan2(dy, dx);
    const power = len / 420;
    const col = power < 0.6 ? 0x66ff66 : power < 0.85 ? 0xffeb3b : 0xff5252;
    const ex = SPOT.x + Math.cos(ang) * len * 0.75, ey = SPOT.y + Math.sin(ang) * len * 0.75;
    this.aimG.lineStyle(10, col, 0.85);
    this.aimG.lineBetween(SPOT.x, SPOT.y, ex, ey);
    this.aimG.fillStyle(col, 0.85);
    this.aimG.fillTriangle(
      ex + Math.cos(ang) * 22, ey + Math.sin(ang) * 22,
      ex + Math.cos(ang + 2.4) * 18, ey + Math.sin(ang + 2.4) * 18,
      ex + Math.cos(ang - 2.4) * 18, ey + Math.sin(ang - 2.4) * 18,
    );
  }

  onUp(p) {
    if (!this.drag) return;
    const dx = p.x - this.drag.x, dy = p.y - this.drag.y;
    this.drag = null;
    this.aimG.clear();
    if (dy > -30) {
      this.setMsg('Arraste para CIMA, em direção ao gol!');
      return;
    }
    const cb = this.swipeCb;
    this.swipeCb = null;
    this.hintTween.stop();
    this.hint.setVisible(false);
    cb(this.computeShot(dx, dy));
  }

  // Direção do arrasto = para onde vai; tamanho do arrasto = altura (forte demais vai por cima).
  computeShot(dx, dy) {
    const len = Math.hypot(dx, dy);
    const power = Phaser.Math.Clamp((len - 60) / 320, 0, 1.25);
    let y = GOAL.bottom - 14 - power * 230;
    let x = SPOT.x + (dx / -dy) * (SPOT.y - y);
    const spread = 8 + 26 * power * power;
    x += (Math.random() * 2 - 1) * spread;
    y += (Math.random() * 2 - 1) * spread;
    return this.classify(x, Math.min(y, GOAL.bottom - 12));
  }

  classify(x, y) {
    const nearPost = (Math.abs(x - GOAL.left) < 10 || Math.abs(x - GOAL.right) < 10) && y > GOAL.top - 10;
    const nearBar = Math.abs(y - GOAL.top) < 10 && x > GOAL.left - 10 && x < GOAL.right + 10;
    if (nearPost || nearBar) return { x, y, out: true, post: true };
    if (x < GOAL.left || x > GOAL.right || y < GOAL.top) return { x, y, out: true };
    const col = Math.min(2, Math.floor((x - GOAL.left) / ZONE_W));
    const row = y < GOAL.top + ZONE_H ? 1 : 0;
    return { x, y, out: false, zone: { col, row } };
  }

  // ---------------- Computador ----------------
  cpuKeeper(shot) {
    if (shot.zone && Math.random() < this.diff.read) return { ...shot.zone };
    return { col: weighted([0.38, 0.24, 0.38]), row: weighted([0.6, 0.4]) };
  }

  cpuShot() {
    if (Math.random() < this.diff.cpuMiss) {
      const kind = weighted([0.4, 0.35, 0.25]);
      const side = Math.random() < 0.5 ? -1 : 1;
      if (kind === 0) return this.classify(W / 2 + side * Phaser.Math.Between(80, 280), GOAL.top - 40); // por cima
      if (kind === 1) return this.classify(side < 0 ? GOAL.left - 40 : GOAL.right + 40, Phaser.Math.Between(220, 380)); // pra fora
      return this.classify(side < 0 ? GOAL.left : GOAL.right, Phaser.Math.Between(200, 370)); // trave
    }
    const z = { col: weighted([0.4, 0.2, 0.4]), row: weighted([0.55, 0.45]) };
    const c = zoneCenter(z);
    const x = Phaser.Math.Clamp(c.x + Phaser.Math.Between(-60, 60), GOAL.left + 22, GOAL.right - 22);
    const y = Phaser.Math.Clamp(c.y + Phaser.Math.Between(-35, 35), GOAL.top + 22, GOAL.bottom - 14);
    return this.classify(x, y);
  }

  // ---------------- Goleiro (escolher zona) ----------------
  buildZones() {
    this.zones = this.add.container(0, 0).setDepth(40).setVisible(false);
    for (let col = 0; col < 3; col++) {
      for (let row = 0; row < 2; row++) {
        const c = zoneCenter({ col, row });
        const r = this.add.rectangle(c.x, c.y, ZONE_W - 6, ZONE_H - 6, 0xffffff, 0.12)
          .setStrokeStyle(3, 0xffffff, 0.6)
          .setInteractive({ useHandCursor: true });
        r.on('pointerover', () => r.setFillStyle(0xffeb3b, 0.35));
        r.on('pointerout', () => r.setFillStyle(0xffffff, 0.12));
        r.on('pointerdown', () => this.chooseZone({ col, row }));
        this.zones.add(r);
      }
    }
  }

  enableZones(timeMs, cb) {
    this.zoneCb = cb;
    this.zones.each(r => r.setFillStyle(0xffffff, 0.12));
    this.zones.setVisible(true);
    if (timeMs > 0) {
      this.timer = this.tweens.addCounter({
        from: 1, to: 0, duration: timeMs,
        onUpdate: tw => {
          const v = tw.getValue();
          this.timerG.clear();
          this.timerG.fillStyle(0x000000, 0.5); this.timerG.fillRoundedRect(GOAL.left, GOAL.bottom + 14, GOAL.w, 16, 8);
          this.timerG.fillStyle(v > 0.35 ? 0x66ff66 : 0xff5252); this.timerG.fillRoundedRect(GOAL.left, GOAL.bottom + 14, GOAL.w * v, 16, 8);
        },
        onComplete: () => this.chooseZone(null),
      });
    }
  }

  chooseZone(zone) {
    if (!this.zoneCb) return;
    const cb = this.zoneCb;
    this.zoneCb = null;
    if (this.timer) { this.timer.stop(); this.timer = null; }
    this.timerG.clear();
    this.zones.setVisible(false);
    Sound.click();
    cb(zone);
  }

  // Modo 2 jogadores: tela que esconde a escolha do goleiro.
  passDevice(name, cb) {
    const layer = this.add.container(0, 0).setDepth(100);
    const bg = this.add.rectangle(W / 2, H / 2, W, H, 0x0d1b3e, 0.97).setInteractive();
    const t = this.add.text(W / 2, 260, `Passe o aparelho para\n${name}\n(o batedor)`, textStyle(48)).setOrigin(0.5);
    const b = Art.button(this, W / 2, 500, 'Estou pronto!', () => { layer.destroy(); cb(); });
    layer.add([bg, t, b]);
  }

  // ---------------- Resultado do chute ----------------
  resolve(shot, kzone) {
    let result;
    if (shot.out) {
      result = shot.post ? 'post' : 'miss';
    } else {
      let p = 0;
      const z = shot.zone;
      if (kzone) {
        const sameCol = kzone.col === z.col, sameRow = kzone.row === z.row;
        if (sameCol && sameRow) p = 0.9;
        else if (sameCol) p = 0.35;
        else if (sameRow && Math.abs(kzone.col - z.col) === 1) p = 0.15;
      } else if (z.col === 1) {
        p = z.row === 0 ? 0.8 : 0.5; // goleiro ficou parado no meio
      }
      result = Math.random() < p ? 'save' : 'goal';
    }

    this.setMsg('');
    this.tweens.add({
      targets: this.kicker, x: 576, y: 662, duration: 420, ease: 'Quad.easeIn',
      onComplete: () => {
        Sound.kick();
        this.tweens.add({ targets: this.kicker, angle: -12, duration: 120, yoyo: true });
        if (this.idle) this.idle.stop();
        this.keeper.x = W / 2;
        this.dive(kzone);
        this.flyBall(shot, result);
      },
    });
  }

  dive(z) {
    if (!z) {
      this.tweens.add({ targets: this.keeper, y: GOAL.bottom - 20, duration: 160, yoyo: true });
      return;
    }
    const c = zoneCenter(z);
    const R = 100 * this.keeper.scale;
    const dir = z.col === 0 ? -1 : z.col === 2 ? 1 : 0;
    const deg = dir * (z.row === 1 ? 55 : 80);
    const th = Phaser.Math.DegToRad(deg);
    // posiciona o centro do corpo do goleiro no centro da zona
    let x = c.x - Math.sin(th) * R, y = c.y + Math.cos(th) * R;
    if (dir === 0 && z.row === 0) y = GOAL.bottom;
    this.tweens.add({ targets: this.keeper, x, y: Math.min(y, GOAL.bottom), angle: deg, duration: 380, ease: 'Cubic.easeOut' });
  }

  flyBall(shot, result) {
    const sx = SPOT.x, sy = SPOT.y;
    let tx = shot.x, ty = shot.y;
    if (result === 'miss') { tx += (tx - sx) * 0.35; ty -= 70; }
    const curve = new Phaser.Curves.QuadraticBezier(
      new Phaser.Math.Vector2(sx, sy),
      new Phaser.Math.Vector2((sx + tx) / 2 + (tx - sx) * 0.15, Math.min(sy, ty) - 50),
      new Phaser.Math.Vector2(tx, ty),
    );
    const groundY = t => sy + 18 + (GOAL.bottom - sy - 18) * t;
    this.tweens.addCounter({
      from: 0, to: 1, duration: 520, ease: 'Sine.easeOut',
      onUpdate: tw => {
        const t = tw.getValue(), pt = curve.getPoint(t);
        this.ball.setPosition(pt.x, pt.y).setScale(1 - 0.5 * t).setAngle(t * 720);
        this.ballShadow.setPosition(pt.x, groundY(t)).setScale(1 - 0.5 * t);
      },
      onComplete: () => this.afterShot(shot, result),
    });
  }

  afterShot(shot, result) {
    const away = shot.x < W / 2 ? -1 : 1;
    if (result === 'goal') {
      Sound.goal();
      this.cameras.main.shake(250, 0.006);
      this.ball.setDepth(5);
      this.tweens.add({ targets: this.net, scaleX: 1.03, scaleY: 1.04, duration: 90, yoyo: true, repeat: 2 });
      this.tweens.add({ targets: this.ball, y: GOAL.bottom - 12, scale: 0.42, duration: 450, ease: 'Bounce.easeOut' });
      this.tweens.add({ targets: this.ballShadow, alpha: 0, duration: 200 });
      this.showBig('GOOOL!', '#ffeb3b');
    } else if (result === 'save') {
      Sound.save();
      this.tweens.add({ targets: this.ball, x: shot.x + away * 240, y: GOAL.bottom + 70, scale: 0.65, angle: 900, duration: 600, ease: 'Quad.easeOut' });
      this.tweens.add({ targets: this.ballShadow, alpha: 0, duration: 200 });
      this.showBig('DEFENDEU!', '#4fc3f7');
    } else if (result === 'post') {
      Sound.post();
      this.tweens.add({ targets: this.ball, x: shot.x + away * 200, y: GOAL.bottom + 120, scale: 0.7, duration: 600, ease: 'Quad.easeOut' });
      this.tweens.add({ targets: this.ballShadow, alpha: 0, duration: 200 });
      this.showBig('NA TRAVE!', '#ff8a65');
    } else {
      Sound.miss();
      this.tweens.add({ targets: [this.ball, this.ballShadow], alpha: 0, duration: 300 });
      this.showBig('PRA FORA!', '#ff8a65');
    }

    this.kicks[this.k].push(result === 'goal');
    this.updateScoreboard();

    this.time.delayedCall(1900, () => {
      const winner = this.decide();
      if (winner === null) {
        this.turn++;
        this.startTurn();
        return;
      }
      Sound.whistle();
      this.time.delayedCall(700, () => this.scene.start('Result', { ...this.data_, kicks: this.kicks, winner }));
    });
  }

  showBig(text, color) {
    this.big.setText(text).setColor(color).setAlpha(1).setScale(0.3);
    this.tweens.add({ targets: this.big, scale: 1, duration: 350, ease: 'Back.easeOut' });
    this.tweens.add({ targets: this.big, alpha: 0, delay: 1300, duration: 400 });
  }
}
