import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service.js';

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: DatabaseService) {}

  async getDashboard(laboratory_id: string, dateFrom?: string, dateTo?: string) {
    const where: any = { laboratory_id, deleted_at: null };
    if (dateFrom) where.created_at = { gte: new Date(dateFrom) };
    if (dateTo) where.created_at = { ...where.created_at, lte: new Date(dateTo) };

    const [patients, visits, orders, specimens, results, pending, invoices, payments, activeProducts, expiringLots] = await Promise.all([
      this.prisma.patients.count({ where }),
      this.prisma.visits.count({ where: { laboratory_id } }),
      this.prisma.orders.count({ where: { laboratory_id } }),
      this.prisma.specimens.count({ where: { laboratory_id } }),
      this.prisma.results.count({ where: { laboratory_id } }),
      this.prisma.results.count({ where: { laboratory_id, status: 'preliminary' } }),
      this.prisma.invoices.aggregate({ where: { laboratory_id }, _sum: { total: true } }),
      this.prisma.payments.aggregate({ where: { laboratory_id, status: 'completed' }, _sum: { amount: true } }),
      this.prisma.products.findMany({ where: { laboratory_id, is_active: true } }),
      this.prisma.stock_lots.findMany({ where: { laboratory_id, expiry_date: { lte: new Date(Date.now() + 7 * 86400000).toISOString() } } }),
    ]);

    const lowStock = (activeProducts ?? []).filter((p: any) => (p.current_stock ?? 0) <= (p.min_stock ?? 0)).length;
    const expiring = Array.isArray(expiringLots) ? expiringLots.length : (expiringLots ?? 0);

    return {
      patients, visits, orders, specimens, results,
      pending_validations: pending,
      invoices_total: Number(invoices?._sum?.total || 0),
      payments_collected: Number(payments?._sum?.amount || 0),
      low_stock_alerts: lowStock,
      expiring_lots: expiring,
    };
  }

  async getAuditLogs(laboratory_id: string, page = 1, limit = 20) {
    return this.prisma.audit_logs.findMany({
      where: { laboratory_id },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { created_at: 'desc' },
    });
  }
}
