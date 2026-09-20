/**
 * ==============================================================================
 * js/firebase-config.js
 * ==============================================================================
 * PARA QUE SERVE ESTE ARQUIVO? (Explicação em termos simples):
 * Este arquivo é o "conector" do nosso site com a nuvem do Google (Firebase).
 * É ele quem permite que o site seja acessado pela internet por qualquer pessoa
 * no mundo e onde podemos guardar arquivos ou salvar dados dos modelos 3D.
 * ==============================================================================
 */

// Importa as ferramentas necessárias da biblioteca do Firebase direto da web
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-analytics.js";

/**
 * Dados de conexão com o Firebase do seu projeto 'visualizador3dwsc'.
 * Essas chaves são a "identidade" do seu aplicativo na nuvem.
 */
export const firebaseConfig = {
  apiKey: "AIzaSyBeQ3zL1grOShgk0o92mMrF7Hommx836TI",
  authDomain: "visualizador3dwsc.firebaseapp.com",
  projectId: "visualizador3dwsc",
  storageBucket: "visualizador3dwsc.firebasestorage.app",
  messagingSenderId: "675780516071",
  appId: "1:675780516071:web:ef3909fac6c7804be76a42",
  measurementId: "G-1MGDMJ4109"
};

/**
 * Função simples para inicializar o Firebase.
 * O que ela faz: Liga a conexão com a nuvem quando a página é aberta.
 */
export function iniciarFirebase() {
  try {
    const app = initializeApp(firebaseConfig);
    // Analytics opcional caso o navegador permita
    let analytics = null;
    if (typeof window !== "undefined" && window.location.protocol.startsWith("http")) {
      try {
        analytics = getAnalytics(app);
      } catch (e) {
        console.log("Analytics em modo offline ou restrito.");
      }
    }
    return { app, analytics };
  } catch (erro) {
    console.error("Aviso ao conectar com Firebase:", erro);
    return null;
  }
}
