// Cena inicial: gera as texturas desenhadas por código, carrega as fotos e vai para o menu.
class BootScene extends Phaser.Scene {
  constructor() { super('Boot'); }
  create() {
    Art.makeBase(this);
    loadFaces(this, Storage.load()).then(() => this.scene.start('Menu'));
  }
}

// O navegador só libera som depois do primeiro toque/clique.
document.addEventListener('pointerdown', () => Sound.unlock());

window.game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  width: W,
  height: H,
  backgroundColor: '#0d1b3e',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [BootScene, MenuScene, SelectScene, MatchScene, ResultScene],
});
