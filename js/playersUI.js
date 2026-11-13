// Tela HTML para cadastrar jogadores: nome, cor da camisa e foto do rosto recortada em círculo.
const PlayersUI = (() => {
  const $ = id => document.getElementById(id);
  const CS = 280;      // tamanho do canvas de recorte
  const R = 120;       // raio do círculo do rosto no canvas
  const OUT = 128;     // tamanho final da foto salva

  let onClose = null;
  let editing = null;
  let color = SHIRT_COLORS[0];
  let currentFace = null;
  let crop = null;     // { img, cx, cy, zoom } — cx/cy = ponto da imagem no centro do círculo
  let cropDirty = false;

  const hex = c => '#' + c.toString(16).padStart(6, '0');

  function open(cb) {
    onClose = cb;
    // O Phaser escuta cliques na janela toda; desliga o jogo enquanto o painel está aberto.
    window.game.input.enabled = false;
    $('players-ui').classList.remove('hidden');
    hideForm();
  }

  function close() {
    $('players-ui').classList.add('hidden');
    window.game.input.enabled = true;
    if (onClose) onClose();
  }

  function renderList() {
    const list = Storage.load();
    const el = $('pl-list');
    el.innerHTML = '';
    if (!list.length) {
      el.innerHTML = '<p class="empty">Nenhum jogador ainda. Crie o primeiro!</p>';
      return;
    }
    list.forEach(p => {
      const row = document.createElement('div');
      row.className = 'pl-row';
      const thumb = document.createElement('span');
      thumb.className = 'thumb';
      thumb.style.borderColor = hex(p.color);
      if (p.face) {
        const img = document.createElement('img');
        img.src = p.face;
        thumb.appendChild(img);
      } else {
        thumb.textContent = '🙂';
      }
      const nm = document.createElement('span');
      nm.className = 'nm';
      nm.textContent = p.name;
      const ed = document.createElement('button');
      ed.className = 'ed'; ed.textContent = 'Editar';
      ed.onclick = () => showForm(p);
      const del = document.createElement('button');
      del.className = 'del'; del.textContent = 'Apagar';
      del.onclick = () => {
        if (confirm(`Apagar ${p.name}?`)) { Storage.remove(p.id); renderList(); }
      };
      row.append(thumb, nm, ed, del);
      el.appendChild(row);
    });
  }

  function showForm(p) {
    editing = p || null;
    $('pl-form').classList.remove('hidden');
    $('pl-new').classList.add('hidden');
    $('pl-list').classList.add('hidden');
    $('pl-close').classList.add('hidden');
    $('pl-name').value = p ? p.name : '';
    color = p ? p.color : SHIRT_COLORS[Math.floor(Math.random() * SHIRT_COLORS.length)];
    currentFace = p ? p.face : null;
    crop = null;
    cropDirty = false;
    renderColors();
    if (currentFace) loadImage(currentFace, false);
    else $('crop-wrap').classList.add('hidden');
  }

  function hideForm() {
    $('pl-form').classList.add('hidden');
    $('pl-new').classList.remove('hidden');
    $('pl-list').classList.remove('hidden');
    $('pl-close').classList.remove('hidden');
    renderList();
  }

  function renderColors() {
    const el = $('pl-colors');
    el.innerHTML = '';
    SHIRT_COLORS.forEach(c => {
      const b = document.createElement('button');
      b.className = 'swatch' + (c === color ? ' sel' : '');
      b.style.background = hex(c);
      b.setAttribute('aria-label', 'Cor ' + hex(c));
      b.onclick = () => { color = c; renderColors(); };
      el.appendChild(b);
    });
  }

  function loadImage(src, dirty) {
    const img = new Image();
    img.onload = () => {
      // Reduz fotos grandes do celular para o recorte ficar leve.
      const s = Math.min(1, 900 / Math.max(img.width, img.height));
      const c = document.createElement('canvas');
      c.width = Math.round(img.width * s);
      c.height = Math.round(img.height * s);
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      crop = { img: c, cx: c.width / 2, cy: c.height / 2, zoom: 1 };
      $('crop-zoom').value = 1;
      cropDirty = dirty;
      $('crop-wrap').classList.remove('hidden');
      drawCrop();
      if (src.startsWith('blob:')) URL.revokeObjectURL(src);
    };
    img.onerror = () => alert('Não consegui abrir essa imagem.');
    img.src = src;
  }

  function cropScale() {
    return Math.max((2 * R) / crop.img.width, (2 * R) / crop.img.height) * crop.zoom;
  }

  function drawCrop() {
    if (!crop) return;
    const ctx = $('crop').getContext('2d');
    const s = cropScale();
    ctx.fillStyle = '#222';
    ctx.fillRect(0, 0, CS, CS);
    ctx.drawImage(crop.img, CS / 2 - crop.cx * s, CS / 2 - crop.cy * s, crop.img.width * s, crop.img.height * s);
    ctx.beginPath();
    ctx.rect(0, 0, CS, CS);
    ctx.arc(CS / 2, CS / 2, R, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fill('evenodd');
    ctx.beginPath();
    ctx.arc(CS / 2, CS / 2, R, 0, Math.PI * 2);
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#ffc107';
    ctx.stroke();
  }

  function exportFace() {
    const out = document.createElement('canvas');
    out.width = out.height = OUT;
    const ctx = out.getContext('2d');
    ctx.beginPath();
    ctx.arc(OUT / 2, OUT / 2, OUT / 2, 0, Math.PI * 2);
    ctx.clip();
    const s = cropScale() * (OUT / (2 * R));
    ctx.drawImage(crop.img, OUT / 2 - crop.cx * s, OUT / 2 - crop.cy * s, crop.img.width * s, crop.img.height * s);
    return out.toDataURL('image/png');
  }

  function save() {
    const name = $('pl-name').value.trim();
    if (!name) { alert('Digite um nome.'); return; }
    const face = crop && cropDirty ? exportFace() : currentFace;
    const list = Storage.load();
    if (editing) {
      const i = list.findIndex(p => p.id === editing.id);
      if (i >= 0) list[i] = { ...editing, name, color, face };
    } else {
      list.push({ id: 'p' + Date.now().toString(36), name, color, face });
    }
    if (Storage.save(list)) hideForm();
  }

  // Arrastar a foto dentro do recorte
  let drag = null;
  const canvas = $('crop');
  const toCanvas = e => {
    const r = canvas.getBoundingClientRect();
    return { x: (e.clientX - r.left) * (CS / r.width), y: (e.clientY - r.top) * (CS / r.height) };
  };
  canvas.addEventListener('pointerdown', e => {
    if (!crop) return;
    canvas.setPointerCapture(e.pointerId);
    drag = toCanvas(e);
  });
  canvas.addEventListener('pointermove', e => {
    if (!drag || !crop) return;
    const p = toCanvas(e), s = cropScale();
    crop.cx = Phaser.Math.Clamp(crop.cx - (p.x - drag.x) / s, 0, crop.img.width);
    crop.cy = Phaser.Math.Clamp(crop.cy - (p.y - drag.y) / s, 0, crop.img.height);
    drag = p;
    cropDirty = true;
    drawCrop();
  });
  canvas.addEventListener('pointerup', () => { drag = null; });
  canvas.addEventListener('pointercancel', () => { drag = null; });
  canvas.addEventListener('wheel', e => {
    if (!crop) return;
    e.preventDefault();
    crop.zoom = Phaser.Math.Clamp(crop.zoom * (e.deltaY < 0 ? 1.08 : 0.93), 1, 4);
    $('crop-zoom').value = crop.zoom;
    cropDirty = true;
    drawCrop();
  }, { passive: false });

  $('crop-zoom').addEventListener('input', e => {
    if (!crop) return;
    crop.zoom = +e.target.value;
    cropDirty = true;
    drawCrop();
  });

  $('pl-file').addEventListener('change', e => {
    const f = e.target.files[0];
    if (f) loadImage(URL.createObjectURL(f), true);
    e.target.value = '';
  });
  $('pl-nophoto').onclick = () => {
    currentFace = null; crop = null; cropDirty = false;
    $('crop-wrap').classList.add('hidden');
  };
  $('pl-new').onclick = () => showForm(null);
  $('pl-save').onclick = save;
  $('pl-cancel').onclick = hideForm;
  $('pl-close').onclick = close;

  return { open };
})();
