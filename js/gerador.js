/**
 * ==============================================================================
 * js/gerador.js — Lógica do Gerador de Links, QR Codes e Exportação de PDF/PNG
 * ==============================================================================
 * PARA QUE SERVE ESTE ARQUIVO? (Explicação simples para o Bruno):
 * Este arquivo comanda todo o painel do Líder:
 * 1. Cria os cartões dos 4 links dos módulos (Módulo A, B, C, D) e do projeto completo.
 * 2. Coloca em cada cartão a foto do módulo pronto e o QR Code em alta resolução.
 * 3. Faz o botão "Print / PDF" funcionar, montando uma folha A4 oficial de competição pronta para imprimir.
 * 4. Faz o botão "Save PNG" gerar uma imagem bonita em alta definição pronta para baixar e mandar no WhatsApp/WeChat.
 * 5. Controla a senha de segurança (PIN: 2026) para barrar acessos não autorizados.
 * ==============================================================================
 */

import { gerarQRCodeNoCanvas } from "./qrcode-light.js";

// Available projects
const PROJETOS_DISPONIVEIS = [
  { id: "Projeto_Atual", nome: "Current Project (Official - 4 Modules)" },
  { id: "video-do-projeto", nome: "Demonstration Project (Backup)" }
];

// Production domain on Firebase Hosting
const DOMINIO_FIREBASE = "https://visualizador3dwsc.web.app";

// DOM Elements
const selectProjeto = document.getElementById("select-projeto");
const selectDominio = document.getElementById("select-dominio");
const inputDominioCustom = document.getElementById("input-dominio-custom");
const gridModulos = document.getElementById("grid-modulos");
const btnExportarTodos = document.getElementById("btn-exportar-todos");
const modalExportar = document.getElementById("modal-exportar");
const btnFecharModal = document.getElementById("btn-fechar-modal");
const textareaExportar = document.getElementById("textarea-exportar");
const btnCopiarTodos = document.getElementById("btn-copiar-todos");

// PIN Security Elements
const telaBloqueio = document.getElementById("tela-bloqueio");
const conteudoPainel = document.getElementById("conteudo-painel");
const inputPin = document.getElementById("input-pin");
const btnDesbloquear = document.getElementById("btn-desbloquear");
const pinErro = document.getElementById("pin-erro");

// Official Leader PIN
const PIN_LIDER = "2026";

// Função simples: checa se o líder já digitou a senha correta (PIN 2026) nesta sessão do navegador
function verificarAutenticacao() {
  const autenticado = sessionStorage.getItem("wsc_lider_autenticado");
  if (autenticado === "true") {
    if (telaBloqueio) telaBloqueio.style.display = "none";
    if (conteudoPainel) conteudoPainel.style.display = "block";
    return true;
  }
  return false;
}

if (btnDesbloquear && inputPin) {
  btnDesbloquear.addEventListener("click", () => {
    if (inputPin.value === PIN_LIDER) {
      sessionStorage.setItem("wsc_lider_autenticado", "true");
      telaBloqueio.style.display = "none";
      conteudoPainel.style.display = "block";
    } else {
      pinErro.style.display = "block";
      inputPin.value = "";
      inputPin.focus();
    }
  });

  inputPin.addEventListener("keyup", (e) => {
    if (e.key === "Enter") btnDesbloquear.click();
  });
}

let dadosProjetoAtual = null;
let linksGerados = [];

// Photos of completed module stages
const FOTOS_MODULOS = {
  "A": "imagens/modulos/modulo_a.png",
  "B": "imagens/modulos/modulo_b.png",
  "C": "imagens/modulos/modulo_c.png",
  "D": "imagens/modulos/modulo_d.png",
  "FULL": "imagens/modulos/modulo_d.png"
};

// Códigos únicos e não-óbvios para os links de cada módulo
// Explicação leiga: Usamos códigos diferentes para cada módulo (ex: "mod-8k2p", "mod-4t7b")
// para que ninguém consiga mudar apenas uma letra no navegador e descobrir o próximo módulo!
const CODIGOS_MODULOS = {
  "A": "mod-8k2p",
  "B": "mod-4t7b",
  "C": "mod-1w9v",
  "D": "mod-6n3r",
  "FULL": "full-model"
};

