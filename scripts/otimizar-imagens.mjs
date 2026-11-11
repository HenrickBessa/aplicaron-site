// Gera as imagens do site a partir dos originais em assets/ (rode: npm run imagens).
// Os originais ficam no repositório como fonte; o site só serve as versões geradas, leves.
// No navegador, o next/image ainda converte para AVIF/WebP no tamanho exato de cada tela.
import { mkdir } from "node:fs/promises";
import sharp from "sharp";

const FUNDO = { r: 11, g: 26, b: 46, alpha: 1 }; // azul-noite #0B1A2E
const TRANSPARENTE = { r: 0, g: 0, b: 0, alpha: 0 };

// Mantém só os pixels que interessam e zera o resto (sombras, halos, linhas de fundo).
async function filtrarPixels(entrada, manter, extracao) {
  let img = sharp(entrada);
  if (extracao) img = img.extract(extracao);
  const { data, info } = await img.ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  for (let i = 0; i < data.length; i += 4) {
    const [r, g, b, a] = [data[i], data[i + 1], data[i + 2], data[i + 3]];
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const saturacao = max ? (max - min) / max : 0;
    if (!manter({ r, g, b, a, min, saturacao })) data[i + 3] = 0;
  }
  return sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } }).trim().png().toBuffer();
}

const azul = ({ b, saturacao }) => saturacao > 0.5 && b > 140;
const branco = ({ min, a }) => min > 215 && a > 200;

await mkdir("public/imagens/marca", { recursive: true });
await mkdir("public/imagens/clientes", { recursive: true });

// 1. Logotipo do cabeçalho: texto branco + "On" azul, sem a sombra cinza do original.
const logotipo = await filtrarPixels("assets/favicon_aplicaron.png", (p) => branco(p) || azul(p));
await sharp(logotipo).resize({ height: 96 }).png({ compressionLevel: 9, palette: true }).toFile("public/imagens/marca/logotipo.png");

// 2. Símbolo (botão de ligar do "On"): favicon e ícone Apple. Nítido até em 16px.
//    Recorte medido: o "O" ocupa x 831–1003 e o "n" começa em 1015 (vão entre os dois).
const simbolo = await filtrarPixels("assets/favicon_aplicaron.png", azul, { left: 820, top: 500, width: 189, height: 220 });
const quadrado = async (lado, margem, fundo) => {
  const centro = await sharp(simbolo)
    .resize(lado - margem * 2, lado - margem * 2, { fit: "contain", background: TRANSPARENTE })
    .toBuffer();
  // Compõe sobre um quadrado inteiro da cor de fundo (só "extend" pintaria as margens).
  return sharp({ create: { width: lado, height: lado, channels: 4, background: fundo } })
    .composite([{ input: centro, gravity: "center" }])
    .png({ compressionLevel: 9 });
};
// O Google pede favicon em múltiplo de 48px; 192 cobre também telas de alta densidade.
await (await quadrado(192, 16, TRANSPARENTE)).toFile("app/icon.png");
// iOS não lida bem com transparência: ícone Apple com fundo azul-noite.
await (await quadrado(180, 30, FUNDO)).toFile("app/apple-icon.png");

// 3. Ilustração da home (o original tem 1,7 MB).
await sharp("assets/aplicaron_logo.png").trim({ threshold: 10 }).resize({ width: 960 }).webp({ quality: 72, effort: 6 }).toFile("public/imagens/marca/ilustracao.webp");

// 4. Imagem de compartilhamento (WhatsApp, LinkedIn, Google): 1200x630 em JPEG.
const ilustracaoOg = await sharp("assets/aplicaron_logo.png").trim({ threshold: 10 }).resize({ width: 1060, height: 560, fit: "inside" }).toBuffer();
await sharp({ create: { width: 1200, height: 630, channels: 4, background: FUNDO } })
  .composite([{ input: ilustracaoOg, gravity: "center" }])
  .jpeg({ quality: 82, mozjpeg: true })
  .toFile("public/og.jpg");

