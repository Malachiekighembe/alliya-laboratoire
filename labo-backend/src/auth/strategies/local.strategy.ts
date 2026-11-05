import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { PrismaService } from '../../prisma/prisma.service.js';
import { PasswordUtil } from '../../common/index.js';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly prisma: PrismaService,
    private readonly passwordUtil: PasswordUtil,
  ) {
    super({ usernameField: 'email' });
  }

  async validate(email: string, password: string): Promise<any> {
    const user = await this.prisma.users.findFirst({
      where: { email, deleted_at: null, is_active: true },
    });
    if (!user || !(await PasswordUtil.verify(password, user.password_hash))) {
      throw new UnauthorizedException();
    }
    return user;
  }
}