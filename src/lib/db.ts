// Astrofeet data layer — JSON-backed store that mirrors the Prisma Client API
// surface used by this app (findUnique / findMany / findFirst / create / update
// / delete / upsert / count / aggregate, with where operators, orderBy, include,
// and increment/decrement). It self-seeds on first run.
//
// This keeps the app fully runnable without external database binaries, while
// the repository surface stays 1:1 with Prisma so swapping to a real DB later
// is a drop-in change.

import "server-only";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { hashPassword } from "@/lib/crypto";
import {
  SEED_USERS,
  SEED_PRODUCTS,
  SEED_REVIEWS,
  SEED_COUPONS,
  type SeedProduct,
} from "@/lib/seed-data";

const DB_PATH = path.resolve(process.cwd(), "db/astrofeet.json");

interface DBShape {
  users: Record<string, unknown>[];
  products: Record<string, unknown>[];
  orders: Record<string, unknown>[];
  reviews: Record<string, unknown>[];
  coupons: Record<string, unknown>[];
  addresses: Record<string, unknown>[];
  notifications: Record<string, unknown>[];
}

const DATE_FIELDS = new Set(["createdAt", "updatedAt", "sentAt"]);

// ---------- low-level load / persist ----------
// Use globalThis so the cache survives module reloads (Turbopack HMR can
// otherwise give each route module its own _db instance, causing data divergence).
const _global = globalThis as unknown as { __astrofeet_db?: DBShape | null; __astrofeet_write_chain?: Promise<void> };
let _db: DBShape | null = _global.__astrofeet_db ?? null;
let _writeChain: Promise<void> = _global.__astrofeet_write_chain ?? Promise.resolve();

function _persistGlobal() {
  _global.__astrofeet_db = _db;
  _global.__astrofeet_write_chain = _writeChain;
}

function load(): DBShape {
  if (_db) return _db;
  try {
    if (fs.existsSync(DB_PATH)) {
      const raw = fs.readFileSync(DB_PATH, "utf8");
      const parsed = JSON.parse(raw) as DBShape;
      _db = {
        users: parsed.users ?? [],
        products: parsed.products ?? [],
        orders: parsed.orders ?? [],
        reviews: parsed.reviews ?? [],
        coupons: parsed.coupons ?? [],
        addresses: parsed.addresses ?? [],
        notifications: parsed.notifications ?? [],
      };
      hydrateDates(_db);
      // Auto-migrate: ensure products have sizeStock, and coupons are seeded
      // if the collection is empty (preserves users/orders/reviews).
      let migrated = false;
      // Backfill sizeStock from seed data for products that lack it (by slug).
      const seedBySlug = new Map(SEED_PRODUCTS.map((p) => [p.slug, p]));
      for (const p of _db.products) {
        if (p.sizeStock === undefined) {
          p.sizeStock = "{}";
          migrated = true;
        }
        const slug = p.slug as string;
        const seed = seedBySlug.get(slug);
        const current = (() => {
          try {
            return JSON.parse((p.sizeStock as string) || "{}");
          } catch {
            return {};
          }
        })();
        if (
          seed &&
          seed.sizeStock &&
          Object.keys(current).length === 0
        ) {
          p.sizeStock = seed.sizeStock;
          migrated = true;
        }
      }
      if (_db.coupons.length === 0) {
        const now = new Date();
        for (const c of SEED_COUPONS) {
          _db.coupons.push({
            id: genId(),
            code: c.code,
            type: c.type,
            value: c.value,
            minSubtotal: c.minSubtotal,
            active: c.active,
            description: c.description,
            expiresAt: c.expiresAt,
            createdAt: now,
            updatedAt: now,
          });
        }
        migrated = true;
      }
      if (migrated) persistSync(_db);
      _persistGlobal();
      return _db;
    }
  } catch (e) {
    console.error("[db] failed to read store, reseeding:", e);
  }
  _db = seed();
  persistSync(_db);
  _persistGlobal();
  return _db;
}

function hydrateDates(db: DBShape) {
  for (const coll of Object.values(db)) {
    for (const rec of coll) {
      for (const k of Object.keys(rec)) {
        if (DATE_FIELDS.has(k) && typeof rec[k] === "string") {
          rec[k] = new Date(rec[k] as string);
        }
      }
    }
  }
}