// 5. Logos dos clientes: sem bordas vazias, altura padronizada.
for (const [origem, destino] of [
  ["assets/logoemer.png", "emer.png"],
  ["assets/armazemlogo.png", "atacado-das-cestas.png"],
  ["assets/logokavana.png", "kavana.png"],
  ["assets/logobazar.webp", "bazar-bike-motos.png"],
]) {
  await sharp(origem).trim().resize({ height: 200 }).png({ compressionLevel: 9 }).toFile(`public/imagens/clientes/${destino}`);
}
// A logo da AGI vem sobre fundo verde opaco: o trim colaria o fundo no texto, então o recorte deixa margem.
await sharp("assets/logoagi.png")
  .extract({ left: 96, top: 216, width: 2208, height: 684 })
  .resize({ height: 200 })
  .png({ compressionLevel: 9 })
  .toFile("public/imagens/clientes/agi.png");

// Uma tela: recorte opcional (px do original), largura máxima de 1280, WebP.
async function tela(origem, destino, recorte) {
  let img = sharp(origem);
  if (recorte) img = img.extract(recorte);
  await img.resize({ width: 1280, withoutEnlargement: true }).webp({ quality: 80, effort: 6 }).toFile(destino);
}

// 6. Telas dos sistemas dos clientes (dados fictícios), vindas das apresentações de cada sistema.
//    O recorte (px do original) fica só com a parte que a página comenta e deixa de fora
//    o que não pode aparecer no site (nomes de parceiros, contratos, números).
for (const [cliente, nome, recorte] of [
  ["kavana", "site-agendamento", null],
  ["kavana", "agenda-dia", { left: 0, top: 0, width: 1280, height: 1240 }],
  ["kavana", "solicitacoes", { left: 0, top: 0, width: 1280, height: 1400 }],
  ["kavana", "prontuario-finalizado", { left: 0, top: 0, width: 1280, height: 1570 }],
  ["emer", "paciente-chamada", null],
  // Sem o cabeçalho, que traz o nome da unidade de saúde.
  ["emer", "agenda", { left: 320, top: 80, width: 1280, height: 520 }],
  ["emer", "atendimento", null],
  // Só o selo: o aviso logo abaixo cita o edital do contrato.
  ["emer", "prontuario-selado", { left: 976, top: 140, width: 584, height: 465 }],
  // Só o topo da home: abaixo começa outra seção.
  ["agi", "site-home", { left: 0, top: 0, width: 1600, height: 850 }],
  ["agi", "hub-fachada-noite", { left: 0, top: 0, width: 1600, height: 880 }],
  ["agi", "hub-planta-final-01", null],
  ["agi", "m-hub-inicio", null],
  // Só a lista, sem a área vazia abaixo (leads de exemplo, telefones 90000-00xx).
  ["agi", "painel-leads", { left: 160, top: 0, width: 1280, height: 650 }],
  // Telas do site no ar (públicas, 10/11/2026). Sem a faixa da barra de rolagem à direita.
  ["bazar-bike-motos", "site-home", { left: 0, top: 0, width: 1584, height: 900 }],
  ["bazar-bike-motos", "catalogo", { left: 0, top: 0, width: 1584, height: 900 }],
  // Só o produto, sem o começo do rodapé.
  ["bazar-bike-motos", "produto", { left: 0, top: 0, width: 1584, height: 780 }],
  ["bazar-bike-motos", "revisao", { left: 0, top: 0, width: 1584, height: 900 }],
  ["bazar-bike-motos", "m-catalogo", null],
]) {
  await mkdir(`public/imagens/clientes/${cliente}`, { recursive: true });
  await tela(`assets/telas/${cliente}/${nome}.webp`, `public/imagens/clientes/${cliente}/${nome}.webp`, recorte);
}

// 7. Telas dos produtos, vindas das apresentações públicas de cada um (dados de exemplo).
for (const [produto, nome, recorte] of [
  ["aplicarsaude", "inicio", null],
  ["aplicarsaude", "camera-pressao", null],
  ["aplicarsaude", "maxima", null],
  ["aplicarsaude", "caderno", null],
  // Só o cabeçalho e os cartões: os gráficos abaixo mostram as faixas de aviso, ainda não validadas com a médica.
  ["aplicarsaude", "painel", { left: 0, top: 0, width: 1600, height: 432 }],
  ["aplicaragro", "sem-sinal", null],
  ["aplicaragro", "contagem", null],
  ["aplicaragro", "pesar", null],
  ["aplicaragro", "acerto", null],
]) {
  await mkdir(`public/imagens/produtos/${produto}`, { recursive: true });
  await tela(`assets/telas/produtos/${produto}/${nome}.webp`, `public/imagens/produtos/${produto}/${nome}.webp`, recorte);
}

console.log("Imagens geradas.");
