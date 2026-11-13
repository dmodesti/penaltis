class MenuScene extends Phaser.Scene {
  constructor() { super('Menu'); }

  create() {
    Art.drawStadium(this);
    Art.drawGoal(this);
    Art.dim(this, 0.55);

    const ball = this.add.image(W / 2, 205, 'ball').setScale(2.2);
    this.tweens.add({ targets: ball, angle: 360, duration: 4000, repeat: -1 });
    this.add.text(W / 2, 110, 'PÊNALTIS', textStyle(96, '#ffc107')).setOrigin(0.5);
    this.add.text(W / 2, 275, 'Disputa de pênaltis em família', textStyle(28)).setOrigin(0.5);

    Art.button(this, W / 2, 380, 'Contra o Computador', () => this.scene.start('Select', { mode: 'cpu' }));
    Art.button(this, W / 2, 480, '2 Jogadores', () => this.scene.start('Select', { mode: '2p' }));
    Art.button(this, W / 2, 580, 'Jogadores e Fotos', () => PlayersUI.open(), { color: 0x42a5f5, textColor: '#ffffff' });

    const snd = Art.button(this, 1170, 670, Sound.isMuted() ? 'Som: não' : 'Som: sim', () => {
      snd.label.setText(Sound.toggle() ? 'Som: não' : 'Som: sim');
    }, { w: 180, h: 56, size: 22, color: 0xffffff });

    if (this.scale.fullscreen.available) {
      Art.button(this, 120, 670, 'Tela cheia', () => this.scale.toggleFullscreen(), { w: 200, h: 56, size: 22, color: 0xffffff });
    }
  }
}
