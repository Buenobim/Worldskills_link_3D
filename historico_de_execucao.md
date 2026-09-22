# Histórico de Execução — Visualizador 3D WSC & Gerador de Links

Este arquivo registra cada passo dado no desenvolvimento do projeto, garantindo continuidade e clareza sobre o que já foi feito e o que está por vir.

---

### [2026-09-20] - Inicialização e Arquitetura
- **Análise do projeto de referência**: Avaliado o projeto `Plataforma_4D - WSC - MELHORADO`, compreendendo o funcionamento do leitor IFC (`web-ifc`), a estrutura de dados das sequências 4D (`modulos`, `seq`, tempos) e os materiais Three.js.
- **Aprovação do Plano**: Plano apresentado ao usuário e aprovado com sucesso.
- **Criação do ARQUITETURA.md**: Definidos os pilares do sistema (câmera livre, celular em primeiro lugar, visual limpo, links por módulos e gerador com QR code).
- **Criação do historico_de_execucao.md**: Inicializado para rastreamento do progresso.

---

### [2026-09-20] - Construção do Núcleo do Sistema
- **Estrutura de Arquivos e Modelos**:
  - Modelos IFC e JSON de referência copiados para a pasta `modelos/` (`video-do-projeto` e `projeto-worldskills`).
  - Configurados `package.json`, `firebase.json` e `.firebaserc` com cabeçalhos CORS e MIME types apropriados para arquivos IFC e WebAssembly.
- **Conector Firebase (`js/firebase-config.js`)**:
  - Implementada a conexão com o Firebase com credenciais do projeto `visualizador3dwsc` e explicações em termos leigos.
- **Motor de Sequência 4D (`js/sequencia-motor.js`)**:
  - Criado o algoritmo de cálculo de tempos, amortecimento suave de chegada (ease-out) e isolamento de módulos para links específicos (`?modulo=A`).
- **Controles Livres de Toque para Celular (`js/controles-toque.js`)**:
  - Configurado Three.js `OrbitControls` com amortecimento suave (`dampingFactor = 0.06`), rotação com 1 dedo, zoom em pinça com 2 dedos e duplo toque para reenquadrar.
- **Motor do Visualizador 3D (`js/visualizador.js`)**:
  - Configuração da cena Three.js, iluminação solar realista com sombras suaves, leitor de arquivos IFC via `web-ifc` WebAssembly, animação das peças descendo verticalmente e se assentando.
- **Interface do Visualizador (`index.html` e `css/visualizador.css`)**:
  - Design moderno em Dark Mode com glassmorphism, player flutuante minimalista, barra de tempo deslizante, seletor de módulos e controle de velocidade.
- **Painel Gerador de Links (`gerador.html`, `css/gerador.css` e `js/gerador.js`)**:
  - Geração automática de links por módulo e obra completa.
  - Geração instantânea de QR Code para apontar a câmera do celular (`js/qrcode-light.js`).
  - Botão de copiar link com 1 clique e modal de exportação completa formatada para envio no WhatsApp.
- **Controle de Versão Git**:
  - Repositório inicializado na branch `main` e conectado ao GitHub `https://github.com/Buenobim/Worldskills_link_3D.git`.
  - Primeiro commit estruturado realizado e enviado (`git push -u origin main`).

---

### [2026-09-20] - Blindagem de Segurança Absoluta (WorldSkills China)
- **Eliminação Estrutural no Código HTML**:
  - A tag `<select id="seletor-modulo">` foi **completamente excluída do arquivo HTML**. Não existe mais menu de seleção nem opções de outros módulos no código da página.
  - O botão de atalho para o `gerador.html` foi **completamente excluído do arquivo HTML**.
  - O competidor vê apenas um texto estático e inerte (ex: `Módulo A`), sem qualquer elemento clicável para alternar módulos.