// Função simples: dá a partida no painel quando a tela carrega, montando os botões e listas
export async function iniciarGerador() {
  verificarAutenticacao();

  selectProjeto.innerHTML = "";
  PROJETOS_DISPONIVEIS.forEach((p) => {
    const opt = document.createElement("option");
    opt.value = p.id;
    opt.innerText = p.nome;
    selectProjeto.appendChild(opt);
  });

  selectProjeto.addEventListener("change", () => {
    carregarModulosDoProjeto(selectProjeto.value);
  });

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

  await carregarModulosDoProjeto(selectProjeto.value);

  btnExportarTodos.addEventListener("click", abrirModalExportacao);
  btnFecharModal.addEventListener("click", () => modalExportar.classList.remove("ativo"));
  btnCopiarTodos.addEventListener("click", copiarTodosOsLinks);
}

// Função simples: busca na pasta "modelos" os dados do projeto em formato JSON
async function carregarModulosDoProjeto(projetoId) {
  try {
    const res = await fetch(`modelos/${projetoId}.json`);
    if (!res.ok) throw new Error("Could not load project data.");
    dadosProjetoAtual = await res.json();
  } catch (err) {
    console.warn("Using fallback project data:", err);
    dadosProjetoAtual = { modulos: [] };
  }
  atualizarCards();
}

// Função simples: descobre qual o endereço da internet certo para colocar nos links e QR Codes
function obterUrlBase() {
  if (selectDominio.value === "firebase") {
    return DOMINIO_FIREBASE;
  } else if (selectDominio.value === "custom") {
    return inputDominioCustom.value.trim().replace(/\/$/, "");
  } else {
    return window.location.origin + window.location.pathname.replace(/gerador\.html$/, "").replace(/\/$/, "");
  }
}

// Função simples: cria os cartões na tela (um para cada módulo e um para o projeto inteiro)
function atualizarCards() {
  gridModulos.innerHTML = "";
  linksGerados = [];

  const urlBase = obterUrlBase();
  const projetoId = selectProjeto.value;

  const subtitulos = {
    "A": "Foundation & base masonry",
    "B": "Module A pre-assembled + Module B tiling",
    "C": "Modules A & B pre-assembled + Module C door wall",
    "D": "Modules A, B, C pre-assembled + Module D final assembly"
  };

  const titulosOficiais = {
    "A": "Module A — Base & Masonry",
    "B": "Module B — Structure & Mosaic",
    "C": "Module C — Intermediate Sequence",
    "D": "Module D — Final Assembly"
  };

  const numeros = { "A": "1", "B": "2", "C": "3", "D": "4" };

  const modulos = (dadosProjetoAtual && dadosProjetoAtual.estado && dadosProjetoAtual.estado.modulos)
    || (dadosProjetoAtual && dadosProjetoAtual.modulos)
    || [];

  // 1. Cards for Module 1, 2, 3, and 4
  if (modulos.length > 0) {
    modulos.forEach((m) => {
      const rotuloMod = (m.rotulo || m.id || "").toUpperCase().replace(/^M\d+-/, "");
      const num = numeros[rotuloMod] || "";
      const prefixo = num ? `Link ${num} — ` : "";
      const nomeMod = `${prefixo}${titulosOficiais[rotuloMod] || `Module ${rotuloMod}`}`;
      const corMod = m.cor || "#3b82f6";
      const totalPecas = (m.seq || []).length;
      const codMod = CODIGOS_MODULOS[rotuloMod] || CODIGOS_MODULOS["A"];
      const urlModulo = `${urlBase}/index.html?m=${codMod}`;
      const fotoSrc = FOTOS_MODULOS[rotuloMod] || FOTOS_MODULOS["A"];

      linksGerados.push({
        titulo: nomeMod,
        url: urlModulo,
        cor: corMod,
        pecas: totalPecas
      });

      criarCard({
        rotulo: rotuloMod,
        titulo: nomeMod,
        subtitulo: subtitulos[rotuloMod] || `Focus on Module ${rotuloMod}`,
        cor: corMod,
        url: urlModulo,
        detalhe: `${totalPecas} pieces`,
        fotoSrc
      });
    });
  }

  // 2. Complete Model Card (Leader Overview)
  const urlCompleta = `${urlBase}/index.html?m=full-model`;
  linksGerados.push({
    titulo: "Complete Project (All Modules)",
    url: urlCompleta,
    cor: "#38bdf8",
    pecas: 409
  });

  criarCard({
    rotulo: "FULL",
    titulo: "Complete Project",
    subtitulo: "All modules in sequence (Leader Overview)",
    cor: "#38bdf8",
    url: urlCompleta,
    detalhe: "409 pieces",
    fotoSrc: FOTOS_MODULOS["FULL"]
  });
}

