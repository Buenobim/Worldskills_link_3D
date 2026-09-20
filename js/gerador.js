/**
 * ==============================================================================
 * js/gerador.js
 * ==============================================================================
 * PARA QUE SERVE ESTE ARQUIVO? (Explicação em termos simples):
 * Este arquivo é o "motor do gerador de links". Ele:
 * 1. Abre a lista de peças e descobre quais módulos existem (Módulo A, B, C...).
 * 2. Cria na tela um card para a Obra Completa e um card para cada Módulo.
 * 3. Desenha os QR Codes para você apontar a câmera do celular e testar na hora.
 * 4. Permite copiar qualquer link com 1 clique e exportar uma lista pronta pro WhatsApp!
 * ==============================================================================
 */

import { gerarQRCodeNoCanvas } from "./qrcode-light.js";

// Lista de projetos disponíveis localmente
const PROJETOS_DISPONIVEIS = [
  { id: "video-do-projeto", nome: "Vídeo do Projeto (Principal)" },
  { id: "projeto-worldskills", nome: "Projeto WorldSkills (Demonstração)" }
];

// Domínio padrão de produção no Firebase
const DOMINIO_FIREBASE = "https://visualizador3dwsc.web.app";

// Elementos da página
const selectProjeto = document.getElementById("select-projeto");
const selectDominio = document.getElementById("select-dominio");
const inputDominioCustom = document.getElementById("input-dominio-custom");
const gridModulos = document.getElementById("grid-modulos");
const btnExportarTodos = document.getElementById("btn-exportar-todos");
const modalExportar = document.getElementById("modal-exportar");
const btnFecharModal = document.getElementById("btn-fechar-modal");
const textareaExportar = document.getElementById("textarea-exportar");
const btnCopiarTodos = document.getElementById("btn-copiar-todos");

let dadosProjetoAtual = null;
let linksGerados = [];

/**
 * Função para inicializar o painel do Gerador:
 * O que ela faz: Preenche os menus e carrega os módulos do primeiro projeto.
 */
export async function iniciarGerador() {
  // Preenche a lista de projetos
  selectProjeto.innerHTML = "";
  PROJETOS_DISPONIVEIS.forEach((p) => {
    const opt = document.createElement("option");
    opt.value = p.id;
    opt.innerText = p.nome;
    selectProjeto.appendChild(opt);
  });

  // Evento de troca de projeto
  selectProjeto.addEventListener("change", () => {
    carregarModulosDoProjeto(selectProjeto.value);
  });

  // Evento de troca de domínio (Firebase vs Local)
  selectDominio.addEventListener("change", () => {
    if (selectDominio.value === "custom") {
      inputDominioCustom.style.display = "block";
    } else {
      inputDominioCustom.style.display = "none";
    }
    atualizarCards();
  });

  inputDominioCustom.addEventListener("input", () => {
    atualizarCards();
  });

  // Carrega o projeto padrão inicial
  await carregarModulosDoProjeto(selectProjeto.value);

  // Eventos do modal de exportar
  btnExportarTodos.addEventListener("click", abrirModalExportacao);
  btnFecharModal.addEventListener("click", () => modalExportar.classList.remove("ativo"));
  btnCopiarTodos.addEventListener("click", copiarTodosOsLinks);
}

/**
 * Função para ler os dados do arquivo JSON do projeto selecionado:
 * O que ela faz: Baixa o arquivo .json do projeto para saber quantos módulos ele tem e suas cores.
 */
async function carregarModulosDoProjeto(projetoId) {
  try {
    const res = await fetch(`modelos/${projetoId}.json`);
    if (!res.ok) throw new Error("Não foi possível carregar os dados do projeto.");
    dadosProjetoAtual = await res.json();
  } catch (err) {
    console.warn("Usando modelo padrão básico:", err);
    dadosProjetoAtual = { modulos: [] };
  }
  atualizarCards();
}

/**
 * Função que descobre o endereço base (URL) para montar o link:
 * Pode ser o endereço real da nuvem (Firebase) ou o endereço do seu computador (Localhost).
 */
function obterUrlBase() {
  if (selectDominio.value === "firebase") {
    return DOMINIO_FIREBASE;
  } else if (selectDominio.value === "custom") {
    return inputDominioCustom.value.trim().replace(/\/$/, "");
  } else {
    // Pega o endereço atual do navegador (ex: http://localhost:5000)
    return window.location.origin + window.location.pathname.replace(/gerador\.html$/, "").replace(/\/$/, "");
  }
}

/**
 * Função para desenhar todos os cards de links na tela:
 * O que ela faz: Cria o card da Obra Completa e os cards de cada Módulo com QR Code e botão de copiar.
 */
