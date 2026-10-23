// Datas do admin sempre no horário de Brasília (o servidor da Vercel roda em UTC).
export const dataHora = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
  timeZone: "America/Sao_Paulo",
});
