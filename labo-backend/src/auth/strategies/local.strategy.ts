import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { DatabaseService } from '../../database/database.service.js';
import { PasswordUtil } from '../../common/index.js';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly prisma: DatabaseService,
    private readonly passwordUtil: PasswordUtil,
  ) {
    super({ usernameField: 'email' });
  }

  async validate(email: string, password: string): Promise<any> {
    const user = await this.prisma.users.findFirst({
      where: { email, deleted_at: null, is_active: true },
    });
    if (!user || password !== user.password_hash) {
      throw new UnauthorizedException();
    }
    return user;
  }
}