- **Proteção do Painel por PIN**:
  - O `gerador.html` foi blindado com uma tela de bloqueio com PIN (`2026`). Concorrentes não conseguem ver nem gerar links se tentarem acessar o gerador diretamente.
- **Prevenção Total de Cache**:
  - O `firebase.json` foi configurado com cabeçalhos HTTP rigorosos: `Cache-Control: no-cache, no-store, must-revalidate, max-age=0`. Isso impede que navegadores guardem ou mostrem versões antigas da página.

---

### [2026-09-20] - Vista Isométrica Inicial e Estabilidade Total do Zoom
- **Vista Isométrica Frontal Padrão**:
  - A câmera agora inicia automaticamente no ângulo isométrico oficial (olhando de frente para o canto interior, com a parede do mosaico à esquerda e a parede da porta à direita).
- **Correção Definitiva do Zoom (Eliminação do Snap-back)**:
  - Identificada a causa do retorno indesejado: o evento de duplo toque na tela disparava falsamente quando o usuário levantava os dois dedos após a pinça de zoom.
  - O gatilho de duplo toque acidental foi removido dos controles de toque, mantendo o zoom 100% firme onde o usuário deixar.
  - O botão de enquadrar da barra inferior agora recentraliza perfeitamente na vista isométrica oficial sempre que o usuário desejar.
- **Publicação**:
  - Deploy final no Firebase Hosting (`https://visualizador3dwsc.web.app`) e sincronizado no GitHub.

---

### [2026-09-21] - Tradução Integral em Inglês, Fotos dos Módulos Prontos e Exportação em PDF e PNG
- **Tradução Integral para o Inglês**:
  - Toda a plataforma pública (`index.html`, `gerador.html`), as folhas de impressão A4 e as imagens geradas foram convertidas 100% para o inglês, atendendo às exigências da competição internacional na China (Wall & Floor Tiling - Skill 12).
- **Fotos de Alta Resolução dos Módulos Prontos**:
  - Foram extraídas 4 fotos oficiais da maquete em estado finalizado para cada módulo:
    - `imagens/modulos/modulo_a.png` (Base e alvenaria)
    - `imagens/modulos/modulo_b.png` (Mosaico estrutural)
    - `imagens/modulos/modulo_c.png` (Parede intermediária da porta)
    - `imagens/modulos/modulo_d.png` (Montagem final completa)
  - Cada cartão do gerador agora exibe a foto do módulo pronto logo acima do QR Code.
- **Exportação de Folha Oficial A4 para Impressão e PDF**:
  - Adicionado botão **"Print / PDF"** em cada cartão.
  - Ao clicar, o sistema aciona a impressão do navegador com layout padrão A4 contendo: cabeçalho oficial WorldSkills, foto do módulo pronto, QR Code de 200px, link direto e instruções de uso em inglês.
- **Exportação de Imagem em Alta Resolução (PNG)**:
  - Adicionado botão **"Save PNG"** em cada cartão.
  - Gera através de um canvas offscreen uma imagem em alta resolução (1000 x 1380 px) contendo moldura escura profissional, foto da maquete pronta, QR Code ampliado e instruções passo a passo para envio por WeChat/WhatsApp.
- **Didática e Regras de Ouro**:
  - Todos os arquivos mantêm comentários explicativos em português leigo no topo e acima de cada função para fácil compreensão do usuário Bruno.
- **Deploy e Nuvem**:
  - Publicado com sucesso no Firebase Hosting (`https://visualizador3dwsc.web.app`) e versionado no GitHub.

---

