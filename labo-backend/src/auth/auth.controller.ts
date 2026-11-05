import { Controller, Post, Body } from "@nestjs/common";
import { AuthService } from "./auth.service.js";
import { ApiResponseDto } from "../common/dto/api-response.dto.js";
import { LoginDto, RegisterDto, RefreshTokenDto, ChangePasswordDto } from "./auth.dtos.js";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("register")
  async register(@Body() dto: RegisterDto) {
    const user = await this.authService.register(dto);
    return ApiResponseDto.success(user, "Utilisateur cree");
  }

  @Post("login")
  async login(@Body() dto: LoginDto) {
    const result = await this.authService.login(dto);
    return ApiResponseDto.success(result, "Connecte");
  }

  @Post("refresh")
  async refresh(@Body() dto: RefreshTokenDto) {
    const tokens = await this.authService.refresh(dto);
    return ApiResponseDto.success(tokens, "Tokens rafraichis");
  }

  @Post("logout")
  async logout(@Body("user_id") userId: string, @Body("refresh_token") refreshToken?: string) {
    const result = await this.authService.logout(userId, refreshToken);
    return ApiResponseDto.success(null, result.message);
  }

  @Post("change-password")
  async changePassword(@Body("user_id") userId: string, @Body() dto: ChangePasswordDto) {
    const result = await this.authService.changePassword(userId, dto);
    return ApiResponseDto.success(null, result.message);
  }
}