function persistSync(db: DBShape) {
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), "utf8");
}

function persist(): Promise<void> {
  const db = _db!;
  _writeChain = _writeChain.then(() => {
    try {
      persistSync(db);
    } catch (e) {
      console.error("[db] persist failed:", e);
    }
  });
  _persistGlobal();
  return _writeChain;
}

// ---------- seeding ----------
function genId(): string {
  return crypto.randomUUID();
}

function seed(): DBShape {
  const now = new Date();
  const db: DBShape = { users: [], products: [], orders: [], reviews: [], coupons: [], addresses: [], notifications: [] };

  for (const u of SEED_USERS) {
    db.users.push({
      id: genId(),
      email: u.email,
      name: u.name,
      passwordHash: hashPassword(u.password),
      role: u.role,
      createdAt: now,
      updatedAt: now,
    });
  }

  const slugToId = new Map<string, string>();
  for (const p of SEED_PRODUCTS) {
    const id = genId();
    slugToId.set(p.slug, id);
    db.products.push({
      id,
      slug: p.slug,
      name: p.name,
      brand: p.brand,
      category: p.category,
      price: p.price,
      description: p.description,
      images: p.images,
      sizes: p.sizes,
      stock: p.stock,
      sizeStock: p.sizeStock ?? "{}",
      rating: p.rating,
      accent: p.accent,
      badge: p.badge,
      featured: p.featured,
      bestSeller: p.bestSeller,
      createdAt: now,
      updatedAt: now,
    });
  }

  for (const r of SEED_REVIEWS) {
    const productId = slugToId.get(r.slug);
    if (!productId) continue;
    db.reviews.push({
      id: genId(),
      productId,
      userId: null,
      authorName: r.authorName,
      rating: r.rating,
      comment: r.comment,
      createdAt: now,
    });
  }

  for (const c of SEED_COUPONS) {
    db.coupons.push({
      id: genId(),
      code: c.code,
      type: c.type,
      value: c.value,
      minSubtotal: c.minSubtotal,
      active: c.active,
      description: c.description,
      expiresAt: c.expiresAt,
      createdAt: now,
      updatedAt: now,
    });
  }

  return db;
}

// ---------- query engine ----------
type Cond = unknown;
type Record_ = Record<string, unknown>;

function toComparable(v: unknown): unknown {
  if (v instanceof Date) return v.getTime();
  return v;
}

function matchOp(recordVal: unknown, cond: Record<string, unknown>): boolean {
  const rv = toComparable(recordVal);
  for (const [op, target] of Object.entries(cond)) {
    const tv = target instanceof Date ? target.getTime() : target;
    switch (op) {
      case "equals":
        if (rv !== tv) return false;
        break;
      case "gte":
        if (!(typeof rv === "number" && typeof tv === "number" && rv >= tv))
          return false;
        break;
      case "lte":
        if (!(typeof rv === "number" && typeof tv === "number" && rv <= tv))
          return false;
        break;
      case "gt":
        if (!(typeof rv === "number" && typeof tv === "number" && rv > tv))
          return false;
        break;
      case "lt":
        if (!(typeof rv === "number" && typeof tv === "number" && rv < tv))
          return false;
        break;
      case "contains": {
        const s = String(rv ?? "").toLowerCase();
        if (!s.includes(String(tv).toLowerCase())) return false;
        break;
      }
      case "startsWith": {
        const s = String(rv ?? "").toLowerCase();
        if (!s.startsWith(String(tv).toLowerCase())) return false;
        break;
      }
      case "in": {
        if (!Array.isArray(tv) || !tv.includes(rv)) return false;
        break;
      }
      case "not":
        if (rv === tv) return false;
        break;
      default:
        // unknown operator — treat as equality fallback
        if (rv !== tv) return false;
    }
  }
  return true;
}

