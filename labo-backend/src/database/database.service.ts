import * as dotenv from 'dotenv';
import { randomUUID } from 'node:crypto';
dotenv.config();
import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { createClient } from '@supabase/supabase-js';
const supabase: any = createClient(process.env.SUPABASE_URL || '', process.env.SUPABASE_SERVICE_ROLE_KEY || '', { auth: { persistSession: false } });

export function fail(error: any): never {
  const err = error || {};
  const raw = typeof error === 'string' ? error : err.message || err.details || err.hint;
  const message = typeof raw === 'string' && raw.trim() ? raw : 'Erreur base de données';
  switch (err.code) {
    case '23505':
      throw new ConflictException(message);
    case '23503':
      throw new ConflictException(`Référence invalide : ${message}`);
    case '23502':
      throw new BadRequestException(`Champ requis manquant : ${message}`);
    case '22P02':
      throw new BadRequestException(`Données invalides : ${message}`);
    case '42P01':
      throw new NotFoundException(`Table introuvable : ${message}`);
    case '42501':
      throw new ForbiddenException(`Permission refusée : ${message}`);
    case 'PGRST116':
      throw new NotFoundException(message);
    default:
      if (err.status === 401 || err.status === 403) throw new ForbiddenException(message);
      if (err.status === 404) throw new NotFoundException(message);
      break;
  }
  const wrapped = new Error(message) as Error & { code?: string; details?: any };
  if (err.code) wrapped.code = err.code;
  if (err.details) wrapped.details = err.details;
  throw wrapped;
}

function expandCompoundKey(where: any): any {
  if (!where || typeof where !== 'object') return where;
  const out: any = { ...where };
  const operators = ['equals', 'not', 'in', 'gt', 'gte', 'lt', 'lte', 'contains', 'startsWith', 'endsWith', 'mode', 'increment'];
  for (const [k, v] of Object.entries(out)) {
    if (!v || typeof v !== 'object' || Array.isArray(v) || v instanceof Date) continue;
    const fields = Object.keys(v);
    // Clé composée Prisma (ex: laboratory_id_entity_type_year) : on éclate
    // ses champs en filtres d'égalité.
    if (fields.length && !fields.some((f) => operators.includes(f))) {
      delete out[k];
      Object.assign(out, v);
    }
  }
  return out;
}

function encodeFilterValue(ck: string, cv: any): string {
  if (cv && typeof cv === 'object' && cv.contains !== undefined) return `${ck}.ilike.%${cv.contains}%`;
  if (cv instanceof Date) return `${ck}.eq.${cv.toISOString()}`;
  return `${ck}.eq.${cv}`;
}

function applyFilters(q: any, where: any): any {
  if (!where) return q;
  for (const [k, v] of Object.entries(expandCompoundKey(where))) {
    if (k === 'OR' && Array.isArray(v)) {
      // Chaque élément de OR est un groupe : plusieurs conditions dans un même
      // objet doivent être assemblées en ET (and(...)), sinon une recherche
      // « nom + prénom + date » correspondrait au seul prénom.
      const parts = v.map((cond: any) => {
        const entries = Object.entries(cond).filter(([, cv]: any) => cv !== null && cv !== undefined);
        if (entries.length === 0) return '';
        const encoded = entries.map(([ck, cv]: any) => encodeFilterValue(ck, cv)).join(',');
        return entries.length === 1 ? encoded : `and(${encoded})`;
      }).filter(Boolean);
      const or = parts.join(',');
      if (or) q = q.or(or);
      continue;
    }
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      const o: any = v;
      if (o.equals !== undefined) q = q.eq(k, o.equals instanceof Date ? o.equals.toISOString() : o.equals);
      if (o.in) q = q.in(k, o.in);
      if (o.gte !== undefined) q = q.gte(k, o.gte instanceof Date ? o.gte.toISOString() : o.gte);
      if (o.lte !== undefined) q = q.lte(k, o.lte instanceof Date ? o.lte.toISOString() : o.lte);
      if (o.gt !== undefined) q = q.gt(k, o.gt instanceof Date ? o.gt.toISOString() : o.gt);
      if (o.lt !== undefined) q = q.lt(k, o.lt instanceof Date ? o.lt.toISOString() : o.lt);
      if (o.contains !== undefined) q = q.ilike(k, `%${o.contains}%`);
      if (o.increment !== undefined) { /* handled in update wrapper */ }
    } else if (v instanceof Date) {
      // Évite la sérialisation "Thu Nov 13 2026 ... GMT+0200" qui casse les filtres.
      q = q.eq(k, v.toISOString());
    } else if (v === null) {
      // Skip null filters: .is(k, null) generates invalid SQL in this supabase-js version
      continue;
    } else if (v !== undefined) {
      q = q.eq(k, v);
    }
  }
  return q;
}