// Função simples: monta visualmente cada cartão com foto da peça pronta, QR Code e botões de ação
function criarCard({ rotulo, titulo, subtitulo, cor, url, detalhe, fotoSrc }) {
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

    <!-- Finished Module Stage Photo Thumbnail -->
    <div class="card-foto-box">
      <img src="${fotoSrc}" alt="${titulo} Finished Stage" loading="lazy">
      <span class="card-foto-tag">Finished Stage</span>
    </div>

    <!-- High-res QR Code -->
    <div class="qrcode-box">
      <canvas class="canvas-qr"></canvas>
    </div>
    <span class="dica-qr">📱 Scan with smartphone camera to view 3D model</span>

    <!-- Link Box with Copy Button -->
    <div class="link-copiar-box">
      <input type="text" class="link-input" value="${url}" readonly>
      <button class="btn-copiar" title="Copy Link">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
        </svg>
        <span>Copy</span>
      </button>
    </div>

    <!-- Action Buttons (Print PDF & Download Image) -->
    <div class="card-acoes">
      <a href="${url}" target="_blank" class="btn-card-acao btn-card-abrir">
        <span>Open 3D Viewer ↗</span>
      </a>

      <div class="linha-botoes-card">
        <button class="btn-card-acao btn-imprimir-pdf" title="Print official sheet or save as PDF">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="6 9 6 2 18 2 18 9"></polyline>
            <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
            <rect x="6" y="14" width="12" height="8"></rect>
          </svg>
          <span>Print / PDF</span>
        </button>

        <button class="btn-card-acao btn-baixar-png" title="Download high-resolution graphic card as PNG image">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="7 10 12 15 17 10"></polyline>
            <line x1="12" y1="15" x2="12" y2="3"></line>
          </svg>
          <span>Save PNG</span>
        </button>
      </div>
    </div>
  `;

  // Draw QR code
  const canvasQr = card.querySelector(".canvas-qr");
  gerarQRCodeNoCanvas(canvasQr, url, 160);

  // Copy button
  const btnCopiar = card.querySelector(".btn-copiar");
  const linkInput = card.querySelector(".link-input");
  btnCopiar.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(url);
      btnCopiar.classList.add("copiado");
      btnCopiar.querySelector("span").innerText = "Copied!";
      setTimeout(() => {
        btnCopiar.classList.remove("copiado");
        btnCopiar.querySelector("span").innerText = "Copy";
      }, 2000);
    } catch (e) {
      linkInput.select();
      document.execCommand("copy");
    }
  });

  // Print / Save PDF
  const btnImprimir = card.querySelector(".btn-imprimir-pdf");
  btnImprimir.addEventListener("click", () => {
    imprimirFolhaPDF(titulo, subtitulo, fotoSrc, canvasQr, url);
  });

  // Download High-Res PNG Card
  const btnBaixarPng = card.querySelector(".btn-baixar-png");
  btnBaixarPng.addEventListener("click", () => {
    baixarCartaoPNG(titulo, subtitulo, fotoSrc, canvasQr, url, cor);
  });

  gridModulos.appendChild(card);
}

// Função simples: aciona a impressão da folha oficial em A4 ou permite salvar direto em PDF
function imprimirFolhaPDF(titulo, subtitulo, fotoSrc, canvasQr, url) {
  const folha = document.getElementById("folha-impressao");
  const tituloEl = document.getElementById("print-titulo-modulo");
  const fotoEl = document.getElementById("print-foto-img");
  const printCanvas = document.getElementById("print-qr-canvas");
  const urlEl = document.getElementById("print-url-texto");

  tituloEl.innerText = titulo.toUpperCase();
  fotoEl.src = fotoSrc;
  urlEl.innerText = url;

  // Copy QR code to print canvas
  const ctx = printCanvas.getContext("2d");
  ctx.clearRect(0, 0, 200, 200);
  ctx.drawImage(canvasQr, 0, 0, 200, 200);

  window.print();
}

// Função simples: gera uma imagem em alta resolução (PNG) com foto, QR Code e instruções para baixar
function baixarCartaoPNG(titulo, subtitulo, fotoSrc, canvasQr, url, cor) {
  const canvas = document.createElement("canvas");
  canvas.width = 1000;
  canvas.height = 1380;
  const ctx = canvas.getContext("2d");

  // Dark modern background
  ctx.fillStyle = "#090d16";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Border card
  ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
  ctx.lineWidth = 4;
  ctx.strokeRect(30, 30, canvas.width - 60, canvas.height - 60);

  // Top header tag
  ctx.fillStyle = cor || "#38bdf8";
  ctx.fillRect(50, 50, 16, 40);

  ctx.fillStyle = "#f8fafc";
  ctx.font = "bold 32px Inter, sans-serif";
  ctx.textAlign = "left";
  ctx.fillText("WORLDSKILLS COMPETITION · 4D SEQUENCE", 80, 80);

  ctx.fillStyle = "#94a3b8";
  ctx.font = "600 20px Inter, sans-serif";
  ctx.fillText("Wall and Floor Tiling (Skill 12) — Official Release", 80, 114);

  // Module Title Banner
  ctx.fillStyle = "#1e293b";
  ctx.fillRect(50, 140, canvas.width - 100, 70);

  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 30px Inter, sans-serif";
  ctx.fillText(titulo.toUpperCase(), 74, 186);

  // Draw Finished Stage Photo
  const imgFoto = new Image();
  imgFoto.crossOrigin = "anonymous";
  imgFoto.onload = () => {
    ctx.drawImage(imgFoto, 50, 230, canvas.width - 100, 480);

    // Photo label tag
    ctx.fillStyle = "rgba(15, 23, 42, 0.9)";
    ctx.fillRect(60, 660, 240, 40);
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 16px Inter, sans-serif";
    ctx.fillText("FINISHED STAGE PREVIEW", 74, 686);

    // QR Code Box (white background)
    const qrSize = 300;
    const qrX = (canvas.width - qrSize) / 2;
    const qrY = 740;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(qrX - 16, qrY - 16, qrSize + 32, qrSize + 32);
    ctx.drawImage(canvasQr, qrX, qrY, qrSize, qrSize);

    // Scan Label
    ctx.fillStyle = "#38bdf8";
    ctx.font = "bold 22px Inter, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("SCAN WITH SMARTPHONE CAMERA TO VIEW 3D MODEL", canvas.width / 2, 1095);

    // URL text
    ctx.fillStyle = "#64748b";
    ctx.font = "16px monospace";
    ctx.fillText(url, canvas.width / 2, 1125);

    // Instructions Box
    ctx.fillStyle = "#0f172a";
    ctx.fillRect(50, 1150, canvas.width - 100, 160);
    ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
    ctx.lineWidth = 2;
    ctx.strokeRect(50, 1150, canvas.width - 100, 160);

    ctx.fillStyle = "#f8fafc";
    ctx.font = "bold 18px Inter, sans-serif";
    ctx.textAlign = "left";
    ctx.fillText("INSTRUCTIONS FOR COMPETITORS & EXPERTS:", 70, 1182);

    ctx.fillStyle = "#cbd5e1";
    ctx.font = "16px Inter, sans-serif";
    ctx.fillText("1. Scan the QR code using your smartphone camera and open the link.", 70, 1214);
    ctx.fillText("2. Free Camera: 1 finger to rotate in 360°, pinch with 2 fingers to zoom and pan freely.", 70, 1244);
    ctx.fillText("3. Tap the Play button to watch the piece-by-piece construction assembly timeline.", 70, 1274);

    // Trigger download
    const link = document.createElement("a");
    link.download = `${titulo.replace(/[^a-zA-Z0-9]/g, '_')}_WorldSkills.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };
  imgFoto.src = fotoSrc;
}