function atualizarCards() {
  gridModulos.innerHTML = "";
  linksGerados = [];

  const urlBase = obterUrlBase();
  const projetoId = selectProjeto.value;

  // 1. Card da Obra Completa
  const urlCompleta = `${urlBase}/index.html?projeto=${encodeURIComponent(projetoId)}`;
  linksGerados.push({
    titulo: "Obra Completa (Todos os Módulos)",
    url: urlCompleta,
    cor: "#38bdf8"
  });

  criarCard({
    titulo: "Obra Completa",
    subtitulo: "Todos os módulos em sequência",
    cor: "#38bdf8",
    url: urlCompleta,
    detalhe: "Sequência completa"
  });

  // 2. Cards para cada Módulo encontrado
  if (dadosProjetoAtual && dadosProjetoAtual.modulos && dadosProjetoAtual.modulos.length > 0) {
    dadosProjetoAtual.modulos.forEach((m) => {
      const idMod = m.id;
      const nomeMod = m.nome || `Módulo ${idMod}`;
      const corMod = m.cor || "#3b82f6";
      const totalPecas = (m.seq || []).length;
      const urlModulo = `${urlBase}/index.html?projeto=${encodeURIComponent(projetoId)}&modulo=${encodeURIComponent(idMod)}`;

      linksGerados.push({
        titulo: nomeMod,
        url: urlModulo,
        cor: corMod
      });

      criarCard({
        titulo: nomeMod,
        subtitulo: `Foco exclusivo no Módulo ${idMod}`,
        cor: corMod,
        url: urlModulo,
        detalhe: `${totalPecas} peças sequenciadas`
      });
    });
  }
}

/**
 * Função que constrói o elemento HTML do Card:
 * O que ela faz: Monta o visual do card, o canvas do QR Code e conecta o botão de cópia.
 */
function criarCard({ titulo, subtitulo, cor, url, detalhe }) {
  const card = document.createElement("div");
  card.className = "card-modulo";

  card.innerHTML = `
    <div class="card-topo">
      <div class="card-titulo-area">
        <div class="card-cor-indicador" style="background-color: ${cor}; color: ${cor};"></div>
        <div>
          <h3 class="card-titulo">${titulo}</h3>
          <p style="font-size:12px; color:var(--texto-secundario);">${subtitulo}</p>
        </div>
      </div>
      <span class="card-badge">${detalhe}</span>
    </div>

    <!-- Área onde o QR Code é desenhado -->
    <div class="qrcode-box">
      <canvas class="canvas-qr"></canvas>
    </div>
    <span class="dica-qr">📱 Aponte a câmera do celular para testar</span>

    <!-- Campo do Link com Botão Copiar -->
    <div class="link-copiar-box">
      <input type="text" class="link-input" value="${url}" readonly>
      <button class="btn-copiar" title="Copiar Link">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
        </svg>
        <span>Copiar</span>
      </button>
    </div>

    <!-- Ações Inferiores -->
    <div class="card-acoes">
      <a href="${url}" target="_blank" class="btn-card-abrir">Abrir Visualizador ↗</a>
    </div>
  `;

  // Desenha o QR Code
  const canvasQr = card.querySelector(".canvas-qr");
  gerarQRCodeNoCanvas(canvasQr, url, 156);

  // Conecta o botão de copiar
  const btnCopiar = card.querySelector(".btn-copiar");
  const linkInput = card.querySelector(".link-input");

  btnCopiar.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(url);
      btnCopiar.classList.add("copiado");
      btnCopiar.querySelector("span").innerText = "Copiado!";
      setTimeout(() => {
        btnCopiar.classList.remove("copiado");
        btnCopiar.querySelector("span").innerText = "Copiar";
      }, 2000);
    } catch (e) {
      linkInput.select();
      document.execCommand("copy");
    }
  });

  gridModulos.appendChild(card);
}

/**
 * Função para abrir o modal de exportação com todos os links organizados:
 * O que ela faz: Formata uma mensagem limpa e elegante para você colar no WhatsApp.
 */
function abrirModalExportacao() {
  const nomeProjeto = selectProjeto.options[selectProjeto.selectedIndex].text;
  let texto = `🏗️ LINKS 3D WORLDSKILLS - ${nomeProjeto.toUpperCase()}\n`;
  texto += `--------------------------------------------------\n\n`;

  linksGerados.forEach((item) => {
    texto += `📌 ${item.titulo}:\n${item.url}\n\n`;
  });

  texto += `💡 Dica: Abra o link direto no celular para visualizar o modelo 3D em tela cheia com rotação e zoom livres!`;

  textareaExportar.value = texto;
  modalExportar.classList.add("ativo");
}

/**
 * Função para copiar todos os links de uma só vez:
 */
async function copiarTodosOsLinks() {
  try {
    await navigator.clipboard.writeText(textareaExportar.value);
    btnCopiarTodos.innerText = "✅ Todos os Links Copiados!";
    setTimeout(() => {
      btnCopiarTodos.innerText = "Copiar Texto Completo";
    }, 2500);
  } catch (e) {
    textareaExportar.select();
    document.execCommand("copy");
  }
}

// Inicia automaticamente quando a página carregar
window.addEventListener("DOMContentLoaded", iniciarGerador);
