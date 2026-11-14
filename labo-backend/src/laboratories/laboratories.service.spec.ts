import { ConflictException } from '@nestjs/common';
import bcrypt from 'bcryptjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LaboratoriesService } from './laboratories.service.js';

function makeService() {
  const laboratories = {
    findFirst: vi.fn().mockResolvedValue(null),
    create: vi.fn().mockImplementation(async ({ data }: any) => ({ id: 'lab-1', ...data })),
  };
  const users = {
    count: vi.fn().mockResolvedValue(0),
    create: vi.fn().mockImplementation(async ({ data }: any) => ({ id: 'user-1', ...data })),
  };
  const prisma: any = { laboratories, users };
  const cache: any = {
    get: vi.fn().mockResolvedValue(null),
    set: vi.fn().mockResolvedValue(undefined),
    delByPattern: vi.fn().mockResolvedValue(undefined),
  };
  const metricUtil: any = {
    generateUserMatricule: vi.fn().mockResolvedValue('LAB/ADM/2026/0001'),
  };
  return { service: new LaboratoriesService(prisma, cache, metricUtil), laboratories, users, cache, metricUtil };
}

describe('LaboratoriesService.create', () => {
  let ctx: ReturnType<typeof makeService>;

  beforeEach(() => {
    ctx = makeService();
  });

  it('crée le laboratoire et hash le mot de passe du responsable', async () => {
    const result: any = await ctx.service.create(
      { name: 'Labo Test', admin: { email: 'Responsable@Labo.cd', password: 'MotDePasse123' } },
      { roles: ['super_admin'] },
    );

    expect(result.id).toBe('lab-1');
    expect(result.admin).toBeDefined();

    const created = ctx.users.create.mock.calls[0][0].data;
    expect(created.email).toBe('responsable@labo.cd');
    expect(created.password_hash).not.toBe('MotDePasse123');
    expect(await bcrypt.compare('MotDePasse123', created.password_hash)).toBe(true);
    expect(created.matricule).toBe('LAB/ADM/2026/0001');

    expect(result.admin.password_hash).toBeUndefined();
  });

  it('fonctionne sans responsable', async () => {
    const result: any = await ctx.service.create({ name: 'Labo Sans Admin' }, { roles: ['super_admin'] });

    expect(result.id).toBe('lab-1');
    expect(result.admin).toBeNull();
    expect(ctx.users.create).not.toHaveBeenCalled();
  });

  it('refuse un email de responsable déjà utilisé avant de créer le laboratoire', async () => {
    ctx.users.count.mockResolvedValue(1);

    await expect(
      ctx.service.create(
        { name: 'Labo Doublon', admin: { email: 'responsable@labo.cd', password: 'MotDePasse123' } },
        { roles: ['super_admin'] },
      ),
    ).rejects.toBeInstanceOf(ConflictException);

    expect(ctx.laboratories.create).not.toHaveBeenCalled();
  });
});