function matchWhere(rec: Record_, where: Cond): boolean {
  if (!where || typeof where !== "object") return true;
  const w = where as Record<string, unknown>;
  for (const [key, val] of Object.entries(w)) {
    if (key === "OR") {
      if (!Array.isArray(val)) return false;
      if (!val.some((sub) => matchWhere(rec, sub))) return false;
      continue;
    }
    if (key === "AND") {
      if (!Array.isArray(val)) return false;
      if (!val.every((sub) => matchWhere(rec, sub))) return false;
      continue;
    }
    if (key === "NOT") {
      if (matchWhere(rec, val)) return false;
      continue;
    }
    const rv = rec[key];
    if (val !== null && typeof val === "object" && !(val instanceof Date)) {
      if (!matchOp(rv, val as Record<string, unknown>)) return false;
    } else {
      const a = toComparable(rv);
      const b = val instanceof Date ? val.getTime() : val;
      if (a !== b) return false;
    }
  }
  return true;
}

function sortRecords(records: Record_[], orderBy?: Record<string, string>): Record_[] {
  if (!orderBy) return records;
  const [field, dir] = Object.entries(orderBy)[0];
  const sorted = [...records].sort((a, b) => {
    const av = toComparable(a[field]);
    const bv = toComparable(b[field]);
    if (av === bv) return 0;
    if (typeof av === "number" && typeof bv === "number") {
      return av - bv;
    }
    return String(av).localeCompare(String(bv));
  });
  return dir === "desc" ? sorted.reverse() : sorted;
}

function clone<T>(rec: T): T {
  return JSON.parse(
    JSON.stringify(rec, (_k, v) => (v instanceof Date ? v.toISOString() : v)),
  ) as T;
}

// Convert ISO strings back to Date for date fields on the cloned output so
// consumers see Date objects (matches Prisma behaviour).
function withDates<T extends Record_>(rec: T): T {
  const out: Record_ = { ...rec };
  for (const k of Object.keys(out)) {
    if (DATE_FIELDS.has(k) && typeof out[k] === "string") {
      out[k] = new Date(out[k] as string);
    }
  }
  return out as T;
}

// Apply include relations (only reviews on product supported here).
function applyInclude(
  rec: Record_,
  include?: Record<string, unknown>,
): Record_ {
  if (!include) return rec;
  const out: Record_ = { ...rec };
  if (include.reviews && typeof include.reviews === "object") {
    const opts = include.reviews as Record<string, unknown>;
    let related = (out.reviews as Record_[]) ?? load().reviews.filter((r) => r.productId === rec.id);
    related = load().reviews.filter((r) => r.productId === rec.id);
    related = sortRecords(related, opts.orderBy as Record<string, string>);
    if (opts.select) {
      const sel = opts.select as Record<string, boolean>;
      related = related.map((r) => {
        const proj: Record_ = {};
        for (const k of Object.keys(sel)) if (sel[k]) proj[k] = r[k];
        return proj;
      });
    }
    out.reviews = related;
  }
  return out;
}

// ---------- model factory ----------
interface ModelAPI {
  findUnique(args?: { where?: Record<string, unknown>; include?: Record<string, unknown> }): Promise<Record_ | null>;
  findFirst(args?: { where?: Cond; include?: Record<string, unknown> }): Promise<Record_ | null>;
  findMany(args?: { where?: Cond; orderBy?: Record<string, string>; include?: Record<string, unknown> }): Promise<Record_[]>;
  create(args: { data: Record_; include?: Record<string, unknown> }): Promise<Record_>;
  update(args: { where: Record<string, unknown>; data: Record_; include?: Record<string, unknown> }): Promise<Record_>;
  delete(args: { where: Record<string, unknown> }): Promise<Record_>;
  upsert(args: { where: Record<string, unknown>; update?: Record_; create: Record_ | (() => Record_); include?: Record<string, unknown> }): Promise<Record_>;
  count(args?: { where?: Cond }): Promise<number>;
  aggregate(args: { where?: Cond; _avg?: Record<string, true>; _sum?: Record<string, true> }): Promise<Record<string, unknown>>;
}

