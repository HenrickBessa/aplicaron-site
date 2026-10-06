import { ICONES, type IconeTecnologia } from "./icones-tecnologias.gerado";

// Tecnologias exibidas no carrossel da home (inteligências artificiais ficam de fora).
// Para incluir: acrescente uma linha usando o nome do ícone em https://simpleicons.org, em
// minúsculas (ex.: "laravel" vira a propriedade laravel de ICONES) e rode `npm run icones`.
export type Tecnologia = { nome: string; icone: IconeTecnologia };

export const tecnologias: Tecnologia[] = [
  // Web
  { nome: "TypeScript", icone: ICONES.typescript },
  { nome: "JavaScript", icone: ICONES.javascript },
  { nome: "React", icone: ICONES.react },
  { nome: "Next.js", icone: ICONES.nextdotjs },
  { nome: "Node.js", icone: ICONES.nodedotjs },
  { nome: "Tailwind CSS", icone: ICONES.tailwindcss },
  { nome: "HTML5", icone: ICONES.html5 },
  { nome: "CSS", icone: ICONES.css },
  // Dados e nuvem
  { nome: "PostgreSQL", icone: ICONES.postgresql },
  { nome: "Supabase", icone: ICONES.supabase },
  { nome: "Vercel", icone: ICONES.vercel },
  { nome: "Docker", icone: ICONES.docker },
  { nome: "Git", icone: ICONES.git },
  { nome: "GitHub", icone: ICONES.github },
  // Mobile
  { nome: "React Native", icone: ICONES.react },
  { nome: "Flutter", icone: ICONES.flutter },
  { nome: "Android", icone: ICONES.android },
  { nome: "iOS", icone: ICONES.ios },
  // Outras
  { nome: "Python", icone: ICONES.python },
  { nome: "PHP", icone: ICONES.php },
  { nome: "Firebase", icone: ICONES.firebase },
];