### [2026-09-21] - Simplificação dos Links com Códigos Não-Óbvios
- **Links Não-Óbvios Sem Complicação**:
  - Removido qualquer mecanismo complexo ou mensagens confusas de liberação.
  - O sistema agora usa parâmetros simples e diretos com códigos não-óbvios:
    - **Link 1 (Módulo A)**: `https://visualizador3dwsc.web.app/?m=mod-8k2p`
    - **Link 2 (Módulo B)**: `https://visualizador3dwsc.web.app/?m=mod-4t7b`
    - **Link 3 (Módulo C)**: `https://visualizador3dwsc.web.app/?m=mod-1w9v`
    - **Link 4 (Módulo D)**: `https://visualizador3dwsc.web.app/?m=mod-6n3r`
    - **Obra Completa**: `https://visualizador3dwsc.web.app/?m=full-model`
- **Prevenção de Troca por 1 Letra**:
  - Como os códigos são diferentes e não seguem `A`, `B`, `C`, ninguém consegue deduzir o próximo módulo trocando uma única letra.
  - Se alguém digitar um link inexistente, aparece uma mensagem amigável: *"Module not found. Please check your link or scan the QR code."*
- **Gerador de Links Atualizado**:
  - Todos os cartões, links diretos, QR codes, impressão A4 e download de PNG geram diretamente esses links limpos.
- **Deploy de Produção**:
  - Publicado com sucesso no Firebase Hosting (`https://visualizador3dwsc.web.app`).

---

### [2026-09-21] - Atualização da Revisão dos Módulos e IFC
- **Atualização do Modelo IFC 3D**:
  - Atualizado o arquivo IFC oficial `modelos/Projeto_Atual.ifc` a partir da nova revisão `Projeto WorldSkills 04.ifc`.
- **Atualização do Cronograma e Sequência JSON**:
  - Atualizado `modelos/Projeto_Atual.json` com a revisão completa fornecida pelo usuário.
  - Reprocessados todos os arquivos segregados por módulo para os links não-óbvios:
    - `modulo_mod-8k2p.json` (Módulo A: Base e alvenaria)
    - `modulo_mod-4t7b.json` (Módulo B: Módulo A pré-montado + Mosaico estrutural)
    - `modulo_mod-1w9v.json` (Módulo C: Módulos A e B pré-montados + Parede intermediária)
    - `modulo_mod-6n3r.json` (Módulo D: Módulos A, B e C pré-montados + Montagem final)
    - `modulo_full-model.json` (Obra completa com todos os módulos)
- **Deploy e Nuvem**:
  - Publicado no Firebase Hosting para que os links e QR Codes abram imediatamente a versão revisada.

---

### [2026-09-21] - Trilha Sonora Cinematográfica de Fundo e Controle de Áudio
- **Inclusão da Trilha Sonora**:
  - Adicionado o arquivo de áudio `audio/trilha.mp3` ("Inspiring Uplifting Cinematic Background Music For Videos").
- **Comportamento Sincronizado**:
  - A música inicia automaticamente em volume agradável (40%) ao clicar em Play para acompanhar a montagem 3D.
  - A música pausa automaticamente ao pausar o vídeo ou ao término da sequência de peças.
- **Botão de Mute**:
  - Adicionado botão de som na barra flutuante para mutar ou desmutar a qualquer momento com apenas 1 toque.
- **Preservação Total dos Links**:
  - Todos os links oficiais continuam exatamente os mesmos, sem qualquer alteração de URL.

---

### [2026-09-22] - Nova Revisão do Modelo (WorldSkills 06) e Suporte a Direção de Entrada por Peça
- **Atualização do Modelo IFC 3D**:
  - Atualizado `modelos/Projeto_Atual.ifc` a partir da nova revisão `Projeto WorldSkills 06.ifc`.
- **Atualização do Cronograma e Sequência JSON**:
  - Atualizado `modelos/Projeto_Atual.json` com a revisão completa exportada do editor (413 peças no total: A=93, B=194, C=105, D=21).
  - Reprocessados todos os arquivos segregados por módulo para os links não-óbvios (`modulo_mod-8k2p.json`, `modulo_mod-4t7b.json`, `modulo_mod-1w9v.json`, `modulo_mod-6n3r.json`, `modulo_full-model.json`), mantendo os mesmos links já divulgados.
