// =====================================================
// SALA — ATENDIMENTO (VERSÃO FINAL)
// =====================================================

// 🔥 Verificar login
// 🔥 Verificar login e corresponder com a sala na URL
const salaLogada = localStorage.getItem("sala-logada");
const params = new URLSearchParams(window.location.search);
const nomeSala = params.get("sala");

if (!salaLogada || !nomeSala || salaLogada !== nomeSala) {
    localStorage.removeItem("sala-logada");
    window.location.href = "login-salas.html";
}

// 🔥 Atualizar título da página
const titulo = document.getElementById("titulo-sala");
if (!nomeSala) {
    titulo.textContent = "Sala: (erro)";
} else {
    titulo.textContent = `Sala: ${nomeSala.toUpperCase()}`;
}

// 🔥 Botão sair
document.getElementById("btn-sair").addEventListener("click", () => {
    localStorage.removeItem("sala-logada");
    // Também deslogar do Firebase Auth, se estiver logado
    if (firebase && firebase.auth) {
        firebase.auth().signOut().finally(() => {
            window.location.href = "login-salas.html";
        });
    } else {
        window.location.href = "login-salas.html";
    }
});

// =====================================================
// LISTENER — PACIENTE ATUAL
// =====================================================
listenUltimaChamada((doc) => {

    const div = document.getElementById("paciente-atual");

    if (!doc.exists) {
        div.innerHTML = `<p class="vazio">Nenhuma chamada ainda.</p>`;
        return;
    }

    const d = doc.data();

    // 🔥 Mostrar somente se for desta sala
    if (normalizarSala(d.salaDestino) !== normalizarSala(nomeSala)) return;

    div.innerHTML = `
        <p><strong>${d.nomeCompleto}</strong></p>
        <p>${nomeSala.toUpperCase()}</p>
    `;
});

// =====================================================
// LISTENER — FILA DA SALA
// =====================================================
listenFilaDaSala(nomeSala, (snapshot) => {

    const div = document.getElementById("fila-sala");

    if (snapshot.empty) {
        div.innerHTML = `<p class="vazio">Nenhum paciente aguardando</p>`;
        return;
    }

    let html = "";
    snapshot.forEach(doc => {
        const p = doc.data();

        html += `
            <div class="item">
                <strong>${p.nomePublico}</strong><br>
                <small>${p.status}</small>
            </div>
        `;
    });

    div.innerHTML = html;
});

// =====================================================
// BOTÃO — CHAMAR PRÓXIMO
// =====================================================
document.getElementById("btn-chamar-proximo").addEventListener("click", async () => {
    const msg = document.getElementById("msg-chamar");

    const r = await chamarProximoDaSala(nomeSala);

    if (!r.sucesso) {
        msg.textContent = r.erro;
        msg.className = "mensagem erro";
        return;
    }

    msg.textContent = `Chamado: ${r.paciente.nomePublico}`;
    msg.className = "mensagem sucesso";
});

// =====================================================
// BOTÃO — RECHAMAR (POR SALA ESPECÍFICA)
// =====================================================
document.getElementById("btn-rechamar").addEventListener("click", async () => {

    const msg = document.getElementById("ultima-chamada");

    const r = await repetirUltimaChamadaDaSala(nomeSala);

    if (!r.sucesso) {
        msg.innerHTML = `<p class="vazio">${r.erro}</p>`;
        return;
    }

    // Efeito de pulse
    msg.classList.add("pulse");
    setTimeout(() => msg.classList.remove("pulse"), 500);
});

// =====================================================
// BOTÃO — REENVIAR PACIENTE
// =====================================================
document.getElementById("btn-enviar-nova-sala").addEventListener("click", async () => {

    const nome = document.getElementById("nome-reeviar").value.trim();
    const novaSala = document.getElementById("nova-sala").value;
    const msg = document.getElementById("msg-reenviar");

    const snap = await db.collection("pacientes")
        .where("nomeCompleto", "==", nome)
        .limit(1).get();

    if (snap.empty) {
        msg.textContent = "Paciente não encontrado.";
        msg.className = "mensagem erro";
        return;
    }

    const id = snap.docs[0].id;

    const r = await enviarParaOutraSala(id, novaSala);

    if (!r.sucesso) {
        msg.textContent = r.erro;
        msg.className = "mensagem erro";
        return;
    }

    msg.textContent = "Enviado para " + novaSala.toUpperCase();
    msg.className = "mensagem sucesso";
});