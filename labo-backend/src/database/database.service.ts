import * as dotenv from 'dotenv';
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

function applyFilters(q: any, where: any): any {
  if (!where) return q;
  for (const [k, v] of Object.entries(where)) {
    if (k === 'OR' && Array.isArray(v)) {
      const parts = v.map((cond: any) => Object.entries(cond).map(([ck, cv]: any) => {
        if (cv && typeof cv === 'object' && cv.contains !== undefined) return `${ck}.ilike.%${cv.contains}%`;
        return `${ck}.eq.${cv}`;
      }).join(',')).join(',');
      if (parts) q = q.or(parts);
      continue;
    }
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      const o: any = v;
      if (o.equals !== undefined) q = q.eq(k, o.equals);
      if (o.in) q = q.in(k, o.in);
      if (o.gte !== undefined) q = q.gte(k, o.gte);
      if (o.lte !== undefined) q = q.lte(k, o.lte);
      if (o.gt !== undefined) q = q.gt(k, o.gt);
      if (o.lt !== undefined) q = q.lt(k, o.lt);
      if (o.contains !== undefined) q = q.ilike(k, `%${o.contains}%`);
      if (o.increment !== undefined) { /* handled in update wrapper */ }
    } else if (v === null) {
      // Skip null filters: .is(k, null) generates invalid SQL in this supabase-js version
      continue;
    } else if (v !== undefined) {
      q = q.eq(k, v);
    }
  }
  return q;
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
      return data ?? [];
    },
    findUnique: async (args: any) => {
      let q: any = from().select(args && args.select ? Object.keys(args.select).join(',') : '*');
      q = applyFilters(q, args && args.where);
      const { data, error } = await q.maybeSingle();
      if (error) fail(error);
      return data;
    },
    findFirst: async (args?: any) => {
      const r = await (tableProxy(table) as any).findMany({ ...args, take: 1 });
      return r[0] ?? null;
    },
    create: async (args: any) => {
      const { data, error } = await from().insert(args.data).select().single();
      if (error) fail(error);
      return data;
    },
    createMany: async (args: any) => {
      const { data, error } = await from().insert(args.data).select();
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
      const { data, error } = await from().upsert(args.create ?? args.data, { onConflict: args.where ? Object.keys(args.where).join(',') : undefined }).select().single();
      if (error) fail(error);
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