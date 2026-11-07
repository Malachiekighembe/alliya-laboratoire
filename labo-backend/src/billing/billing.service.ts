import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DatabaseService } from '../database/database.service.js';
import { MetricUtil } from '../common/utils/metric.util.js';
import {
  CreateInvoiceDto,
  CreateInvoiceItemDto,
  UpdateInvoiceDto,
  CreatePaymentDto,
  IssueInvoiceDto,
  SearchBillingDto,
} from './billing.dtos.js';
import {
  InvoiceView,
  PaymentView,
  ReceiptView,
  BillingStatistics,
  CashJournalEntry,
} from './billing.interfaces.js';
import { PaginationDto } from '../common/dto/pagination.dto.js';

@Injectable()
export class BillingService {
  constructor(
    private readonly prisma: DatabaseService,
    private readonly metricUtil: MetricUtil,
  ) {}

  private toNumber(value: unknown): number {
    if (value === null || value === undefined) {
      return 0;
    }
    if (typeof value === 'number') {
      return value;
    }
    if (typeof value === 'object' && 'toNumber' in value) {
      return (value as { toNumber: () => number }).toNumber();
    }
    return Number(value);
  }

  private async recomputeTotals(invoiceId: string, laboratoryId: string): Promise<void> {
    const items = await this.prisma.invoice_items.findMany({
      where: { invoice_id: invoiceId, laboratory_id: laboratoryId },
    });
    const subtotal = items.reduce((sum: number, item: { total_price: unknown }) => sum + this.toNumber(item.total_price), 0);
    const invoice = await this.prisma.invoices.findUnique({ where: { id: invoiceId } });
    if (!invoice) {
      return;
    }
    await this.prisma.invoices.update({
      where: { id: invoiceId },
      data: { subtotal, total: subtotal + this.toNumber(invoice.tax) },
    });
  }

  private async recomputeStatus(invoiceId: string, laboratoryId: string): Promise<void> {
    const invoice = await this.prisma.invoices.findUnique({ where: { id: invoiceId } });
    if (!invoice || invoice.laboratory_id !== laboratoryId) {
      return;
    }
    const payments = await this.prisma.payments.findMany({
      where: { invoice_id: invoiceId, laboratory_id: laboratoryId, status: 'completed' },
    });
    const paid = payments.reduce((sum: any, p: any) => sum + this.toNumber(p.amount), 0);
    const total = this.toNumber(invoice.total);
    let status = invoice.status;
    if (paid >= total && total > 0) {
      status = 'paid';
    } else if (paid > 0) {
      status = 'partially_paid';
    }
    await this.prisma.invoices.update({ where: { id: invoiceId }, data: { status } });
  }

  async createInvoice(dto: CreateInvoiceDto, laboratoryId: string, _userId: string): Promise<InvoiceView> {
    const invoiceNumber = await this.metricUtil.generateInvoiceNumber(laboratoryId);

    const itemsData = (dto.items || []).map((item) => ({
      description: item.description,
      quantity: item.quantity ?? 1,
      unit_price: item.unit_price,
      total_price: (item.quantity ?? 1) * item.unit_price,
      test_catalog_id: item.test_catalog_id ?? null,
      laboratory_id: laboratoryId,
    }));

    const subtotal = itemsData.reduce((sum, item) => sum + item.total_price, 0);
    const tax = 0;
    const total = subtotal + tax;

    const invoice = await this.prisma.invoices.create({
      data: {
        laboratory_id: laboratoryId,
        invoice_number: invoiceNumber,
        patient_id: dto.patient_id,
        visit_id: dto.visit_id ?? null,
        order_id: dto.order_id ?? null,
        status: 'draft',
        subtotal,
        tax,
        total,
        currency: dto.currency ?? 'EUR',
        due_date: dto.due_date ? new Date(dto.due_date) : null,
        notes: dto.notes ?? null,
        invoice_items: { create: itemsData },
      },
      include: {
        invoice_items: true,
        patient: { select: { id: true, matricule: true, first_name: true, last_name: true } },
      },
    });

    return this.mapInvoice(invoice);
  }

