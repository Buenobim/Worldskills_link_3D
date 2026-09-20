/**
 * ==============================================================================
 * js/visualizador.js
 * ==============================================================================
 * PARA QUE SERVE ESTE ARQUIVO? (Explicação em termos simples):
 * Este é o "palco e o maestro" da cena 3D. Ele:
 * 1. Liga o motor 3D (Three.js), o chão e as luzes realistas.
 * 2. Carrega o modelo IFC e a sequência de montagem JSON (como Projeto_Atual).
 * 3. Mostra as peças descendo e se assentando no lugar certo.
 * 4. Mantém as peças fixas (base) sempre visíveis e isola perfeitamente os módulos.
 * 5. Conecta os botões da tela (Play, Pausa, Barra de Tempo, Enquadrar) com a cena.
 * ==============================================================================
 */

import * as THREE from "three";
import { configurarControlesCamera, enquadrarModelo } from "./controles-toque.js";
import { prepararCronograma, avaliarEstadoPecas } from "./sequencia-motor.js";

// Endereço da biblioteca que lê arquivos IFC no navegador
const URL_WEBIFC = "https://cdn.jsdelivr.net/npm/web-ifc@0.0.57/";

// Variáveis principais da cena 3D
let cena, camera, renderizador, controles;
let grupoModelo = null;
let ifcApi = null;

// Dados do modelo e da sequência
const elementosPorGuid = new Map(); // guid -> { grupo, meshes, corOriginal, posicaoYBase }
let cronogramaAtual = null;
let tempoAtual = 0;
let estaTocando = false;
let velocidadeReproducao = 1.0;
let relogioAnimacao = new THREE.Clock();

// Material fantasma translúcido
const materialFantasma = new THREE.MeshStandardMaterial({
  color: 0x8899a6,
  transparent: true,
  opacity: 0.1,
  roughness: 0.9,
  depthWrite: false
});

/**
 * Função para inicializar a cena 3D, iluminação e câmera:
 * O que ela faz: Prepara o estúdio onde o modelo 3D é exibido.
 */
export function iniciarCena(container) {
  cena = new THREE.Scene();
  cena.background = new THREE.Color("#090d16"); // Fundo escuro premium

  const largura = container.clientWidth || window.innerWidth;
  const altura = container.clientHeight || window.innerHeight;
  camera = new THREE.PerspectiveCamera(45, largura / altura, 0.1, 100);
  camera.position.set(7, 6, 9);

  renderizador = new THREE.WebGLRenderer({
    antialias: true,
    powerPreference: "high-performance"
  });
  renderizador.setSize(largura, altura);
  renderizador.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderizador.shadowMap.enabled = true;
  renderizador.shadowMap.type = THREE.PCFSoftShadowMap;
  renderizador.toneMapping = THREE.ACESFilmicToneMapping;
  renderizador.toneMappingExposure = 1.15;
  container.appendChild(renderizador.domElement);

  // Configura os controles livres de toque (celular e mouse)
  controles = configurarControlesCamera(camera, renderizador.domElement);

  configurarLuzes();
  criarChaoEGrade();

  grupoModelo = new THREE.Group();
  cena.add(grupoModelo);

  window.addEventListener("resize", () => {
    const w = container.clientWidth || window.innerWidth;
    const h = container.clientHeight || window.innerHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderizador.setSize(w, h);
  });

  window.addEventListener("solicitar-enquadrar", () => {
    enquadrarModelo(camera, controles, grupoModelo);
  });

  loop();

  return { cena, camera, renderizador, controles };
}

/**
 * Função para criar as luzes da cena:
 * O que ela faz: Ilumina o modelo com sol suave e luz de preenchimento.
 */
