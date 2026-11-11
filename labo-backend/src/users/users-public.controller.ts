import { Controller, Get, Param } from '@nestjs/common';
import { UsersService } from './users.service.js';
import { ApiResponseDto } from '../common/dto/api-response.dto.js';

@Controller('users/public')
export class UsersPublicController {
  constructor(private readonly usersService: UsersService) {}

  @Get(':token')
  async getPublicProfile(@Param('token') token: string) {
    const data = await this.usersService.findPublicByToken(token);
    return ApiResponseDto.success(data);
  }
}
