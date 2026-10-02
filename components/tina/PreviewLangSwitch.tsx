import type { Lang } from "@/content";

/**
 * Seletor de idioma SÓ da pré-visualização da TinaCMS (task-017): o painel
 * da Tina mostra sempre Português e Inglês; aqui escolhe-se em que idioma se
 * vê a página. Cada idioma é uma rota própria, dentro do layout desse idioma
 * (cabeçalho e rodapé no idioma certo, FR-3.4): este seletor é só a ligação
 * entre as duas rotas. Não existe no site público.
 */
export function PreviewLangSwitch({ lang, hrefPt, hrefEn }: { lang: Lang; hrefPt: string; hrefEn: string }) {
  const link = (target: Lang, href: string, label: string) => (
    <a
      href={href}
      aria-current={lang === target ? "page" : undefined}
      style={{
        padding: "6px 12px",
        borderRadius: 999,
        textDecoration: "none",
        fontWeight: 600,
        background: lang === target ? "var(--green)" : "transparent",
        color: lang === target ? "white" : "var(--green)",
      }}
    >
      {label}
    </a>
  );
  return (
    <div
      style={{
        position: "fixed",
        // À direita do indicador do Next.js em desenvolvimento (canto inferior esquerdo).
        left: 64,
        bottom: 16,
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        gap: 4,
        padding: 4,
        background: "white",
        border: "1px solid var(--green)",
        borderRadius: 999,
        boxShadow: "0 4px 16px rgba(0,0,0,0.15)",
        fontSize: 13,
      }}
    >
      <span style={{ padding: "0 8px", color: "#555" }}>Ver em:</span>
      {link("pt", hrefPt, "Português")}
      {link("en", hrefEn, "Inglês")}
    </div>
  );
}
