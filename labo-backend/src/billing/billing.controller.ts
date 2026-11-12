import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../common/guards/permissions.guard.js';
import { LaboratoryAccessGuard } from '../common/guards/laboratory-access.guard.js';
import { RequirePermissions } from '../common/decorators/permissions.decorator.js';
import { CurrentLaboratory } from '../common/decorators/laboratory.decorator.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { BillingService } from './billing.service.js';
import { ApiResponseDto } from '../common/dto/api-response.dto.js';
import { PaginationDto } from '../common/dto/pagination.dto.js';
import { SearchBillingDto } from './billing.dtos.js';
import { CreateInvoiceDto } from './billing.dtos.js';
import { UpdateInvoiceDto } from './billing.dtos.js';
import { IssueInvoiceDto } from './billing.dtos.js';
import { PayInvoiceDto } from './billing.dtos.js';
import { CreatePaymentDto } from './billing.dtos.js';

@ApiTags('Billing')
@ApiBearerAuth()
@Controller('billing')
@UseGuards(JwtAuthGuard, PermissionsGuard, LaboratoryAccessGuard)
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  private paginationMeta(pagination: PaginationDto, total: number) {
    return {
      page: pagination.page,
      limit: pagination.limit,
      total,
      totalPages: Math.ceil(total / pagination.limit),
      hasNext: pagination.page * pagination.limit < total,
      hasPrev: pagination.page > 1,
    };
  }

  @Get()
  @RequirePermissions('billing.read')
  async findAll(
    @CurrentLaboratory() labId: string,
    @Query() pagination: PaginationDto,
    @Query() filters: SearchBillingDto,
  ) {
    const result = await this.billingService.findAll(labId, pagination, filters);
    return new ApiResponseDto({
      success: true,
      data: result.items,
      pagination: this.paginationMeta(pagination, result.total),
    });
  }

  @Get('patient/:patientId')
  @RequirePermissions('billing.read')
  async byPatient(
    @Param('patientId') patientId: string,
    @CurrentLaboratory() labId: string,
    @Query() pagination: PaginationDto,
  ) {
    const result = await this.billingService.findByPatient(patientId, labId, pagination);
    return new ApiResponseDto({
      success: true,
      data: result.items,
      pagination: this.paginationMeta(pagination, result.total),
    });
  }

  @Get('statistics')
  @RequirePermissions('billing.statistics')
  async statistics(
    @CurrentLaboratory() labId: string,
    @Query('date_from') dateFrom?: string,
    @Query('date_to') dateTo?: string,
  ) {
    const data = await this.billingService.getStatistics(labId, dateFrom, dateTo);
    return ApiResponseDto.success(data);
  }

  @Get('cash-journal')
  @RequirePermissions('billing.statistics')
  async cashJournal(
    @CurrentLaboratory() labId: string,
    @Query('date_from') dateFrom?: string,
    @Query('date_to') dateTo?: string,
  ) {
    const data = await this.billingService.getCashJournal(labId, dateFrom, dateTo);
    return ApiResponseDto.success(data);
  }

  @Get(':id')
  @RequirePermissions('billing.read')
  async findOne(@Param('id') id: string, @CurrentLaboratory() labId: string) {
    const data = await this.billingService.findById(id, labId);
    return ApiResponseDto.success(data);
  }

  @Post()
  @RequirePermissions('billing.create')
  async create(
    @Body() dto: CreateInvoiceDto,
    @CurrentLaboratory() labId: string,
    @CurrentUser() user: any,
  ) {
    const data = await this.billingService.createInvoice(dto, labId, user.id);
    return ApiResponseDto.success(data, 'Facture créée');
  }

  @Patch(':id')
  @RequirePermissions('billing.update')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateInvoiceDto,
    @CurrentLaboratory() labId: string,
  ) {
    const data = await this.billingService.update(id, dto, labId);
    return ApiResponseDto.success(data, 'Facture mise à jour');
  }

  @Delete(':id')
  @RequirePermissions('billing.delete')
  async cancel(@Param('id') id: string, @CurrentLaboratory() labId: string) {
    const data = await this.billingService.cancel(id, labId);
    return ApiResponseDto.success(data, 'Facture annulée');
  }

  @Patch(':id/issue')
  @RequirePermissions('billing.issue')
  async issue(
    @Param('id') id: string,
    @Body() dto: IssueInvoiceDto,
    @CurrentLaboratory() labId: string,
  ) {
    const data = await this.billingService.issue(id, dto, labId);
    return ApiResponseDto.success(data, 'Facture émise');
  }

  @Patch(':id/pay')
  @RequirePermissions('billing.pay')
  async pay(
    @Param('id') id: string,
    @Body() dto: PayInvoiceDto,
    @CurrentLaboratory() labId: string,
  ) {
    const data = await this.billingService.markPaid(id, labId);
    return ApiResponseDto.success(data, 'Facture marquée comme payée');
  }

  @Post(':id/payments')
  @RequirePermissions('billing.payments.manage')
  async addPayment(
    @Param('id') id: string,
    @Body() dto: CreatePaymentDto,
    @CurrentLaboratory() labId: string,
    @CurrentUser() user: any,
  ) {
    const data = await this.billingService.addPayment(id, dto, labId, user.id);
    return ApiResponseDto.success(data, 'Paiement enregistré');
  }

  @Get(':id/receipts')
  @RequirePermissions('billing.read')
  async receipts(@Param('id') id: string, @CurrentLaboratory() labId: string) {
    const data = await this.billingService.getReceipts(id, labId);
    return ApiResponseDto.success(data);
  }
}