  async addInvoiceItem(invoiceId: string, dto: CreateInvoiceItemDto, laboratoryId: string): Promise<InvoiceView> {
    const invoice = await this.prisma.invoices.findFirst({
      where: { id: invoiceId, laboratory_id: laboratoryId },
    });
    if (!invoice) {
      throw new NotFoundException('Facture non trouvée');
    }
    if (invoice.status !== 'draft') {
      throw new BadRequestException('Seules les factures brouillon peuvent être modifiées');
    }

    const totalPrice = (dto.quantity ?? 1) * dto.unit_price;
    await this.prisma.invoice_items.create({
      data: {
        invoice_id: invoiceId,
        laboratory_id: laboratoryId,
        description: dto.description,
        quantity: dto.quantity ?? 1,
        unit_price: dto.unit_price,
        total_price: totalPrice,
        test_catalog_id: dto.test_catalog_id ?? null,
      },
    });

    await this.recomputeTotals(invoiceId, laboratoryId);
    return this.findById(invoiceId, laboratoryId);
  }

  async findAll(
    laboratoryId: string,
    pagination: PaginationDto,
    filters?: SearchBillingDto,
  ): Promise<{ items: InvoiceView[]; total: number }> {
    const where: any = { laboratory_id: laboratoryId };

    if (filters?.search) {
      where.OR = [
        { invoice_number: { contains: filters.search, mode: 'insensitive' } },
        { patient: { first_name: { contains: filters.search, mode: 'insensitive' } } },
        { patient: { last_name: { contains: filters.search, mode: 'insensitive' } } },
      ];
    }
    if (filters?.status) {
      where.status = filters.status;
    }
    if (filters?.date_from || filters?.date_to) {
      where.created_at = {};
      if (filters.date_from) {
        where.created_at.gte = new Date(filters.date_from);
      }
      if (filters.date_to) {
        where.created_at.lte = new Date(filters.date_to);
      }
    }

    const [items, total] = await Promise.all([
      this.prisma.invoices.findMany({
        where,
        skip: pagination.skip,
        take: pagination.take,
        orderBy: { created_at: 'desc' },
        include: {
          invoice_items: true,
          payments: true,
          patient: { select: { id: true, matricule: true, first_name: true, last_name: true } },
        },
      }),
      this.prisma.invoices.count({ where }),
    ]);

    return { items: items.map((item: any) => this.mapInvoice(item)), total };
  }

  async findById(id: string, laboratoryId: string): Promise<InvoiceView> {
    const invoice = await this.prisma.invoices.findFirst({
      where: { id, laboratory_id: laboratoryId },
      include: {
        invoice_items: true,
        payments: { include: { receipts: true } },
        patient: { select: { id: true, matricule: true, first_name: true, last_name: true } },
      },
    });
    if (!invoice) {
      throw new NotFoundException('Facture non trouvée');
    }
    return this.mapInvoice(invoice);
  }

  async findByPatient(
    patientId: string,
    laboratoryId: string,
    pagination: PaginationDto,
  ): Promise<{ items: InvoiceView[]; total: number }> {
    const patient = await this.prisma.patients.findFirst({
      where: { id: patientId, laboratory_id: laboratoryId },
    });
    if (!patient) {
      throw new NotFoundException('Patient non trouvé');
    }

    const where = { laboratory_id: laboratoryId, patient_id: patientId };
    const [items, total] = await Promise.all([
      this.prisma.invoices.findMany({
        where,
        skip: pagination.skip,
        take: pagination.take,
        orderBy: { created_at: 'desc' },
        include: {
          invoice_items: true,
          payments: true,
          patient: { select: { id: true, matricule: true, first_name: true, last_name: true } },
        },
      }),
      this.prisma.invoices.count({ where }),
    ]);

    return { items: items.map((item: any) => this.mapInvoice(item)), total };
  }

  async update(id: string, dto: UpdateInvoiceDto, laboratoryId: string): Promise<InvoiceView> {
    const invoice = await this.prisma.invoices.findFirst({
      where: { id, laboratory_id: laboratoryId },
    });
    if (!invoice) {
      throw new NotFoundException('Facture non trouvée');
    }
    if (invoice.status !== 'draft') {
      throw new BadRequestException('Seules les factures brouillon peuvent être modifiées');
    }

    const data: any = {};
    if (dto.due_date !== undefined) {
      data.due_date = new Date(dto.due_date);
    }
    if (dto.currency !== undefined) {
      data.currency = dto.currency;
    }
    if (dto.notes !== undefined) {
      data.notes = dto.notes ?? null;
    }

    await this.prisma.invoices.update({ where: { id }, data });
    return this.findById(id, laboratoryId);
  }