// Função simples: abre a janela com a lista de todos os links em texto para envio por WhatsApp/WeChat
function abrirModalExportacao() {
  let texto = `🏆 WORLDSKILLS COMPETITION — 4D ASSEMBLY SEQUENCE LINKS\n`;
  texto += `Skill 12: Wall and Floor Tiling\n`;
  texto += `========================================================\n\n`;

  linksGerados.forEach((item) => {
    texto += `📌 ${item.titulo} (${item.pecas} pieces):\n${item.url}\n\n`;
  });

  texto += `💡 Instructions: Open the link directly on your smartphone camera for full-screen 3D model visualization with free touch rotation and piece-by-piece assembly play.`;

  textareaExportar.value = texto;
  modalExportar.classList.add("ativo");
}

// Função simples: copia todo o texto da lista de links com apenas 1 clique
async function copiarTodosOsLinks() {
  try {
    await navigator.clipboard.writeText(textareaExportar.value);
    btnCopiarTodos.innerText = "✅ All Links Copied!";
    setTimeout(() => {
      btnCopiarTodos.innerText = "Copy All Text";
    }, 2500);
  } catch (e) {
    textareaExportar.select();
    document.execCommand("copy");
  }
}

window.addEventListener("DOMContentLoaded", iniciarGerador);
