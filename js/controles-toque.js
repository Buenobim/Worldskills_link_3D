/**
 * ==============================================================================
 * js/controles-toque.js
 * ==============================================================================
 * PARA QUE SERVE ESTE ARQUIVO? (Explicação em termos simples):
 * Este arquivo é o "volante e os olhos" do visualizador 3D.
 * Ele cuida para que, ao mexer com o dedo no celular ou mouse no PC,
 * a pessoa consiga:
 *  - 1 dedo: Girar o modelo livremente em 360°.
 *  - 2 dedos (pinça): Aproximar (zoom in) ou afastar (zoom out) SEM VOLTAR SOZINHO.
 *  - 2 dedos arrastando: Mover o modelo para os lados (pan).
 *  - Botão de Enquadrar: Centraliza na vista isométrica perfeita quando solicitado.
 * REGRA DE OURO: A câmera NUNCA briga com a pessoa e NUNCA reseta o zoom sozinha!
 * ==============================================================================
 */

import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import * as THREE from "three";

/**
 * Configura os controles de câmera sem interferência e sem reset falso de zoom.
 */
export function configurarControlesCamera(camera, elementoCanvas) {
  const controles = new OrbitControls(camera, elementoCanvas);

  // Amortecimento suave e gostoso de navegar
  controles.enableDamping = true;
  controles.dampingFactor = 0.06;

  // Configuração precisa de toque para celular:
  // 1 dedo: girar
  // 2 dedos: zoom suave e pan
  controles.touches = {
    ONE: THREE.TOUCH.ROTATE,
    TWO: THREE.TOUCH.DOLLY_PAN
  };

  // Limites de distância confortáveis
  controles.minDistance = 0.5;
  controles.maxDistance = 30.0;
  controles.maxPolarAngle = Math.PI / 2 + 0.12; // Não deixa virar de ponta cabeça

  // REMOVIDO o listener de touchend antigo que causava o "snap back":
  // Ao soltar os dois dedos do zoom no celular, o touchend disparava duas vezes
  // e o código achava falsamente que era um duplo toque, resetando o zoom!
  // Agora o zoom FICA EXATAMENTE onde o usuário deixou, com estabilidade total.

  return controles;
}

/**
 * Enquadra o modelo na vista isométrica oficial WorldSkills.
 * Visão angular frontal: parede do mosaico à esquerda e porta à direita.
 */
export function enquadrarModelo(camera, controles, objeto3D) {
  if (!objeto3D) return;

  const caixa = new THREE.Box3().setFromObject(objeto3D);
  if (caixa.isEmpty()) return;

  const centro = caixa.getCenter(new THREE.Vector3());
  const tamanho = caixa.getSize(new THREE.Vector3());
  const raioMaximo = Math.max(tamanho.x, tamanho.y, tamanho.z) * 0.5;

  // Ângulo isométrico ideal frontal da prova da WorldSkills:
  // X negativo (olha da esquerda), Y positivo (ligeiramente de cima), Z positivo (de frente)
  const direcaoIsometrica = new THREE.Vector3(-0.95, 0.48, 1.15).normalize();

  // Distância perfeita para enquadrar a estrutura inteira na tela do celular e PC
  const fovRad = (camera.fov * Math.PI) / 180;
  let distancia = raioMaximo / Math.sin(fovRad / 2);
  distancia = Math.max(distancia * 1.28, 4.5);

  const alvo = centro.clone();
  alvo.y += tamanho.y * 0.05; // Ajuste fino na altura do olhar

  camera.position.copy(alvo).addScaledVector(direcaoIsometrica, distancia);
  controles.target.copy(alvo);
  controles.update();
}
