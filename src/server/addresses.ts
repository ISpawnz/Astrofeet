import "server-only";
import { z } from "zod";
import { db } from "@/server/db";
import { fail, required, str } from "@/server/http";

const fields = {
  label: required("Dê um apelido ao endereço.", 40),
  recipient: str(120).min(2, "Informe o nome de quem recebe."),
  cep: z
    .string()
    .transform((v) => v.replace(/\D/g, ""))
    .pipe(z.string().length(8, "CEP inválido. Use 8 dígitos.")),
  street: required("Informe a rua.", 120),
  number: required("Informe o número.", 20),
  complement: str(120),
  district: str(120),
  city: required("Informe a cidade.", 120),
  state: z.string().trim().toUpperCase().length(2, "UF inválida."),
  isDefault: z.boolean(),
};

export const AddressInput = z.object({
  ...fields,
  complement: fields.complement.default(""),
  district: fields.district.default(""),
  isDefault: fields.isDefault.default(false),
});
/** Edição: tudo opcional e sem valores padrão (campo ausente = não mexe). */
export const AddressPatch = z.object(fields).partial();

export async function ownAddress(userId: string, id: string) {
  const a = await db.address.findUnique({ where: { id } });
  return a && a.userId === userId ? a : fail("Endereço não encontrado.", 404);
}

/** Só um endereço padrão por usuário: ao marcar um, desmarca os outros. */
export async function clearDefault(userId: string, exceptId?: string) {
  for (const a of await db.address.findMany({ where: { userId, isDefault: true } }))
    if (a.id !== exceptId) await db.address.update({ where: { id: a.id }, data: { isDefault: false } });
}
