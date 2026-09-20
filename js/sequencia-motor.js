/**
 * ==============================================================================
 * js/sequencia-motor.js
 * ==============================================================================
 * PARA QUE SERVE ESTE ARQUIVO? (Explicação em termos simples):
 * Este arquivo é o "cérebro do cronograma 4D". Ele pega a lista de peças da obra
 * e descobre exatamente em qual segundo cada peça deve começar a descer,
 * quando ela deve se encaixar no lugar e quanto tempo dura a animação de cada módulo.
 * Ele também cuida de filtrar apenas um Módulo específico (ex: Módulo A) quando
 * você gera um link exclusivo para esse módulo!
 * ==============================================================================
 */

/**
 * Função suave de chegada (amortecimento / assentamento):
 * Faz com que a peça comece a descer e diminua a velocidade bem no final,
 * dando a impressão realista de que a peça "encaixou com precisão" no lugar.
 */
export function amortecerChegada(progresso) {
  // Fórmula matemática de desaceleração suave (Ease-Out)
  return 1 - Math.pow(1 - Math.max(0, Math.min(1, progresso)), 4);
}

/**
 * Função para calcular a ordem e o tempo de cada peça:
 * O que ela faz: Lê os dados do arquivo JSON do projeto e organiza cada peça
 * com seu segundo de início e segundo de fim.
 * Se o usuário escolheu ver apenas um Módulo (ex: "A"), ela foca apenas nas peças daquele módulo!
 */
export function prepararCronograma(dadosJson, filtroModulo = null) {
  if (!dadosJson || !dadosJson.modulos) {
    return { pecas: [], duracaoTotal: 0, modulos: [] };
  }

  const modulosValidos = dadosJson.modulos;
  let modulosFiltrados = modulosValidos;

  // Se tiver um filtro de módulo na URL (ex: ?modulo=A), pega só aquele
  if (filtroModulo) {
    const idLimpo = filtroModulo.trim().toUpperCase();
    const encontrado = modulosValidos.find(
      (m) => (m.id && m.id.toUpperCase() === idLimpo) || (m.nome && m.nome.toUpperCase().includes(idLimpo))
    );
    if (encontrado) {
      modulosFiltrados = [encontrado];
    }
  }

  const pecas = [];
  let tempoAcumulado = 0;
  // Tempo padrão que cada peça leva na tela (em segundos para uma visualização gostosa no celular)
  const TEMPO_POR_PECA_SEG = 0.85;

  for (const modulo of modulosFiltrados) {
    const seq = modulo.seq || [];
    const corModulo = modulo.cor || "#3b82f6";
    const nomeModulo = modulo.nome || `Módulo ${modulo.id}`;
    const idModulo = modulo.id || "A";

    for (let i = 0; i < seq.length; i++) {
      const guid = seq[i];
      const inicio = tempoAcumulado;
      const fim = inicio + TEMPO_POR_PECA_SEG;

      pecas.push({
        guid,
        moduloId: idModulo,
        moduloNome: nomeModulo,
        cor: corModulo,
        inicio,
        fim,
        duracao: TEMPO_POR_PECA_SEG,
        direcao: modulo.dir || "cima", // De onde a peça vem voando (padrão: de cima)
        indiceNoModulo: i + 1,
        totalNoModulo: seq.length
      });

      tempoAcumulado = fim;
    }
  }

  return {
    pecas,
    duracaoTotal: Math.max(tempoAcumulado, 1),
    modulos: modulosValidos,
    moduloAtivo: filtroModulo ? modulosFiltrados[0] : null
  };
}

/**
 * Função para calcular o estado visual de cada peça em um dado instante de tempo:
 * O que ela faz: Quando o relógio está em 5.2 segundos, ela avisa:
 * - "Peças 1, 2, 3, 4 e 5 já estão montadas no lugar (sólidas)."
 * - "Peça 6 está voando descendo para o chão agora (animando)."
 * - "Peças 7, 8, 9... ainda não nasceram (invisíveis ou fantasma)."
 */
export function avaliarEstadoPecas(cronograma, tempoAtual, modoFantasma = true) {
  const resultado = new Map(); // guid -> estado

  for (const p of cronograma.pecas) {
    if (tempoAtual >= p.fim) {
      // Já foi totalmente construída
      resultado.set(p.guid, {
        estado: "montado",
        progressoAnim: 1,
        deslocamento: 0,
        cor: p.cor,
        pecaInfo: p
      });
    } else if (tempoAtual >= p.inicio) {
      // Sendo colocada exatamente agora!
      const frac = (tempoAtual - p.inicio) / Math.max(p.duracao, 0.001);
      const progressoSuave = amortecerChegada(frac);
      const distanciaRestante = 1 - progressoSuave; // 1 no início do voo, 0 quando encaixa

      resultado.set(p.guid, {
        estado: "entrando",
        progressoAnim: progressoSuave,
        deslocamento: distanciaRestante,
        cor: p.cor,
        pecaInfo: p
      });
    } else {
      // Peça do futuro (ainda não chegou a sua hora)
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
