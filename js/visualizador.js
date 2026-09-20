/**
 * ==============================================================================
 * js/visualizador.js
 * ==============================================================================
 * PARA QUE SERVE ESTE ARQUIVO? (Explicação em termos simples):
 * Este é o "palco e o maestro" da cena 3D. Ele:
 * 1. Liga o motor 3D (Three.js), o chão e as luzes para deixar a cena linda.
 * 2. Carrega o arquivo do projeto (.ifc) e o arquivo de passos (.json).
 * 3. Mostra as peças descendo e se encaixando conforme o cronômetro anda.
 * 4. Conecta os botões da tela (Play, Pausa, Barra de Tempo, Enquadrar) com a cena.
 * ==============================================================================
 */

import * as THREE from "three";
import { configurarControlesCamera, enquadrarModelo } from "./controles-toque.js";
import { prepararCronograma, avaliarEstadoPecas } from "./sequencia-motor.js";

// Endereço da biblioteca que lê arquivos IFC no navegador
const URL_WEBIFC = "https://cdn.jsdelivr.net/npm/web-ifc@0.0.57/";

// Variáveis principais do motor 3D
let cena, camera, renderizador, controles;
let grupoModelo = null;
let ifcApi = null;

// Dados do modelo e da sequência
const elementosPorGuid = new Map(); // guid -> { grupo, meshes, corOriginal }
let cronogramaAtual = null;
let tempoAtual = 0;
let estaTocando = false;
let velocidadeReproducao = 1.0;
let relogioAnimacao = new THREE.Clock();

// Materiais reutilizáveis para garantir que o celular rode a 60 fps liso
const materialFantasma = new THREE.MeshStandardMaterial({
  color: 0x8899a6,
  transparent: true,
  opacity: 0.12,
  roughness: 0.9,
  depthWrite: false
});

/**
 * Função para inicializar a cena 3D, iluminação e câmera:
 * O que ela faz: Prepara o "estúdio" onde o modelo vai aparecer.
 */
export function iniciarCena(container) {
  // 1. Cria o mundo 3D (Cena)
  cena = new THREE.Scene();
  cena.background = new THREE.Color("#0f172a"); // Fundo azul marinho escuro elegante

  // 2. Cria a Câmera
  const largura = container.clientWidth || window.innerWidth;
  const altura = container.clientHeight || window.innerHeight;
  camera = new THREE.PerspectiveCamera(45, largura / altura, 0.1, 100);
  camera.position.set(6, 5, 8);

  // 3. Cria o Renderizador (com suporte a telas retina de celular)
  renderizador = new THREE.WebGLRenderer({
    antialias: true,
    powerPreference: "high-performance"
  });
  renderizador.setSize(largura, altura);
  renderizador.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderizador.shadowMap.enabled = true;
  renderizador.shadowMap.type = THREE.PCFSoftShadowMap;
  renderizador.toneMapping = THREE.ACESFilmicToneMapping;
  renderizador.toneMappingExposure = 1.1;
  container.appendChild(renderizador.domElement);

  // 4. Configura os controles livres de toque
  controles = configurarControlesCamera(camera, renderizador.domElement);

  // 5. Configura as Luzes (Sol e Luz de Ambiente)
  configurarLuzes();

  // 6. Adiciona o piso e a grade sutil
  criarChaoEGrade();

  // 7. Grupo onde os blocos da casa ficarão guardados
  grupoModelo = new THREE.Group();
  cena.add(grupoModelo);

  // Redimensionamento automático se a pessoa girar o celular
  window.addEventListener("resize", () => {
    const w = container.clientWidth || window.innerWidth;
    const h = container.clientHeight || window.innerHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderizador.setSize(w, h);
  });

  // Evento para centralizar
  window.addEventListener("solicitar-enquadrar", () => {
    enquadrarModelo(camera, controles, grupoModelo);
  });

  // Inicia o ciclo de renderização
  loop();

  return { cena, camera, renderizador, controles };
}

/**
 * Função para criar as luzes da cena:
 * O que ela faz: Coloca uma luz principal suave (o "sol") para criar sombras realistas
 * e uma luz de preenchimento para que nenhum canto do modelo fique totalmente escuro.
 */