  async cancel(id: string, laboratoryId: string): Promise<InvoiceView> {
    const invoice = await this.prisma.invoices.findFirst({
      where: { id, laboratory_id: laboratoryId },
    });
    if (!invoice) {
      throw new NotFoundException('Facture non trouvée');
    }
    if (invoice.status === 'paid') {
      throw new BadRequestException('Une facture payée ne peut pas être annulée');
    }
    if (invoice.status === 'cancelled') {
      throw new BadRequestException('La facture est déjà annulée');
    }
    if (invoice.status === 'refunded') {
      throw new BadRequestException('Une facture remboursée ne peut pas être annulée');
    }

    await this.prisma.invoices.update({ where: { id }, data: { status: 'cancelled' } });
    return this.findById(id, laboratoryId);
  }

  async issue(id: string, dto: IssueInvoiceDto, laboratoryId: string): Promise<InvoiceView> {
    const invoice = await this.prisma.invoices.findFirst({
      where: { id, laboratory_id: laboratoryId },
    });
    if (!invoice) {
      throw new NotFoundException('Facture non trouvée');
    }
    if (invoice.status !== 'draft') {
      throw new BadRequestException('Seules les factures brouillon peuvent être émises');
    }

    const data: any = { status: 'issued', issued_date: new Date() };
    if (dto.due_date !== undefined) {
      data.due_date = new Date(dto.due_date);
    }
    if (dto.notes !== undefined) {
      data.notes = dto.notes ?? null;
    }

    await this.prisma.invoices.update({ where: { id }, data });
    return this.findById(id, laboratoryId);
  }

  async markPaid(id: string, laboratoryId: string): Promise<InvoiceView> {
    const invoice = await this.prisma.invoices.findFirst({
      where: { id, laboratory_id: laboratoryId },
    });
    if (!invoice) {
      throw new NotFoundException('Facture non trouvée');
    }
    await this.recomputeStatus(id, laboratoryId);
    return this.findById(id, laboratoryId);
  }

  async addPayment(
    invoiceId: string,
    dto: CreatePaymentDto,
    laboratoryId: string,
    _userId: string,
  ): Promise<{ payment: PaymentView; receipt?: ReceiptView }> {
    const invoice = await this.prisma.invoices.findFirst({
      where: { id: invoiceId, laboratory_id: laboratoryId },
    });
    if (!invoice) {
      throw new NotFoundException('Facture non trouvée');
    }
    if (invoice.status !== 'issued' && invoice.status !== 'partially_paid') {
      throw new BadRequestException('La facture doit être émise pour recevoir un paiement');
    }

    const existing = await this.prisma.payments.findFirst({
      where: { idempotency_key: dto.idempotency_key, laboratory_id: laboratoryId },
    });
    if (existing) {
      throw new ConflictException('Cette clé d\'idempotence a déjà été utilisée pour un paiement');
    }

    const receiptNumber = await this.metricUtil.generateReceiptNumber(laboratoryId);

    const result = await this.prisma.$transaction(async (tx: any) => {
      const payment = await tx.payments.create({
        data: {
          laboratory_id: laboratoryId,
          invoice_id: invoiceId,
          idempotency_key: dto.idempotency_key,
          amount: dto.amount,
          currency: dto.currency ?? 'EUR',
          method: dto.method,
          status: 'completed',
          paid_at: dto.paid_at ? new Date(dto.paid_at) : new Date(),
          reference: dto.reference ?? null,
          notes: dto.notes ?? null,
        },
        include: { receipts: true },
      });

      const payments = await tx.payments.findMany({
        where: { invoice_id: invoiceId, laboratory_id: laboratoryId, status: 'completed' },
      });
      const paid = payments.reduce((sum: any, p: any) => sum + this.toNumber(p.amount), 0);
      const total = this.toNumber(invoice.total);
      let status = invoice.status;
      if (paid >= total && total > 0) {
        status = 'paid';
      } else if (paid > 0) {
        status = 'partially_paid';
      }
      await tx.invoices.update({ where: { id: invoiceId }, data: { status } });

      let receipt: any;
      if (payment.status === 'completed') {
        receipt = await tx.receipts.create({
          data: {
            laboratory_id: laboratoryId,
            payment_id: payment.id,
            receipt_number: receiptNumber,
            amount: dto.amount,
          },
        });
      }

      return { payment, receipt };
    });

    return {
      payment: this.mapPayment(result.payment),
      receipt: result.receipt ? this.mapReceipt(result.receipt) : undefined,
    };
  }

