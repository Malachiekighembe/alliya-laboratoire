import { Controller, Post, Get, Patch, Delete, Body, Param, Query, UseGuards } from "@nestjs/common";
import { ApiTags, ApiBearerAuth } from "@nestjs/swagger";
import { ResultValidationsService } from "./result-validations.service.js";
import { ApiResponseDto } from "../common/dto/api-response.dto.js";
import { CurrentUser } from "../common/decorators/current-user.decorator.js";
import { CurrentLaboratory } from "../common/decorators/laboratory.decorator.js";
import { RequirePermissions } from "../common/decorators/permissions.decorator.js";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard.js";
import { PermissionsGuard } from "../common/guards/permissions.guard.js";
import { LaboratoryAccessGuard } from "../common/guards/laboratory-access.guard.js";

@Controller("result-validations")
@ApiTags("Result Validations")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard, LaboratoryAccessGuard)
export class ResultValidationsController {
  constructor(private readonly resultValidationsService: ResultValidationsService) {}

  @Get()
  @RequirePermissions("result-validations.read")
  async findAll(
    @Query("laboratory_id") laboratory_id: string,
    @Query("page") page = 1,
    @Query("limit") limit = 20,
    @Query("result_id") result_id?: string,
    @Query("status") status?: string,
    @Query("date_from") date_from?: string,
    @Query("date_to") date_to?: string,
    @Query("search") search?: string,
  ) {
    const data = await this.resultValidationsService.findAll(laboratory_id, page, limit, { result_id, status, date_from, date_to, search });
    return ApiResponseDto.success(data);
  }

  @Get(":id")
  @RequirePermissions("result-validations.read")
  async findById(@Param("id") id: string, @Query("laboratory_id") laboratory_id: string) {
    const data = await this.resultValidationsService.findById(id, laboratory_id);
    return ApiResponseDto.success(data);
  }

  @Get("result/:resultId")
  @RequirePermissions("result-validations.read")
  async findByResult(@Param("resultId") resultId: string, @Query("laboratory_id") laboratory_id: string) {
    const data = await this.resultValidationsService.findByResult(resultId, laboratory_id);
    return ApiResponseDto.success(data);
  }

  @Post()
  @RequirePermissions("result-validations.create")
  async create(
    @Body("result_id") result_id: string,
    @Body("status") status: string,
    @Body("notes") notes: string | undefined,
    @CurrentLaboratory() laboratory_id: string,
    @CurrentUser("id") validated_by_id: string,
  ) {
    const data = await this.resultValidationsService.create(result_id, laboratory_id, validated_by_id, status, notes);
    return ApiResponseDto.success(data, "Validation creee");
  }

  @Patch(":id")
  @RequirePermissions("result-validations.update")
  async update(
    @Param("id") id: string,
    @Body("status") status: string | undefined,
    @Body("notes") notes: string | undefined,
    @Query("laboratory_id") laboratory_id: string,
  ) {
    const data = await this.resultValidationsService.update(id, laboratory_id, status, notes);
    return ApiResponseDto.success(data, "Validation mise a jour");
  }

  @Delete(":id")
  @RequirePermissions("result-validations.delete")
  async remove(@Param("id") id: string, @Query("laboratory_id") laboratory_id: string) {
    await this.resultValidationsService.remove(id, laboratory_id);
    return ApiResponseDto.success(null, "Validation supprimee");
  }
}
