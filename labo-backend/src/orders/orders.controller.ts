import { Controller, Post, Get, Patch, Delete, Body, Param, Query, UseGuards } from "@nestjs/common";
import { ApiTags, ApiBearerAuth } from "@nestjs/swagger";
import { OrdersService } from "./orders.service.js";
import { ApiResponseDto } from "../common/dto/api-response.dto.js";
import { CurrentUser } from "../common/decorators/current-user.decorator.js";
import { CurrentLaboratory } from "../common/decorators/laboratory.decorator.js";
import { RequirePermissions } from "../common/decorators/permissions.decorator.js";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard.js";
import { PermissionsGuard } from "../common/guards/permissions.guard.js";
import { LaboratoryAccessGuard } from "../common/guards/laboratory-access.guard.js";
import { CreateOrderDto, CreateOrderItemDto, UpdateOrderDto, UpdateOrderItemDto } from "./orders.dtos.js";

@Controller("orders")
@ApiTags("Orders")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard, LaboratoryAccessGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  @RequirePermissions("orders.read")
  async findAll(
    @Query("laboratory_id") laboratory_id: string,
    @Query("page") page = 1,
    @Query("limit") limit = 20,
    @Query("patient_id") patient_id?: string,
    @Query("status") status?: string,
    @Query("priority") priority?: string,
    @Query("date_from") date_from?: string,
    @Query("date_to") date_to?: string,
    @Query("search") search?: string,
  ) {
    const data = await this.ordersService.findAll(laboratory_id, page, limit, { patient_id, status, priority, date_from, date_to, search });
    return ApiResponseDto.success(data);
  }

  @Get(":id")
  @RequirePermissions("orders.read")
  async findById(@Param("id") id: string, @Query("laboratory_id") laboratory_id: string) {
    const data = await this.ordersService.findById(id, laboratory_id);
    return ApiResponseDto.success(data);
  }

  @Get("patient/:patientId")
  @RequirePermissions("orders.read")
  async findByPatient(@Param("patientId") patientId: string, @Query("laboratory_id") laboratory_id: string, @Query("page") page = 1, @Query("limit") limit = 20) {
    const data = await this.ordersService.findByPatient(patientId, laboratory_id, page, limit);
    return ApiResponseDto.success(data);
  }

  @Post()
  @RequirePermissions("orders.create")
  async create(@Body() dto: CreateOrderDto, @CurrentLaboratory() laboratory_id: string, @CurrentUser("id") created_by_id: string) {
    const data = await this.ordersService.create(dto, laboratory_id, created_by_id);
    return ApiResponseDto.success(data, "Demande creee");
  }

  /** Ajoute une analyse à une demande en attente (§5.3). */
  @Post(":id/items")
  @RequirePermissions("orders.update")
  async addItem(@Param("id") id: string, @Body() dto: CreateOrderItemDto, @Query("laboratory_id") laboratory_id: string) {
    const data = await this.ordersService.addItem(id, laboratory_id, dto);
    return ApiResponseDto.success(data, "Analyse ajoutee");
  }

  @Patch(":id/items/:itemId")
  @RequirePermissions("orders.update")
  async updateItem(
    @Param("id") id: string,
    @Param("itemId") itemId: string,
    @Body() dto: UpdateOrderItemDto,
    @Query("laboratory_id") laboratory_id: string,
  ) {
    const data = await this.ordersService.updateItem(id, itemId, laboratory_id, dto);
    return ApiResponseDto.success(data, "Analyse mise a jour");
  }

  @Delete(":id/items/:itemId")
  @RequirePermissions("orders.update")
  async removeItem(@Param("id") id: string, @Param("itemId") itemId: string, @Query("laboratory_id") laboratory_id: string) {
    const data = await this.ordersService.removeItem(id, itemId, laboratory_id);
    return ApiResponseDto.success(data, "Analyse retiree");
  }

  /** Envoi au laboratoire : crée les analyses en attente (§5.3). */
  @Post(":id/send-to-lab")
  @RequirePermissions("orders.update")
  async sendToLab(@Param("id") id: string, @Query("laboratory_id") laboratory_id: string, @CurrentUser("id") user_id: string) {
    const data = await this.ordersService.sendToLab(id, laboratory_id, user_id);
    return ApiResponseDto.success(data, "Demande envoyee au laboratoire");
  }

  @Get("statistics/summary")
  @RequirePermissions("orders.read")
  async statistics(
    @Query("laboratory_id") laboratory_id: string,
    @Query("date_from") date_from?: string,
    @Query("date_to") date_to?: string,
  ) {
    const data = await this.ordersService.getStatistics(laboratory_id, date_from, date_to);
    return ApiResponseDto.success(data);
  }

  @Patch(":id")
  @RequirePermissions("orders.update")
  async update(@Param("id") id: string, @Body() dto: UpdateOrderDto, @Query("laboratory_id") laboratory_id: string) {
    const data = await this.ordersService.update(id, laboratory_id, dto);
    return ApiResponseDto.success(data, "Demande mise a jour");
  }

  @Delete(":id")
  @RequirePermissions("orders.delete")
  async remove(@Param("id") id: string, @Query("laboratory_id") laboratory_id: string) {
    await this.ordersService.remove(id, laboratory_id);
    return ApiResponseDto.success(null, "Demande supprimee");
  }
}