/**
 * Insère une ligne en complétant automatiquement les colonnes de date
 * (NOT NULL sans DEFAULT dans certaines bases) et l'`id` si absent.
 */
async function insertRow(client: any, row: any): Promise<any> {
  const payload: any = { ...row };
  if (payload.id === undefined || payload.id === null) payload.id = randomUUID();
  for (let attempt = 0; attempt < 3; attempt++) {
    const res = await client.insert(payload).select().single();
    if (!res.error) return res.data;
    const msg = res.error.message || '';
    const col = msg.match(/column "([^"]+)"[\s\S]*violates not-null/);
    if (!col || payload[col[1]] !== undefined || !/_date$|_at$/.test(col[1])) fail(res.error);
    payload[col[1]] = new Date().toISOString();
  }
  return fail(new Error("Impossible d'enregistrer la ligne"));
}

const singular = (t: string) => t.replace(/ies$/, 'y').replace(/s$/, '');
const plural = (t: string) => (t.endsWith('s') ? t : t.endsWith('y') ? `${t.slice(0, -1)}ies` : `${t}s`);

/**
 * Résout les relations Prisma `include` (le client Supabase ne les gère pas) :
 * relation "many" (ex: invoice_items) => table = clé, FK = <parent au singulier>_id ;
 * relation "one" (ex: patient) => table = clé au pluriel, id = <clé>_id du parent.
 */
async function attachIncludes(rows: any[], table: string, include: any): Promise<any[]> {
  if (!rows || !rows.length || !include) return rows;
  for (const [rel, opts] of Object.entries<any>(include)) {
    if (!opts) continue;
    const nested = opts && typeof opts === 'object' ? opts.include : undefined;
    try {
      if (rel.endsWith('s')) {
        const fk = `${singular(table)}_id`;
        const ids = rows.map((r) => r.id).filter(Boolean);
        if (!ids.length) continue;
        const { data, error } = await (supabase as any).from(rel).select('*').in(fk, ids);
        if (error) continue;
        for (const row of rows) {
          row[rel] = (data ?? []).filter((c: any) => c[fk] === row.id);
        }
        if (nested) {
          for (const row of rows) await attachIncludes(row[rel] ?? [], rel, nested);
        }
      } else {
        const fk = `${rel}_id`;
        const { data, error } = await (supabase as any).from(plural(rel)).select('*');
        if (error) continue;
        for (const row of rows) {
          row[rel] = (data ?? []).find((c: any) => c.id === row[fk]) ?? null;
          if (nested && row[rel]) await attachIncludes([row[rel]], plural(rel), nested);
        }
      }
    } catch {
      // Relation indisponible : on laisse la propriété vide plutôt que d'échouer.
    }
  }
  return rows;
}

