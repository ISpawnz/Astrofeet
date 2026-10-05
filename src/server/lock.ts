import "server-only";

// Mutex assíncrono por chave. O banco é um único processo Node, mas as rotas
// têm `await` entre "ler" e "gravar" — sem trava, duas requisições simultâneas
// podiam vender o mesmo estoque duas vezes ou resgatar os mesmos pontos 2x.

const g = globalThis as unknown as { __astrofeet_locks?: Map<string, Promise<unknown>> };
const tails = (g.__astrofeet_locks ??= new Map());

export async function withLock<T>(key: string, fn: () => Promise<T>): Promise<T> {
  const prev = tails.get(key) ?? Promise.resolve();
  let release!: () => void;
  const gate = new Promise<void>((r) => (release = r));
  const tail = prev.then(() => gate);
  tails.set(key, tail);
  await prev.catch(() => undefined);
  try {
    return await fn();
  } finally {
    release();
    if (tails.get(key) === tail) tails.delete(key);
  }
}