function configurarLuzes() {
  const luzAmbiente = new THREE.AmbientLight(0xffffff, 0.75);
  cena.add(luzAmbiente);

  const sol = new THREE.DirectionalLight(0xfff5ea, 2.0);
  sol.position.set(12, 18, 12);
  sol.castShadow = true;
  sol.shadow.mapSize.width = 2048;
  sol.shadow.mapSize.height = 2048;
  sol.shadow.camera.near = 0.5;
  sol.shadow.camera.far = 45;
  const d = 10;
  sol.shadow.camera.left = -d;
  sol.shadow.camera.right = d;
  sol.shadow.camera.top = d;
  sol.shadow.camera.bottom = -d;
  sol.shadow.bias = -0.0005;
  cena.add(sol);

  const luzRebote = new THREE.DirectionalLight(0x90b0e0, 0.6);
  luzRebote.position.set(-12, -6, -12);
  cena.add(luzRebote);
}

/**
 * Função para criar o piso e a grade no chão:
 * O que ela faz: Adiciona uma grade moderna no chão para referência de escala.
 */
function criarChaoEGrade() {
  const grade = new THREE.GridHelper(24, 24, 0x334155, 0x1e293b);
  grade.position.y = -0.01;
  cena.add(grade);

  const geoChao = new THREE.PlaneGeometry(80, 80);
  const matChao = new THREE.ShadowMaterial({ opacity: 0.35 });
  const chao = new THREE.Mesh(geoChao, matChao);
  chao.rotation.x = -Math.PI / 2;
  chao.position.y = -0.012;
  chao.receiveShadow = true;
  cena.add(chao);
}

/**
 * Função para carregar a biblioteca do leitor de IFC (Web-IFC):
 */
async function obterLeitorIFC() {
  if (ifcApi) return ifcApi;
  const WebIFC = await import(URL_WEBIFC + "+esm");
  ifcApi = new WebIFC.IfcAPI();
  ifcApi.SetWasmPath(URL_WEBIFC, true);
  await ifcApi.Init();
  return ifcApi;
}

/**
 * Função para carregar o modelo IFC e seu arquivo de sequência JSON:
 * O que ela faz: Baixa o modelo 3D (.ifc) e as instruções de montagem (.json),
 * montando as peças na cena.
 */
