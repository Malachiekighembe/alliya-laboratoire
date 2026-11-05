import { randomUUID } from 'crypto';

export class UuidUtil {
  static generate(): string {
    return randomUUID();
  }

  static isValid(uuid: string): boolean {
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }

  static isVersion4(uuid: string): boolean {
    if (!this.isValid(uuid)) return false;
    const version = uuid.charAt(14);
    return version === '4';
  }
}
