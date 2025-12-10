// 🔥 Configuração do Firebase (versão COMPAT — recomendada para projetos estáticos)

const firebaseConfig = {
    apiKey: "AIzaSyDoDwWWosgTcSmMdPl9mRIvmreWNzT4kjM",
    authDomain: "hospital-chamadas.firebaseapp.com",
    projectId: "hospital-chamadas",
    storageBucket: "hospital-chamadas.appspot.com",
    messagingSenderId: "635532448024",
    appId: "1:635532448024:web:eedb6e03c8ff2b0fee4e6d"
};

// Inicializar Firebase (COMPAT)
firebase.initializeApp(firebaseConfig);

// Serviços usados pela aplicação
const db = firebase.firestore();

// Configurações opcionais do Firestore
db.settings({ ignoreUndefinedProperties: true });

// Log de teste
console.log("🔥 Firebase conectado (compat mode)");

// ==================================================
// Proteções runtime contra uso de Email-Link / Dynamic Links
// Se o projeto tentar usar sendSignInLinkToEmail / signInWithEmailLink,
// lançamos erro e mostramos instruções no console (evitar que o fluxo quebre).
// ==================================================
if (firebase && firebase.auth) {
    // Guardar originais (caso necessário)
    try {
        const _auth = firebase.auth();

        if (_auth.sendSignInLinkToEmail) {
            _auth._orig_sendSignInLinkToEmail = _auth.sendSignInLinkToEmail.bind(_auth);
            _auth.sendSignInLinkToEmail = function () {
                console.error("[SECURITY] sendSignInLinkToEmail is disabled. Firebase Dynamic Links are deprecated for this flow. Use email+password or OAuth native flows.");
                return Promise.reject(new Error('sendSignInLinkToEmail is disabled: Dynamic Links deprecated.'));
            };
        }

        if (_auth.signInWithEmailLink) {
            _auth._orig_signInWithEmailLink = _auth.signInWithEmailLink.bind(_auth);
            _auth.signInWithEmailLink = function () {
                console.error("[SECURITY] signInWithEmailLink is disabled. Firebase Dynamic Links are deprecated for this flow.");
                return Promise.reject(new Error('signInWithEmailLink is disabled: Dynamic Links deprecated.'));
            };
        }

    } catch (e) {
        console.warn('Falha ao aplicar proteção runtime no auth:', e);
    }
}