import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { InventoryService } from './inventory.service.js';
import { ApiResponseDto } from '../common/dto/api-response.dto.js';

@Controller('inventory')
@ApiTags('Inventory')
@ApiBearerAuth()
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get('products')
  async findAll(@Query('laboratory_id') laboratory_id: string, @Query('search') search?: string) {
    const data = await this.inventoryService.findAllProducts(laboratory_id, search);
    return ApiResponseDto.success(data);
  }

  @Post('products')
  async create(@Body('laboratory_id') laboratory_id: string, @Body() data: any) {
    const product = await this.inventoryService.createProduct(laboratory_id, data);
    return ApiResponseDto.success( product, 'Produit créé');
  }

  @Patch('products/:id')
  async update(@Param('id') id: string, @Body('laboratory_id') laboratory_id: string, @Body() data: any) {
    const product = await this.inventoryService.updateProduct(id, laboratory_id, data);
    return ApiResponseDto.success( product, 'Produit mis à jour');
  }

  @Delete('products/:id')
  async delete(@Param('id') id: string, @Body('laboratory_id') laboratory_id: string) {
    await this.inventoryService.deleteProduct(id, laboratory_id);
    return ApiResponseDto.success( null, 'Produit supprimé');
  }

  @Post('products/:id/lots')
  async createLot(@Param('id') id: string, @Body('laboratory_id') laboratory_id: string, @Body() data: any) {
    const lot = await this.inventoryService.createStockLot(laboratory_id, { product_id: id, ...data });
    return ApiResponseDto.success( lot, 'Lot créé');
  }

  @Get('products/:id/lots')
  async getLots(@Param('id') id: string, @Query('laboratory_id') laboratory_id: string) {
    const data = await this.inventoryService.findAllStockLots(laboratory_id, id);
    return ApiResponseDto.success(data);
  }

  @Get('lots')
  async getLotsAll(@Query('laboratory_id') laboratory_id: string, @Query('product_id') product_id?: string) {
    const data = await this.inventoryService.findAllStockLots(laboratory_id, product_id);
    return ApiResponseDto.success(data);
  }

  @Post('movements')
  async createMovement(@Body('laboratory_id') laboratory_id: string, @Body() data: any) {
    const movement = await this.inventoryService.recordMovement(laboratory_id, data);
    return ApiResponseDto.success( movement, 'Mouvement enregistré');
  }

  @Get('alerts/expiring')
  async expiring(@Query('laboratory_id') laboratory_id: string, @Query('days') days?: string) {
    const data = await this.inventoryService.getExpiringLots(laboratory_id, days ? parseInt(days) : 7);
    return ApiResponseDto.success(data);
  }

  @Get('alerts/low-stock')
  async lowStock(@Query('laboratory_id') laboratory_id: string) {
    const data = await this.inventoryService.getLowStockAlerts(laboratory_id);
    return ApiResponseDto.success(data);
  }
}