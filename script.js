let audioContext;
let analisador;
let microfone;

// ========================================
// ATIVAR MICROFONE
// ========================================

async function iniciarMicrofone() {

```
try {

    const stream =
        await navigator.mediaDevices.getUserMedia({
            audio: true
        });

    audioContext =
        new AudioContext();

    analisador =
        audioContext.createAnalyser();

    analisador.fftSize = 256;

    microfone =
        audioContext.createMediaStreamSource(stream);

    microfone.connect(analisador);

    analisarSom();

}

catch (erro) {

    alert(
        "Não foi possível acessar o microfone. " +
        "Permita o acesso ao microfone."
    );

    console.error(erro);
}
```

}

// ========================================
// ANALISAR O SOM
// ========================================

function analisarSom() {

```
const dados =
    new Uint8Array(
        analisador.frequencyBinCount
    );

analisador.getByteFrequencyData(dados);

let soma = 0;

for (
    let i = 0;
    i < dados.length;
    i++
) {

    soma += dados[i];

}

let media =
    soma / dados.length;

// Converte para uma escala de 0 a 100

let nivel =
    Math.min(
        100,
        Math.round(media * 1.5)
    );

atualizarSemaforo(nivel);

requestAnimationFrame(analisarSom);
```

}

// ========================================
// ATUALIZAR SEMÁFORO
// ========================================

function atualizarSemaforo(nivel) {

```
const verde =
    document.getElementById("verde");

const amarelo =
    document.getElementById("amarelo");

const vermelho =
    document.getElementById("vermelho");

const emoji =
    document.getElementById("emoji");

const mensagem =
    document.getElementById("mensagem");

const nivelTexto =
    document.getElementById("nivel");

const barra =
    document.getElementById("nivelBarra");


// Apaga todas as luzes

verde.classList.remove("acesa");

amarelo.classList.remove("acesa");

vermelho.classList.remove("acesa");


// Mostra o nível

nivelTexto.innerHTML =
    "Nível do som: " + nivel + "%";


// Atualiza a barra

barra.style.width =
    nivel + "%";


// ========================================
// 🟢 SOM BAIXO
// ========================================

if (nivel < 35) {

    verde.classList.add("acesa");

    emoji.innerHTML = "😊";

    mensagem.innerHTML =
        "SALA TRANQUILA";

    barra.style.background =
        "#00c853";
}


// ========================================
// 🟡 SOM MODERADO
// ========================================

else if (nivel < 65) {

    amarelo.classList.add("acesa");

    emoji.innerHTML = "😐";

    mensagem.innerHTML =
        "ATENÇÃO AO BARULHO!";

    barra.style.background =
        "#ffd600";
}


// ========================================
// 🔴 SOM ALTO
// ========================================

else {

    vermelho.classList.add("acesa");

    emoji.innerHTML = "😮";

    mensagem.innerHTML =
```
