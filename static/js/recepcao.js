console.log("DEBUG MODE ATIVO — RECEPÇÃO");

listenFilaCompleta((snapshot) => {
    console.log("SNAPSHOT FILA:", snapshot.docs.map(d => d.data()));
});
// ==========================
// TTS helper (configuração local)
// ==========================
function speakPTBR(text, preferredVoiceName=null) {
    const speak = () => {
        const voices = window.speechSynthesis.getVoices();
        let voice = null;
        if (preferredVoiceName) voice = voices.find(v => v.name === preferredVoiceName);
        voice = voice || voices.find(v => /pt-BR|pt/.test(v.lang) && /Google|Microsoft|Azure|Brasil|Brazil|Br/i.test(v.name))
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
// =====================================================
// RECEPÇÃO — GESTÃO DE PACIENTES E FILA
// =====================================================

// Registrar novo paciente
document.getElementById("btn-novo-paciente").addEventListener("click", async () => {
    const nome = document.getElementById("nome-paciente").value.trim();
    const sala = document.getElementById("sala-destino").value;
    const msg = document.getElementById("mensagem-novo-paciente");

    msg.textContent = "";

    const r = await registrarPaciente(nome, sala);

    if (!r.sucesso) {
        msg.textContent = r.erro;
        msg.className = "mensagem erro";
        return;
    }

    msg.textContent = "Paciente registrado com sucesso!";
    msg.className = "mensagem sucesso";
});

// LISTENER — Fila atual
listenFilaCompleta((snapshot) => {
    const lista = document.getElementById("lista-fila");

    if (snapshot.empty) {
        lista.innerHTML = `<p class="vazio">Nenhum paciente</p>`;
        return;
    }

    let html = "";
    snapshot.forEach(doc => {
        const p = doc.data();
        html += `
            <div class="item-fila">
                <strong>${p.nomePublico}</strong>
                <br><small>${p.salaDestino}</small>
            </div>
        `;
    });

    lista.innerHTML = html;
});

// CHAMAR PRÓXIMO
document.getElementById("btn-chamar-proximo").addEventListener("click", async () => {
    const sala = document.getElementById("sala-destino").value;
    const msg = document.getElementById("mensagem-chamada");

    const r = await chamarProximoDaSala(sala);

    if (!r.sucesso) {
        msg.textContent = r.erro;
        msg.className = "mensagem erro";
        return;
    }

    msg.textContent = `Chamado: ${r.paciente.nomePublico}`;
    msg.className = "mensagem sucesso";
});

// RECHAMAR ÚLTIMA
document.getElementById("btn-rechamar").addEventListener("click", async () => {
    const msg = document.getElementById("mensagem-chamada");

    const snap = await db.collection("ultima_chamada").doc("atual").get();
    if (!snap.exists) {
        msg.textContent = "Nenhuma chamada registrada ainda.";
        msg.className = "mensagem info";
        return;
    }

    await db.collection("ultima_chamada").doc("atual").update({
        repetir: Date.now()
    });

    msg.textContent = "Chamada repetida!";
    msg.className = "mensagem sucesso";
});

// ==========================
// Voice config UI handlers
// ==========================
const btnVoiceConfig = document.getElementById('btn-voice-config');
const panelVoice = document.getElementById('voice-config');
const selVoices = document.getElementById('voices-recep');
const btnRefreshVoices = document.getElementById('btn-refresh-voices');
const btnTestVoice = document.getElementById('btn-test-voice');
const textoRecep = document.getElementById('texto-recep');

function populateVoicesRecep() {
    if (!selVoices) return;
    selVoices.innerHTML = '';
    const voices = window.speechSynthesis.getVoices();
    voices.forEach(v => {
        const o = document.createElement('option');
        o.value = v.name;
        o.textContent = `${v.name} — ${v.lang}`;
        selVoices.appendChild(o);
    });
    if (voices.length === 0) {
        const o = document.createElement('option');
        o.textContent = 'Nenhuma voz detectada. Recarregue a página ou abra em Chrome/Edge.';
        selVoices.appendChild(o);
    }
}

if (btnVoiceConfig) {
    btnVoiceConfig.addEventListener('click', () => {
        if (!panelVoice) return;
        panelVoice.style.display = panelVoice.style.display === 'none' ? 'block' : 'none';
        populateVoicesRecep();
    });
}

if (btnRefreshVoices) {
    btnRefreshVoices.addEventListener('click', populateVoicesRecep);
}

if (btnTestVoice) {
    btnTestVoice.addEventListener('click', () => {
        const txt = textoRecep ? textoRecep.value : 'Teste de voz.';
        const pref = selVoices ? selVoices.value : null;
        speakPTBR(txt, pref);
    });
}

window.speechSynthesis.addEventListener('voiceschanged', populateVoicesRecep);