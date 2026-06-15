# TeamUp

App mobile feito com Expo e React Native para alunos montarem equipes em projetos acadêmicos: feed de vagas, candidaturas, chat da equipe, portfólio e validação de skills entre colegas.

## Como funciona com o Firebase

O backend é o Firebase. O app usa **Auth** para login (e-mail/senha) e **Firestore** como banco.

- `src/config/firebase.ts` — inicializa Auth e Firestore com as variáveis do `.env`
- `src/services/` — leitura e escrita no Firestore (`projects`, `applications`, `chats`, `users`, `classes`, etc.)
- `src/hooks/` — assinam mudanças em tempo real (`onSnapshot`) e alimentam as telas
- `firestore.rules` — quem pode ler/escrever cada coleção (deploy separado)
