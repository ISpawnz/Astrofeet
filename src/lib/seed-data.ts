// Initial seed data for Astrofeet. Used by the JSON-backed store on first run.
import type { Product, Review } from "@/lib/types";

export interface SeedUser {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  role: "customer" | "admin";
  createdAt: string;
  updatedAt: string;
}

export interface SeedProduct {
  id: string;
  slug: string;
  name: string;
  brand: string;
  category: string;
  price: number;
  description: string;
  images: string;
  sizes: string;
  stock: number;
  sizeStock?: string; // JSON: { "38": 5, "39": 0, ... }
  rating: number;
  accent: string;
  badge: string | null;
  featured: boolean;
  bestSeller: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SeedCoupon {
  id: string;
  code: string;
  type: "percent" | "fixed";
  value: number;
  minSubtotal: number;
  active: boolean;
  description: string;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SeedReview {
  id: string;
  productId: string;
  userId: string | null;
  authorName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface SeedOrder {
  id: string;
  code: string;
  userId: string | null;
  status: string;
  items: string;
  subtotal: number;
  shipping: number;
  total: number;
  customer: string;
  address: string;
  payment: string;
  createdAt: string;
  updatedAt: string;
}

// Passwords (scrypt hashes). Generated lazily by the store via hashPassword.
// Here we only store the plaintext intended for seed; the store hashes them.
export const SEED_USERS: { email: string; name: string; password: string; role: "customer" | "admin" }[] = [
  { email: "admin@astrofeet.com", name: "Comando Astrofeet", password: "admin123", role: "admin" },
  { email: "explorador@astrofeet.com", name: "Explorador Astrofeet", password: "explorador123", role: "customer" },
];

const now = () => new Date().toISOString();

export const SEED_PRODUCTS: Omit<SeedProduct, "id" | "createdAt" | "updatedAt">[] = [
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
    sizeStock: JSON.stringify({ "38": 4, "39": 6, "40": 7, "41": 6, "42": 5, "43": 4 }),
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
    sizeStock: JSON.stringify({ "37": 2, "38": 3, "39": 4, "40": 3, "41": 3, "42": 3 }),
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
    sizeStock: JSON.stringify({ "39": 3, "40": 5, "41": 5, "42": 4, "43": 4, "44": 3 }),
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
    sizeStock: JSON.stringify({ "37": 2, "38": 3, "39": 3, "40": 4, "41": 3, "42": 3, "43": 3 }),
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
    sizeStock: JSON.stringify({ "36": 3, "37": 4, "38": 5, "39": 5, "40": 5, "42": 5 }),
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
    sizeStock: JSON.stringify({ "38": 1, "39": 2, "40": 3, "41": 3, "42": 2, "43": 2, "44": 2 }),
    rating: 4.8,
    accent: "#ff7a3c",
    badge: "Drop limitado",
    featured: false,
    bestSeller: false,
  },
];

export const SEED_REVIEWS: { slug: string; authorName: string; rating: number; comment: string }[] = [
  { slug: "orion-runner", authorName: "Lucas M.", rating: 5, comment: "Confortável demais, parece que tô flutuando. Visual de outro nível." },
  { slug: "orion-runner", authorName: "Bianca R.", rating: 4, comment: "Lindo, só achei meio justo no peito do pé. Recomendo pegar meia numeração acima." },
  { slug: "lunar-drift", authorName: "Pedro H.", rating: 5, comment: "Couro macio e acabamento impecável. Vale cada real." },
  { slug: "lunar-drift", authorName: "Ana C.", rating: 5, comment: "Combina com tudo, virei meu cotidiano." },
  { slug: "solar-pulse", authorName: "Júlia S.", rating: 5, comment: "Corro meia maratona com ele, leveza absurda." },
  { slug: "solar-pulse", authorName: "Rafael T.", rating: 5, comment: "Melhor tênis de performance que já tive." },
  { slug: "void-classic", authorName: "Marcos L.", rating: 4, comment: "Clássico que faltava no meu armário. Aderência boa de skate." },
  { slug: "meteor-air", authorName: "Camila V.", rating: 5, comment: "O câmara de ar é sensacional, parece trampolim." },
];

export const SEED_COUPONS: Omit<SeedCoupon, "id" | "createdAt" | "updatedAt">[] = [
  {
    code: "GALAXIA10",
    type: "percent",
    value: 10,
    minSubtotal: 0,
    active: true,
    description: "10% off em tudo. Bem-vindo à galáxia!",
    expiresAt: null,
  },
  {
    code: "ORBITA50",
    type: "fixed",
    value: 50,
    minSubtotal: 300,
    active: true,
    description: "R$50 off em pedidos acima de R$300.",
    expiresAt: null,
  },
  {
    code: "DROP15",
    type: "percent",
    value: 15,
    minSubtotal: 500,
    active: true,
    description: "15% off em pedidos acima de R$500. Para colecionadores de drops.",
    expiresAt: null,
  },
];

export const nowIso = now;
