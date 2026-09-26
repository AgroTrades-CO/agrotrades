# task-002-contact-form-false-error — handoff 03 — code-reviewer (Gate 5)

Workflow: bug-fix | Classificação: SMALL

STATUS: APPROVED

SUMMARY:
Revisto `git diff components/ContactForm.tsx` (8 inserções, 3 remoções, só dentro de `onSubmit`).
A correção ataca a causa raiz documentada pelo developer e confirmada em runtime pelo tester: o
acesso a `event.currentTarget` depois do `await`, que no React devolve `null`. O form passa a ser
capturado em `formElement` antes de qualquer `await` e usado tanto em `new FormData(...)` como em
`reset()`. O `try/catch` fica restrito ao `fetch` e à verificação de `response.ok`, e o caminho de
sucesso sai do `try`, o que elimina a classe de erro (não só esta instância): uma falha posterior a
um envio bem-sucedido já não pode ser reinterpretada como falha de envio. Não há pedidos de
alteração.

ARTIFACTS:
- project/state/task-002-contact-form-false-error/handoff-03-code-reviewer.md (este ficheiro)
- project/state/task-002-contact-form-false-error/gates.md (estado dos gates desta tarefa)
Nenhum ficheiro de código alterado. Sem commit.

VALIDATIONS:
- Correção — OK.
  - `formElement` é capturado de forma síncrona, logo após `preventDefault()`; todos os acessos
    ao form depois do `await` usam esta referência. Não resta nenhum acesso a `event.*` depois do
    `await`.
  - Ramo de erro: `setStatus("error")` + `return` preserva o comportamento anterior (campos não
    são limpos, o visitante pode reenviar).
  - Ramo de sucesso: `setStatus("success")` seguido de `formElement.reset()`. `reset()` num
    `HTMLFormElement` válido não lança; mesmo que lançasse, o estado já não passaria a "error"
    (ficaria apenas como rejeição não tratada da função assíncrona), o que é o comportamento
    desejado.
  - Ordem `setStatus` antes de `reset()` é indiferente para o resultado (o React agrupa as
    atualizações; `reset()` atua sobre inputs não controlados).
- Legibilidade — OK. Fluxo linear com saída antecipada no `catch`, mais fácil de ler do que a
  versão anterior. Nome `formElement` justificado: evita sombrear a prop `form` do componente.
- Coerência com o estilo do ficheiro — OK. Os dois comentários novos estão em português, explicam o
  "porquê" (não o "quê") e seguem a densidade do resto do ficheiro, que já comenta decisões não
  óbvias (honeypot, `HONEYPOT_FIELD`). Nota menor, não bloqueante: a linha 51 tem cerca de 88
  caracteres, ligeiramente acima das restantes linhas de comentário (quebradas por volta dos 80);
  não há formatador/linter a impor limite e o resto do ficheiro tem linhas de código mais longas.
- Efeitos secundários — nenhum. Payload, honeypot, URL, cabeçalhos, JSX, mensagens do CMS e
  contrato da rota inalterados. O pormenor de `setStatus`/`reset()` após desmontagem durante o
  `fetch` já existia antes, é inofensivo no React atual e está registado pelo developer e tester.
- Âmbito — OK. `git diff --stat` mostra só components/ContactForm.tsx; `git diff --check` sem
  problemas de espaços em branco. Nada fora de `onSubmit`.
- Classificação SMALL — mantém-se. A alteração é só de estado de UI no cliente; não muda o que é
  recolhido, como nem para onde é enviado, pelo que não aciona os sinais de risco de dados pessoais.

ISSUES:
- Nenhum defeito.
- Atenção para o commit (não é defeito do código): o índice do git tem neste momento staged a
  remoção de `.eslintrc.json`, que pertence a outra tarefa em paralelo (configuração de ESLint).
  O commit desta tarefa deve incluir apenas components/ContactForm.tsx (e, se desejado, os
  handoffs de task-002); não usar `git commit -a` nem fazer commit do índice tal como está.
- Continua a não existir teste de regressão automatizado para este caso (não há framework de
  testes no projeto). Fora do âmbito desta tarefa.

BLOCKERS: nenhum.

REQUIRED_NEXT_ACTION (orchestrator):
Registar Gate 5 = APPROVED. Bug-fix SMALL fica concluído (sem devops/qa neste fluxo). Se o
utilizador pedir commit/release, garantir que só components/ContactForm.tsx entra no commit desta
tarefa (ver ISSUES) e seguir o workflow `release` para produção.

CONTEXT_FOR_NEXT_AGENT:
- Diff final: captura de `formElement` antes do `await`; `try/catch` só à volta do `fetch` e de
  `response.ok`; `catch` com `setStatus("error")` + `return`; `setStatus("success")` e
  `formElement.reset()` fora do `try`.
- Validado pelo tester em runtime (PT e EN, sucesso/erro HTTP/erro de rede/reenvio, 1 POST por
  submissão, `tsc` limpo). ESLint não executado por a configuração estar em alteração noutra tarefa.
