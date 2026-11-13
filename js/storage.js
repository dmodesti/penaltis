// Jogadores ficam salvos só neste navegador (localStorage). Nenhuma foto sai do aparelho.
const Storage = {
  KEY: 'penaltis_players_v1',

  load() {
    try {
      return JSON.parse(localStorage.getItem(this.KEY)) || [];
    } catch (e) {
      return [];
    }
  },

  save(list) {
    try {
      localStorage.setItem(this.KEY, JSON.stringify(list));
      return true;
    } catch (e) {
      alert('Não foi possível salvar (memória do navegador cheia ou bloqueada).');
      return false;
    }
  },

  remove(id) {
    this.save(this.load().filter(p => p.id !== id));
  },
};

// Jogadores fixos, sempre disponíveis.
const CPU = { id: 'cpu', name: 'Computador', color: 0x616161, face: null, cpu: true };
const GUESTS = [
  { id: 'guest1', name: 'Convidado', color: 0x1e88e5, face: null },
  { id: 'guest2', name: 'Convidado 2', color: 0xe53935, face: null },
];
