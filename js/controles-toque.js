/**
 * ==============================================================================
 * js/controles-toque.js
 * ==============================================================================
 * PARA QUE SERVE ESTE ARQUIVO? (Explicação em termos simples):
 * Este arquivo é o "volante e os olhos" do visualizador 3D.
 * Ele cuida para que, ao mexer com o dedo na tela do celular (ou mouse no PC),
 * a pessoa consiga:
 *  - 1 dedo: Girar o modelo para ver de qualquer lado.
 *  - 2 dedos (pinça): Aproximar (zoom in) ou afastar (zoom out).
 *  - 2 dedos arrastando: Mover o modelo para os lados.
 *  - 2 toques rápidos (duplo toque): Centralizar o modelo na tela se a pessoa se perder.
 * REGRA DE OURO: A câmera NUNCA briga com a pessoa nem se move sozinha forçadamente!
 * ==============================================================================
 */

import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import * as THREE from "three";

/**
 * Função para configurar os controles de toque e câmera:
 * O que ela faz: Pega a câmera e a tela, e aplica as melhores configurações de sensibilidade
 * e amortecimento (para ficar com aquela sensação macia de aplicativo moderno).
 */
export function configurarControlesCamera(camera, elementoCanvas) {
  const controles = new OrbitControls(camera, elementoCanvas);

  // Amortecimento suave (Damping): quando você solta o dedo, a câmera não para em seco,
  // ela desacelera de forma gostosa e fluida.
  controles.enableDamping = true;
  controles.dampingFactor = 0.06;

  // Ajustes de toque para celular:
  // 1 dedo = GIRAR (Rotate)
  // 2 dedos = ZOOM e PAN (Mover pros lados e aproximar)
  controles.touches = {
    ONE: THREE.TOUCH.ROTATE,
    TWO: THREE.TOUCH.DOLLY_PAN
  };

  // Limites inteligentes para a pessoa não se perder no espaço infinito
  controles.minDistance = 0.3;
  controles.maxDistance = 50.0;
  controles.maxPolarAngle = Math.PI / 2 + 0.15; // Permite ver um pouquinho abaixo do chão, mas não virar de ponta cabeça

  // Suporte a duplo clique ou duplo toque para recentralizar o modelo
  let ultimoToque = 0;
  elementoCanvas.addEventListener("touchend", (evento) => {
    const agora = Date.now();
    if (agora - ultimoToque < 300) {
      // Foi um duplo toque! Dispara o evento de enquadrar
      const evt = new CustomEvent("solicitar-enquadrar");
      window.dispatchEvent(evt);
    }
    ultimoToque = agora;
  });

  return controles;
}

/**
 * Função para enquadrar perfeitamente o modelo na tela:
 * O que ela faz: Calcula o tamanho exato da casa / estrutura e posiciona a câmera
 * a uma distância perfeita para que o modelo caiba inteirinho na tela do celular.
 */
export function enquadrarModelo(camera, controles, objeto3D) {
  if (!objeto3D) return;

  const caixa = new THREE.Box3().setFromObject(objeto3D);
  if (caixa.isEmpty()) return;

  const centro = caixa.getCenter(new THREE.Vector3());
  const tamanho = caixa.getSize(new THREE.Vector3());
  const raioMaximo = Math.max(tamanho.x, tamanho.y, tamanho.z) * 0.5;

  // Distância ideal baseada no campo de visão (FOV) da câmera
  const fovRad = (camera.fov * Math.PI) / 180;
  let distancia = raioMaximo / Math.sin(fovRad / 2);
  distancia = Math.max(distancia * 1.35, 2.0); // Margem de segurança para não cortar as pontas

  // Posiciona a câmera em um ângulo isométrico agradável (45 graus de cima e de lado)
  const direcao = new THREE.Vector3(1, 0.75, 1.2).normalize();
  camera.position.copy(centro).addScaledVector(direcao, distancia);

  // Faz a câmera olhar exatamente para o centro do modelo
  controles.target.copy(centro);
  controles.update();
}
