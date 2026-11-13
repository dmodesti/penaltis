# ⚽ Pênaltis em Família

Disputa de pênaltis por turnos para jogar no navegador (celular ou computador).
Coloque você, seu filho e quem quiser como jogadores, com foto do rosto!

## Como jogar

- **Jogadores e Fotos**: crie jogadores com nome, cor da camisa e foto. Arraste a foto para
  encaixar o rosto no contorno (formato de rosto) e use a barra para dar zoom.
- **Cenário**: no menu, escolha entre Grama, Quadra, Areia e Cimento.
- **Contra o Computador**: você bate e defende, alternando. Escolha o nível (Fácil / Normal / Difícil).
- **2 Jogadores**: no mesmo aparelho. O goleiro escolhe o canto em segredo, passa o aparelho, e o batedor chuta.

**Chutar:** arraste o dedo (ou o mouse) da parte de baixo da tela para cima, na direção do gol.
A direção escolhe o canto; o tamanho do arrasto escolhe a altura — forte demais vai por cima!

**Defender:** toque em um dos 6 cantos do gol.

Regras: 5 cobranças para cada lado; acaba antes se um lado não puder mais alcançar o outro;
empatou, vai para a morte súbita.

> As fotos ficam salvas **só no navegador do aparelho** (localStorage). Elas não vão para o GitHub.
> Cada aparelho tem seus próprios jogadores.

## Rodar no computador

Abra o `index.html` com dois cliques, ou (melhor) rode um servidor local nesta pasta:

```bash
python -m http.server 8000
```

e abra http://localhost:8000

## Publicar no GitHub Pages (grátis)

1. Crie uma conta em https://github.com e clique em **New repository** (ex.: `penaltis`, público).
2. Na página do repositório, clique em **Add file → Upload files** e arraste **o conteúdo desta pasta**
   (`index.html`, `css/`, `js/`, `README.md`). Clique em **Commit changes**.
3. Vá em **Settings → Pages**. Em *Source*, escolha **Deploy from a branch**, branch **main**, pasta **/ (root)**, e salve.
4. Em 1–2 minutos o jogo estará em `https://SEU-USUARIO.github.io/penaltis/` — abra no celular e jogue!

Para atualizar depois, é só subir os arquivos alterados de novo.

## Como o jogo é feito

- **Engine:** [Phaser 3](https://phaser.io) (gratuita, JavaScript), carregada direto do CDN — não precisa instalar nada.
- **Gráficos:** desenhados por código em `js/art.js` (campo, gol, bola, jogadores). O rosto é a foto recortada em círculo.
  Para deixar mais bonito, dá para trocar por imagens prontas e gratuitas, como as do [Kenney.nl](https://kenney.nl/assets) (licença CC0).
- **Sons:** sintetizados em `js/sound.js`, sem arquivos de áudio.

```
index.html            página do jogo
css/style.css         estilo da página e da tela de jogadores
js/art.js             gráficos desenhados por código (jogadores, bola, gol)
js/scenery.js         cenários: grama, quadra, areia e cimento
js/sound.js           efeitos sonoros
js/storage.js         jogadores salvos no navegador
js/playersUI.js       cadastro de jogadores e recorte da foto
js/scenes/*.js        telas: Menu, Seleção, Partida, Resultado
js/main.js            configuração do Phaser
```
