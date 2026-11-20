/**
 * TransLog KM — Controle Operacional de Quilometragem de Transportadora
 * Arquitetura: HTML5 + CSS3 + Vanilla JS (Sem dependências externas / Sem Backend)
 * Persistência: localStorage em formato JSON
 */

(function () {
  'use strict';

  // ==================== CONSTANTES E CHAVES DE ARMAZENAMENTO ====================
  const STORAGE_KEYS = {
    VEICULOS: 'translog_km_veiculos_v1',
    ANOTACOES: 'translog_km_anotacoes_v1',
    DEMO_FLAG: 'translog_km_demo_ativo_v1'
  };

  // ==================== ESTADO DA APLICAÇÃO ====================
  let state = {
    veiculos: [],
    anotacoes: [],
    isDemo: false,
    currentDetailId: null
  };

  // ==================== UTILITÁRIOS DE FORMATAÇÃO E VALIDAÇÃO ====================
  function gerarId() {
    return Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 7);
  }

  function hojeISO() {
    const d = new Date();
    const ano = d.getFullYear();
    const mes = String(d.getMonth() + 1).padStart(2, '0');
    const dia = String(d.getDate()).padStart(2, '0');
    return `${ano}-${mes}-${dia}`;
  }

  /**
   * Converte data YYYY-MM-DD para DD/MM/AAAA
   */
  function formatarDataBR(dataISO) {
    if (!dataISO || typeof dataISO !== 'string') return '-';
    const partes = dataISO.split('-');
    if (partes.length !== 3) return dataISO;
    return `${partes[2]}/${partes[1]}/${partes[0]}`;
  }

  /**
   * Formata número de quilometragem no padrão brasileiro (ex: 1.250 ou 385,5)
   */
  function formatarKM(valor) {
    const num = Number(valor) || 0;
    const temDecimal = !Number.isInteger(num);
    return num.toLocaleString('pt-BR', {
      minimumFractionDigits: temDecimal ? 1 : 0,
      maximumFractionDigits: 1
    });
  }

  /**
   * Converte entrada de texto (ex: "1.240,5" ou "385") em número válido
   */
  function parseKM(texto) {
    if (typeof texto === 'number') return texto;
    if (!texto) return NaN;
    const limpo = String(texto).trim().replace(/\./g, '').replace(',', '.');
    return parseFloat(limpo);
  }

  /**
   * Normaliza placa para maiúsculas sem caracteres inválidos (Mercosul ou Antiga)
   */
  function normalizarPlaca(valor) {
    return String(valor || '')
      .toUpperCase()
      .replace(/[^A-Z0-9-]/g, '')
      .slice(0, 8);
  }

  function validarPlaca(placa) {
    const limpa = placa.replace('-', '');
    // Padrão antigo (AAA1234) ou Mercosul (AAA1A23)
    return /^[A-Z]{3}[0-9][A-Z0-9][0-9]{2}$/.test(limpa);
  }

  function escapeHTML(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function mostrarToast(mensagem) {
    const toast = document.getElementById('toast');
    toast.textContent = mensagem;
    toast.classList.add('show');
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => {
      toast.classList.remove('show');
    }, 3200);
  }

  // ==================== DADOS DEMONSTRATIVOS INICIAIS ====================
  function obterDadosDemonstrativos() {
    const hoje = hojeISO();
    const ontemDate = new Date();
    ontemDate.setDate(ontemDate.getDate() - 1);
    const ontem = ontemDate.toISOString().slice(0, 10);

    const doisDiasDate = new Date();
    doisDiasDate.setDate(doisDiasDate.getDate() - 2);
    const doisDias = doisDiasDate.toISOString().slice(0, 10);

    const veiculos = [
      {
        id: 'v-demo-1',
        placa: 'ABC1D23',
        modelo: 'Volvo FH 540',
        motorista: 'João Silva',
        frota: 'FROTA-01'
      },
      {
        id: 'v-demo-2',
        placa: 'BRA4E56',
        modelo: 'Scania R450',
        motorista: 'Carlos Mendes',
        frota: 'FROTA-02'
      },
      {
        id: 'v-demo-3',
        placa: 'MER7G89',
        modelo: 'Mercedes-Benz Actros 2651',
        motorista: 'Marcos Oliveira',
        frota: 'FROTA-03'
      }
    ];

    const anotacoes = [
      {
        id: 'a-demo-1',
        data: hoje,
        categoria: 'Viagem nacional',
        veiculoId: 'v-demo-1',
        veiculoModelo: 'Volvo FH 540',
        placa: 'ABC1D23',
        motorista: 'João Silva',
        km: 385,
        cidade: 'Campinas',
        uf: 'SP',
        observacao: 'Deslocamento para operação de entrega.'
      },
      {
        id: 'a-demo-2',
        data: hoje,
        categoria: 'Coleta',
        veiculoId: 'v-demo-2',
        veiculoModelo: 'Scania R450',
        placa: 'BRA4E56',
        motorista: 'Carlos Mendes',
        km: 142,
        cidade: 'Jundiaí',
        uf: 'SP',
        observacao: 'Coleta de carga paletizada no centro logístico.'
      },
      {
        id: 'a-demo-3',
        data: ontem,
        categoria: 'Transferência',
        veiculoId: 'v-demo-3',
        veiculoModelo: 'Mercedes-Benz Actros 2651',
        placa: 'MER7G89',
        motorista: 'Marcos Oliveira',
        km: 510,
        cidade: 'Belo Horizonte',
        uf: 'MG',
        observacao: 'Transferência entre filiais SP -> MG.'
      },
      {
        id: 'a-demo-4',
        data: doisDias,
        categoria: 'Entrega',
        veiculoId: 'v-demo-1',
        veiculoModelo: 'Volvo FH 540',
        placa: 'ABC1D23',
        motorista: 'João Silva',
        km: 430,
        cidade: 'Curitiba',
        uf: 'PR',
        observacao: 'Entrega dedicada concluída sem ocorrências.'
      }
    ];

    return { veiculos, anotacoes };
  }

  // ==================== CAMADA DE PERSISTÊNCIA (LOCALSTORAGE) ====================
  function carregarDados() {
    try {
      const rawVeiculos = localStorage.getItem(STORAGE_KEYS.VEICULOS);
      const rawAnotacoes = localStorage.getItem(STORAGE_KEYS.ANOTACOES);
      const demoFlag = localStorage.getItem(STORAGE_KEYS.DEMO_FLAG);

      if (rawVeiculos === null && rawAnotacoes === null) {
        // Primeira execução: popula com dados demonstrativos
        const demo = obterDadosDemonstrativos();
        state.veiculos = demo.veiculos;
        state.anotacoes = demo.anotacoes;
        state.isDemo = true;
        salvarDados();
      } else {
        state.veiculos = rawVeiculos ? JSON.parse(rawVeiculos) : [];
        state.anotacoes = rawAnotacoes ? JSON.parse(rawAnotacoes) : [];
        state.isDemo = demoFlag === 'true';
      }
    } catch (erro) {
      console.error('Erro ao ler localStorage:', erro);
      state.veiculos = [];
      state.anotacoes = [];
    }
  }

  function salvarDados() {
    localStorage.setItem(STORAGE_KEYS.VEICULOS, JSON.stringify(state.veiculos));
    localStorage.setItem(STORAGE_KEYS.ANOTACOES, JSON.stringify(state.anotacoes));
    localStorage.setItem(STORAGE_KEYS.DEMO_FLAG, state.isDemo ? 'true' : 'false');
  }

  // ==================== NAVEGAÇÃO ENTRE TELAS ====================
  function navegarPara(secaoId) {
    document.querySelectorAll('.view-section').forEach((sec) => {
      sec.classList.toggle('active', sec.id === `sec-${secaoId}`);
    });

    document.querySelectorAll('.nav-item').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.target === secaoId);
    });

    fecharMenuMobile();
    window.scrollTo({ top: 0, behavior: 'smooth' });

    if (secaoId === 'dashboard') renderDashboard();
    if (secaoId === 'nova-anotacao') prepararFormularioAnotacao();
    if (secaoId === 'historico') renderHistorico();
    if (secaoId === 'veiculos') renderVeiculos();
    if (secaoId === 'relatorios') renderRelatorios();
  }

  function abrirMenuMobile() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    const btn = document.getElementById('btn-mobile-menu');
    sidebar.classList.add('open');
    overlay.hidden = false;
    btn.setAttribute('aria-expanded', 'true');
  }

  function fecharMenuMobile() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    const btn = document.getElementById('btn-mobile-menu');
    sidebar.classList.remove('open');
    overlay.hidden = true;
    btn.setAttribute('aria-expanded', 'false');
  }

  // ==================== 1. DASHBOARD ====================
  function renderDashboard() {
    const totalAnotacoes = state.anotacoes.length;
    const totalKm = state.anotacoes.reduce((acc, item) => acc + (Number(item.km) || 0), 0);
    const totalVeiculos = state.veiculos.length;

    const hoje = hojeISO();
    const kmHoje = state.anotacoes
      .filter((a) => a.data === hoje)
      .reduce((acc, item) => acc + (Number(item.km) || 0), 0);

    document.getElementById('kpi-total-anotacoes').textContent = totalAnotacoes.toLocaleString('pt-BR');
    document.getElementById('kpi-total-km').textContent = `${formatarKM(totalKm)} km`;
    document.getElementById('kpi-total-veiculos').textContent = totalVeiculos.toLocaleString('pt-BR');
    document.getElementById('kpi-km-hoje').textContent = `${formatarKM(kmHoje)} km`;

    // Banner de dados demonstrativos
    const demoBanner = document.getElementById('demo-banner');
    demoBanner.hidden = !state.isDemo;

    // Últimas 5 anotações
    const container = document.getElementById('dashboard-recent-list');
    const recentes = [...state.anotacoes]
      .sort((a, b) => b.data.localeCompare(a.data))
      .slice(0, 5);

    if (recentes.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <p>Nenhuma anotação registrada ainda.</p>
          <button type="button" class="btn btn-primary btn-sm" style="margin-top:0.75rem" data-goto="nova-anotacao">Criar Primeira Anotação</button>
        </div>
      `;
      return;
    }

    container.innerHTML = recentes
      .map(
        (item) => `
        <div class="recent-item">
          <div class="recent-main">
            <div>
              <span class="cat-badge">${escapeHTML(item.categoria)}</span>
              <span class="recent-title" style="margin-left:0.35rem">${escapeHTML(item.placa)} — ${escapeHTML(item.veiculoModelo || 'Veículo')}</span>
            </div>
            <div class="recent-meta">
              ${formatarDataBR(item.data)} • ${escapeHTML(item.cidade)}/${escapeHTML(item.uf)}
              ${item.motorista ? ` • Mot.: ${escapeHTML(item.motorista)}` : ''}
            </div>
          </div>
          <div class="recent-right">
            <span class="km-badge">${formatarKM(item.km)} km</span>
            <button type="button" class="action-icon-btn wpp js-share-single" data-id="${item.id}" title="Compartilhar no WhatsApp">WhatsApp</button>
          </div>
        </div>
      `
      )
      .join('');
  }

  // ==================== 2. CADASTRO DE VEÍCULOS ====================
  function renderVeiculos() {
    const termo = (document.getElementById('busca-veiculo').value || '').trim().toLowerCase();
    const lista = document.getElementById('lista-veiculos');

    const filtrados = state.veiculos.filter((v) => {
      if (!termo) return true;
      return (
        v.placa.toLowerCase().includes(termo) ||
        v.modelo.toLowerCase().includes(termo) ||
        (v.motorista && v.motorista.toLowerCase().includes(termo)) ||
        (v.frota && v.frota.toLowerCase().includes(termo))
      );
    });

    if (filtrados.length === 0) {
      lista.innerHTML = `<div class="empty-state" style="grid-column:1/-1">Nenhum veículo encontrado.</div>`;
      return;
    }

    lista.innerHTML = filtrados
      .map(
        (v) => `
        <article class="vehicle-card">
          <div>
            <div>
              <span class="vehicle-plate-tag">${escapeHTML(v.placa)}</span>
              ${v.frota ? `<span class="vehicle-fleet-tag">${escapeHTML(v.frota)}</span>` : ''}
            </div>
            <div class="vehicle-model">${escapeHTML(v.modelo)}</div>
            <div class="vehicle-driver">Motorista: ${escapeHTML(v.motorista || 'Não definido')}</div>
          </div>
          <div class="vehicle-actions">
            <button type="button" class="btn btn-sm btn-secondary js-edit-veiculo" data-id="${v.id}">Editar</button>
            <button type="button" class="btn btn-sm btn-danger js-del-veiculo" data-id="${v.id}">Excluir</button>
          </div>
        </article>
      `
      )
      .join('');
  }

  function salvarVeiculo(e) {
    e.preventDefault();
    const id = document.getElementById('veiculo-id').value;
    const placa = normalizarPlaca(document.getElementById('veiculo-placa').value);
    const modelo = document.getElementById('veiculo-modelo').value.trim();
    const motorista = document.getElementById('veiculo-motorista').value.trim();
    const frota = document.getElementById('veiculo-frota').value.trim().toUpperCase();

    if (!placa || !validarPlaca(placa)) {
      mostrarToast('Informe uma placa válida (ex: ABC1D23 ou ABC-1234).');
      document.getElementById('veiculo-placa').focus();
      return;
    }

    if (!modelo) {
      mostrarToast('Informe o modelo do veículo.');
      document.getElementById('veiculo-modelo').focus();
      return;
    }

    // Verifica duplicidade de placa
    const duplicado = state.veiculos.some(
      (v) => v.placa.replace('-', '') === placa.replace('-', '') && v.id !== id
    );
    if (duplicado) {
      mostrarToast('Já existe um veículo cadastrado com esta placa.');
      return;
    }

    if (id) {
      const idx = state.veiculos.findIndex((v) => v.id === id);
      if (idx !== -1) {
        state.veiculos[idx] = { id, placa, modelo, motorista, frota };
        mostrarToast('Veículo atualizado com sucesso!');
      }
    } else {
      state.veiculos.push({
        id: gerarId(),
        placa,
        modelo,
        motorista,
        frota
      });
      mostrarToast('Veículo cadastrado com sucesso!');
    }

    salvarDados();
    resetarFormularioVeiculo();
    renderVeiculos();
    atualizarSelectsVeiculos();
  }

  function editarVeiculo(id) {
    const v = state.veiculos.find((item) => item.id === id);
    if (!v) return;

    document.getElementById('veiculo-id').value = v.id;
    document.getElementById('veiculo-placa').value = v.placa;
    document.getElementById('veiculo-modelo').value = v.modelo;
    document.getElementById('veiculo-motorista').value = v.motorista || '';
    document.getElementById('veiculo-frota').value = v.frota || '';

    document.getElementById('form-veiculo-title').textContent = 'Editar Veículo';
    document.getElementById('btn-submit-veiculo-text').textContent = 'Atualizar Veículo';
    document.getElementById('btn-cancel-veiculo').hidden = false;
    document.getElementById('veiculo-placa').focus();
  }

  function excluirVeiculo(id) {
    const v = state.veiculos.find((item) => item.id === id);
    if (!v) return;

    if (!confirm(`Deseja realmente excluir o veículo ${v.placa} (${v.modelo})?`)) return;

    state.veiculos = state.veiculos.filter((item) => item.id !== id);
    salvarDados();
    renderVeiculos();
    atualizarSelectsVeiculos();
    mostrarToast('Veículo excluído.');
  }

  function resetarFormularioVeiculo() {
    document.getElementById('form-veiculo').reset();
    document.getElementById('veiculo-id').value = '';
    document.getElementById('form-veiculo-title').textContent = 'Cadastrar Novo Veículo';
    document.getElementById('btn-submit-veiculo-text').textContent = 'Salvar Veículo';
    document.getElementById('btn-cancel-veiculo').hidden = true;
  }

  function atualizarSelectsVeiculos() {
    const selectForm = document.getElementById('anotacao-veiculo');
    const selectFiltro = document.getElementById('filtro-veiculo');
    const selectWpp = document.getElementById('wpp-select-veiculo');

    const opcoes = state.veiculos
      .map(
        (v) =>
          `<option value="${v.id}">${escapeHTML(v.placa)} — ${escapeHTML(v.modelo)}${
            v.frota ? ` (${escapeHTML(v.frota)})` : ''
          }</option>`
      )
      .join('');

    selectForm.innerHTML = `<option value="">Selecione um veículo...</option>${opcoes}`;
    selectFiltro.innerHTML = `<option value="">Todos os veículos</option>${opcoes}`;
    selectWpp.innerHTML = state.veiculos.length
      ? opcoes
      : `<option value="">Nenhum veículo cadastrado</option>`;
  }

  // ==================== 3. REGISTRO DE ANOTAÇÕES DE QUILOMETRAGEM ====================
  function prepararFormularioAnotacao() {
    atualizarSelectsVeiculos();
    const idAtual = document.getElementById('anotacao-id').value;
    if (!idAtual) {
      document.getElementById('anotacao-data').value = hojeISO();
    }
  }

  function aoSelecionarVeiculoNoForm() {
    const veiculoId = document.getElementById('anotacao-veiculo').value;
    const veiculo = state.veiculos.find((v) => v.id === veiculoId);

    if (veiculo) {
      document.getElementById('anotacao-placa').value = veiculo.placa;
      document.getElementById('anotacao-motorista').value = veiculo.motorista || '';
    } else {
      document.getElementById('anotacao-placa').value = '';
      document.getElementById('anotacao-motorista').value = '';
    }
  }

  function salvarAnotacao(abrirWhatsappDepois = false) {
    const id = document.getElementById('anotacao-id').value;
    const veiculoId = document.getElementById('anotacao-veiculo').value;
    const data = document.getElementById('anotacao-data').value;
    const categoria = document.getElementById('anotacao-categoria').value;
    const motorista = document.getElementById('anotacao-motorista').value.trim();
    const kmValor = parseKM(document.getElementById('anotacao-km').value);
    const cidade = document.getElementById('anotacao-cidade').value.trim();
    const uf = document.getElementById('anotacao-uf').value;
    const observacao = document.getElementById('anotacao-obs').value.trim();

    if (!veiculoId) {
      mostrarToast('Selecione um veículo da frota.');
      document.getElementById('anotacao-veiculo').focus();
      return;
    }

    if (!data) {
      mostrarToast('Informe a data da anotação.');
      document.getElementById('anotacao-data').focus();
      return;
    }

    if (isNaN(kmValor) || kmValor <= 0) {
      mostrarToast('Informe uma quilometragem válida maior que zero.');
      document.getElementById('anotacao-km').focus();
      return;
    }

    if (!cidade) {
      mostrarToast('Informe a cidade.');
      document.getElementById('anotacao-cidade').focus();
      return;
    }

    if (!uf) {
      mostrarToast('Selecione o estado (UF).');
      document.getElementById('anotacao-uf').focus();
      return;
    }

    const veiculo = state.veiculos.find((v) => v.id === veiculoId);
    const registroId = id || gerarId();

    const registro = {
      id: registroId,
      data,
      categoria,
      veiculoId,
      veiculoModelo: veiculo ? veiculo.modelo : '',
      placa: veiculo ? veiculo.placa : document.getElementById('anotacao-placa').value,
      motorista,
      km: kmValor,
      cidade,
      uf,
      observacao
    };

    if (id) {
      const idx = state.anotacoes.findIndex((a) => a.id === id);
      if (idx !== -1) state.anotacoes[idx] = registro;
      mostrarToast('Anotação atualizada com sucesso!');
    } else {
      state.anotacoes.push(registro);
      mostrarToast('Anotação de quilometragem salva!');
    }

    salvarDados();
    resetarFormularioAnotacao();

    if (abrirWhatsappDepois) {
      abrirModalWhatsApp('individual', registroId);
    } else {
      navegarPara('historico');
    }
  }

  function editarAnotacao(id) {
    const a = state.anotacoes.find((item) => item.id === id);
    if (!a) return;

    navegarPara('nova-anotacao');
    atualizarSelectsVeiculos();

    document.getElementById('anotacao-id').value = a.id;
    document.getElementById('anotacao-veiculo').value = a.veiculoId;
    document.getElementById('anotacao-placa').value = a.placa;
    document.getElementById('anotacao-motorista').value = a.motorista || '';
    document.getElementById('anotacao-data').value = a.data;
    document.getElementById('anotacao-categoria').value = a.categoria;
    document.getElementById('anotacao-km').value = formatarKM(a.km);
    document.getElementById('anotacao-cidade').value = a.cidade;
    document.getElementById('anotacao-uf').value = a.uf;
    document.getElementById('anotacao-obs').value = a.observacao || '';

    document.getElementById('title-nova-anotacao').textContent = 'Editar Anotação de Quilometragem';
    document.getElementById('btn-submit-anotacao-text').textContent = 'Atualizar Anotação';
    document.getElementById('btn-cancel-anotacao').hidden = false;
  }

  function excluirAnotacao(id) {
    if (!confirm('Deseja realmente excluir esta anotação de quilometragem?')) return;
    state.anotacoes = state.anotacoes.filter((a) => a.id !== id);
    salvarDados();
    renderHistorico();
    renderDashboard();
    mostrarToast('Anotação excluída.');
  }

  function resetarFormularioAnotacao() {
    document.getElementById('form-anotacao').reset();
    document.getElementById('anotacao-id').value = '';
    document.getElementById('anotacao-data').value = hojeISO();
    document.getElementById('title-nova-anotacao').textContent = 'Nova Anotação de Quilometragem';
    document.getElementById('btn-submit-anotacao-text').textContent = 'Salvar Anotação';
    document.getElementById('btn-cancel-anotacao').hidden = true;
  }

  // ==================== 4. HISTÓRICO DE ANOTAÇÕES ====================
  function popularFiltroEstados() {
    const selectUf = document.getElementById('filtro-uf');
    const atual = selectUf.value;
    const ufsPresentes = [...new Set(state.anotacoes.map((a) => a.uf).filter(Boolean))].sort();

    selectUf.innerHTML =
      `<option value="">Todos os estados</option>` +
      ufsPresentes.map((uf) => `<option value="${uf}">${uf}</option>`).join('');

    if (ufsPresentes.includes(atual)) selectUf.value = atual;
  }

  function obterAnotacoesFiltradas() {
    const placa = normalizarPlaca(document.getElementById('filtro-placa').value).replace('-', '');
    const veiculoId = document.getElementById('filtro-veiculo').value;
    const categoria = document.getElementById('filtro-categoria').value;
    const uf = document.getElementById('filtro-uf').value;
    const dataIni = document.getElementById('filtro-data-ini').value;
    const dataFim = document.getElementById('filtro-data-fim').value;
    const ordem = document.getElementById('filtro-ordem').value;

    const filtradas = state.anotacoes.filter((a) => {
      if (placa && !a.placa.replace('-', '').includes(placa)) return false;
      if (veiculoId && a.veiculoId !== veiculoId) return false;
      if (categoria && a.categoria !== categoria) return false;
      if (uf && a.uf !== uf) return false;
      if (dataIni && a.data < dataIni) return false;
      if (dataFim && a.data > dataFim) return false;
      return true;
    });

    filtradas.sort((a, b) => {
      if (ordem === 'asc') return a.data.localeCompare(b.data);
      if (ordem === 'km-desc') return (Number(b.km) || 0) - (Number(a.km) || 0);
      return b.data.localeCompare(a.data);
    });

    return filtradas;
  }

  function renderHistorico() {
    atualizarSelectsVeiculos();
    popularFiltroEstados();

    const lista = obterAnotacoesFiltradas();
    const totalKm = lista.reduce((acc, item) => acc + (Number(item.km) || 0), 0);

    document.getElementById('historico-count').textContent = `${lista.length} registro(s) encontrado(s)`;
    document.getElementById('historico-total-km').textContent = `Total filtrado: ${formatarKM(totalKm)} km`;

    const tbody = document.getElementById('historico-table-body');
    const cardsContainer = document.getElementById('historico-cards-list');

    if (lista.length === 0) {
      tbody.innerHTML = `<tr><td colspan="8" class="empty-state">Nenhuma anotação encontrada para os filtros selecionados.</td></tr>`;
      cardsContainer.innerHTML = `<div class="card empty-state">Nenhuma anotação encontrada para os filtros selecionados.</div>`;
      return;
    }

    // Renderização Tabela (Desktop)
    tbody.innerHTML = lista
      .map(
        (a) => `
        <tr>
          <td><strong>${formatarDataBR(a.data)}</strong></td>
          <td><span class="cat-badge">${escapeHTML(a.categoria)}</span></td>
          <td>
            <strong>${escapeHTML(a.placa)}</strong><br />
            <small style="color:var(--text-muted)">${escapeHTML(a.veiculoModelo || '')}</small>
          </td>
          <td>${escapeHTML(a.motorista || '-')}</td>
          <td><strong>${formatarKM(a.km)} km</strong></td>
          <td>${escapeHTML(a.cidade)}/${escapeHTML(a.uf)}</td>
          <td style="max-width:220px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;" title="${escapeHTML(a.observacao)}">
            ${escapeHTML(a.observacao || '-')}
          </td>
          <td class="text-right">
            <div class="table-actions">
              <button type="button" class="action-icon-btn js-view-anotacao" data-id="${a.id}" title="Ver detalhes">Ver</button>
              <button type="button" class="action-icon-btn wpp js-share-single" data-id="${a.id}" title="Enviar no WhatsApp">WPP</button>
              <button type="button" class="action-icon-btn js-edit-anotacao" data-id="${a.id}" title="Editar">Editar</button>
              <button type="button" class="action-icon-btn del js-del-anotacao" data-id="${a.id}" title="Excluir">Excluir</button>
            </div>
          </td>
        </tr>
      `
      )
      .join('');

    // Renderização Cards (Celular)
    cardsContainer.innerHTML = lista
      .map(
        (a) => `
        <article class="history-card">
          <div class="history-card-top">
            <span class="history-card-date">${formatarDataBR(a.data)}</span>
            <span class="cat-badge">${escapeHTML(a.categoria)}</span>
          </div>
          <div class="history-card-plate">${escapeHTML(a.placa)} — ${formatarKM(a.km)} km</div>
          <div class="history-card-details">
            <span><strong>Veículo:</strong> ${escapeHTML(a.veiculoModelo || '-')}</span>
            <span><strong>Motorista:</strong> ${escapeHTML(a.motorista || 'Não informado')}</span>
            <span><strong>Local:</strong> ${escapeHTML(a.cidade)}/${escapeHTML(a.uf)}</span>
            ${a.observacao ? `<span><strong>Obs:</strong> ${escapeHTML(a.observacao)}</span>` : ''}
          </div>
          <div class="history-card-actions">
            <button type="button" class="action-icon-btn js-view-anotacao" data-id="${a.id}">Detalhes</button>
            <button type="button" class="action-icon-btn wpp js-share-single" data-id="${a.id}">WhatsApp</button>
            <button type="button" class="action-icon-btn js-edit-anotacao" data-id="${a.id}">Editar</button>
            <button type="button" class="action-icon-btn del js-del-anotacao" data-id="${a.id}">Excluir</button>
          </div>
        </article>
      `
      )
      .join('');
  }

  function abrirDetalhesAnotacao(id) {
    const a = state.anotacoes.find((item) => item.id === id);
    if (!a) return;

    state.currentDetailId = id;
    const body = document.getElementById('modal-detalhes-body');
    body.innerHTML = `
      <div class="detail-grid">
        <div class="detail-item"><span>Data</span><strong>${formatarDataBR(a.data)}</strong></div>
        <div class="detail-item"><span>Categoria</span><strong>${escapeHTML(a.categoria)}</strong></div>
        <div class="detail-item"><span>Veículo</span><strong>${escapeHTML(a.veiculoModelo || '-')}</strong></div>
        <div class="detail-item"><span>Placa</span><strong>${escapeHTML(a.placa)}</strong></div>
        <div class="detail-item"><span>Motorista</span><strong>${escapeHTML(a.motorista || 'Não informado')}</strong></div>
        <div class="detail-item"><span>Quilometragem</span><strong>${formatarKM(a.km)} km</strong></div>
        <div class="detail-item" style="grid-column:1/-1"><span>Localização</span><strong>${escapeHTML(a.cidade)}/${escapeHTML(a.uf)}</strong></div>
        <div class="detail-item" style="grid-column:1/-1"><span>Observação</span><strong>${escapeHTML(a.observacao || 'Nenhuma observação registrada.')}</strong></div>
      </div>
    `;
    document.getElementById('modal-detalhes').hidden = false;
  }

  // ==================== 5. COMPARTILHAMENTO PELO WHATSAPP ====================
  function formatarMensagemIndividual(a) {
    const linhas = [
      'RELATÓRIO OPERACIONAL – TRANSPORTADORA',
      `Data: ${formatarDataBR(a.data)}`,
      `🚛 Veículo: ${a.veiculoModelo || 'Não informado'}`,
      `Placa: ${a.placa}`,
      `👤 Motorista: ${a.motorista || 'Não informado'}`,
      `📌 Categoria: ${a.categoria}`,
      `📍 Localização: ${a.cidade}/${a.uf}`,
      `🛣️ KM rodados: ${formatarKM(a.km)} km`
    ];

    if (a.observacao) {
      linhas.push(`📝 Observação: ${a.observacao}`);
    }

    linhas.push(`Total de KM registrados: ${formatarKM(a.km)} km`);
    linhas.push('Relatório gerado pelo Sistema Operacional da Transportadora.');
    return linhas.join('
');
  }

  function formatarMensagemGrupo(tituloPeriodo, lista) {
    if (!lista || lista.length === 0) {
      return 'Nenhum registro encontrado para o filtro selecionado.';
    }

    const totalKm = lista.reduce((acc, item) => acc + (Number(item.km) || 0), 0);
    const linhas = [
      'RELATÓRIO OPERACIONAL – TRANSPORTADORA',
      tituloPeriodo,
      `Registros: ${lista.length}`,
      '--------------------------------'
    ];

    lista.forEach((a, index) => {
      linhas.push(
        `${index + 1}. ${formatarDataBR(a.data)} | 🚛 ${a.placa} (${a.veiculoModelo || 'Veículo'})`,
        `   👤 Mot.: ${a.motorista || 'N/I'} | 📌 ${a.categoria}`,
        `   📍 ${a.cidade}/${a.uf} | 🛣️ ${formatarKM(a.km)} km`
      );
      if (a.observacao) {
        linhas.push(`   📝 Obs: ${a.observacao}`);
      }
    });

    linhas.push('--------------------------------');
    linhas.push(`Total de KM registrados: ${formatarKM(totalKm)} km`);
    linhas.push('Relatório gerado pelo Sistema Operacional da Transportadora.');
    return linhas.join('
');
  }

  function abrirModalWhatsApp(modoInicial = 'individual', registroId = null) {
    atualizarSelectsVeiculos();

    const selectAnotacao = document.getElementById('wpp-select-anotacao');
    const ordenadas = [...state.anotacoes].sort((a, b) => b.data.localeCompare(a.data));

    selectAnotacao.innerHTML = ordenadas.length
      ? ordenadas
          .map(
            (a) =>
              `<option value="${a.id}">${formatarDataBR(a.data)} — ${escapeHTML(a.placa)} (${formatarKM(a.km)} km - ${escapeHTML(a.categoria)})</option>`
          )
          .join('')
      : `<option value="">Nenhuma anotação disponível</option>`;

    document.getElementById('wpp-modo').value = modoInicial;
    document.getElementById('wpp-select-dia').value = hojeISO();
    document.getElementById('wpp-periodo-ini').value = hojeISO();
    document.getElementById('wpp-periodo-fim').value = hojeISO();

    if (registroId && ordenadas.some((a) => a.id === registroId)) {
      selectAnotacao.value = registroId;
    }

    atualizarSubopcoesWhatsApp();
    document.getElementById('modal-whatsapp').hidden = false;
  }

  function atualizarSubopcoesWhatsApp() {
    const modo = document.getElementById('wpp-modo').value;
    document.getElementById('wpp-opt-individual').hidden = modo !== 'individual';
    document.getElementById('wpp-opt-dia').hidden = modo !== 'dia';
    document.getElementById('wpp-opt-veiculo').hidden = modo !== 'veiculo';
    document.getElementById('wpp-opt-periodo').hidden = modo !== 'periodo';

    gerarPreviewWhatsApp();
  }

  function gerarPreviewWhatsApp() {
    const modo = document.getElementById('wpp-modo').value;
    let texto = '';

    if (modo === 'individual') {
      const id = document.getElementById('wpp-select-anotacao').value;
      const anotacao = state.anotacoes.find((a) => a.id === id);
      texto = anotacao
        ? formatarMensagemIndividual(anotacao)
        : 'Selecione ou cadastre uma anotação para compartilhar.';
    } else if (modo === 'dia') {
      const dia = document.getElementById('wpp-select-dia').value;
      const lista = state.anotacoes.filter((a) => a.data === dia);
      texto = formatarMensagemGrupo(`Data: ${formatarDataBR(dia)}`, lista);
    } else if (modo === 'veiculo') {
      const veiculoId = document.getElementById('wpp-select-veiculo').value;
      const veiculo = state.veiculos.find((v) => v.id === veiculoId);
      const lista = state.anotacoes
        .filter((a) => a.veiculoId === veiculoId)
        .sort((a, b) => b.data.localeCompare(a.data));
      const titulo = veiculo
        ? `🚛 Veículo: ${veiculo.modelo} | Placa: ${veiculo.placa}`
        : 'Veículo selecionado';
      texto = formatarMensagemGrupo(titulo, lista);
    } else if (modo === 'periodo') {
      const ini = document.getElementById('wpp-periodo-ini').value;
      const fim = document.getElementById('wpp-periodo-fim').value;
      const lista = state.anotacoes
        .filter((a) => (!ini || a.data >= ini) && (!fim || a.data <= fim))
        .sort((a, b) => a.data.localeCompare(b.data));
      texto = formatarMensagemGrupo(
        `Período: ${formatarDataBR(ini)} a ${formatarDataBR(fim)}`,
        lista
      );
    }

    document.getElementById('wpp-preview').value = texto;
  }

  function enviarParaWhatsApp() {
    const texto = document.getElementById('wpp-preview').value;
    if (!texto || texto.startsWith('Nenhum registro') || texto.startsWith('Selecione ou cadastre')) {
      mostrarToast('Não há dados válidos para compartilhar.');
      return;
    }

    const url = `https://wa.me/?text=${encodeURIComponent(texto)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  // ==================== 6. RELATÓRIOS E EXPORTAÇÃO CSV ====================
  function obterAnotacoesRelatorio() {
    const ini = document.getElementById('rel-data-ini').value;
    const fim = document.getElementById('rel-data-fim').value;
    return state.anotacoes.filter((a) => (!ini || a.data >= ini) && (!fim || a.data <= fim));
  }

  function agruparPorChave(lista, obterChave) {
    const mapa = {};
    lista.forEach((item) => {
      const chave = obterChave(item) || 'Não informado';
      mapa[chave] = (mapa[chave] || 0) + (Number(item.km) || 0);
    });
    return Object.entries(mapa).sort((a, b) => b[1] - a[1]);
  }

  function renderListaRelatorio(elementId, pares, totalGeral) {
    const el = document.getElementById(elementId);
    if (pares.length === 0) {
      el.innerHTML = `<p class="muted-text">Sem registros no período.</p>`;
      return;
    }

    el.innerHTML = pares
      .map(([nome, km]) => {
        const pct = totalGeral > 0 ? Math.round((km / totalGeral) * 100) : 0;
        return `
          <div class="report-row">
            <div class="report-row-top">
              <span>${escapeHTML(nome)}</span>
              <strong>${formatarKM(km)} km (${pct}%)</strong>
            </div>
            <div class="progress-track">
              <div class="progress-fill" style="width:${pct}%"></div>
            </div>
          </div>
        `;
      })
      .join('');
  }

  function renderRelatorios() {
    const lista = obterAnotacoesRelatorio();
    const totalRegistros = lista.length;
    const totalKm = lista.reduce((acc, item) => acc + (Number(item.km) || 0), 0);
    const mediaKm = totalRegistros > 0 ? totalKm / totalRegistros : 0;

    document.getElementById('rel-total-registros').textContent = totalRegistros.toLocaleString('pt-BR');
    document.getElementById('rel-total-km').textContent = `${formatarKM(totalKm)} km`;
    document.getElementById('rel-media-km').textContent = `${formatarKM(mediaKm)} km`;

    const porVeiculo = agruparPorChave(lista, (a) => `${a.placa} (${a.veiculoModelo || 'Veículo'})`);
    const porMotorista = agruparPorChave(lista, (a) => a.motorista || 'Não informado');
    const porCategoria = agruparPorChave(lista, (a) => a.categoria);
    const porEstado = agruparPorChave(lista, (a) => a.uf);

    renderListaRelatorio('rel-por-veiculo', porVeiculo, totalKm);
    renderListaRelatorio('rel-por-motorista', porMotorista, totalKm);
    renderListaRelatorio('rel-por-categoria', porCategoria, totalKm);
    renderListaRelatorio('rel-por-estado', porEstado, totalKm);
  }

  function exportarCSV() {
    const lista = obterAnotacoesRelatorio();
    if (lista.length === 0) {
      mostrarToast('Não há registros no período para exportar.');
      return;
    }

    const cabecalho = ['Data', 'Categoria', 'Placa', 'Veiculo', 'Motorista', 'KM_Rodados', 'Cidade', 'UF', 'Observacao'];
    const linhas = lista.map((a) => [
      formatarDataBR(a.data),
      a.categoria,
      a.placa,
      a.veiculoModelo || '',
      a.motorista || '',
      String(a.km).replace('.', ','),
      a.cidade,
      a.uf,
      (a.observacao || '').replace(/[
;]+/g, ' ')
    ]);

    const csvConteudo =
      '﻿' +
      [cabecalho, ...linhas]
        .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(';'))
        .join('
');

    const blob = new Blob([csvConteudo], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `relatorio-km-transportadora-${hojeISO()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    mostrarToast('Arquivo CSV exportado com sucesso!');
  }

  function compartilharResumoRelatorioWhatsApp() {
    const lista = obterAnotacoesRelatorio();
    if (lista.length === 0) {
      mostrarToast('Não há registros no período para compartilhar.');
      return;
    }

    const ini = document.getElementById('rel-data-ini').value;
    const fim = document.getElementById('rel-data-fim').value;
    const totalKm = lista.reduce((acc, item) => acc + (Number(item.km) || 0), 0);
    const porVeiculo = agruparPorChave(lista, (a) => `${a.placa} (${a.veiculoModelo || 'Veículo'})`);

    const periodoTexto =
      ini || fim
        ? `Período: ${ini ? formatarDataBR(ini) : 'Início'} a ${fim ? formatarDataBR(fim) : 'Atual'}`
        : 'Período: Geral Consolidado';

    const linhas = [
      'RESUMO GERENCIAL DE QUILOMETRAGEM',
      periodoTexto,
      `📋 Total de anotações: ${lista.length}`,
      `🛣️ Total geral de KM: ${formatarKM(totalKm)} km`,
      '',
      '🚛 KM POR VEÍCULO:'
    ];

    porVeiculo.forEach(([veic, km]) => {
      linhas.push(`• ${veic}: ${formatarKM(km)} km`);
    });

    linhas.push('', 'Relatório gerado pelo Sistema Operacional da Transportadora.');
    const texto = linhas.join('
');
    window.open(`https://wa.me/?text=${encodeURIComponent(texto)}`, '_blank', 'noopener,noreferrer');
  }

  // ==================== 7. BACKUP E IMPORTAÇÃO JSON ====================
  function exportarBackupJSON() {
    const payload = {
      sistema: 'TransLog KM',
      versao: '1.0',
      exportadoEm: new Date().toISOString(),
      veiculos: state.veiculos,
      anotacoes: state.anotacoes
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `backup-transportadora-${hojeISO()}.json`;
    link.click();
    URL.revokeObjectURL(url);
    mostrarToast('Backup JSON baixado com sucesso!');
  }

  function importarBackupJSON(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (e) {
      try {
        const dados = JSON.parse(e.target.result);
        if (!Array.isArray(dados.veiculos) || !Array.isArray(dados.anotacoes)) {
          throw new Error('Estrutura de backup inválida.');
        }

        if (
          !confirm(
            `Restaurar ${dados.veiculos.length} veículo(s) e ${dados.anotacoes.length} anotação(ões)? Os dados atuais deste navegador serão substituídos.`
          )
        ) {
          event.target.value = '';
          return;
        }

        state.veiculos = dados.veiculos;
        state.anotacoes = dados.anotacoes;
        state.isDemo = false;
        salvarDados();

        renderDashboard();
        atualizarSelectsVeiculos();
        mostrarToast('Backup restaurado com sucesso!');
      } catch (err) {
        mostrarToast('Arquivo JSON inválido ou corrompido.');
      } finally {
        event.target.value = '';
      }
    };
    reader.readAsText(file);
  }

  // ==================== INICIALIZAÇÃO E EVENTOS ====================
  function registrarEventos() {
    // Menu Mobile
    document.getElementById('btn-mobile-menu').addEventListener('click', abrirMenuMobile);
    document.getElementById('btn-close-menu').addEventListener('click', fecharMenuMobile);
    document.getElementById('sidebar-overlay').addEventListener('click', fecharMenuMobile);

    // Navegação Sidebar
    document.querySelectorAll('.nav-item').forEach((btn) => {
      btn.addEventListener('click', () => navegarPara(btn.dataset.target));
    });

    // Delegação global de cliques para botões dinâmicos e atalhos
    document.body.addEventListener('click', (e) => {
      const gotoBtn = e.target.closest('[data-goto]');
      if (gotoBtn) {
        e.preventDefault();
        navegarPara(gotoBtn.dataset.goto);
        return;
      }

      if (e.target.closest('.js-open-wpp-modal')) {
        abrirModalWhatsApp('individual');
        return;
      }

      const shareSingleBtn = e.target.closest('.js-share-single');
      if (shareSingleBtn) {
        abrirModalWhatsApp('individual', shareSingleBtn.dataset.id);
        return;
      }

      const editVeiculoBtn = e.target.closest('.js-edit-veiculo');
      if (editVeiculoBtn) {
        editarVeiculo(editVeiculoBtn.dataset.id);
        return;
      }

      const delVeiculoBtn = e.target.closest('.js-del-veiculo');
      if (delVeiculoBtn) {
        excluirVeiculo(delVeiculoBtn.dataset.id);
        return;
      }

      const viewAnotacaoBtn = e.target.closest('.js-view-anotacao');
      if (viewAnotacaoBtn) {
        abrirDetalhesAnotacao(viewAnotacaoBtn.dataset.id);
        return;
      }

      const editAnotacaoBtn = e.target.closest('.js-edit-anotacao');
      if (editAnotacaoBtn) {
        editarAnotacao(editAnotacaoBtn.dataset.id);
        return;
      }

      const delAnotacaoBtn = e.target.closest('.js-del-anotacao');
      if (delAnotacaoBtn) {
        excluirAnotacao(delAnotacaoBtn.dataset.id);
        return;
      }

      if (e.target.closest('.js-close-modal')) {
        document.getElementById('modal-whatsapp').hidden = true;
        document.getElementById('modal-detalhes').hidden = true;
      }
    });

    // Máscara de placa em tempo real
    document.getElementById('veiculo-placa').addEventListener('input', (e) => {
      e.target.value = normalizarPlaca(e.target.value);
    });

    document.getElementById('filtro-placa').addEventListener('input', (e) => {
      e.target.value = normalizarPlaca(e.target.value);
      renderHistorico();
    });

    // Formulário Veículos
    document.getElementById('form-veiculo').addEventListener('submit', salvarVeiculo);
    document.getElementById('btn-cancel-veiculo').addEventListener('click', resetarFormularioVeiculo);
    document.getElementById('busca-veiculo').addEventListener('input', renderVeiculos);

    // Formulário Anotação
    document.getElementById('anotacao-veiculo').addEventListener('change', aoSelecionarVeiculoNoForm);
    document.getElementById('form-anotacao').addEventListener('submit', (e) => {
      e.preventDefault();
      salvarAnotacao(false);
    });
    document.getElementById('btn-save-and-wpp').addEventListener('click', () => salvarAnotacao(true));
    document.getElementById('btn-cancel-anotacao').addEventListener('click', () => {
      resetarFormularioAnotacao();
      navegarPara('historico');
    });

    // Filtros Histórico
    ['filtro-veiculo', 'filtro-categoria', 'filtro-uf', 'filtro-data-ini', 'filtro-data-fim', 'filtro-ordem'].forEach(
      (id) => {
        document.getElementById(id).addEventListener('change', renderHistorico);
      }
    );

    document.getElementById('btn-limpar-filtros').addEventListener('click', () => {
      document.getElementById('filtro-placa').value = '';
      document.getElementById('filtro-veiculo').value = '';
      document.getElementById('filtro-categoria').value = '';
      document.getElementById('filtro-uf').value = '';
      document.getElementById('filtro-data-ini').value = '';
      document.getElementById('filtro-data-fim').value = '';
      document.getElementById('filtro-ordem').value = 'desc';
      renderHistorico();
    });

    // Modal WhatsApp
    document.getElementById('wpp-modo').addEventListener('change', atualizarSubopcoesWhatsApp);
    ['wpp-select-anotacao', 'wpp-select-dia', 'wpp-select-veiculo', 'wpp-periodo-ini', 'wpp-periodo-fim'].forEach(
      (id) => {
        document.getElementById(id).addEventListener('change', gerarPreviewWhatsApp);
      }
    );

    document.getElementById('btn-send-wpp').addEventListener('click', enviarParaWhatsApp);
    document.getElementById('btn-copy-wpp').addEventListener('click', () => {
      const texto = document.getElementById('wpp-preview').value;
      if (navigator.clipboard) {
        navigator.clipboard.writeText(texto);
        mostrarToast('Texto copiado para a área de transferência!');
      }
    });

    document.getElementById('btn-det-wpp').addEventListener('click', () => {
      document.getElementById('modal-detalhes').hidden = true;
      if (state.currentDetailId) {
        abrirModalWhatsApp('individual', state.currentDetailId);
      }
    });

    // Relatórios
    document.getElementById('rel-data-ini').addEventListener('change', renderRelatorios);
    document.getElementById('rel-data-fim').addEventListener('change', renderRelatorios);
    document.getElementById('btn-rel-limpar').addEventListener('click', () => {
      document.getElementById('rel-data-ini').value = '';
      document.getElementById('rel-data-fim').value = '';
      renderRelatorios();
    });
    document.getElementById('btn-export-csv').addEventListener('click', exportarCSV);
    document.getElementById('btn-share-report-wpp').addEventListener('click', compartilharResumoRelatorioWhatsApp);

    // Backup e Dados Demo
    document.getElementById('btn-export-json').addEventListener('click', exportarBackupJSON);
    document.getElementById('input-import-json').addEventListener('change', importarBackupJSON);

    document.getElementById('btn-clear-demo').addEventListener('click', () => {
      if (!confirm('Deseja remover os dados de exemplo para iniciar seu cadastro real?')) return;
      state.veiculos = [];
      state.anotacoes = [];
      state.isDemo = false;
      salvarDados();
      renderDashboard();
      atualizarSelectsVeiculos();
      mostrarToast('Dados demonstrativos removidos!');
    });

    document.getElementById('btn-restore-demo').addEventListener('click', () => {
      if (!confirm('Isso substituirá os dados atuais pelos registros demonstrativos. Continuar?')) return;
      const demo = obterDadosDemonstrativos();
      state.veiculos = demo.veiculos;
      state.anotacoes = demo.anotacoes;
      state.isDemo = true;
      salvarDados();
      renderDashboard();
      atualizarSelectsVeiculos();
      mostrarToast('Dados demonstrativos restaurados.');
    });

    document.getElementById('btn-wipe-all').addEventListener('click', () => {
      if (!confirm('ATENÇÃO: Todos os veículos e anotações salvos neste navegador serão apagados permanentemente. Confirmar?')) return;
      state.veiculos = [];
      state.anotacoes = [];
      state.isDemo = false;
      salvarDados();
      renderDashboard();
      atualizarSelectsVeiculos();
      mostrarToast('Todos os dados locais foram apagados.');
    });
  }

  // Inicialização ao carregar o DOM
  document.addEventListener('DOMContentLoaded', () => {
    carregarDados();
    registrarEventos();
    atualizarSelectsVeiculos();
    document.getElementById('anotacao-data').value = hojeISO();
    renderDashboard();
  });
})();
