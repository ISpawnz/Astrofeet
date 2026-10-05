// Banco em arquivo JSON com uma API no formato do Prisma Client (findUnique /
// findFirst / findMany / create / update / delete / count), com operadores de
// where, orderBy, take e include de reviews. Semeia sozinho na primeira carga.
// Roda sem binários externos; trocar por Prisma de verdade é mudar só este arquivo.

import "server-only";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { hashPassword, verifyPassword } from "@/server/crypto";
import { SEED_USERS, SEED_PRODUCTS, SEED_REVIEWS, SEED_COUPONS } from "@/server/seed-data";

// Registros são JSON dinâmico; `any` evita centenas de casts nas rotas.

type Row = Record<string, any>;
type Where = Record<string, unknown>;
type Include = { reviews?: { orderBy?: Record<string, string>; select?: Record<string, boolean> } };
const COLLECTIONS = ["users", "products", "orders", "reviews", "coupons", "addresses", "notifications"] as const;
type DBShape = Record<(typeof COLLECTIONS)[number], Row[]>;

// O servidor "standalone" muda o cwd; em produção aponte para um volume persistente
// fora do build com ASTROFEET_DB_PATH.
const DB_PATH = path.resolve(
  /* turbopackIgnore: true */ process.env.ASTROFEET_DB_PATH ||
    path.join(/* turbopackIgnore: true */ process.cwd(), "db/astrofeet.json"),
);
const DATE_FIELDS = new Set(["createdAt", "updatedAt", "sentAt"]);
const isProd = process.env.NODE_ENV === "production";

// ---------- carga / persistência ----------
// globalThis: o cache sobrevive ao HMR (senão cada rota teria sua própria cópia).
const g = globalThis as unknown as { __astrofeet_db?: DBShape; __astrofeet_writes?: Promise<void> };
const genId = () => crypto.randomUUID();
const stamp = (data: Row, now = new Date()) => ({ id: genId(), createdAt: now, updatedAt: now, ...data });

function hydrateDates(rec: Row): Row {
  for (const k of Object.keys(rec)) if (DATE_FIELDS.has(k) && typeof rec[k] === "string") rec[k] = new Date(rec[k]);
  return rec;
}

function write(db: DBShape) {
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), "utf8");
}

function persist() {
  const db = load();
  g.__astrofeet_writes = (g.__astrofeet_writes ?? Promise.resolve()).then(() => {
    try {
      write(db);
    } catch (e) {
      console.error("[db] persist failed:", e);
    }
  });
  return g.__astrofeet_writes;
}

// Dev: contas de demonstração. Produção: NUNCA (admin123 seria uma porta aberta);
// o primeiro admin vem de ASTROFEET_ADMIN_EMAIL / ASTROFEET_ADMIN_PASSWORD (>= 12).
function seedUsers() {
  if (!isProd) return SEED_USERS;
  const email = process.env.ASTROFEET_ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ASTROFEET_ADMIN_PASSWORD;
  if (email && password && password.length >= 12)
    return [{ email, name: "Administrador", password, role: "admin" as const }];
  console.warn("[db] produção sem ASTROFEET_ADMIN_EMAIL/ASTROFEET_ADMIN_PASSWORD (>=12 chars): nenhum admin criado.");
  return [];
}

function seed(): DBShape {
  const db = Object.fromEntries(COLLECTIONS.map((c) => [c, []])) as unknown as DBShape;
  db.users = seedUsers().map(({ password, ...u }) => stamp({ ...u, passwordHash: hashPassword(password) }));
  db.products = SEED_PRODUCTS.map((p) => stamp(p));
  const idBySlug = new Map(db.products.map((p) => [p.slug, p.id]));
  db.reviews = SEED_REVIEWS.filter((r) => idBySlug.has(r.slug)).map(({ slug, ...r }) =>
    stamp({ ...r, productId: idBySlug.get(slug), userId: null }),
  );
  db.coupons = SEED_COUPONS.map((c) => stamp(c));
  return db;
}

function load(): DBShape {
  if (g.__astrofeet_db) return g.__astrofeet_db;
  let db: DBShape;
  try {
    const raw = JSON.parse(fs.readFileSync(DB_PATH, "utf8")) as Partial<DBShape>;
    db = Object.fromEntries(COLLECTIONS.map((c) => [c, (raw[c] ?? []).map(hydrateDates)])) as DBShape;
    // Migrações leves: estoque por tamanho vindo do seed e cupons padrão.
    const seedBySlug = new Map(SEED_PRODUCTS.map((p) => [p.slug, p]));
    for (const p of db.products)
      if (!p.sizeStock || p.sizeStock === "{}") p.sizeStock = seedBySlug.get(p.slug)?.sizeStock ?? "{}";
    if (!db.coupons.length) db.coupons = SEED_COUPONS.map((c) => stamp(c));
    if (isProd)
      for (const u of SEED_USERS)
        if (db.users.some((x) => x.email === u.email && verifyPassword(u.password, String(x.passwordHash))))
          console.error(
            `[SEGURANÇA] A conta ${u.email} usa a senha de demonstração. Troque ou remova antes de expor o app.`,
          );
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code !== "ENOENT")
      console.error("[db] falha ao ler o banco, semeando de novo:", e);
    db = seed();
  }
  write(db);
  return (g.__astrofeet_db = db);
}

