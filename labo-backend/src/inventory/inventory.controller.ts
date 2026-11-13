import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { InventoryService } from './inventory.service.js';
import { ApiResponseDto } from '../common/dto/api-response.dto.js';
import { CurrentLaboratory } from '../common/decorators/laboratory.decorator.js';
import { RequirePermissions } from '../common/decorators/permissions.decorator.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../common/guards/permissions.guard.js';
import { LaboratoryAccessGuard } from '../common/guards/laboratory-access.guard.js';

@Controller('inventory')
@ApiTags('Inventory')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard, LaboratoryAccessGuard)
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get('products')
  @RequirePermissions('laboratory.inventory')
  async findAll(@CurrentLaboratory() laboratory_id: string, @Query('search') search?: string) {
    const data = await this.inventoryService.findAllProducts(laboratory_id, search);
    return ApiResponseDto.success(data);
  }

  @Post('products')
  @RequirePermissions('laboratory.inventory')
  async create(@Body() data: any, @CurrentLaboratory() laboratory_id: string) {
    const product = await this.inventoryService.createProduct(laboratory_id, data);
    return ApiResponseDto.success(product, 'Produit cree');
  }

  @Patch('products/:id')
  @RequirePermissions('laboratory.inventory')
  async update(
    @Param('id') id: string,
    @Body() data: any,
    @Query('laboratory_id') laboratory_id: string,
    @CurrentLaboratory() currentLaboratory: string,
  ) {
    const product = await this.inventoryService.updateProduct(id, laboratory_id || currentLaboratory, data);
    return ApiResponseDto.success(product, 'Produit mis a jour');
  }

  @Delete('products/:id')
  @RequirePermissions('laboratory.inventory')
  async delete(@Param('id') id: string, @CurrentLaboratory() laboratory_id: string) {
    await this.inventoryService.deleteProduct(id, laboratory_id);
    return ApiResponseDto.success(null, 'Produit supprime');
  }

  @Post('products/:id/lots')
  @RequirePermissions('laboratory.inventory')
  async createLot(@Param('id') id: string, @Body() data: any, @CurrentLaboratory() laboratory_id: string) {
    const lot = await this.inventoryService.createStockLot(laboratory_id, { ...data, product_id: id });
    return ApiResponseDto.success(lot, 'Lot cree');
  }

  @Get('products/:id/lots')
  @RequirePermissions('laboratory.inventory')
  async getLots(@Param('id') id: string, @CurrentLaboratory() laboratory_id: string) {
    const data = await this.inventoryService.findAllStockLots(laboratory_id, id);
    return ApiResponseDto.success(data);
  }

  @Get('lots')
  @RequirePermissions('laboratory.inventory')
  async getLotsAll(@CurrentLaboratory() laboratory_id: string, @Query('product_id') product_id?: string) {
    const data = await this.inventoryService.findAllStockLots(laboratory_id, product_id);
    return ApiResponseDto.success(data);
  }

  @Post('movements')
  @RequirePermissions('laboratory.inventory')
  async createMovement(@Body() data: any, @CurrentLaboratory() laboratory_id: string) {
    const movement = await this.inventoryService.recordMovement(laboratory_id, data);
    return ApiResponseDto.success(movement, 'Mouvement enregistre');
  }

  @Get('alerts/expiring')
  @RequirePermissions('laboratory.inventory')
  async expiring(@CurrentLaboratory() laboratory_id: string, @Query('days') days?: string) {
    const data = await this.inventoryService.getExpiringLots(laboratory_id, days ? parseInt(String(days), 10) : 7);
    return ApiResponseDto.success(data);
  }

  @Get('alerts/low-stock')
  @RequirePermissions('laboratory.inventory')
  async lowStock(@CurrentLaboratory() laboratory_id: string) {
    const data = await this.inventoryService.getLowStockAlerts(laboratory_id);
    return ApiResponseDto.success(data);
  }
}