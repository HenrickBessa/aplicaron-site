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
]) {
  await sharp(origem).trim().resize({ height: 200 }).png({ compressionLevel: 9 }).toFile(`public/imagens/clientes/${destino}`);
}

console.log("Imagens geradas.");