- **Suporte a Direção de Entrada por Peça (`dirs`)**:
  - O projeto exportado do editor "Plataforma 4D" agora traz, além da direção padrão do módulo (`dir`), uma direção específica por peça (`dirs[guid]`: cima, baixo, esquerda, direita, frente ou trás) — usada, por exemplo, para simular uma porta ou soleira encaixando de lado em vez de cair de cima.
  - `js/sequencia-motor.js`: a direção de cada peça agora respeita `mod.dirs[guid]` antes de cair para `mod.dir`.
  - `js/visualizador.js`: a animação de entrada agora desloca a peça ao longo do eixo correto (cima/baixo/esquerda/direita/frente/trás), não apenas verticalmente como antes. Testado nos 4 módulos e na obra completa sem erros de console.
  - Cache-busting das versões dos módulos JS atualizado (`?v=20260922_modulos06`) para garantir que o navegador não sirva a versão antiga em cache.

---

### [2026-09-22] - Aplicador de Silicone (Trilha de "Movimentos" Livres) e Correção de Coordenadas
- **Contexto**: o Bruno percebeu que o aplicador de silicone (ferramenta que percorre a junta entre as placas no Módulo B) não aparecia no visualizador, mesmo já estando presente no projeto exportado (`estado.movimentos`). Investigado o projeto de referência `Plataforma_4D - WSC - MELHORADO` para entender como essa trilha funciona lá.
- **O que é a trilha de movimentos**: além da sequência normal de montagem (peça aparece e fica), o editor permite gravar um "movimento livre" — uma peça específica (ex: o aplicador, um `IFCBUILDINGELEMENTPROXY` do modelo) se deslocando de um ponto 3D a outro num intervalo de tempo. Ela só existe visível dentro dessa janela de tempo — some antes e depois.
- **Implementado em `js/sequencia-motor.js`**:
  - `prepararCronograma` agora lê `mod.movimentos` (tempo gravado em horas relativas ao início do próprio módulo) e converte para o tempo de vídeo real, na mesma proporção do módulo (`fração das horas do módulo × duração de vídeo do módulo`), então funciona tanto no link isolado do módulo quanto na obra completa.
  - `avaliarEstadoPecas` retorna um estado `"movimento"` (com o ponto interpolado) enquanto a peça está na janela, e `"oculto_movimento"` fora dela.
- **Implementado em `js/visualizador.js`**:
  - Foi descoberta e corrigida uma incompatibilidade de coordenadas: o editor "Plataforma 4D" recentraliza o modelo inteiro após carregar o IFC (centro em X/Z, piso em Y=0) e grava os pontos "de"/"ate" nessa escala recentralizada — este visualizador carregava o IFC nas coordenadas brutas do arquivo, então o aplicador aparecia longe do lugar certo (fora da tela / dentro de paredes). Corrigido aplicando a mesma recentralização (`grupoModelo.position`) logo após montar as peças.
  - Cada peça agora guarda seu centro real em coordenadas de mundo (`el.centro`, calculado manualmente via `Box3.applyMatrix4` para não atropelar a matriz já pronta do IFC), usado para posicionar a peça durante o movimento.
  - Peça em movimento: visível, posição interpolada linearmente entre "de" e "ate". Fora da janela: oculta.
- **Regenerados os 5 arquivos de módulo** (script local) para embutir os movimentos já convertidos para o tempo relativo de cada módulo — o aplicador de silicone acabou caindo dentro do Módulo B, perto do fim da sua janela de vídeo.
- **Testado**: aplicador aparece só dentro da janela certa (Módulo B, ~99.8s a ~111.1s de vídeo isolado), sobe corretamente de "de" a "ate", some antes e depois. Módulos A/C/D e obra completa continuam carregando e enquadrando normalmente. Sem erros de console.
- Cache-busting atualizado (`?v=20260922_movimentos`).
