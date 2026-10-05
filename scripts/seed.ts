import { db } from "../src/server/db";
import { hashPassword } from "../src/server/auth";

const products = [
  {
    slug: "orion-runner",
    name: "Orion Runner",
    brand: "Astrofeet Lab",
    category: "Corrida",
    price: 279.99,
    description:
      "Leve, limpo e veloz. O Orion Runner foi feito para quem quer um visual de órbita baixa sem abrir mão do conforto no dia a dia. Cabedal em malha translúcida com acabamento refletivo e entressola responsiva.",
    images: JSON.stringify(["/products/orion-runner.png"]),
    sizes: JSON.stringify([38, 39, 40, 41, 42, 43]),
    stock: 32,
    rating: 4.7,
    accent: "#34e7ff",
    badge: "Novo",
    featured: true,
    bestSeller: false,
  },
  {
    slug: "lunar-drift",
    name: "Lunar Drift",
    brand: "Astrofeet Lab",
    category: "Casual",
    price: 349.9,
    description:
      "Cabedal premium em couro macio, cano alto e presença de vitrine. O Lunar Drift combina clima noturno com conforto de outro planeta. Palmilha com memória de impacto e solado com aderência lunar.",
    images: JSON.stringify(["/products/lunar-drift.png"]),
    sizes: JSON.stringify([37, 38, 39, 40, 41, 42]),
    stock: 18,
    rating: 4.8,
    accent: "#c6ff5a",
    badge: "Drop limitado",
    featured: true,
    bestSeller: true,
  },
  {
    slug: "solar-pulse",
    name: "Solar Pulse",
    brand: "Nebula Wear",
    category: "Performance",
    price: 429.0,
    description:
      "Um sneaker técnico, feito para chamar atenção sem pesar. Malha respirante, placa de propulsão no antepelo e detalhes em neon dourado. Pronto para treinos longos e looks de impacto.",
    images: JSON.stringify(["/products/solar-pulse.png"]),
    sizes: JSON.stringify([39, 40, 41, 42, 43, 44]),
    stock: 24,
    rating: 4.9,
    accent: "#ffcf5a",
    badge: "Mais vendido",
    featured: true,
    bestSeller: true,
  },
  {
    slug: "nebula-dunk",
    name: "Nebula Dunk",
    brand: "Nebula Wear",
    category: "Lifestyle",
    price: 389.0,
    description:
      "Silhueta chunky com solado robusto e cabedal em camadas de material espacial. O Nebula Dunk é um drop de baixa gravidade para quem vive entre as estrelas e o asfalto.",
    images: JSON.stringify(["/products/nebula-dunk.png"]),
    sizes: JSON.stringify([37, 38, 39, 40, 41, 42, 43]),
    stock: 21,
    rating: 4.6,
    accent: "#a779ff",
    badge: "Novo",
    featured: false,
    bestSeller: false,
  },
  {
    slug: "void-classic",
    name: "Void Classic",
    brand: "Astrofeet Lab",
    category: "Skate",
    price: 319.5,
    description:
      "Clássico atemporal com contraste escuro para looks noturnos. Camurça preta, detalhes em neon magenta e solado vulcanizado de aderência absurda. Um void que combina com tudo.",
    images: JSON.stringify(["/products/void-classic.png"]),
    sizes: JSON.stringify([36, 37, 38, 39, 40, 42]),
    stock: 27,
    rating: 4.5,
    accent: "#ff5cf0",
    badge: null,
    featured: false,
    bestSeller: true,
  },
  {
    slug: "meteor-air",
    name: "Meteor Air",
    brand: "Nebula Wear",
    category: "Performance",
    price: 459.0,
    description:
      "Solado com câmara de ar visível e cabedal em gradiente ígneo. O Meteor Air absorve o impacto e devolve energia a cada passada, como uma chuva de meteoros sob seus pés.",
    images: JSON.stringify(["/products/meteor-air.png"]),
    sizes: JSON.stringify([38, 39, 40, 41, 42, 43, 44]),
    stock: 15,
    rating: 4.8,
    accent: "#ff7a3c",
    badge: "Drop limitado",
    featured: false,
    bestSeller: false,
  },
];

const reviews = [
  {
    slug: "orion-runner",
    items: [
      { authorName: "Lucas M.", rating: 5, comment: "Confortável demais, parece que tô flutuando. Visual de outro nível." },
      { authorName: "Bianca R.", rating: 4, comment: "Lindo, só achei meio justo no peito do pé. Recomendo pegar meia numeração acima." },
    ],
  },
  {
    slug: "lunar-drift",
    items: [
      { authorName: "Pedro H.", rating: 5, comment: "Couro macio e acabamento impecável. Vale cada real." },
      { authorName: "Ana C.", rating: 5, comment: "Combina com tudo, virei meu cotidiano." },
    ],
  },
  {
    slug: "solar-pulse",
    items: [
      { authorName: "Júlia S.", rating: 5, comment: "Corro meia maratona com ele, leveza absurda." },
      { authorName: "Rafael T.", rating: 5, comment: "Melhor tênis de performance que já tive." },
    ],
  },
  {
    slug: "void-classic",
    items: [
      { authorName: "Marcos L.", rating: 4, comment: "Clássico que faltava no meu armário. Aderência boa de skate." },
    ],
  },
  {
    slug: "meteor-air",
    items: [
      { authorName: "Camila V.", rating: 5, comment: "O câmara de ar é sensacional, parece trampolim." },
    ],
  },
];

async function main() {
  console.log("Seeding Astrofeet...");

  // Users
  const admin = await db.user.upsert({
    where: { email: "admin@astrofeet.com" },
    update: {},
    create: {
      email: "admin@astrofeet.com",
      name: "Comando Astrofeet",
      passwordHash: hashPassword("admin123"),
      role: "admin",
    },
  });
  const demo = await db.user.upsert({
    where: { email: "explorador@astrofeet.com" },
    update: {},
    create: {
      email: "explorador@astrofeet.com",
      name: "Explorador Astrofeet",
      passwordHash: hashPassword("explorador123"),
      role: "customer",
    },
  });
  console.log(`users: ${admin.email} / ${demo.email}`);

  // Products
  for (const p of products) {
    await db.product.upsert({
      where: { slug: p.slug },
      update: {},
      create: p,
    });
  }
  console.log(`products: ${products.length}`);

  // Reviews
  for (const r of reviews) {
    const product = await db.product.findUnique({ where: { slug: r.slug } });
    if (!product) continue;
    for (const item of r.items) {
      const exists = await db.review.findFirst({
        where: { productId: product.id, authorName: item.authorName },
      });
      if (exists) continue;
      await db.review.create({
        data: { ...item, productId: product.id },
      });
    }
  }
  console.log("reviews seeded");

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
