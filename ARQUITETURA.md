# ARQUITETURA DA PLATAFORMA - VISUALIZADOR 3D WSC & GERADOR DE LINKS

> *"Portanto, quem ouve estas minhas palavras e as pratica é como o homem prudente que construiu a sua casa sobre a rocha."* — Mateus 7:24 NVI

---

## 1. O Que é Este Projeto? (Para Leigos)
Este projeto é uma **plataforma web leve e moderna** criada para permitir que qualquer pessoa abra um link (especialmente pelo **celular**) e consiga **ver um modelo 3D de construção da WorldSkills e sua sequência de montagem (4D)**.

Além disso, ela possui um **Gerador de Links**: um painel prático onde você pode escolher o projeto ou o módulo (ex: Módulo A, Módulo B, Obra Completa), gerar um link direto, gerar um **QR Code** para abrir na câmera do celular e copiar ou exportar a lista de links para enviar no WhatsApp ou e-mail.

---

## 2. Pilares de Experiência (Regras Inegociáveis)

1. **Câmera 100% Livre**:
   - Nenhuma animação automática de câmera deve travar os dedos do usuário.
   - 1 dedo na tela: gira o modelo em qualquer ângulo.
   - 2 dedos na tela (pinça): dá zoom suave.
   - 2 dedos arrastando: move o modelo lateralmente (pan).
   - Dois toques rápidos (duplo clique): centraliza o modelo na tela caso a pessoa se perca.

2. **Visual Limpo e Focado**:
   - Quem abre o link não vê menus complexos nem botões de edição.
   - Vê apenas o modelo 3D em tela cheia com uma barra flutuante minimalista na parte inferior:
     - Botão Play / Pausa
     - Linha do tempo (para avançar ou voltar com o dedo)
     - Identificação do Módulo e cor
     - Botão de centralizar e reiniciar

3. **Links por Módulo**:
   - O link pode carregar a obra toda ou focar exclusivamente em um módulo específico:
     - Exemplo: `https://visualizador3dwsc.web.app/?projeto=video-do-projeto` (Obra toda)
     - Exemplo: `https://visualizador3dwsc.web.app/?projeto=video-do-projeto&modulo=A` (Apenas Módulo A)

4. **Gerador com QR Code e Exportação**:
   - O gerador gera links com 1 clique.
   - Apresenta QR Code para teste imediato com celular.
   - Permite exportar a lista formatada de todos os módulos.

---

## 3. Estrutura de Arquivos do Projeto

```
Visualizador/
├── ARQUITETURA.md               # Este documento de referência
├── historico_de_execucao.md     # Registro de tudo que foi feito passo a passo
├── package.json                 # Configurações do projeto e bibliotecas
├── firebase.json                # Configuração de publicação no Firebase Hosting
├── .firebaserc                  # Vinculação com o projeto Firebase 'visualizador3dwsc'
│
├── index.html                   # O VISUALIZADOR 3D (Página que as pessoas abrem no celular)
├── gerador.html                 # O GERADOR DE LINKS (Painel onde você cria os links e QR codes)
│
├── css/
│   ├── visualizador.css         # Estilos visuais do visualizador (modo escuro, botões, responsivo)
│   └── gerador.css              # Estilos visuais do gerador de links
│
├── js/
│   ├── firebase-config.js       # Conexão com o Firebase do Google
│   ├── sequencia-motor.js       # Matemática da linha do tempo e avanço das peças
│   ├── controles-toque.js       # Configuração da câmera e toques na tela (OrbitControls livre)
│   ├── visualizador.js          # Montagem da cena 3D (Three.js), luzes e leitor IFC
│   └── gerador.js               # Lógica de criação de links, cópia e geração de QR code
│
└── modelos/                     # Pasta onde ficam os modelos 3D (.ifc) e as sequências (.json)
```

---

## 4. Tecnologias Utilizadas

- **HTML5 e Vanilla CSS Moderno**: Design moderno, temas escuros, bordas arredondadas e efeito de vidro fosco (*glassmorphism*). Sem excesso de bibliotecas pesadas.
- **Three.js (v0.160+)**: Motor de renderização 3D para web com iluminação realista e sombras suaves.
- **web-ifc**: Leitor de modelos BIM/IFC direto no navegador via WebAssembly (sem precisar de servidor convertendo arquivos).
- **QRCode.js**: Geração instantânea de QR Codes diretamente na tela do navegador sem depender de serviços externos.
- **Firebase**:
  - **Firebase Hosting**: Servidor ultrarrápido do Google para hospedar o visualizador mundialmente.
  - **Firebase Storage**: Armazenamento em nuvem caso queira guardar novos modelos na nuvem.
- **GitHub**: Controle de versão seguro conectado ao repositório do projeto.

---

## 5. Regras de Código e Manutenção

- **Didática em Primeiro Lugar**: Todo arquivo de código deve conter no topo uma explicação em português simples do seu papel no sistema.
- **Funções Explicadas**: Cada função deve ter um comentário leigo logo acima ou abaixo explicando o que ela faz.
- **Estabilidade Móvel**: Sempre testar para garantir que telas pequenas de smartphones (iPhone e Android) tenham botões fáceis de tocar e excelente taxa de quadros (60 fps).