function tableProxy(table: string) {
  const from = () => (supabase as any).from(table);
  return {
    findMany: async (args?: any) => {
      const select = args && args.select ? Object.keys(args.select).join(',') : '*';
      let q: any = from().select(select);
      q = applyFilters(q, args && args.where);
      if (args && args.orderBy) {
        for (const [k, v] of Object.entries(args.orderBy)) q = q.order(k, { ascending: v !== 'desc' });
      }
      if (args && args.skip) q = q.range(args.skip, args.skip + (args.take ?? 50) - 1);
      else if (args && args.take) q = q.limit(args.take);
      const { data, error } = await q;
      if (error) fail(error);
      return attachIncludes(data ?? [], table, args && args.include);
    },
    findUnique: async (args: any) => {
      let q: any = from().select(args && args.select ? Object.keys(args.select).join(',') : '*');
      q = applyFilters(q, args && args.where);
      const { data, error } = await q.maybeSingle();
      if (error) fail(error);
      if (!data) return data;
      const [row] = await attachIncludes([data], table, args && args.include);
      return row;
    },
    findFirst: async (args?: any) => {
      const r = await (tableProxy(table) as any).findMany({ ...args, take: 1 });
      return r[0] ?? null;
    },
    create: async (args: any) => {
      const row: any = { ...(args.data || {}) };
      // Relations imbriquées (ex: invoice_items: { create: [...] }) : insertion
      // du parent puis des enfants avec la clé étrangère correspondante.
      const children: { table: string; fk: string; rows: any[] }[] = [];
      for (const [k, v] of Object.entries(row)) {
        if (!v || typeof v !== 'object' || Array.isArray(v) || v instanceof Date) continue;
        const rel: any = v;
        let list: any[] | null = null;
        if (Array.isArray(rel.create)) list = rel.create;
        else if (rel.create) list = [rel.create];
        else if (rel.createMany && Array.isArray(rel.createMany.data)) list = rel.createMany.data;
        if (!list) continue;
        delete row[k];
        children.push({ table: k, fk: `${k.replace(/_items$/, '')}_id`, rows: list });
      }
      const created = await insertRow(from(), row);
      for (const child of children) {
        if (!child.rows.length) continue;
        for (const r of child.rows) {
          await insertRow((supabase as any).from(child.table), {
            ...r,
            [child.fk]: (created as any).id,
          });
        }
      }
      return created && args.include ? (await attachIncludes([created], table, args.include))[0] : created;
    },
    createMany: async (args: any) => {
      const rows: any[] = (args.data || []).map((r: any) => (r && (r.id === undefined || r.id === null) ? { ...r, id: randomUUID() } : r));
      const { data, error } = await from().insert(rows).select();
      if (error) fail(error);
      return { count: (data ?? []).length };
    },
    update: async (args: any) => {
      const payload: any = { ...(args.data || {}) };
      for (const [k, v] of Object.entries(payload)) {
        if (v && typeof v === 'object' && (v as any).increment !== undefined) {
          const existing = await (tableProxy(table) as any).findUnique({ where: args.where });
          payload[k] = Number((existing && existing[k]) ?? 0) + Number((v as any).increment);
        }
      }
      let q: any = from().update(payload);
      q = applyFilters(q, args && args.where);
      const { data, error } = await q.select().maybeSingle();
      if (error) fail(error);
      return data;
    },
    updateMany: async (args: any) => {
      let q: any = from().update(args.data);
      q = applyFilters(q, args && args.where);
      const { data, error } = await q.select();
      if (error) fail(error);
      return { count: (data ?? []).length };
    },
    upsert: async (args: any) => {
      // Si la ligne existe déjà, un upsert PostgREST réécrirait les colonnes de
      // `create` (ex: last_number remis à 1) : on applique uniquement `update`.
      const existing = await (tableProxy(table) as any).findUnique({ where: args.where });
      if (existing && args.update) {
        const patch: any = { ...args.update };
        for (const [k, v] of Object.entries(patch)) {
          if (v && typeof v === 'object' && (v as any).increment !== undefined) {
            patch[k] = Number((existing as any)[k] ?? 0) + Number((v as any).increment);
          }
        }
        const { data: updated, error: updateError } = await from()
          .update(patch)
          .eq('id', (existing as any).id)
          .select()
          .maybeSingle();
        if (updateError) fail(updateError);
        return updated ?? existing;
      }
      let conflict: string | undefined;
      if (args.where) {
        const cols: string[] = [];
        for (const [k, v] of Object.entries(args.where)) {
          if (v && typeof v === 'object' && !Array.isArray(v)) cols.push(...Object.keys(v as any));
          else cols.push(k);
        }
        conflict = cols.join(',');
      }
      const payload: any = { ...(args.create ?? args.data ?? {}) };
      if (payload.id === undefined || payload.id === null) payload.id = randomUUID();
      let res = await from()
        .upsert(payload, conflict ? { onConflict: conflict } : undefined)
        .select()
        .maybeSingle();
      if (res.error && /column "(created_at|updated_at)"/.test(res.error.message || '') && /null value|not-null/i.test(res.error.message)) {
        const now = new Date().toISOString();
        if (/column "created_at"/.test(res.error.message)) payload.created_at = now;
        if (/column "updated_at"/.test(res.error.message)) payload.updated_at = now;
        res = await from()
          .upsert(payload, conflict ? { onConflict: conflict } : undefined)
          .select()
          .maybeSingle();
      }
      if (res.error) fail(res.error);
      const data = res.data;
      if (args.update && data) {
        const patch: any = { ...args.update };
        let touched = false;
        for (const [k, v] of Object.entries(patch)) {
          if (v && typeof v === 'object' && (v as any).increment !== undefined) {
            patch[k] = Number((data as any)[k] ?? 0) + Number((v as any).increment);
            touched = true;
          }
        }
        if (touched) {
          const { data: updated, error: updateError } = await from()
            .update(patch)
            .eq('id', (data as any).id)
            .select()
            .maybeSingle();
          if (updateError) fail(updateError);
          return updated ?? data;
        }
      }
      return data;
    },
    count: async (args?: any) => {
      let q: any = from().select('*', { count: 'exact', head: true });
      q = applyFilters(q, args && args.where);
      const { count, error } = await q;
      if (error) fail(error);
      return count ?? 0;
    },
    aggregate: async (args?: any) => {
      const rows = await (tableProxy(table) as any).findMany({ where: args && args.where });
      const result: any = {};
      if (args && args._sum) {
        result._sum = {};
        for (const k of Object.keys(args._sum)) {
          result._sum[k] = rows.reduce((acc: number, r: any) => acc + Number(r[k] ?? 0), 0);
        }
      }
      if (args && args._count) result._count = rows.length;
      if (args && args._avg) {
        result._avg = {};
        for (const k of Object.keys(args._avg)) result._avg[k] = rows.length ? rows.reduce((a: number, r: any) => a + Number(r[k] ?? 0), 0) / rows.length : null;
      }
      return result;
    },
    groupBy: async (args: any) => {
      const rows = await (tableProxy(table) as any).findMany({ where: args && args.where });
      const fields: string[] = (args && args.by) || [];
      const groups = new Map<string, any>();
      for (const row of rows) {
        const key = JSON.stringify(fields.map((f) => (row as any)[f] ?? null));
        const entry = groups.get(key) || { _count: 0 };
        for (const f of fields) entry[f] = (row as any)[f] ?? null;
        entry._count += 1;
        groups.set(key, entry);
      }
      return Array.from(groups.values());
    },
    delete: async (args: any) => {
      let q: any = from().delete();
      q = applyFilters(q, args && args.where);
      const { data, error } = await q.select().maybeSingle();
      if (error) fail(error);
      return data;
    },
    deleteMany: async (args?: any) => {
      let q: any = from().delete();
      q = applyFilters(q, args && args.where);
      const { data, error } = await q.select();
      if (error) fail(error);
      return { count: (data ?? []).length };
    },
  };
}

