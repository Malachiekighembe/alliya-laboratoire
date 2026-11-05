import { Module } from "@nestjs/common";
import { PassportModule } from "@nestjs/passport";
import { JwtModule } from "@nestjs/jwt";

import { AuthController } from "./auth.controller.js";
import { AuthService } from "./auth.service.js";
import { JwtStrategy } from "./strategies/jwt.strategy.js";
import { LocalStrategy } from "./strategies/local.strategy.js";
import { PrismaModule } from "../prisma/prisma.module.js";
import { COMMON } from "../common/common.module.js";

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: "jwt" }),
    JwtModule.register({
      secret: process.env.JWT_ACCESS_SECRET || "changeme",
      signOptions: { expiresIn: "15m" },
    }),
    PrismaModule,
    COMMON,
  ],
  providers: [AuthService, JwtStrategy, LocalStrategy],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
