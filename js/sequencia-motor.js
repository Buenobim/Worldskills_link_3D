/**
 * ==============================================================================
 * js/sequencia-motor.js
 * ==============================================================================
 * PARA QUE SERVE ESTE ARQUIVO? (Explicação em termos simples):
 * Este arquivo é o "maestro do cronograma 4D". Ele:
 * 1. Lê o arquivo de dados do projeto (como o Projeto_Atual.json).
 * 2. Identifica os 4 módulos oficiais (Módulo A, Módulo B, Módulo C e Módulo D).
 * 3. Identifica as peças fixas (a base/chão de concreto que já começa montada).
 * 4. Respeita a ordem exata de montagem de cada peça (seq) e os tempos ajustados.
 * 5. Se a pessoa abrir o link do Módulo B, ele já deixa o Módulo A pronto no chão
 *    e monta o Módulo B na sequência correta, sem misturar!
 * ==============================================================================
 */

/**
 * Função de amortecimento suave (Ease-Out):
 * Faz a peça desacelerar suavemente antes de tocar o chão, simulando
 * o encaixe perfeito da peça na vida real.
 */
export function amortecerChegada(progresso) {
  const p = Math.max(0, Math.min(1, progresso));
  return 1 - Math.pow(1 - p, 4);
}

/**
 * Função para encontrar um módulo na lista com base na letra (A, B, C, D):
 * O que ela faz: Compara se o ID (ex: "M0-A"), o rótulo ("A") ou o nome ("Módulo A")
 * corresponde ao módulo que o usuário pediu no link.
 */
export function encontrarModulo(modulos, filtro) {
  if (!filtro) return null;
  const f = filtro.trim().toUpperCase();
  return modulos.find((m) => {
    const id = (m.id || "").toUpperCase();
    const rotulo = (m.rotulo || "").toUpperCase();
    const nome = (m.nome || "").toUpperCase();
    return rotulo === f || id === f || id.endsWith("-" + f) || id.endsWith(f) || nome.includes(`MÓDULO ${f}`) || nome.includes(`MODULO ${f}`);
  }) || null;
}

/**
 * Função para preparar o cronograma completo das peças:
 * O que ela faz: Organiza as peças em ordem cronológica de montagem,
 * calculando o segundo exato em que cada peça desce.
 */
export function prepararCronograma(dadosJson, filtroModulo = null) {
  if (!dadosJson) {
    return { pecas: [], duracaoTotal: 0, modulos: [], fixos: new Set(), pecasPreMontadas: new Set() };
  }

  // Suporta tanto a estrutura com .estado.modulos quanto .modulos na raiz
  const estado = dadosJson.estado || dadosJson;
  const modulos = estado.modulos || [];
  const listaFixos = estado.fixos || [];
  const fixosSet = new Set(listaFixos);

  // Módulo ativo filtrado caso exista (ex: ?modulo=A, ?modulo=B, etc.)
  const moduloAlvo = encontrarModulo(modulos, filtroModulo);

  const pecas = [];
  const pecasPreMontadas = new Set(dadosJson.pre_montados || []);
  let tempoAcumulado = 0;

  // Tempo padrão suave para cada peça no celular (em segundos)
  const DURACAO_BASE_PECA = 0.55;

  for (let i = 0; i < modulos.length; i++) {
    const mod = modulos[i];
    const ehModuloAlvo = moduloAlvo ? mod === moduloAlvo : true;
    const ehModuloPassado = moduloAlvo ? modulos.indexOf(mod) < modulos.indexOf(moduloAlvo) : false;

    const seq = mod.seq || [];
    const ajustes = mod.ajuste || {};
    const corMod = mod.cor || "#3b82f6";
    const nomeMod = mod.nome || `Módulo ${mod.rotulo || mod.id}`;
    const idMod = mod.rotulo || mod.id || `M${i}`;

    // Se estamos vendo um módulo posterior (ex: Módulo B), as peças do Módulo A
    // já devem estar montadas como alicerce estrutural!
    if (ehModuloPassado) {
      for (const guid of seq) {
        pecasPreMontadas.add(guid);
      }
      continue;
    }

    // Se for outro módulo que vem DEPOIS do módulo filtrado, ignoramos na animação atual
    if (moduloAlvo && !ehModuloAlvo) {
      continue;
    }

    // Adiciona as peças deste módulo na sequência exata definida
    for (let idx = 0; idx < seq.length; idx++) {
      const guid = seq[idx];
      const ajustePeca = ajustes[guid] || {};

      // Duração da peça respeita o ajuste do projeto ou usa a base suave
      const dur = Math.max(ajustePeca.dur ? Math.min(ajustePeca.dur * 3.5, 1.2) : DURACAO_BASE_PECA, 0.25);
      const inicio = tempoAcumulado;
      const fim = inicio + dur;

      pecas.push({
        guid,
        moduloId: idMod,
        moduloNome: nomeMod,
        cor: corMod,
        inicio,
        fim,
        duracao: dur,
        direcao: mod.dir || "cima",
        indiceNoModulo: idx + 1,
        totalNoModulo: seq.length
      });

      tempoAcumulado = fim;
    }
  }

  return {
    pecas,
    duracaoTotal: Math.max(tempoAcumulado, 1.0),
    modulos,
    moduloAtivo: moduloAlvo,
    fixos: fixosSet,
    pecasPreMontadas
  };
}

/**
 * Função para avaliar o estado de cada peça a cada segundo:
 * O que ela faz: Diz se a peça já está montada, se está descendo agora
 * ou se é do futuro (ainda não apareceu).
 */
export function avaliarEstadoPecas(cronograma, tempoAtual, modoFantasma = true) {
  const resultado = new Map();

  // Peças pré-montadas de módulos anteriores já ficam 100% visíveis e prontas
  if (cronograma.pecasPreMontadas) {
    for (const guid of cronograma.pecasPreMontadas) {
      resultado.set(guid, {
        estado: "pre_montado",
        progressoAnim: 1,
        deslocamento: 0,
        cor: null
      });
    }
  }

  // Peças da sequência ativa
  for (const p of cronograma.pecas) {
    if (tempoAtual >= p.fim) {
      // Já montada no lugar
      resultado.set(p.guid, {
        estado: "montado",
        progressoAnim: 1,
        deslocamento: 0,
        cor: p.cor,
        pecaInfo: p
      });
    } else if (tempoAtual > p.inicio) {
      // Sendo construída agora (só entra se o tempo já começou a correr > início)
      const frac = (tempoAtual - p.inicio) / Math.max(p.duracao, 0.001);
      const progressoSuave = amortecerChegada(frac);
      const distanciaRestante = 1 - progressoSuave;

      resultado.set(p.guid, {
        estado: "entrando",
        progressoAnim: progressoSuave,
        deslocamento: distanciaRestante,
        cor: p.cor,
        pecaInfo: p
      });
    } else {
      // Peça futura (no instante 00:00 fica oculta/esperando o Play)
      resultado.set(p.guid, {
        estado: modoFantasma ? "fantasma" : "oculto",
        progressoAnim: 0,
        deslocamento: 1,
        cor: null,
        pecaInfo: p
      });
    }
  }

  return resultado;
}