  async createReceipt(paymentId: string, laboratoryId: string): Promise<ReceiptView> {
    const payment = await this.prisma.payments.findFirst({
      where: { id: paymentId, laboratory_id: laboratoryId },
    });
    if (!payment) {
      throw new NotFoundException('Paiement non trouvé');
    }
    if (payment.status !== 'completed') {
      throw new BadRequestException('Le reçu ne peut être généré que pour un paiement complété');
    }

    const existing = await this.prisma.receipts.findFirst({ where: { payment_id: paymentId } });
    if (existing) {
      return this.mapReceipt(existing);
    }

    const receiptNumber = await this.metricUtil.generateReceiptNumber(laboratoryId);
    const receipt = await this.prisma.receipts.create({
      data: {
        laboratory_id: laboratoryId,
        payment_id: paymentId,
        receipt_number: receiptNumber,
        amount: this.toNumber(payment.amount),
      },
    });
    return this.mapReceipt(receipt);
  }

  async getReceipts(invoiceId: string, laboratoryId: string): Promise<ReceiptView[]> {
    const invoice = await this.prisma.invoices.findFirst({
      where: { id: invoiceId, laboratory_id: laboratoryId },
    });
    if (!invoice) {
      throw new NotFoundException('Facture non trouvée');
    }

    const receipts = await this.prisma.receipts.findMany({
      where: { laboratory_id: laboratoryId, payment: { invoice_id: invoiceId } },
      orderBy: { issued_at: 'desc' },
    });
    return receipts.map((receipt: any) => this.mapReceipt(receipt));
  }

  async getStatistics(
    laboratoryId: string,
    dateFrom?: string,
    dateTo?: string,
  ): Promise<BillingStatistics> {
    const invoiceWhere: any = { laboratory_id: laboratoryId };
    if (dateFrom || dateTo) {
      invoiceWhere.created_at = {};
      if (dateFrom) {
        invoiceWhere.created_at.gte = new Date(dateFrom);
      }
      if (dateTo) {
        invoiceWhere.created_at.lte = new Date(dateTo);
      }
    }

    const paymentWhere: any = { laboratory_id: laboratoryId, status: 'completed' };
    if (dateFrom || dateTo) {
      paymentWhere.paid_at = {};
      if (dateFrom) {
        paymentWhere.paid_at.gte = new Date(dateFrom);
      }
      if (dateTo) {
        paymentWhere.paid_at.lte = new Date(dateTo);
      }
    }

    const [invoices, completedPayments] = await Promise.all([
      this.prisma.invoices.findMany({ where: invoiceWhere }),
      this.prisma.payments.findMany({ where: paymentWhere }),
    ]);

    const totalAmount = invoices.reduce((sum: any, inv: any) => sum + this.toNumber(inv.total), 0);
    const paidAmount = completedPayments.reduce((sum: any, p: any) => sum + this.toNumber(p.amount), 0);
    const overdueAmount = invoices
      .filter((inv: any) => inv.status === 'overdue')
      .reduce((sum: any, inv: any) => sum + this.toNumber(inv.total), 0);
    const pendingAmount = Math.max(totalAmount - paidAmount, 0);

    const byStatus: Record<string, { count: number; amount: number }> = {};
    for (const inv of invoices) {
      if (!byStatus[inv.status]) {
        byStatus[inv.status] = { count: 0, amount: 0 };
      }
      byStatus[inv.status].count += 1;
      byStatus[inv.status].amount += this.toNumber(inv.total);
    }

    const byMethod: Record<string, { count: number; amount: number }> = {};
    for (const p of completedPayments) {
      if (!byMethod[p.method]) {
        byMethod[p.method] = { count: 0, amount: 0 };
      }
      byMethod[p.method].count += 1;
      byMethod[p.method].amount += this.toNumber(p.amount);
    }

    return {
      total_invoices: invoices.length,
      total_amount: totalAmount,
      paid_amount: paidAmount,
      pending_amount: pendingAmount,
      overdue_amount: overdueAmount,
      by_status: byStatus,
      by_method: byMethod,
    };
  }