export async function carregarProjeto(caminhoIfc, caminhoJson, filtroModulo = null, aoProgredir = null) {
  if (aoProgredir) aoProgredir("Carregando sequência de montagem...", 0.1);

  let dadosJson = null;
  try {
    const resJson = await fetch(caminhoJson);
    if (resJson.ok) {
      dadosJson = await resJson.json();
    }
  } catch (err) {
    console.warn("Aviso ao carregar JSON da sequência:", err);
  }

  // Prepara o cronograma e os filtros de módulo
  cronogramaAtual = prepararCronograma(dadosJson, filtroModulo);

  if (aoProgredir) aoProgredir("Baixando modelo 3D...", 0.3);
  const resIfc = await fetch(caminhoIfc);
  const bufferIfc = await resIfc.arrayBuffer();

  if (aoProgredir) aoProgredir("Lendo geometria IFC...", 0.5);
  const api = await obterLeitorIFC();
  const modelID = api.OpenModel(new Uint8Array(bufferIfc), { COORDINATE_TO_ORIGIN: false });

  // Limpa malhas anteriores se houver
  while (grupoModelo.children.length > 0) {
    const c = grupoModelo.children[0];
    grupoModelo.remove(c);
  }
  elementosPorGuid.clear();

  // Coleta as malhas do IFC
  const malhasPorExpressID = new Map();
  api.StreamAllMeshes(modelID, (flatMesh) => {
    const eid = flatMesh.expressID;
    const totalGeom = flatMesh.geometries.size();
    const dadosMesh = [];

    for (let i = 0; i < totalGeom; i++) {
      const pg = flatMesh.geometries.get(i);
      const geomBruta = api.GetGeometry(modelID, pg.geometryExpressID);
      const verts = api.GetVertexArray(geomBruta.GetVertexData(), geomBruta.GetVertexDataSize());
      const idx = api.GetIndexArray(geomBruta.GetIndexData(), geomBruta.GetIndexDataSize());
      dadosMesh.push({
        verts: verts.slice(),
        idx: idx.slice(),
        cor: pg.color,
        matriz: pg.flatTransformation
      });
      geomBruta.delete();
    }
    malhasPorExpressID.set(eid, dadosMesh);
  });

  if (aoProgredir) aoProgredir("Construindo peças 3D...", 0.8);

  // Cores manuais salvas no projeto (se houver)
  const estadoJson = dadosJson ? (dadosJson.estado || dadosJson) : {};
  const mapaCoresJson = estadoJson.cores || {};

  // Cria os objetos Three.js e mapeia pelos GUIDs
  for (const [eid, listaGeom] of malhasPorExpressID) {
    let guid = "E" + eid;
    try {
      const linha = api.GetLine(modelID, eid);
      if (linha.GlobalId?.value) {
        guid = linha.GlobalId.value;
      }
    } catch (e) {}

    const subGrupo = new THREE.Group();
    const listaMeshes = [];
    let corHexOriginal = "#94a3b8";

    // Verifica se a peça tem pintura manual salva no JSON
    const corManual = mapaCoresJson[guid];

    for (const d of listaGeom) {
      const geo = new THREE.BufferGeometry();
      const inter = new THREE.InterleavedBuffer(d.verts, 6);
      geo.setAttribute("position", new THREE.InterleavedBufferAttribute(inter, 3, 0));
      geo.setAttribute("normal", new THREE.InterleavedBufferAttribute(inter, 3, 3));
      geo.setIndex(new THREE.BufferAttribute(d.idx, 1));

      const r = d.cor?.x ?? 0.8;
      const g = d.cor?.y ?? 0.8;
      const b = d.cor?.z ?? 0.8;
      const corFinal = corManual ? new THREE.Color(corManual) : new THREE.Color(r, g, b);
      corHexOriginal = "#" + corFinal.getHexString();

      const mat = new THREE.MeshStandardMaterial({
        color: corFinal,
        roughness: 0.5,
        metalness: 0.1,
        side: THREE.DoubleSide
      });

      const mesh = new THREE.Mesh(geo, mat);
      mesh.matrixAutoUpdate = false;
      mesh.matrix.fromArray(d.matriz);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.userData.materialOriginal = mat;

      subGrupo.add(mesh);
      listaMeshes.push(mesh);
    }

    grupoModelo.add(subGrupo);
    elementosPorGuid.set(guid, {
      grupo: subGrupo,
      meshes: listaMeshes,
      corOriginal: corHexOriginal,
      posicaoYBase: subGrupo.position.y
    });
  }

  try {
    api.CloseModel(modelID);
  } catch (e) {}

  enquadrarModelo(camera, controles, grupoModelo);
  atualizarInstanteAnimacao(0);

  if (aoProgredir) aoProgredir("Pronto!", 1.0);

  return { cronograma: cronogramaAtual, totalPecas: elementosPorGuid.size };
}

/**
 * Função para atualizar visualmente todas as peças com base no tempo:
 * O que ela faz: Anima a descida suave das peças ativas, mantém as fixas
 * e as peças de módulos anteriores prontas, e esconde ou deixa translúcidas as futuras.
 */