function createModel(collName: keyof DBShape): ModelAPI {
  function coll(): Record_[] {
    return load()[collName];
  }
  return {
    async findUnique(args) {
      const rec = coll().find((r) => matchWhere(r, args?.where ?? {}));
      if (!rec) return null;
      return withDates(applyInclude(clone(rec), args?.include));
    },
    async findFirst(args) {
      const rec = coll().find((r) => matchWhere(r, args?.where ?? {}));
      if (!rec) return null;
      return withDates(applyInclude(clone(rec), args?.include));
    },
    async findMany(args) {
      let records = coll().filter((r) => matchWhere(r, args?.where ?? {}));
      records = sortRecords(records, args?.orderBy);
      return records.map((r) =>
        withDates(applyInclude(clone(r), args?.include)),
      );
    },
    async create(args) {
      const now = new Date();
      const data = typeof args.data === "function" ? (args.data as () => Record_)() : args.data;
      const rec: Record_ = {
        id: genId(),
        createdAt: now,
        updatedAt: now,
        ...data,
      };
      // ensure date fields are Date objects
      for (const k of Object.keys(rec)) {
        if (DATE_FIELDS.has(k) && typeof rec[k] === "string") {
          rec[k] = new Date(rec[k] as string);
        }
      }
      coll().push(rec);
      await persist();
      return withDates(applyInclude(clone(rec), args.include));
    },
    async update(args) {
      const idx = coll().findIndex((r) => matchWhere(r, args.where));
      if (idx < 0) {
        const e = new Error("Record not found") as Error & { code?: string };
        e.code = "P2025";
        throw e;
      }
      const rec = coll()[idx];
      for (const [k, v] of Object.entries(args.data)) {
        if (v !== null && typeof v === "object" && !Array.isArray(v) && !(v instanceof Date)) {
          const ops = v as Record<string, number>;
          if ("decrement" in ops) {
            rec[k] = (Number(rec[k] ?? 0) - Number(ops.decrement)) as unknown;
          } else if ("increment" in ops) {
            rec[k] = (Number(rec[k] ?? 0) + Number(ops.increment)) as unknown;
          } else if ("set" in ops) {
            rec[k] = ops.set as unknown;
          } else {
            rec[k] = v as unknown;
          }
        } else {
          rec[k] = v as unknown;
        }
      }
      rec.updatedAt = new Date();
      await persist();
      return withDates(applyInclude(clone(rec), args.include));
    },
    async delete(args) {
      const idx = coll().findIndex((r) => matchWhere(r, args.where));
      if (idx < 0) {
        const e = new Error("Record not found") as Error & { code?: string };
        e.code = "P2025";
        throw e;
      }
      const [removed] = coll().splice(idx, 1);
      // cascade delete reviews for products
      if (collName === "products") {
        load().reviews = load().reviews.filter((r) => r.productId !== removed.id);
      }
      await persist();
      return withDates(clone(removed));
    },
    async upsert(args) {
      const existing = coll().find((r) => matchWhere(r, args.where));
      if (existing) {
        if (args.update && Object.keys(args.update).length > 0) {
          for (const [k, v] of Object.entries(args.update)) {
            existing[k] = v as unknown;
          }
          existing.updatedAt = new Date();
          await persist();
        }
        return withDates(applyInclude(clone(existing), args.include));
      }
      const createData =
        typeof args.create === "function" ? (args.create as () => Record_)() : args.create;
      return this.create({ data: createData, include: args.include });
    },
    async count(args) {
      return coll().filter((r) => matchWhere(r, args?.where ?? {})).length;
    },
    async aggregate(args) {
      const records = coll().filter((r) => matchWhere(r, args?.where ?? {}));
      const result: Record<string, unknown> = {};
      if (args._avg) {
        const avg: Record<string, number | null> = {};
        for (const k of Object.keys(args._avg)) {
          const vals = records.map((r) => Number(r[k])).filter((n) => Number.isFinite(n));
          avg[k] = vals.length ? vals.reduce((s, n) => s + n, 0) / vals.length : null;
        }
        result._avg = avg;
      }
      if (args._sum) {
        const sum: Record<string, number> = {};
        for (const k of Object.keys(args._sum)) {
          sum[k] = records.reduce((s, r) => s + Number(r[k] ?? 0), 0);
        }
        result._sum = sum;
      }
      return result;
    },
  };
}

export const db = {
  user: createModel("users"),
  product: createModel("products"),
  order: createModel("orders"),
  review: createModel("reviews"),
  coupon: createModel("coupons"),
  address: createModel("addresses"),
  notification: createModel("notifications"),
  async $disconnect() {
    /* no-op */
  },
};

// Keep the SeedProduct type referenced for downstream typing.
export type { SeedProduct };