function configurarLuzes() {
  const luzAmbiente = new THREE.AmbientLight(0xffffff, 0.65);
  cena.add(luzAmbiente);

  const sol = new THREE.DirectionalLight(0xfff5ea, 1.8);
  sol.position.set(10, 15, 10);
  sol.castShadow = true;
  sol.shadow.mapSize.width = 2048;
  sol.shadow.mapSize.height = 2048;
  sol.shadow.camera.near = 0.5;
  sol.shadow.camera.far = 40;
  const d = 8;
  sol.shadow.camera.left = -d;
  sol.shadow.camera.right = d;
  sol.shadow.camera.top = d;
  sol.shadow.camera.bottom = -d;
  sol.shadow.bias = -0.0005;
  cena.add(sol);

  const luzAzulRebote = new THREE.DirectionalLight(0x90b0e0, 0.5);
  luzAzulRebote.position.set(-10, -5, -10);
  cena.add(luzAzulRebote);
}

/**
 * Função para criar o piso e a grade no chão:
 * O que ela faz: Coloca uma grade bonita no chão para a pessoa ter referência de espaço.
 */
function criarChaoEGrade() {
  const grade = new THREE.GridHelper(20, 20, 0x334155, 0x1e293b);
  grade.position.y = -0.01;
  cena.add(grade);

  const geoChao = new THREE.PlaneGeometry(60, 60);
  const matChao = new THREE.ShadowMaterial({ opacity: 0.35 });
  const chao = new THREE.Mesh(geoChao, matChao);
  chao.rotation.x = -Math.PI / 2;
  chao.position.y = -0.012;
  chao.receiveShadow = true;
  cena.add(chao);
}

/**
 * Função para carregar a biblioteca do leitor de IFC (Web-IFC):
 * O que ela faz: Baixa o motor leitor de arquivo BIM na primeira vez que for necessário.
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
 * O que ela faz: Baixa os arquivos, desenha as peças 3D na cena e sincroniza a linha do tempo.
 */
export async function carregarProjeto(caminhoIfc, caminhoJson, filtroModulo = null, aoProgredir = null) {
  if (aoProgredir) aoProgredir("Carregando arquivos do projeto...", 0.1);

  // 1. Baixa o arquivo JSON com as instruções da sequência
  let dadosJson = null;
  try {
    const resJson = await fetch(caminhoJson);
    if (resJson.ok) {
      dadosJson = await resJson.json();
    }
  } catch (err) {
    console.warn("Aviso ao carregar JSON da sequência:", err);
  }

  // Prepara o cronograma
  cronogramaAtual = prepararCronograma(dadosJson, filtroModulo);

  // 2. Baixa o arquivo IFC 3D
  if (aoProgredir) aoProgredir("Baixando modelo 3D (IFC)...", 0.3);
  const resIfc = await fetch(caminhoIfc);
  const bufferIfc = await resIfc.arrayBuffer();

  // 3. Lê o IFC com o WebAssembly
  if (aoProgredir) aoProgredir("Processando geometria 3D...", 0.5);
  const api = await obterLeitorIFC();
  const modelID = api.OpenModel(new Uint8Array(bufferIfc), { COORDINATE_TO_ORIGIN: false });

  // Limpa o modelo anterior caso exista
  while (grupoModelo.children.length > 0) {
    const c = grupoModelo.children[0];
    grupoModelo.remove(c);
  }
  elementosPorGuid.clear();

  // 4. Coleta as malhas de cada produto
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

  if (aoProgredir) aoProgredir("Montando peças na cena...", 0.8);

  // 5. Constrói os objetos Three.js e associa ao GUID de cada peça
  for (const [eid, listaGeom] of malhasPorExpressID) {
    let guid = "E" + eid;
    try {
      const linha = api.GetLine(modelID, eid);
      if (linha.GlobalId?.value) {
        guid = linha.GlobalId.value;
      }
    } catch (e) {
      // Usa o ID numérico se não tiver GlobalId
    }

    const subGrupo = new THREE.Group();
    const listaMeshes = [];
    let corOriginalPeca = "#94a3b8";

    for (const d of listaGeom) {
      const geo = new THREE.BufferGeometry();
      const inter = new THREE.InterleavedBuffer(d.verts, 6);
      geo.setAttribute("position", new THREE.InterleavedBufferAttribute(inter, 3, 0));
      geo.setAttribute("normal", new THREE.InterleavedBufferAttribute(inter, 3, 3));
      geo.setIndex(new THREE.BufferAttribute(d.idx, 1));

      // Cor original do IFC
      const r = d.cor?.x ?? 0.8;
      const g = d.cor?.y ?? 0.8;
      const b = d.cor?.z ?? 0.8;
      corOriginalPeca = new THREE.Color(r, g, b).getHexString();

      const mat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(r, g, b),
        roughness: 0.5,
        metalness: 0.1,
        side: THREE.DoubleSide
      });

      const mesh = new THREE.Mesh(geo, mat);
      mesh.matrixAutoUpdate = false;
      mesh.matrix.fromArray(d.matriz);
      mesh.castShadow = true;
      mesh.receiveShadow = true;

      subGrupo.add(mesh);
      listaMeshes.push(mesh);
    }

    grupoModelo.add(subGrupo);
    elementosPorGuid.set(guid, {
      grupo: subGrupo,
      meshes: listaMeshes,
      corOriginal: "#" + corOriginalPeca,
      posicaoYBase: subGrupo.position.y
    });
  }

  // Fecha o modelo na memória do leitor
  try {
    api.CloseModel(modelID);
  } catch (e) {}

  // Centraliza o modelo perfeitamente na cena
  enquadrarModelo(camera, controles, grupoModelo);

  // Posiciona a animação no instante inicial
  atualizarInstanteAnimacao(0);

  if (aoProgredir) aoProgredir("Pronto!", 1.0);

  return { cronograma: cronogramaAtual, totalPecas: elementosPorGuid.size };
}

