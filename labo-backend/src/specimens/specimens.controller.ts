import { Controller, Post, Get, Patch, Delete, Body, Param, Query, UseGuards } from "@nestjs/common";
import { ApiTags, ApiBearerAuth } from "@nestjs/swagger";
import { SpecimensService } from "./specimens.service.js";
import { ApiResponseDto } from "../common/dto/api-response.dto.js";
import { PaginationDto } from "../common/dto/pagination.dto.js";
import { CurrentUser } from "../common/decorators/current-user.decorator.js";
import { CurrentLaboratory } from "../common/decorators/laboratory.decorator.js";
import { RequirePermissions } from "../common/decorators/permissions.decorator.js";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard.js";
import { PermissionsGuard } from "../common/guards/permissions.guard.js";
import { LaboratoryAccessGuard } from "../common/guards/laboratory-access.guard.js";
import { CreateSpecimenDto, UpdateSpecimenDto, UpdateSpecimenStatusDto, RejectSpecimenDto, DiscardSpecimenDto } from "./specimens.dtos.js";

@Controller("specimens")
@ApiTags("Specimens")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard, LaboratoryAccessGuard)
export class SpecimensController {
  constructor(private readonly specimensService: SpecimensService) {}

  @Get()
  @RequirePermissions("specimens.read")
  async findAll(
    @Query("laboratory_id") laboratory_id: string,
    @Query("page") page = 1,
    @Query("limit") limit = 20,
    @Query("patient_id") patient_id?: string,
    @Query("status") status?: string,
    @Query("date_from") date_from?: string,
    @Query("date_to") date_to?: string,
    @Query("type") type?: string,
    @Query("search") search?: string,
  ) {
    const data = await this.specimensService.findAll(laboratory_id, { page, limit } as PaginationDto, { patient_id, status, date_from, date_to, type, search });
    return ApiResponseDto.success(data);
  }

  @Get(":id")
  @RequirePermissions("specimens.read")
  async findById(@Param("id") id: string, @Query("laboratory_id") laboratory_id: string) {
    const data = await this.specimensService.findById(id, laboratory_id);
    return ApiResponseDto.success(data);
  }

  @Get("patient/:patientId")
  @RequirePermissions("specimens.read")
  async findByPatient(@Param("patientId") patientId: string, @Query("laboratory_id") laboratory_id: string, @Query("page") page = 1, @Query("limit") limit = 20) {
    const data = await this.specimensService.findByPatient(patientId, laboratory_id, { page, limit } as PaginationDto);
    return ApiResponseDto.success(data);
  }

  @Get("matricule/:matricule")
  @RequirePermissions("specimens.read")
  async findByMatricule(@Param("matricule") matricule: string, @Query("laboratory_id") laboratory_id: string) {
    const data = await this.specimensService.findByMatricule(matricule, laboratory_id);
    return ApiResponseDto.success(data);
  }

  @Post()
  @RequirePermissions("specimens.create")
  async create(@Body() dto: CreateSpecimenDto, @CurrentLaboratory() laboratory_id: string, @CurrentUser("id") collected_by_id: string) {
    const data = await this.specimensService.create(dto, laboratory_id, collected_by_id);
    return ApiResponseDto.success(data, "Echantillon cree");
  }

  @Patch(":id")
  @RequirePermissions("specimens.update")
  async update(@Param("id") id: string, @Body() dto: UpdateSpecimenDto, @Query("laboratory_id") laboratory_id: string) {
    const data = await this.specimensService.update(id, laboratory_id, dto);
    return ApiResponseDto.success(data, "Echantillon mis a jour");
  }

  /** Réception de l'échantillon (§7.4). */
  @Patch(":id/receive")
  @RequirePermissions("specimens.status.manage")
  async receive(@Param("id") id: string, @Query("laboratory_id") laboratory_id: string) {
    const data = await this.specimensService.updateStatus(id, laboratory_id, "recu");
    return ApiResponseDto.success(data, "Echantillon receptionne");
  }

  /** Acceptation après contrôle de conformité (§7.4). */
  @Patch(":id/accept")
  @RequirePermissions("specimens.status.manage")
  async accept(
    @Param("id") id: string,
    @Body("section") section: string | undefined,
    @Query("laboratory_id") laboratory_id: string,
  ) {
    const data = await this.specimensService.accept(id, laboratory_id, section);
    return ApiResponseDto.success(data, "Echantillon accepte");
  }

  @Patch(":id/section")
  @RequirePermissions("specimens.update")
  async assignSection(
    @Param("id") id: string,
    @Body("section") section: string,
    @Query("laboratory_id") laboratory_id: string,
  ) {
    const data = await this.specimensService.assignSection(id, laboratory_id, section);
    return ApiResponseDto.success(data, "Section affectee");
  }

  /** Nouvelle collecte après rejet (§7.4). */
  @Patch(":id/recollect")
  @RequirePermissions("specimens.status.manage")
  async recollect(@Param("id") id: string, @Query("laboratory_id") laboratory_id: string) {
    const data = await this.specimensService.updateStatus(id, laboratory_id, "en_attente");
    return ApiResponseDto.success(data, "Nouvelle collecte demandee");
  }

  @Patch(":id/status")
  @RequirePermissions("specimens.status.manage")
  async updateStatus(
    @Param("id") id: string,
    @Body() dto: UpdateSpecimenStatusDto,
    @Query("laboratory_id") laboratory_id: string,
  ) {
    const data = await this.specimensService.updateStatus(id, laboratory_id, dto.status, dto.notes);
    return ApiResponseDto.success(data, "Statut de l echantillon mis a jour");
  }

  @Patch(":id/reject")
  @RequirePermissions("specimens.reject")
  async reject(
    @Param("id") id: string,
    @Body() dto: RejectSpecimenDto,
    @Query("laboratory_id") laboratory_id: string,
  ) {
    const data = await this.specimensService.reject(id, laboratory_id, dto.reason);
    return ApiResponseDto.success(data, "Echantillon rejete");
  }

  @Patch(":id/discard")
  @RequirePermissions("specimens.discard")
  async discard(
    @Param("id") id: string,
    @Body() dto: DiscardSpecimenDto,
    @Query("laboratory_id") laboratory_id: string,
  ) {
    const data = await this.specimensService.discard(id, laboratory_id, dto.reason);
    return ApiResponseDto.success(data, "Echantillon elimine");
  }

  @Delete(":id")
  @RequirePermissions("specimens.delete")
  async remove(@Param("id") id: string, @Query("laboratory_id") laboratory_id: string) {
    await this.specimensService.remove(id, laboratory_id);
    return ApiResponseDto.success(null, "Echantillon supprime");
  }
}