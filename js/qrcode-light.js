/**
 * ==============================================================================
 * js/qrcode-light.js
 * ==============================================================================
 * PARA QUE SERVE ESTE ARQUIVO? (Explicação em termos simples):
 * Este arquivo gera códigos QR (aqueles quadradinhos pretos que a câmera do celular lê).
 * Com isso, o Gerador de Links consegue desenhar o QR Code na hora na tela,
 * para você apontar o celular e abrir o modelo 3D instantaneamente sem precisar digitar nada!
 * ==============================================================================
 */

// Biblioteca compacta para desenhar QR Code em elemento Canvas HTML
export function gerarQRCodeNoCanvas(canvas, texto, tamanho = 180) {
  if (!canvas) return;

  // Usa a API rápida do Google Charts / QR Server como gerador de imagem garantido,
  // ou desenha direto no canvas via imagem para nitidez absoluta.
  const ctx = canvas.getContext("2d");
  canvas.width = tamanho;
  canvas.height = tamanho;

  const urlApi = `https://api.qrserver.com/v1/create-qr-code/?size=${tamanho}x${tamanho}&margin=10&data=${encodeURIComponent(texto)}`;

  const img = new Image();
  img.crossOrigin = "anonymous";
  img.onload = () => {
    ctx.clearRect(0, 0, tamanho, tamanho);
    ctx.drawImage(img, 0, 0, tamanho, tamanho);
  };
  img.onerror = () => {
    // Fallback caso esteja sem internet: desenha um aviso
    ctx.fillStyle = "#1e293b";
    ctx.fillRect(0, 0, tamanho, tamanho);
    ctx.fillStyle = "#94a3b8";
    ctx.font = "12px Inter, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("QR Code Online", tamanho / 2, tamanho / 2);
  };
  img.src = urlApi;
}
