const DIFFS = [
  { id: 'easy', label: 'Fácil' },
  { id: 'normal', label: 'Normal' },
  { id: 'hard', label: 'Difícil' },
];

class SelectScene extends Phaser.Scene {
  constructor() { super('Select'); }

  init(data) {
    this.mode = data.mode;
    this.first = null;
  }

  create() {
    Art.setupCamera(this);
    Art.drawStadium(this);
    Art.dim(this, 0.7);
    this.title = this.add.text(W / 2, 70, '', textStyle(44, '#ffc107')).setOrigin(0.5);
    this.updateTitle();

    const saved = Storage.load();
    this.players = saved.concat(this.mode === 'cpu' ? GUESTS.slice(0, 1) : GUESTS);
    loadFaces(this, this.players.concat(CPU)).then(() => this.buildCards());

    Art.button(this, 170, 660, 'Voltar', () => this.scene.start('Menu'), { w: 220, h: 64, size: 26, color: 0xffffff });
    Art.button(this, W / 2, 660, 'Cadastrar jogadores', () => PlayersUI.open(() => this.scene.restart()), { w: 420, h: 64, size: 26, color: 0x42a5f5, textColor: '#ffffff' });

    if (this.mode === 'cpu') {
      let i = Math.max(0, DIFFS.findIndex(d => d.id === (this.registry.get('diff') || 'normal')));
      const b = Art.button(this, 1090, 660, 'Nível: ' + DIFFS[i].label, () => {
        i = (i + 1) % DIFFS.length;
        this.registry.set('diff', DIFFS[i].id);
        b.label.setText('Nível: ' + DIFFS[i].label);
      }, { w: 300, h: 64, size: 26 });
    }
  }

  updateTitle() {
    if (this.mode === 'cpu') this.title.setText('Quem vai jogar contra o computador?');
    else this.title.setText(this.first ? 'Jogador 2: escolha você' : 'Jogador 1: escolha você');
  }

  buildCards() {
    const list = this.players.slice(0, 12);
    const perRow = 6, cw = 160, ch = 200, gap = 22;
    list.forEach((p, i) => {
      const row = Math.floor(i / perRow);
      const inRow = Math.min(perRow, list.length - row * perRow);
      const x = W / 2 - (inRow * (cw + gap) - gap) / 2 + (i % perRow) * (cw + gap) + cw / 2;
      const y = 250 + row * (ch + 24);
      const card = this.add.container(x, y);
      const g = this.add.graphics();
      const draw = sel => {
        g.clear();
        g.fillStyle(sel ? 0x3a4f80 : 0x1e2a44, 0.95);
        g.fillRoundedRect(-cw / 2, -ch / 2, cw, ch, 16);
        g.lineStyle(sel ? 8 : 4, sel ? 0xffc107 : p.color);
        g.strokeRoundedRect(-cw / 2, -ch / 2, cw, ch, 16);
      };
      draw(false);
      const face = Art.face(this, 0, -22, p, 120, p.color);
      const name = this.add.text(0, 66, p.name, textStyle(22)).setOrigin(0.5);
      if (name.width > cw - 12) name.setScale((cw - 12) / name.width);
      card.add([g, face, name]);
      card.setSize(cw, ch).setInteractive({ useHandCursor: true });
      card.on('pointerover', () => card.setScale(1.05));
      card.on('pointerout', () => card.setScale(1));
      card.on('pointerdown', () => {
        Sound.click();
        this.pick(p, draw);
      });
    });
  }

  pick(p, draw) {
    const diff = this.registry.get('diff') || 'normal';
    if (this.mode === 'cpu') {
      this.scene.start('Match', { mode: 'cpu', a: p, b: CPU, diff });
      return;
    }
    if (!this.first) {
      this.first = { p, draw };
      draw(true);
      this.updateTitle();
    } else if (this.first.p.id === p.id) {
      this.first.draw(false);
      this.first = null;
      this.updateTitle();
    } else {
      this.scene.start('Match', { mode: '2p', a: this.first.p, b: p, diff });
    }
  }
}
