import { Controller, Get, Param, NotFoundException } from '@nestjs/common';
import { SpecimensService } from './specimens.service.js';
import { ApiResponseDto } from '../common/dto/api-response.dto.js';

@Controller('specimens/public')
export class SpecimensPublicController {
  constructor(private readonly specimensService: SpecimensService) {}

  @Get('qr/:token')
  async getByQrToken(@Param('token') token: string) {
    const data = await this.specimensService.findPublicByQrToken(token);
    if (!data) throw new NotFoundException('Échantillon introuvable');
    return ApiResponseDto.success(data);
  }
}