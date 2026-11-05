import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class InventoryService {
  constructor(private readonly prisma: PrismaService) {}

  async createProduct(laboratory_id: string, data: { sku: string; name: string; category?: string; unit?: string; price?: number; min_stock?: number }) {
    return this.prisma.products.create({ data: { laboratory_id, ...data, min_stock: data.min_stock ?? 0 } });
  }

  async updateProduct(id: string, laboratory_id: string, data: Partial<{ sku: string; name: string; category: string; unit: string; price: number; min_stock: number; is_active: boolean }>) {
    return this.prisma.products.update({ where: { id }, data });
  }

  async deleteProduct(id: string, laboratory_id: string) {
    return this.prisma.products.update({ where: { id }, data: { is_active: false } });
  }

  async findAllProducts(laboratory_id: string, search?: string) {
    return this.prisma.products.findMany({
      where: { laboratory_id, is_active: true, OR: search ? [{ name: { contains: search } }, { sku: { contains: search } }] : undefined },
    });
  }

  async findById(id: string, laboratory_id: string) {
    return this.prisma.products.findUnique({ where: { id } });
  }

  async createStockLot(laboratory_id: string, data: { product_id: string; batch_number: string; quantity: number; expiry_date?: Date }) {
    return this.prisma.$transaction(async (tx: any) => {
      const lot = await tx.stock_lots.create({ data: { laboratory_id, ...data } });
      await tx.products.update({ where: { id: data.product_id }, data: { current_stock: { increment: data.quantity } } });
      return lot;
    });
  }

  async findAllStockLots(laboratory_id: string, product_id?: string) {
    return this.prisma.stock_lots.findMany({ where: { laboratory_id, product_id } });
  }

  async recordMovement(laboratory_id: string, data: { product_id: string; stock_lot_id?: string; movement_type: string; quantity: number; reference?: string; notes?: string; created_by_id: string }) {
    return this.prisma.$transaction(async (tx: any) => {
      const qty = data.movement_type === 'out' ? -Math.abs(data.quantity) : Math.abs(data.quantity);
      const movement = await tx.stock_movements.create({ data: { laboratory_id, product_id: data.product_id, stock_lot_id: data.stock_lot_id, movement_type: data.movement_type, quantity: qty, reference: data.reference, notes: data.notes, created_by_id: data.created_by_id } });
      await tx.products.update({ where: { id: data.product_id }, data: { current_stock: { increment: qty } } });
      if (data.stock_lot_id) {
        await tx.stock_lots.update({ where: { id: data.stock_lot_id }, data: { quantity: { increment: qty } } });
      }
      return movement;
    });
  }

  async getExpiringLots(laboratory_id: string, days = 7) {
    const future = new Date();
    future.setDate(future.getDate() + days);
    return this.prisma.stock_lots.findMany({
      where: { laboratory_id, expiry_date: { lte: future, gte: new Date() } },
      include: { product: true },
    });
  }

  async getLowStockAlerts(laboratory_id: string) {
    return this.prisma.products.findMany({
      where: { laboratory_id, is_active: true, current_stock: { lte: this.prisma.raw('min_stock') } },
    });
  }
}