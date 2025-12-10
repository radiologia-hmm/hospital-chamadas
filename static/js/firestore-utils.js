// ===========================================================
// FIRESTORE-UTILS.JS — PADRÃO OFICIAL DO SISTEMA
// ===========================================================

// Normaliza nome da sala
function normalizarSala(sala) {
    return sala
        .toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]/g, "");
}

// LGPD: nome abreviado
function gerarNomePublico(nomeCompleto) {
    const partes = nomeCompleto.trim().split(" ");
    if (partes.length === 1) return partes[0];
    return `${partes[0]} ${partes[partes.length - 1][0]}.`;
}

// ===========================================================
// REGISTRAR PACIENTE (RECEPÇÃO)
// ===========================================================
async function registrarPaciente(nomeCompleto, salaDestino) {
    try {
        const sala = normalizarSala(salaDestino);
        const nomePublico = gerarNomePublico(nomeCompleto);

        await db.collection("pacientes").add({
            nomeCompleto,
            nomePublico,
            salaDestino: sala,
            status: "aguardando",
            horaEntrada: firebase.firestore.FieldValue.serverTimestamp(),
            horaChamada: null
        });

        return { sucesso: true };

    } catch (err) {
        return { sucesso: false, erro: err.message };
    }
}

async function repetirUltimaChamada() {
    const doc = await db.collection("ultima_chamada").doc("atual").get();
    if (!doc.exists) return { sucesso: false, erro: "Nenhuma chamada registrada." };

    const d = doc.data();

    await db.collection("ultima_chamada")
        .doc("atual")
        .set({
            ...d,
            hora: firebase.firestore.FieldValue.serverTimestamp()
        });

    return { sucesso: true };
}

// ===========================================================
// LISTENER — Última chamada (PAINEL + SALA + RECEPÇÃO)
// ===========================================================
function listenUltimaChamada(callback) {
    return db.collection("ultima_chamada")
        .doc("atual")
        .onSnapshot(callback);
}

// ===========================================================
// LISTENER — Fila completa (RECEPÇÃO e PAINEL)
// ===========================================================
function listenFilaCompleta(callback) {
    return db.collection("pacientes")
        .orderBy("horaEntrada", "asc")
        .onSnapshot(callback);
}

// ===========================================================
// LISTENER — Fila por sala (SALA)
// ===========================================================
function listenFilaDaSala(sala, callback) {
    const destino = normalizarSala(sala);

    return db.collection("pacientes")
        .where("salaDestino", "==", destino)
        .where("status", "==", "aguardando")
        .orderBy("horaEntrada", "asc")
        .onSnapshot(callback);
}

// ===========================================================
// CHAMAR PRÓXIMO PACIENTE
// ===========================================================
async function chamarProximoDaSala(sala) {
    try {
        const destino = normalizarSala(sala);

        const snap = await db.collection("pacientes")
            .where("salaDestino", "==", destino)
            .where("status", "==", "aguardando")
            .orderBy("horaEntrada", "asc")
            .limit(1)
            .get();

        if (snap.empty) {
            return { sucesso: false, erro: "Nenhum paciente aguardando." };
        }

        const doc = snap.docs[0];
        const p = doc.data();

        await doc.ref.update({
            status: "chamado",
            salaChamada: destino,                  // <-- IMPORTANTE!
            horaChamada: firebase.firestore.FieldValue.serverTimestamp()
        });

        await db.collection("ultima_chamada")
            .doc("atual")
            .set({
                nomeCompleto: p.nomeCompleto,
                nomePublico: p.nomePublico,
                salaDestino: destino,
                hora: firebase.firestore.FieldValue.serverTimestamp()
            });

        return { sucesso: true, paciente: p };

    } catch (err) {
        return { sucesso: false, erro: err.message };
    }
}

// ===========================================================
// REENVIAR PACIENTE PARA OUTRA SALA
// ===========================================================
async function enviarParaOutraSala(id, novaSala) {
    try {
        const destino = normalizarSala(novaSala);

        await db.collection("pacientes").doc(id).update({
            salaDestino: destino,
            status: "aguardando",
            horaEntrada: firebase.firestore.FieldValue.serverTimestamp(), // garante ordenação imediata
            horaChamada: null
        });

        return { sucesso: true };
    } catch (err) {
        return { sucesso: false, erro: err.message };
    }
}

async function repetirUltimaChamadaDaSala(sala) {

    const destino = normalizarSala(sala);

    const snap = await db.collection("ultima_chamada")
        .where("salaDestino", "==", destino)
        .limit(1)
        .get();

    if (snap.empty) {
        return { sucesso: false, erro: "Nenhuma chamada registrada nesta sala." };
    }

    const d = snap.docs[0].data();

    await db.collection("ultima_chamada")
        .doc("atual")
        .set({
            ...d,
            hora: firebase.firestore.FieldValue.serverTimestamp()
        });

    return { sucesso: true };
}