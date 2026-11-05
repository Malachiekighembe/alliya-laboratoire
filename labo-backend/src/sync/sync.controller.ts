import { Controller, Post, Get, Body, Query, Param } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { SyncService } from './sync.service.js';
import { ApiResponseDto } from '../common/dto/api-response.dto.js';

@Controller('sync')
@ApiTags('Sync')
@ApiBearerAuth()
export class SyncController {
  constructor(private readonly syncService: SyncService) {}

  @Post('push')
  async push(@Body('laboratory_id') laboratory_id: string, @Body('events') events: any[]) {
    const data = await this.syncService.push(laboratory_id, events);
    return ApiResponseDto.success( data, 'Événements reçus');
  }

  @Get('pull')
  async pull(@Query('laboratory_id') laboratory_id: string, @Query('last_sync_at') lastSyncAt?: string) {
    const data = await this.syncService.pull(laboratory_id, lastSyncAt);
    return ApiResponseDto.success(data);
  }

  @Post('processed/:id')
  async markProcessed(@Param('id') id: string, @Body('laboratory_id') laboratory_id: string) {
    await this.syncService.markProcessed(id, laboratory_id);
    return ApiResponseDto.success( null, 'Événement traité');
  }
}