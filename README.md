# 🏗️ Visualizador 3D WorldSkills — Links & Sequência 4D

> *"Portanto, quem ouve estas minhas palavras e as pratica é como o homem prudente que construiu a sua casa sobre a rocha."* — Mateus 7:24 NVI

Plataforma moderna, ultra-rápida e otimizada para celular para visualização 3D de modelos BIM (IFC) e sequências de montagem 4D, com gerador de links e QR Codes por módulo ou obra completa.

---

## 📱 Funcionalidades Principais

1. **Visualizador 3D Direto no Celular**:
   - Tela cheia, sem menus confusos, focado no modelo.
   - **Câmera 100% livre**: 1 dedo gira, 2 dedos dão zoom (pinça) e movem.
   - Player 4D flutuante: Play/Pausa, barra de tempo e controle de velocidade.
   - As peças descem suavemente e assentam no lugar exato da construção.

2. **Links por Módulo**:
   - Gere links para abrir diretamente um módulo específico (ex: Módulo A, Módulo B, Módulo C...).
   - Cada módulo com sua cor identificadora e contador de peças.

3. **Painel Gerador de Links & QR Codes (`gerador.html`)**:
   - Cria links com 1 clique.
   - Gera QR Codes em tempo real para testar apontando a câmera do celular.
   - Exporta a lista formatada pronta para enviar no WhatsApp ou e-mail.

4. **Tecnologias**:
   - **Three.js** + **web-ifc** (lê arquivos IFC diretamente no navegador sem precisar de conversões externas).
   - **Firebase Hosting** configurado para publicação instantânea na nuvem.
   - Conectado ao repositório GitHub.

---

## 🚀 Como Rodar Localmente no Computador

Abra o terminal na pasta do projeto e execute:

```bash
npx serve . -l 5000
```

Depois acesse no navegador:
- **Visualizador 3D**: `http://localhost:5000/index.html`
- **Gerador de Links**: `http://localhost:5000/gerador.html`

---

## ☁️ Como Publicar no Firebase

O projeto já está configurado para o Firebase `visualizador3dwsc`. Para enviar para a internet:

```bash
npx firebase deploy
```

O site ficará disponível mundialmente em:
`https://visualizador3dwsc.web.app`

---

## 📂 Estrutura do Projeto

- `ARQUITETURA.md` — Regras e estrutura do projeto.
- `historico_de_execucao.md` — Histórico detalhado de tudo o que foi feito.
- `index.html` — O visualizador 3D principal.
- `gerador.html` — O painel de geração de links e QR codes.
- `css/` — Estilos modernos (dark mode, glassmorphism e responsivo).
- `js/` — Motores 3D, cálculos matemáticos da sequência e integração Firebase.
- `modelos/` — Modelos 3D (.ifc) e sequências (.json).