  async getCashJournal(
    laboratoryId: string,
    dateFrom?: string,
    dateTo?: string,
  ): Promise<CashJournalEntry[]> {
    const where: any = { laboratory_id: laboratoryId, status: 'completed' };
    if (dateFrom || dateTo) {
      where.paid_at = {};
      if (dateFrom) {
        where.paid_at.gte = new Date(dateFrom);
      }
      if (dateTo) {
        where.paid_at.lte = new Date(dateTo);
      }
    }

    const payments = await this.prisma.payments.findMany({
      where,
      orderBy: { paid_at: 'desc' },
      include: {
        receipts: true,
        invoice: { include: { patient: { select: { first_name: true, last_name: true } } } },
      },
    });

    return payments.map((payment: any) => ({
      id: payment.id,
      payment_id: payment.id,
      receipt_number: payment.receipts[0]?.receipt_number ?? null,
      invoice_id: payment.invoice_id ?? null,
      invoice_number: payment.invoice?.invoice_number ?? null,
      patient_id: payment.invoice?.patient_id ?? '',
      patient_name: payment.invoice?.patient
        ? `${payment.invoice.patient.first_name} ${payment.invoice.patient.last_name}`
        : '-',
      amount: this.toNumber(payment.amount),
      method: payment.method,
      status: payment.status,
      paid_at: payment.paid_at,
      reference: payment.reference,
      created_at: payment.created_at,
    }));
  }

  private mapInvoice(invoice: any): InvoiceView {
    return {
      id: invoice.id,
      laboratory_id: invoice.laboratory_id,
      invoice_number: invoice.invoice_number,
      visit_id: invoice.visit_id,
      order_id: invoice.order_id,
      patient_id: invoice.patient_id,
      issued_date: invoice.issued_date,
      due_date: invoice.due_date,
      status: invoice.status,
      subtotal: this.toNumber(invoice.subtotal),
      tax: this.toNumber(invoice.tax),
      total: this.toNumber(invoice.total),
      currency: invoice.currency,
      notes: invoice.notes,
      created_at: invoice.created_at,
      updated_at: invoice.updated_at,
      patient: invoice.patient
        ? {
            id: invoice.patient.id,
            matricule: invoice.patient.matricule,
            first_name: invoice.patient.first_name,
            last_name: invoice.patient.last_name,
          }
        : null,
      invoice_items: (invoice.invoice_items || []).map((item: any) => ({
        id: item.id,
        invoice_id: item.invoice_id,
        laboratory_id: item.laboratory_id,
        test_catalog_id: item.test_catalog_id,
        description: item.description,
        quantity: item.quantity,
        unit_price: this.toNumber(item.unit_price),
        total_price: this.toNumber(item.total_price),
        created_at: item.created_at,
        updated_at: item.updated_at,
      })),
      payments: (invoice.payments || []).map((payment: any) => this.mapPayment(payment)),
    };
  }

  private mapPayment(payment: any): PaymentView {
    return {
      id: payment.id,
      laboratory_id: payment.laboratory_id,
      invoice_id: payment.invoice_id,
      idempotency_key: payment.idempotency_key,
      amount: this.toNumber(payment.amount),
      currency: payment.currency,
      method: payment.method,
      status: payment.status,
      paid_at: payment.paid_at,
      reference: payment.reference,
      notes: payment.notes,
      created_at: payment.created_at,
      updated_at: payment.updated_at,
      receipt: payment.receipts?.[0] ? this.mapReceipt(payment.receipts[0]) : undefined,
    };
  }

  private mapReceipt(receipt: any): ReceiptView {
    return {
      id: receipt.id,
      laboratory_id: receipt.laboratory_id,
      payment_id: receipt.payment_id,
      receipt_number: receipt.receipt_number,
      issued_at: receipt.issued_at,
      amount: this.toNumber(receipt.amount),
      created_at: receipt.created_at,
      updated_at: receipt.updated_at,
    };
  }
}