@Injectable()
export class DatabaseService {
  [key: string]: any;
  private proxy: any;

  constructor() {
    this.proxy = new Proxy({} as any, {
      get: (_target, prop: string) => {
        if (prop === '$transaction') {
          return async (fn: any) => fn(this.proxy);
        }
        if (prop === '$connect' || prop === '$disconnect') {
          return async () => undefined;
        }
        if (typeof prop === 'symbol') return undefined;
        return tableProxy(prop);
      },
    });
    return new Proxy(this, {
      get: (target, prop: any) => {
        if (prop === 'getPendingSync' || prop === 'markAsSynced' || prop === 'createLocalOnly' || prop === 'getLaboratoryStats' || prop === 'backupData' || prop === 'restoreData' || prop === 'proxy') {
          return (target as any)[prop];
        }
        if (prop === '$transaction') {
          return async (fn: any) => fn(target.proxy);
        }
        if (prop === '$connect' || prop === '$disconnect') {
          return async () => undefined;
        }
        if (typeof prop === 'symbol') return undefined;
        const own = (target as any)[prop];
        if (typeof own === 'function') return own.bind(target);
        return tableProxy(prop);
      },
    });
  }

  async getPendingSync(table: string, limit = 50) {
    const { data, error } = await (supabase as any).from(table).select('*').eq('synced', false).limit(limit);
    if (error) fail(error);
    return data ?? [];
  }

  async markAsSynced(table: string, id: any) {
    const { error } = await (supabase as any).from(table).update({ synced: true }).eq('id', id);
    if (error) fail(error);
  }

  async createLocalOnly(table: string, data: any) {
    const { data: row, error } = await (supabase as any).from(table).insert(data).select().single();
    if (error) fail(error);
    return row;
  }

  async getLaboratoryStats(laboratoryId: string) {
    return { laboratoryId };
  }

  async backupData(laboratoryId: string, tables: string[]) {
    const backup: Record<string, any> = {};
    for (const t of tables) {
      const { data } = await (supabase as any).from(t).select('*').eq('laboratory_id', laboratoryId);
      backup[t] = data ?? [];
    }
    return backup;
  }

  async restoreData(laboratoryId: string, backup: any) {
    for (const t of Object.keys(backup)) {
      await (supabase as any).from(t).insert(backup[t]);
    }
    return true;
  }

  async rpc(functionName: string, params: any = {}): Promise<any> {
    const { data, error } = await (supabase as any).rpc(functionName, params);
    if (error) fail(error);
    return data;
  }
}