export function atualizarInstanteAnimacao(novoTempo) {
  tempoAtual = novoTempo;
  if (!cronogramaAtual) return;

  const estados = avaliarEstadoPecas(cronogramaAtual, tempoAtual, true);
  const ALTURA_ENTRADA = 1.6; // Altura em metros de onde a peça vem descendo
  const ehModuloIsolado = Boolean(cronogramaAtual.moduloAtivo);

  for (const [guid, el] of elementosPorGuid) {
    // 1. Peça fixa da base (sempre montada e sólida)
    if (cronogramaAtual.fixos && cronogramaAtual.fixos.has(guid)) {
      el.grupo.visible = true;
      el.grupo.position.y = el.posicaoYBase;
      for (const m of el.meshes) {
        m.material = m.userData.materialOriginal;
      }
      continue;
    }

    const estadoInfo = estados.get(guid);

    // 2. Se a peça não pertence à sequência nem aos fixos
    if (!estadoInfo) {
      if (ehModuloIsolado) {
        // Quando está filtrando um módulo, peças de outros módulos futuros somem
        el.grupo.visible = false;
      } else {
        el.grupo.visible = true;
        for (const m of el.meshes) {
          m.material = m.userData.materialOriginal;
        }
      }
      continue;
    }

    // 3. Peça pré-montada (de um módulo anterior que serve de alicerce)
    if (estadoInfo.estado === "pre_montado") {
      el.grupo.visible = true;
      el.grupo.position.y = el.posicaoYBase;
      for (const m of el.meshes) {
        m.material = m.userData.materialOriginal;
      }
      continue;
    }

    // 4. Peça montada na sequência atual: mantém sua cor e material real original do IFC
    if (estadoInfo.estado === "montado") {
      el.grupo.visible = true;
      el.grupo.position.y = el.posicaoYBase;
      for (const m of el.meshes) {
        m.material = m.userData.materialOriginal;
      }
    } else if (estadoInfo.estado === "entrando") {
      // 5. Peça descendo suavemente: usa seu material real com um leve brilho de realce
      el.grupo.visible = true;
      el.grupo.position.y = el.posicaoYBase + estadoInfo.deslocamento * ALTURA_ENTRADA;
      for (const m of el.meshes) {
        if (!m.userData.matEntrando) {
          m.userData.matEntrando = m.userData.materialOriginal.clone();
          m.userData.matEntrando.emissive = new THREE.Color(0xffffff);
          m.userData.matEntrando.emissiveIntensity = 0.25;
        }
        m.material = m.userData.matEntrando;
      }
    } else {
      // 6. Peça do futuro: em modo isolado fica oculta; em obra completa fica fantasma sutil
      if (ehModuloIsolado) {
        el.grupo.visible = false;
      } else {
        el.grupo.visible = true;
        el.grupo.position.y = el.posicaoYBase;
        for (const m of el.meshes) {
          m.material = materialFantasma;
        }
      }
    }
  }
}

/**
 * Função de Play / Pausa:
 */
export function alternarPlay() {
  estaTocando = !estaTocando;
  if (estaTocando) {
    relogioAnimacao.start();
    if (cronogramaAtual && tempoAtual >= cronogramaAtual.duracaoTotal) {
      atualizarInstanteAnimacao(0);
    }
  }
  return estaTocando;
}

/**
 * Função para alterar velocidade de reprodução:
 */
export function definirVelocidade(vel) {
  velocidadeReproducao = vel;
}

/**
 * Loop principal de animação (RequestAnimationFrame):
 */
function loop() {
  requestAnimationFrame(loop);

  const delta = relogioAnimacao.getDelta();

  if (estaTocando && cronogramaAtual) {
    tempoAtual += delta * velocidadeReproducao;
    if (tempoAtual >= cronogramaAtual.duracaoTotal) {
      tempoAtual = cronogramaAtual.duracaoTotal;
      estaTocando = false;
      window.dispatchEvent(new CustomEvent("fim-sequencia"));
    }
    atualizarInstanteAnimacao(tempoAtual);
    window.dispatchEvent(new CustomEvent("tempo-mudou", { detail: { tempo: tempoAtual, total: cronogramaAtual.duracaoTotal } }));
  }

  if (controles) controles.update();

  if (renderizador && cena && camera) {
    renderizador.render(cena, camera);
  }
}

export function obterInfoCronograma() {
  return { cronograma: cronogramaAtual, tempoAtual, estaTocando };
}
