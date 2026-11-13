import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service.js';
import {
  CONFIGURATION_CATEGORIES,
  CONFIGURATION_CATEGORY_LABELS,
  DEFAULT_CONFIGURATION,
} from './configuration.constants.js';
import {
  CreateConfigurationItemDto,
  SearchConfigurationDto,
  UpdateConfigurationItemDto,
} from './configuration.dtos.js';

@Injectable()
export class ConfigurationService {
  constructor(private readonly prisma: DatabaseService) {}

  get categories() {
    return CONFIGURATION_CATEGORIES.map((value) => ({
      value,
      label: CONFIGURATION_CATEGORY_LABELS[value] ?? value,
    }));
  }

  /** Liste des items de configuration du laboratoire. */
  async findAll(laboratory_id: string, filters?: SearchConfigurationDto) {
    const where: any = { laboratory_id };
    if (filters?.category) where.category = filters.category;
    if (!filters?.include_inactive) where.is_active = true;

    if (filters?.search) {
      where.OR = [
        { label: { contains: filters.search } },
        { code: { contains: filters.search } },
      ];
    }

    const items = await this.prisma.configuration_items.findMany({
      where,
      orderBy: [
        { category: 'asc' },
        { sort_order: 'asc' },
        { label: 'asc' },
      ],
    });

    return items;
  }

  /**
   * Catalogue regroupé consommé par les formulaires (plus aucune liste figée
   * côté interface).
   */
  async options(laboratory_id: string) {
    const items = await this.findAll(laboratory_id);

    const grouped: Record<string, any[]> = {};
    for (const category of CONFIGURATION_CATEGORIES) grouped[category] = [];

    for (const item of items as any[]) {
      if (!grouped[item.category]) grouped[item.category] = [];
      grouped[item.category].push(item);
    }

    return {
      categories: this.categories,
      items: grouped,
    };
  }

  async findById(id: string, laboratory_id: string) {
    const item = await this.prisma.configuration_items.findFirst({ where: { id, laboratory_id } });
    if (!item) throw new NotFoundException("Item de configuration introuvable");
    return item;
  }

  async create(laboratory_id: string, dto: CreateConfigurationItemDto) {
    const code = dto.code?.trim();
    if (!code) throw new BadRequestException('Le code est requis');
    if (!dto.label?.trim()) throw new BadRequestException('Le libellé est requis');

    const existing = await this.prisma.configuration_items.findFirst({
      where: { laboratory_id, category: dto.category, code },
    });
    if (existing) {
      throw new BadRequestException('Cet item existe déjà dans cette catégorie');
    }

    return this.prisma.configuration_items.create({
      data: {
        laboratory_id,
        category: dto.category,
        code,
        label: dto.label.trim(),
        description: dto.description ?? null,
        unit: dto.unit ?? null,
        price: dto.price ?? 0,
        tax_rate: dto.tax_rate ?? 0,
        sort_order: dto.sort_order ?? 0,
        is_active: dto.is_active ?? true,
        is_default: dto.is_default ?? false,
      },
    });
  }

  async update(id: string, laboratory_id: string, dto: UpdateConfigurationItemDto) {
    const existing = await this.findById(id, laboratory_id);

    if (dto.label !== undefined && !dto.label.trim()) {
      throw new BadRequestException('Le libellé ne peut pas être vide');
    }

    const item = await this.prisma.configuration_items.update({
      where: { id: existing.id },
      data: {
        ...(dto.label !== undefined ? { label: dto.label.trim() } : {}),
        ...(dto.description !== undefined ? { description: dto.description } : {}),
        ...(dto.unit !== undefined ? { unit: dto.unit } : {}),
        ...(dto.price !== undefined ? { price: dto.price } : {}),
        ...(dto.tax_rate !== undefined ? { tax_rate: dto.tax_rate } : {}),
        ...(dto.sort_order !== undefined ? { sort_order: dto.sort_order } : {}),
        ...(dto.is_active !== undefined ? { is_active: dto.is_active } : {}),
        ...(dto.is_default !== undefined ? { is_default: dto.is_default } : {}),
      },
    });

    return item;
  }

  async remove(id: string, laboratory_id: string) {
    const existing = await this.findById(id, laboratory_id);
    // Suppression logique : les items servent de référence à l'historique.
    await this.prisma.configuration_items.update({
      where: { id: existing.id },
      data: { is_active: false },
    });
    return { success: true };
  }

  /**
   * (Re)crée les items manquants d'une catégorie. Ne touche jamais aux
   * personnalisations existantes : seule la complétion est faite.
   */
  async seed(laboratory_id: string, categories?: string[]) {
    const targets = (categories?.length ? categories : [...CONFIGURATION_CATEGORIES]).filter(
      (c) => (CONFIGURATION_CATEGORIES as readonly string[]).includes(c),
    );

    const created: any[] = [];
    for (const category of targets) {
      const defaults = DEFAULT_CONFIGURATION[category] ?? [];
      for (const def of defaults) {
        const existing = await this.prisma.configuration_items.findFirst({
          where: { laboratory_id, category, code: def.code },
        });
        if (existing) continue;
        const item = await this.prisma.configuration_items.create({
          data: {
            laboratory_id,
            category,
            code: def.code,
            label: def.label,
            description: def.description ?? null,
            price: def.price ?? 0,
            tax_rate: 0,
            sort_order: def.sort_order,
            is_active: true,
            is_default: true,
          },
        });
        created.push(item);
      }
    }

    return { created: created.length, items: created };
  }
}