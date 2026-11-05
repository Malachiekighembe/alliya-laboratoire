import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { Request } from 'express';
import { PrismaService } from '../../prisma/prisma.service.js';

export interface JwtPayload {
  sub: string;
  laboratory_id: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_ACCESS_SECRET || 'changeme',
    });
  }

  async validate(payload: JwtPayload) {
    const user = await this.prisma.users.findUnique({
      where: { id: payload.sub, deleted_at: null, is_active: true },
    });
    if (!user) throw new UnauthorizedException();
    return { id: user.id, laboratory_id: user.laboratory_id, email: user.email };
  }
}