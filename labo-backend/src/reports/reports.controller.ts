import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ReportsService } from './reports.service.js';
import { ApiResponseDto } from '../common/dto/api-response.dto.js';

@Controller('reports')
@ApiTags('Reports')
@ApiBearerAuth()
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('dashboard')
  async dashboard(@Query('laboratory_id') laboratory_id: string, @Query('date_from') dateFrom?: string, @Query('date_to') dateTo?: string) {
    const data = await this.reportsService.getDashboard(laboratory_id, dateFrom, dateTo);
    return ApiResponseDto.success(data);
  }

  @Get('audit')
  async audit(@Query('laboratory_id') laboratory_id: string, @Query('page') page = 1, @Query('limit') limit = 20) {
    const data = await this.reportsService.getAuditLogs(laboratory_id, page, limit);
    return ApiResponseDto.success(data);
  }
}