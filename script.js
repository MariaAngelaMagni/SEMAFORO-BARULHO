'use strict';

const luzVerde = document.getElementById('luz-verde');
const luzAmarela = document.getElementById('luz-amarela');
const luzVermelha = document.getElementById('luz-vermelha');
const emoji = document.getElementById('emoji');
const mensagem = document.getElementById('mensagem');
const nivelTexto = document.getElementById('nivel');
const barra = document.getElementById('barra-nivel');
const barraContainer = document.querySelector('.barra');
const statusEl = document.getElementById('status');
const btnMicrofone = document.getElementById('btn-microfone');
const btnCalibrar = document.getElementById('btn-calibrar');

let audioContext = null;
let analyser = null;
let mediaStream = null;
let animationId = null;
let baseline = 0.005;
let nivelSuavizado = 0;
let calibrando = false;

function limparLuzes() {
  luzVerde.classList.remove('acesa');
  luzAmarela.classList.remove('acesa');
  luzVermelha.classList.remove('acesa');
}

function atualizarSemaforo(nivel) {
  limparLuzes();
  nivel = Math.max(0, Math.min(100, Math.round(nivel)));

  nivelTexto.textContent = `Nível do som: ${nivel}%`;
  barra.style.width = `${nivel}%`;
  barraContainer.setAttribute('aria-valuenow', nivel);

  if (nivel < 30) {
    luzVerde.classList.add('acesa');
    emoji.textContent = '😊';
    mensagem.textContent = 'SALA TRANQUILA';
    barra.style.background = '#00c853';
  } else if (nivel < 60) {
    luzAmarela.classList.add('acesa');
    emoji.textContent = '😐';
    mensagem.textContent = 'ATENÇÃO AO BARULHO!';
    barra.style.background = '#ffd600';
  } else {
    luzVermelha.classList.add('acesa');
    emoji.textContent = '😮';
    mensagem.textContent = 'BARULHO ALTO!';
    barra.style.background = '#d50000';
  }
}

function calcularRms(dados) {
  let soma = 0;
  for (let i = 0; i < dados.length; i++) {
    const x = (dados[i] - 128) / 128;
    soma += x * x;
  }
  return Math.sqrt(soma / dados.length);
}

function calcularNivel(rms) {
  // Remove o ruído de fundo medido na calibração.
  const relativo = Math.max(0, rms - baseline);
  // Escala relativa para uso pedagógico; não é medição em dB.
  return Math.min(100, (relativo / 0.20) * 100);
}

function analisarSom() {
  if (!analyser) return;

  const dados = new Uint8Array(analyser.fftSize);
  analyser.getByteTimeDomainData(dados);
  const rms = calcularRms(dados);
  const nivel = calcularNivel(rms);

  // Suavização para evitar mudanças bruscas.
  nivelSuavizado = nivelSuavizado * 0.72 + nivel * 0.28;
  atualizarSemaforo(nivelSuavizado);

  animationId = requestAnimationFrame(analisarSom);
}

async function iniciarMicrofone() {
  try {
    if (!window.isSecureContext && location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') {
      throw new Error('SECURE_CONTEXT');
    }

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error('NO_GET_USER_MEDIA');
    }

    btnMicrofone.disabled = true;
    statusEl.textContent = 'Solicitando permissão para usar o microfone...';

    mediaStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl: false,
        channelCount: 1
      },
      video: false
    });

    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    if (audioContext.state === 'suspended') await audioContext.resume();

    analyser = audioContext.createAnalyser();
    analyser.fftSize = 1024;
    analyser.smoothingTimeConstant = 0.75;

    const source = audioContext.createMediaStreamSource(mediaStream);
    source.connect(analyser);

    nivelSuavizado = 0;
    btnMicrofone.textContent = '🎙️ Microfone ativo';
    btnMicrofone.disabled = true;
    btnCalibrar.disabled = false;
    statusEl.textContent = 'Microfone ativo. Você pode calibrar o silêncio antes de iniciar a aula.';

    if (animationId) cancelAnimationFrame(animationId);
    analisarSom();
  } catch (erro) {
    console.error(erro);
    btnMicrofone.disabled = false;

    if (erro.message === 'SECURE_CONTEXT') {
      statusEl.textContent = 'Abra o projeto por HTTPS ou usando o servidor local (localhost).';
      alert('Para acessar o microfone, abra este projeto por HTTPS ou pelo servidor local. Não use apenas dois cliques no index.html.');
    } else if (erro.name === 'NotAllowedError' || erro.name === 'PermissionDeniedError') {
      statusEl.textContent = 'Permissão do microfone negada. Autorize o microfone no navegador e tente novamente.';
    } else if (erro.name === 'NotFoundError') {
      statusEl.textContent = 'Nenhum microfone foi encontrado neste aparelho.';
    } else {
      statusEl.textContent = 'Não foi possível acessar o microfone. Verifique as permissões do navegador.';
    }
  }
}

async function calibrarSilencio() {
  if (!analyser || calibrando) return;

  calibrando = true;
  btnCalibrar.disabled = true;
  statusEl.textContent = 'Calibrando... fique em silêncio por 3 segundos.';

  const dados = new Uint8Array(analyser.fftSize);
  const amostras = [];
  const inicio = performance.now();

  while (performance.now() - inicio < 3000) {
    analyser.getByteTimeDomainData(dados);
    amostras.push(calcularRms(dados));
    await new Promise(resolve => setTimeout(resolve, 50));
  }

  const media = amostras.reduce((a, b) => a + b, 0) / amostras.length;
  baseline = Math.max(0.002, media * 1.15);
  calibrando = false;
  btnCalibrar.disabled = false;
  statusEl.textContent = 'Calibração concluída. Agora o semáforo considera este ambiente como referência de silêncio.';
}

btnMicrofone.addEventListener('click', iniciarMicrofone);
btnCalibrar.addEventListener('click', calibrarSilencio);

window.addEventListener('beforeunload', () => {
  if (animationId) cancelAnimationFrame(animationId);
  if (mediaStream) mediaStream.getTracks().forEach(track => track.stop());
  if (audioContext && audioContext.state !== 'closed') audioContext.close();
});

atualizarSemaforo(0);
