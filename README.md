# Hospital - Sistema de Chamadas de Pacientes

Aplicação web estática para gerenciar chamadas de pacientes em postos/consultórios de um hospital ou unidade de saúde. Utiliza Firestore (modo compat) para armazenar a fila, registrar chamadas e transmitir atualizações em tempo real para o painel e as salas.

**Status:** Protótipo funcional — testes manuais realizados. Voz em pt-BR configurável.

---

**Principais recursos**

- Registrar pacientes (Recepção) com `nomeCompleto`, `nomePublico`, `salaDestino`, `status`.
- Chamar próximo paciente por sala (Sala) e atualizar `ultima_chamada` para painel e demais listeners.
- Painel de TV que anuncia por voz e mostra próximos pacientes.
- Teste local de síntese de voz (`test_voice.html`) para ajustar vozes, rate e pitch.

---

## Estrutura principal

- `login-salas.html` — Login simples das salas (localStorage).
- `recepcao.html` — Interface de recepção para registrar pacientes.
- `sala.html` — Interface para cada sala/consultório.
- `painel.html` — Painel de TV para anúncios e fila.
- `static/js/firebase-config.js` — Configuração do Firebase (preencher com seu projeto).
- `static/js/firestore-utils.js` — Funções centrais de leitura/gravação no Firestore.
- `test_voice.html` — Página local para testar e escolher vozes TTS.

---

## Requisitos

- Navegador moderno (Chrome ou Edge recomendados para melhores vozes TTS).
- Conta Firebase com Firestore habilitado.
- (Opcional) servidor estático para hospedar os arquivos (ex.: GitHub Pages, nginx, `python -m http.server`).

---

## Configuração rápida

1. Copie as credenciais do seu projeto Firebase para `static/js/firebase-config.js` (substituir o objeto `firebaseConfig`).
2. No Console do Firebase, configure regras do Firestore para proteger os dados (ex.: permitir escrita apenas por usuários autenticados ou regras específicas para a recepção).
3. Abra as páginas localmente para testar:

Para abrir no Windows Explorer/Chrome, clique duas vezes em `painel.html` ou rode um servidor:

```powershell
python -m http.server 8000
# e abra http://localhost:8000/painel.html
```

4. Ajuste vozes e teste com `test_voice.html` antes de usar o painel em produção.

---

## Segurança e boas práticas

- **Não** utilize validação de credenciais sensíveis somente no cliente (o arquivo `static/js/login-salas.js` contém credenciais locais no protótipo). Considere migrar para autenticação via Firebase Auth e regras de segurança no Firestore.
- Use `firebase.firestore.FieldValue.serverTimestamp()` (já aplicado) para evitar problemas de ordenação entre clientes.
- Crie regras do Firestore que protejam coleções (`pacientes`, `ultima_chamada`) contra gravações/leitura indevidas.

Regras de exemplo e passos para implementar segurança (recomendado):

1. Adicione o arquivo `firestore.rules` (exemplo incluso no repositório) ao projeto.
2. Habilite o Firebase Authentication no console do Firebase e crie usuários para recepção/salas.
3. Use _custom claims_ para marcar perfis com funções (por exemplo `role: 'recepcao'` ou `role: 'sala'`). Você pode definir um claim via Admin SDK:

```js
// Exemplo (Node.js) — precisa de credenciais do Admin SDK
admin.auth().setCustomUserClaims(uid, { role: 'recepcao' });
```

4. publique suas regras com o Firebase CLI:

```bash
firebase deploy --only firestore:rules
```

5. Atualize `static/js/login-salas.js` para usar Firebase Auth em vez de senhas em texto. Ao logar, adicione a reivindicação `role` apropriada ao usuário (via Admin) para que as regras permitam as operações.

Observação: as regras fornecidas no arquivo `firestore.rules` são um ponto de partida — adapte-as à sua política de segurança e aos fluxos de autenticação da aplicação.

### Nota importante sobre Firebase Dynamic Links (descontinuação)

O Firebase anunciou a descontinuação dos Firebase Dynamic Links para fluxos de autenticação (email link, suporte Cordova OAuth). Este repositório foi auditado e não usa `sendSignInLinkToEmail` nem `signInWithEmailLink`. Para mitigar riscos futuros, o projeto aplica um bloqueio runtime que desabilita chamadas `sendSignInLinkToEmail` e `signInWithEmailLink` e lança erros claros no console caso alguma parte do código tente usá-las.

Se você dependia de autenticação por link de e-mail, migre para uma destas opções antes que o suporte seja removido:

- Autenticação por email+senha (recomendado para este app).
- OAuth via provedores nativos (Google, Microsoft) usando SDKs nativos para apps móveis.
- Soluções de backend que emitem tokens customizados e façam deep-linking manual.

Não reative `sendSignInLinkToEmail` no frontend — considere implementar um fluxo alternativo ou usar provedores OAuth com redirecionamento em servidores.

Notas específicas para contas de salas (fluxo recomendado):

- Crie contas de usuário no Firebase Auth para cada sala com email no formato `<sala>@salas.hospital` (ex.: `consultorio1@salas.hospital`).
- Defina a senha durante a criação; os usuários das salas usarão a seleção de sala + senha para entrar.
- Atribua _custom claims_ via Admin SDK para cada usuário, por exemplo `{ role: 'sala', sala: 'consultorio1' }`. O frontend verifica essas claims antes de permitir o acesso à `sala.html`.

Exemplo rápido para criar um usuário (Node.js Admin SDK):

```js
const admin = require('firebase-admin');
// init admin
admin.auth().createUser({
	email: 'consultorio1@salas.hospital',
	password: 'senhaSegura'
}).then(user => {
	return admin.auth().setCustomUserClaims(user.uid, { role: 'sala', sala: 'consultorio1' });
});
```

Após criar as contas e claims, teste o login via `login-salas.html`.

---

## Personalização de síntese de voz

- A aplicação inclui um helper `speakPTBR()` que tenta escolher uma voz pt-BR mais natural disponível no navegador.
- Para pacientes estrangeiros, recomenda-se adicionar uma opção de idioma na UI e chamar a síntese com `utt.lang = 'en-US'` (ou outro) conforme a seleção.
- Teste diferentes vozes em Chrome/Edge (algumas vozes de Google e Microsoft soam mais naturais).

---

## Sugestões futuras

- Migrar autenticação para Firebase Auth e remover senhas armazenadas no cliente.
- Implementar fila/estatísticas no backend e logs de chamadas (histórico persistente separado de `ultima_chamada`).
- Adicionar seleção de idioma por paciente e usar vozes TTS cloud (ex.: Google Cloud Text-to-Speech) para melhor naturalidade.

---

## Contribuindo

Abra um _issue_ ou envie um _pull request_. Documente mudanças e mantenha compatibilidade das chamadas Firestore.

---

## Licença

Escolha uma licença adequada ao seu uso (por exemplo MIT).

---

Arquivo de teste de voz: [test_voice.html](test_voice.html)

Arquivo de configuração do Firebase: `static/js/firebase-config.js`
