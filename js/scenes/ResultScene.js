class ResultScene extends Phaser.Scene {
  constructor() { super('Result'); }

  init(data) { this.d = data; }

  create() {
    const { a, b, kicks, winner, mode } = this.d;
    const teams = [a, b];
    const champ = teams[winner];
    const goals = kicks.map(k => k.filter(Boolean).length);

    Art.setupCamera(this);
    Art.drawStadium(this);
    Art.drawGoal(this);
    Art.dim(this, 0.6);

    // confete
    const colors = [0xffc107, 0xe53935, 0x1e88e5, 0x43a047, 0xffffff, 0x8e24aa];
    for (let i = 0; i < 90; i++) {
      const r = this.add.rectangle(Math.random() * W, -20 - Math.random() * 400, 10, 16, colors[i % colors.length]);
      this.tweens.add({
        targets: r, y: H + 40, x: r.x + Phaser.Math.Between(-120, 120), angle: Phaser.Math.Between(180, 720),
        duration: Phaser.Math.Between(2500, 4500), repeat: -1, delay: Math.random() * 1500,
      });
    }

    const title = mode === 'cpu' && champ.cpu ? 'O COMPUTADOR VENCEU!' : 'CAMPEÃO!';
    this.add.text(W / 2, 80, title, textStyle(72, '#ffc107')).setOrigin(0.5);
    this.add.text(W / 2, 165, `${a.name}  ${goals[0]} x ${goals[1]}  ${b.name}`, textStyle(40)).setOrigin(0.5);
    if (mode === 'cpu' && champ.cpu) {
      this.add.text(W / 2, 215, 'Bora tentar de novo?', textStyle(28)).setOrigin(0.5);
    }

    const hero = Art.player(this, champ, false).setPosition(W / 2, 600).setScale(1.25);
    this.tweens.add({ targets: hero, y: 570, duration: 350, yoyo: true, repeat: -1, ease: 'Quad.easeOut' });
    let up = false;
    this.time.addEvent({ delay: 350, loop: true, callback: () => hero.setPose((up = !up) ? 'cheer' : 'stand') });

    Art.button(this, 250, 660, 'Jogar de novo', () => this.scene.start('Match', { mode, a, b, diff: this.d.diff }), { w: 360, h: 70 });
    Art.button(this, 1030, 660, 'Menu', () => this.scene.start('Menu'), { w: 260, h: 70, color: 0xffffff });
    Sound.goal();
  }
}
