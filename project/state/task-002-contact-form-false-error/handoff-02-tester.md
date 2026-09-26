# task-002-contact-form-false-error — handoff 02 — tester (Gate 3)

Workflow: bug-fix | Classificação: SMALL

STATUS: APPROVED

SUMMARY:
Verificada a correção de `onSubmit` em components/ContactForm.tsx. Testes executados no browser
contra o servidor de desenvolvimento local (`npm run dev`, http://localhost:3000), em /contactos e
/en/contact, sem alterar código de produção e sem enviar nenhum email real. O caso de sucesso foi
exercitado de duas formas: (1) sobreposição de `window.fetch` na página a devolver
`new Response('{"ok":true}', {status:200})` para /api/contact; (2) resposta 200 real da rota através
do caminho do honeypot (a rota responde 200 sem chamar o Resend quando `empresa` vem preenchido). O
caso de erro HTTP usou o 500 real da rota (o .env.local não tem RESEND_API_KEY) e um 400 simulado; a
falha de rede foi simulada com `fetch` a lançar `TypeError('Failed to fetch')`. A causa raiz foi
também confirmada em runtime (React 19.2.8): `event.currentTarget` é `FORM` antes do `await` e `null`
depois, e `.reset()` sobre ele lança `TypeError`. Todas as verificações passaram.

ARTIFACTS:
- project/state/task-002-contact-form-false-error/handoff-02-tester.md (este ficheiro)
Nenhum ficheiro de código, configuração ou package.json alterado. Sem commit. ESLint não tocado.
Os testes foram scripts JavaScript executados na página (não persistidos no repositório).

VALIDATIONS:
1. Caso de sucesso — EXECUTADO — PASSA.
   - PT, fetch sobreposto com atraso de 1,5 s: após a resposta 200 aparece `role="status"` com
     "Mensagem enviada. Entraremos em contacto brevemente.", não aparece `role="alert"`, todos os
     campos (name, email, phone, subject, message, empresa) ficam vazios. Verificado de novo 1 s
     depois: o estado mantém-se "success" (não passa a "error").
   - Exatamente 1 POST por submissão; payload com os valores preenchidos e `empresa` vazio.
   - Sem erros na página: nenhum evento `error`/`unhandledrejection` nem `console.error` capturado;
     na consola do browser não há TypeError (só as linhas "Failed to load resource" dos 400/500
     esperados dos outros casos).
   - 200 real da rota (via honeypot, sem envio de email; log do servidor `POST /api/contact 200`):
     mensagem de sucesso, campos limpos, sem erro.
   - EN (/en/contact), fetch sobreposto: "Message sent. We'll be in touch soon.", campos limpos,
     sem mensagem de erro.
2. Caso de erro HTTP — EXECUTADO — PASSA.
   - 500 real da rota (log do servidor: "Configuração do formulário de contacto incompleta —
     confirme RESEND_API_KEY"), em PT e EN: aparece `role="alert"` com a mensagem de erro do CMS,
     não aparece a de sucesso, campos mantêm os valores escritos.
   - 400 simulado (PT): mesmo resultado.
3. Caso de falha de rede — EXECUTADO (simulado por `fetch` a lançar TypeError, não por modo offline
   do DevTools) — PASSA em PT e EN: mensagem de erro, sem sucesso, campos preservados.
4. Estado "sending" — EXECUTADO — PASSA. Durante o pedido (amostrado a 100–300 ms, com atraso
   simulado) o botão está `disabled` e mostra "…"; no fim volta a ativo com o rótulo do CMS
   ("Enviar mensagem" / "Send message"), tanto em sucesso como em erro HTTP, erro de rede e 500 real.
5. Reenvio — EXECUTADO — PASSA.
   - Após um sucesso, preencher e submeter de novo: novo POST com os novos valores, "sending"
     correto, novo sucesso e campos limpos.
   - Após um erro (campos preservados), submeter de novo com resposta 200: POST com os valores
     preservados, sucesso, a mensagem de erro desaparece, campos limpos. Idem em EN.
6. PT e EN com mensagens do CMS — EXECUTADO — PASSA. Os textos de sucesso/erro e rótulos mostrados
   coincidem com `contactForm.successMessage` / `errorMessage` em content/site/contacts.json (pt/en).
7. `npx tsc --noEmit` — EXECUTADO — PASSA (exit 0; único output é o aviso do npm sobre a config de
   utilizador "python", sem relação com a tarefa). Diff — EXECUTADO — PASSA: `git diff --stat`
   mostra só components/ContactForm.tsx (8 inserções, 3 remoções), todas dentro de `onSubmit`;
   honeypot, payload, JSX e rota inalterados.
8. Causa raiz (suplementar) — EXECUTADO — CONFIRMADA. Substituindo temporariamente as props React do
   form por um handler sonda (e repondo a seguir), com o React 19.2.8 do projeto:
   `currentTarget` antes do `await` = FORM; depois = `null`; `.reset()` nele lança
   "TypeError: Cannot read properties of null (reading 'reset')". A versão corrigida não acede a
   `event.currentTarget` depois do `await` (usa `formElement` capturado antes), pelo que o erro não
   pode ocorrer.
- Não executado: ESLint (configuração em alteração noutra tarefa, conforme instrução); envio real
  via Resend (proibido nesta tarefa); modo offline do DevTools (substituído pela simulação de erro de
  rede descrita no ponto 3, que exercita o mesmo ramo `catch`).
- Servidor de desenvolvimento parado no fim (porta 3000 já não responde). `git status` sem alterações
  introduzidas pelo tester (as pastas task-006/007/008 que aparecem como não seguidas são de outras
  tarefas em paralelo).

ISSUES:
- Nenhum defeito encontrado na correção.
- Observação (fora do âmbito, não bloqueia): o ramo do honeypot da rota responde 200 sem enviar,
  como desenhado; útil como caminho de teste de sucesso sem Resend.
- Mantém-se o pormenor já registado pelo developer (setStatus/reset após desmontagem durante o
  fetch): inofensivo no React atual, não testado por não alterar comportamento visível.
- Não existe suite de testes automáticos no projeto; esta verificação não fica como teste de
  regressão automatizado.

BLOCKERS: nenhum.

REQUIRED_NEXT_ACTION (code-reviewer, Gate 5):
Rever o diff de components/ContactForm.tsx (`git diff components/ContactForm.tsx`), em particular a
captura de `formElement` antes do `await`, o `return` no `catch` e `setStatus("success")` /
`formElement.reset()` fora do `try`.

CONTEXT_FOR_NEXT_AGENT:
- Comportamento verificado em runtime em PT e EN: sucesso -> mensagem de sucesso + campos limpos e
  nunca "error"; erro HTTP/rede -> mensagem de erro + campos preservados; botão desativado com "…"
  durante o envio; reenvio funciona após sucesso e após erro; 1 POST por submissão.
- Causa raiz confirmada empiricamente (currentTarget a null após await no React 19.2.8).
- tsc limpo; diff restrito a `onSubmit`.
