# TeamUp

App mobile feito com Expo e React Native para alunos montarem equipes em projetos acadêmicos: feed de vagas, candidaturas, chat da equipe, portfólio e validação de skills entre colegas.

## Como funciona com o Firebase

O backend é o Firebase. O app usa **Auth** para login (e-mail/senha) e **Firestore** como banco.

- `src/config/firebase.ts` — inicializa Auth e Firestore com as variáveis do `.env`
- `src/services/` — leitura e escrita no Firestore (`projects`, `applications`, `chats`, `users`, `classes`, etc.)
- `src/hooks/` — assinam mudanças em tempo real (`onSnapshot`) e alimentam as telas
- `firestore.rules` — quem pode ler/escrever cada coleção (deploy separado)

As credenciais ficam no `.env` (veja `.env.example`). Não commite esse arquivo.

## Rodar localmente

```bash
npm install
cp .env.example .env   # preencher com o projeto Firebase
npm start
```

Na primeira vez com o Firestore, publique as regras:

```bash
npx firebase-tools login
npx firebase-tools use <project-id>
npx firebase-tools deploy --only firestore:rules
```

Precisa de Node 20+, um projeto no [Firebase Console](https://console.firebase.google.com/) e o Expo Go ou emulador.

## Licença

MIT — ver [LICENSE](LICENSE).
# team-up
