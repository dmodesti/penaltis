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
  width: W * RES,
  height: H * RES,
  backgroundColor: '#0d1b3e',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    // a página inteira vai para tela cheia, assim a tela de jogadores continua aparecendo
    fullscreenTarget: document.documentElement,
  },
  scene: [BootScene, MenuScene, SelectScene, MatchScene, ResultScene],
});

// ---------- Tela cheia e paisagem ----------
const IS_TOUCH = matchMedia('(pointer: coarse)').matches;

function enterFullscreen() {
  if (game.scale.fullscreen.available && !game.scale.isFullscreen) game.scale.startFullscreen();
}

function toggleFullscreen() {
  if (game.scale.isFullscreen) game.scale.stopFullscreen();
  else enterFullscreen();
}

// Em tela cheia, trava a tela deitada (funciona no Android; o iPhone não permite).
game.scale.on('enterfullscreen', () => {
  try { screen.orientation.lock('landscape').catch(() => {}); } catch (e) { /* sem suporte */ }
});

// No celular, qualquer toque no jogo volta para tela cheia.
if (IS_TOUCH) {
  document.getElementById('game').addEventListener('pointerup', enterFullscreen);
}

// Aviso de "gire o celular": tocar nele já entra em tela cheia deitada quando o aparelho permite.
const rotate = document.getElementById('rotate');
if (document.fullscreenEnabled || document.webkitFullscreenEnabled) {
  rotate.querySelector('small').textContent = 'ou toque aqui para jogar em tela cheia';
}
rotate.addEventListener('pointerup', enterFullscreen);
