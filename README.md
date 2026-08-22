# TransportesApp — Frontend

Front-end React (Vite + Tailwind) pra testar a API do TransportesApp. Por enquanto tem 3 telas:

- **Login** (`/login`)
- **Início** (`/`) — mostra o perfil logado e atalho pra pedir corrida
- **Pedir corrida** (`/pedir-corrida`) — só pra contas com perfil Cliente

## Como rodar

1. Instale as dependências:

   ```
   npm install
   ```

2. Confira o arquivo `.env` — a variável `VITE_API_URL` já vem apontando pro perfil `https` padrão
   do `launchSettings.json` da API (`https://localhost:7176/api`). Se a porta da sua API for outra,
   ajuste aqui.

3. Rode a API (.NET) no Visual Studio, normalmente.

4. Rode o front:

   ```
   npm run dev
   ```

   Abre em `http://localhost:5173`.

## Login / cadastro

Ainda não tem tela de cadastro — crie contas de teste pelo Swagger da API
(`POST /api/Auth/registrar-cliente` ou `/registrar-motorista`) e depois logue normalmente pela
tela de login do front com o mesmo e-mail/senha.

## CORS

A API precisa liberar `http://localhost:5173` (porta padrão do Vite) — isso já foi configurado no
`Program.cs` da API (`AddCors` + `UseCors("FrontendDev")`). Se você rodar o front numa porta
diferente, adicione essa origem na política de CORS também.

## Observação sobre preço

A resposta da API (`CorridaResponse`) ainda não devolve o valor cobrado pela corrida — só a faixa
de distância (`faixaContratada`). O valor mostrado na tela de resultado é calculado no front a
partir de uma tabela fixa que espelha `FaixaDistancia.cs` do backend, só pra referência visual. O
ideal, num próximo passo, é a API passar a devolver o valor real cobrado.
