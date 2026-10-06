// Fundo decorativo: colunas de código subindo devagar atrás de todo o site.
// - Só HTML + CSS (animação em .coluna-codigo, globals.css): zero JavaScript.
// - aria-hidden e pointer-events-none: invisível para leitor de tela e não atrapalha cliques.
// - Opacidade baixa: o contraste do texto da página continua dentro do WCAG.
// - Cada coluna repete o texto duas vezes e sobe 50%: o fim encaixa no começo (loop sem emenda).

const TRECHOS = [
  `const aplicarOn = {
  tecnologia: "inovação",
  pessoas: "resultado",
  futuro: "juntos",
};`,
  `function transformar(ideia) {
  return tecnologia
    .conectar(ideia)
    .converter(emRealidade)
    .evoluir();
}`,
  `const progresso = [
  "eficiência",
  "automação",
  "escalabilidade",
  "crescimento",
];`,
  `if (inovacao && tecnologia) {
  return AplicarOn;
}`,
  `async function diagnostico(projeto) {
  const plano = await entender(projeto);
  return entregarEmEtapas(plano);
}`,
  `export default function Site() {
  return <Resultado rapido seguro />;
}`,
  `select servico, count(*)
  from projetos
 where status = 'entregue'
 group by servico;`,
  `const app = criarApp({
  android: true,
  ios: true,
  offline: true,
});`,
];

// Colunas: posição, velocidade e quais trechos. Em telas pequenas, só as 3 primeiras aparecem.
const COLUNAS = [
  { esquerda: "2%", duracao: "95s", trechos: [0, 4, 6, 2] },
  { esquerda: "34%", duracao: "120s", trechos: [1, 7, 3, 5] },
  { esquerda: "67%", duracao: "105s", trechos: [2, 5, 0, 6] },
  { esquerda: "18%", duracao: "135s", trechos: [3, 6, 1, 7], larga: true },
  { esquerda: "50%", duracao: "110s", trechos: [4, 0, 7, 2], larga: true },
  { esquerda: "83%", duracao: "125s", trechos: [5, 2, 4, 1], larga: true },
];

export function FundoCodigo() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden [mask-image:linear-gradient(to_bottom,transparent,black_15%,black_85%,transparent)]"
    >
      {COLUNAS.map((coluna, i) => {
        const texto = coluna.trechos.map((t) => TRECHOS[t]).join("\n\n\n");
        return (
          <pre
            key={i}
            className={`coluna-codigo absolute top-0 m-0 font-mono text-xs leading-6 text-ciano/[0.07] select-none ${coluna.larga ? "hidden lg:block" : ""}`}
            style={{ left: coluna.esquerda, ["--duracao" as string]: coluna.duracao }}
          >
            {texto}
            {"\n\n\n"}
            {texto}
          </pre>
        );
      })}
    </div>
  );
}
