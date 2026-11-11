import { Controller, Get, Param } from '@nestjs/common';
import { UsersService } from './users.service.js';
import { ApiResponseDto } from '../common/dto/api-response.dto.js';

@Controller('users/public')
export class UsersPublicController {
  constructor(private readonly usersService: UsersService) {}

  @Get(':id')
  async getPublicProfile(@Param('id') id: string) {
    const data = await this.usersService.findPublicById(id);
    return ApiResponseDto.success(data);
  }
}
