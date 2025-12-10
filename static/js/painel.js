// =====================================================
// PAINEL DE TV — SISTEMA DE CHAMADAS
// =====================================================

const nomeGrande = document.getElementById("nome-grande");
const salaGrande = document.getElementById("sala-grande");
const horaChamadaEl = document.getElementById("hora-chamada");
const listaProximos = document.getElementById("lista-proximos");

// Helper: fala pt-BR com voz preferencial
function speakPTBR(text) {
    const speak = () => {
        const voices = window.speechSynthesis.getVoices();
        let voice = voices.find(v => /pt-BR|pt/.test(v.lang) && /Google|Microsoft|Azure|Brasil|Brazil|Br/i.test(v.name))
            || voices.find(v => /pt-BR|pt/.test(v.lang))
            || voices[0];

        const utt = new SpeechSynthesisUtterance(text);
        utt.lang = 'pt-BR';
        if (voice) utt.voice = voice;
        utt.rate = 0.98;
        utt.pitch = 1.0;
        utt.volume = 1.0;
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(utt);
    };

    if (window.speechSynthesis.getVoices().length === 0) {
        window.speechSynthesis.addEventListener('voiceschanged', speak, { once: true });
    } else {
        speak();
    }
}

// última chamada
listenUltimaChamada((doc) => {
    if (!doc.exists) return;

    const d = doc.data();

    nomeGrande.textContent = d.nomePublico || "--";
    salaGrande.textContent = d.salaDestino?.toUpperCase() || "--";

    const hora = d.hora?.toDate().toLocaleTimeString("pt-BR") || "--:--:--";
    horaChamadaEl.textContent = hora;

    if (d.nomeCompleto) {

        // 🔥 DICIONÁRIO DE NOMES FALADOS COM ACENTOS
        const nomesFalados = {
            triagem: "Triagem",
            consultorio1: "Consultório 1",
            consultorio2: "Consultório 2",
            consultorio3: "Consultório 3",
            raiox: "Raio-X",
            sutura: "Sutura",
            medicacao: "Medicação"
        };

        const salaLabel = nomesFalados[d.salaDestino] || d.salaDestino;
        const frase = `Paciente ${d.nomeCompleto}, dirigir-se à ${salaLabel}.`;
        speakPTBR(frase);
    }

    document.body.classList.add("nova-chamada");
    setTimeout(() => document.body.classList.remove("nova-chamada"), 3000);
});

// próximos pacientes
listenFilaCompleta((snapshot) => {
    const aguardando = [];
    snapshot.forEach(doc => {
        const p = doc.data();
        if (p.status === "aguardando") aguardando.push(p);
    });

    listaProximos.innerHTML = aguardando.slice(0, 5).map((p, i) => `
        <div class="item-proximo">
            <div class="num">${i + 1}</div>
            <div class="dados">
                <strong>${p.nomePublico}</strong>
                <br><small>${p.salaDestino}</small>
            </div>
        </div>
    `).join("");
});