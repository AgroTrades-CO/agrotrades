# task-002-contact-form-false-error — handoff 01 — developer

Workflow: bug-fix | Classificação: SMALL

STATUS: READY

SUMMARY:
Corrigido o falso erro no formulário de contacto. Em `onSubmit`, `event.currentTarget.reset()` era
chamado depois do `await fetch(...)`; nessa altura o React já pôs `event.currentTarget` a `null`, o
que lançava TypeError, o `catch` corria e o estado passava de "success" para "error" apesar de o
email ter sido enviado. Correção mínima:
- o elemento form é capturado em `const formElement = event.currentTarget;` logo a seguir a
  `event.preventDefault()`, antes de qualquer `await`, e usado tanto no `new FormData(...)` como no
  `reset()`;
- o `try/catch` passa a envolver apenas o `fetch` e a verificação `response.ok`; o `catch` faz
  `setStatus("error")` e `return`;
- `setStatus("success")` e `formElement.reset()` ficam fora do `try`, pelo que nenhuma falha
  posterior a um envio bem-sucedido pode voltar a pôr o estado em "error".
Nome da variável: usei `formElement` em vez de `form` (sugerido no pedido) porque `form` já é o
nome da prop do componente (`Contacts["contactForm"]`, configuração vinda do CMS); usar `form`
sombrearia essa prop dentro de `onSubmit`. O comportamento é o mesmo.

ARTIFACTS:
- components/ContactForm.tsx (alterado — só a função `onSubmit`)
- project/state/task-002-contact-form-false-error/handoff-01-developer.md (este ficheiro)
Não tocados: app/api/contact/route.ts, JSX/markup do componente, configuração de ESLint. Sem commit.

VALIDATIONS:
- `npx tsc --noEmit` na raiz: passa (exit 0, sem erros). O único output é um aviso do npm sobre
  a configuração de utilizador "python", que não tem relação com a tarefa.
- `git status`: só `components/ContactForm.tsx` modificado pelo developer (mais este handoff).
- Revisão manual do fluxo:
  - resposta 2xx: estado "success", form limpo, sem passar pelo `catch`;
  - resposta não-2xx ou falha de rede: estado "error", form NÃO é limpo (o visitante mantém o que
    escreveu para tentar de novo). Este comportamento já existia e mantém-se.
- Não executado: teste no browser, nem ESLint (a configuração está a ser alterada noutra tarefa em
  paralelo). Não testei no browser para evitar um envio real através do Resend; fica para o tester.

ISSUES:
- Não existe framework de testes no projeto; a verificação terá de ser manual ou com mock da rota.
- Pormenor: se o componente for desmontado durante o `fetch` (por exemplo, o visitante muda de
  página), `setStatus` e `reset()` correm sobre um componente/elemento desmontado. No React atual
  isto não lança erro nem dá aviso, e já acontecia antes; não justifica alterar o âmbito.
- Nota de contexto (não bloqueia): este formulário envia dados pessoais (nome, email, telefone) e
  `project/context.md` diz que isso reclassificaria a funcionalidade. Esta correção mexe apenas no
  estado da UI do lado do cliente e não muda o que é recolhido, como é enviado nem para onde; a
  classificação SMALL mantém-se válida para este bug-fix.

BLOCKERS: nenhum.

REQUIRED_NEXT_ACTION (tester):
1. Caso de sucesso (principal): submeter um formulário válido com `/api/contact` a responder 2xx
   (Resend real num ambiente de teste, ou pedido interceptado/mockado no DevTools para devolver 200).
   Confirmar que aparece a mensagem de sucesso (`role="status"`), que a mensagem de erro NÃO
   aparece, que os campos ficam limpos, que não há TypeError na consola e que é feito só um POST.
2. Caso de erro HTTP: pôr `/api/contact` a responder 4xx/5xx. Confirmar que aparece a mensagem de
   erro (`role="alert"`), que não aparece a de sucesso e que os campos continuam preenchidos.
3. Caso de falha de rede (por exemplo, modo offline no DevTools): mesmo resultado que no ponto 2.
4. Estado "sending": o botão fica desativado e mostra "…" durante o pedido e volta ao normal no fim,
   tanto em sucesso como em erro.
5. Reenvio: depois de um sucesso, preencher e submeter de novo; o fluxo tem de voltar a funcionar
   (o reset não pode deixar o form num estado inválido).
6. Confirmar em PT (`/contactos`) e EN (rota equivalente em `/en/`) que as mensagens vêm do CMS.
7. Confirmar `npx tsc --noEmit` e que o diff se limita a `onSubmit` em components/ContactForm.tsx.

CONTEXT_FOR_NEXT_AGENT:
- Causa: o React põe `event.currentTarget` a `null` quando o dispatch síncrono do evento termina;
  qualquer acesso depois de um `await` devolve `null`. O `.reset()` sobre `null` lançava TypeError,
  apanhado pelo mesmo `catch` do `fetch`.
- Diff completo: `git diff components/ContactForm.tsx` (cerca de 10 linhas, só em `onSubmit`).
- O honeypot (`empresa`) e o payload não foram alterados; a rota e o contrato da API também não.
- Não há suite de testes automáticos no projeto.
