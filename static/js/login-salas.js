// Login usando Firebase Auth
// Assumimos que existem contas criadas pelo administrador com email: <sala>@salas.hospital
// e que cada usuário possui custom claim { role: 'sala', sala: '<sala>' }

const selectSala = document.getElementById("select-sala");
const inputSenha = document.getElementById("senha");
const btnEntrar = document.getElementById("btn-entrar");
const msgLogin = document.getElementById("msg-login");

function showMsg(text, kind) {
    msgLogin.textContent = text;
    msgLogin.className = 'mensagem ' + (kind || 'info');
}

btnEntrar.addEventListener("click", async () => {
    const sala = selectSala.value;
    const senha = inputSenha.value.trim();

    msgLogin.textContent = "";

    if (!sala || !senha) {
        showMsg('Preencha sala e senha!', 'erro');
        return;
    }

    // Construir email padrão para cada sala — admin deve criar estas contas
    const email = `${sala}@salas.hospital`;

    try {
        const cred = await firebase.auth().signInWithEmailAndPassword(email, senha);
        const user = cred.user;
        const token = await user.getIdTokenResult(true);

        // Verificar claims (role e sala)
        const claims = token.claims || {};
        if (claims.role === 'sala' && claims.sala === sala) {
            localStorage.setItem('sala-logada', sala);
            window.location.href = `./sala.html?sala=${sala}`;
            return;
        }

        // Se não houver claims, negar acesso e deslogar
        await firebase.auth().signOut();
        showMsg('Conta sem permissão para esta sala. Contate o administrador.', 'erro');

    } catch (err) {
        // Mapear erros comuns
        let texto = 'Erro ao autenticar.';
        if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') texto = 'Sala ou senha inválida.';
        if (err.code === 'auth/too-many-requests') texto = 'Muitas tentativas. Tente mais tarde.';
        showMsg(texto, 'erro');
    }
});