/**
 * Função para atualizar visualmente todas as peças com base no tempo atual:
 * O que ela faz: Faz a peça que está chegando descer suavemente do teto,
 * pinta as peças montadas e esconde/fantasma as futuras.
 */
export function atualizarInstanteAnimacao(novoTempo) {
  tempoAtual = novoTempo;
  if (!cronogramaAtual) return;

  const estados = avaliarEstadoPecas(cronogramaAtual, tempoAtual, true);
  const ALTURA_ENTRADA = 1.8; // Metros de altura de onde a peça vem descendo

  for (const [guid, el] of elementosPorGuid) {
    const estadoInfo = estados.get(guid);

    if (!estadoInfo) {
      // Peça não cadastrada na sequência (ex: base ou terreno): fica visível normalmente
      el.grupo.visible = true;
      for (const m of el.meshes) {
        m.material = m.userData.materialNormal || m.material;
      }
      continue;
    }

    if (estadoInfo.estado === "montado") {
      // Já montada: fixa no lugar certo com sua cor
      el.grupo.visible = true;
      el.grupo.position.y = el.posicaoYBase;
      for (const m of el.meshes) {
        if (!m.userData.matMontado || m.userData.matMontadoCor !== estadoInfo.cor) {
          m.userData.matMontado = new THREE.MeshStandardMaterial({
            color: new THREE.Color(estadoInfo.cor || el.corOriginal),
            roughness: 0.45,
            metalness: 0.1
          });
          m.userData.matMontadoCor = estadoInfo.cor;
        }
        m.material = m.userData.matMontado;
      }
    } else if (estadoInfo.estado === "entrando") {
      // Chegando agora: desce suavemente pelo eixo vertical (Y)
      el.grupo.visible = true;
      el.grupo.position.y = el.posicaoYBase + estadoInfo.deslocamento * ALTURA_ENTRADA;
      for (const m of el.meshes) {
        if (!m.userData.matEntrando) {
          m.userData.matEntrando = new THREE.MeshStandardMaterial({
            color: new THREE.Color(estadoInfo.cor || "#ffffff"),
            roughness: 0.2,
            metalness: 0.2,
            emissive: new THREE.Color(estadoInfo.cor || "#ffffff"),
            emissiveIntensity: 0.25
          });
        }
        m.material = m.userData.matEntrando;
      }
    } else {
      // Peça futura: mostra como fantasma semi-transparente para o usuário entender onde ela vai encaixar
      el.grupo.visible = true;
      el.grupo.position.y = el.posicaoYBase;
      for (const m of el.meshes) {
        m.material = materialFantasma;
      }
    }
  }
}

/**
 * Função de Play / Pausa:
 * O que ela faz: Liga ou pausa o relógio da sequência de montagem.
 */
export function alternarPlay() {
  estaTocando = !estaTocando;
  if (estaTocando) {
    relogioAnimacao.start();
    // Se estiver no final, reinicia do começo
    if (cronogramaAtual && tempoAtual >= cronogramaAtual.duracaoTotal) {
      atualizarInstanteAnimacao(0);
    }
  }
  return estaTocando;
}

/**
 * Função para definir velocidade de reprodução (1x, 1.5x, 2x):
 */
export function definirVelocidade(vel) {
  velocidadeReproducao = vel;
}

/**
 * Loop principal de animação (RequestAnimationFrame):
 * O que ela faz: Roda a cada milissegundo atualizando a câmera e o avanço do tempo.
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

  // Atualiza a física suave dos controles de toque
  if (controles) controles.update();

  // Desenha o quadro na tela
  if (renderizador && cena && camera) {
    renderizador.render(cena, camera);
  }
}

/**
 * Obter informações atuais do cronograma:
 */
export function obterInfoCronograma() {
  return {
    cronograma: cronogramaAtual,
    tempoAtual,
    estaTocando
  };
}
