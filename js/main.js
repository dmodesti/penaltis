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
const IS_IOS = /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
// Aberto pelo ícone da tela de início: já está sem as barras do navegador.
const IS_APP = navigator.standalone === true || matchMedia('(display-mode: fullscreen), (display-mode: standalone)').matches;

function enterFullscreen() {
  if (game.scale.fullscreen.available && !game.scale.isFullscreen) game.scale.startFullscreen();
}

function toggleFullscreen() {
  if (!game.scale.fullscreen.available) return showFullscreenTip();
  if (game.scale.isFullscreen) game.scale.stopFullscreen();
  else enterFullscreen();
}

// iPhone (e alguns navegadores) não deixam sites ficarem em tela cheia:
// o jeito é adicionar o jogo à tela de início e abrir pelo ícone.
function showFullscreenTip() {
  document.getElementById('tip-text').innerHTML = IS_IOS
    ? 'No iPhone, o navegador não deixa sites ficarem em tela cheia.<br><br>Para jogar sem as barras:<br>1. No Safari, toque em <b>Compartilhar</b> (o quadrado com a seta ⬆️).<br>2. Toque em <b>Adicionar à Tela de Início</b>.<br>3. Abra o jogo pelo ícone ⚽ que aparece na tela do celular.'
    : 'Este navegador não deixa o site ficar em tela cheia.<br><br>Abra o menu do navegador (⋮) e toque em <b>Adicionar à tela inicial</b> ou <b>Instalar app</b>. Depois abra o jogo pelo ícone ⚽.';
  game.input.enabled = false;
  document.getElementById('tip').classList.remove('hidden');
}

document.getElementById('tip-ok').onclick = () => {
  document.getElementById('tip').classList.add('hidden');
  game.input.enabled = true;
};

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