// ---------- consulta ----------
const cmp = (v: unknown) => (v instanceof Date ? v.getTime() : v);
const lower = (v: unknown) => String(v ?? "").toLowerCase();

const OPS: Record<string, (rv: unknown, tv: unknown) => boolean> = {
  equals: (a, b) => a === b,
  not: (a, b) => a !== b,
  in: (a, b) => Array.isArray(b) && b.includes(a),
  contains: (a, b) => lower(a).includes(lower(b)),
  gt: (a, b) => (a as number) > (b as number),
  gte: (a, b) => (a as number) >= (b as number),
  lt: (a, b) => (a as number) < (b as number),
  lte: (a, b) => (a as number) <= (b as number),
};

function matches(rec: Row, where: Where = {}): boolean {
  return Object.entries(where).every(([key, cond]) => {
    if (key === "OR") return (cond as Where[]).some((w) => matches(rec, w));
    const rv = cmp(rec[key]);
    if (cond === null || typeof cond !== "object" || cond instanceof Date) return rv === cmp(cond);
    return Object.entries(cond).every(([op, tv]) => (OPS[op] ?? OPS.equals)(rv, cmp(tv)));
  });
}

function sortBy(rows: Row[], orderBy?: Record<string, string>): Row[] {
  if (!orderBy) return rows;
  const [field, dir] = Object.entries(orderBy)[0];
  const sign = dir === "desc" ? -1 : 1;
  return [...rows].sort((a, b) => {
    const [x, y] = [cmp(a[field]), cmp(b[field])];
    return sign * (typeof x === "number" && typeof y === "number" ? x - y : String(x).localeCompare(String(y)));
  });
}

// Cópia profunda (o chamador nunca altera o banco por referência), com datas preservadas.
function output(rec: Row, include?: Include): Row {
  const out = hydrateDates(JSON.parse(JSON.stringify(rec)));
  if (include?.reviews) {
    const { orderBy, select } = include.reviews;
    out.reviews = sortBy(
      load().reviews.filter((r) => r.productId === rec.id),
      orderBy,
    ).map((r) => (select ? Object.fromEntries(Object.keys(select).map((k) => [k, r[k]])) : output(r)));
  }
  return out;
}

function notFound(): never {
  throw Object.assign(new Error("Record not found"), { code: "P2025" });
}

function model(name: keyof DBShape) {
  const rows = () => load()[name];
  const indexOf = (where: Where) => {
    const i = rows().findIndex((r) => matches(r, where));
    return i < 0 ? notFound() : i;
  };
  const findFirst = async (a: { where?: Where; include?: Include } = {}) => {
    const rec = rows().find((r) => matches(r, a.where));
    return rec ? output(rec, a.include) : null;
  };
  return {
    findUnique: findFirst,
    findFirst,
    async findMany(a: { where?: Where; orderBy?: Record<string, string>; include?: Include; take?: number } = {}) {
      return sortBy(
        rows().filter((r) => matches(r, a.where)),
        a.orderBy,
      )
        .slice(0, a.take)
        .map((r) => output(r, a.include));
    },
    async count(a: { where?: Where } = {}) {
      return rows().filter((r) => matches(r, a.where)).length;
    },
    async create(a: { data: Row }) {
      const rec = hydrateDates(stamp(a.data));
      rows().push(rec);
      await persist();
      return output(rec);
    },
    /** `data` aceita valores ou { increment | decrement: n }. */
    async update(a: { where: Where; data: Row; include?: Include }) {
      const rec = rows()[indexOf(a.where)];
      for (const [k, v] of Object.entries(a.data)) {
        if (v && typeof v === "object" && ("increment" in v || "decrement" in v))
          rec[k] = Number(rec[k] ?? 0) + Number(v.increment ?? 0) - Number(v.decrement ?? 0);
        else rec[k] = v;
      }
      rec.updatedAt = new Date();
      await persist();
      return output(rec, a.include);
    },
    async delete(a: { where: Where }) {
      const [removed] = rows().splice(indexOf(a.where), 1);
      if (name === "products") load().reviews = load().reviews.filter((r) => r.productId !== removed.id);
      await persist();
      return output(removed);
    },
  };
}

export const db = {
  user: model("users"),
  product: model("products"),
  order: model("orders"),
  review: model("reviews"),
  coupon: model("coupons"),
  address: model("addresses"),
  notification: model("notifications"),
};
