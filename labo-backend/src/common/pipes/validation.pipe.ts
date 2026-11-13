import {
  ArgumentMetadata,
  BadRequestException,
  Injectable,
  PipeTransform,
} from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

@Injectable()
export class GlobalValidationPipe implements PipeTransform<any> {
  async transform(value: any, { metatype, type }: ArgumentMetadata) {
    if (!metatype || !this.toValidate(metatype)) {
      return value;
    }

    // Les filtres vides (?status=, ?order_id=) sont ignorés plutôt que rejetés.
    const cleaned = type === 'query' ? this.stripEmpty(value) : value;

    const object = plainToInstance(metatype, cleaned);
    const errors = await validate(object, { whitelist: false });

    if (errors.length > 0) {
      const messages = this.buildErrorMessages(errors);
      throw new BadRequestException({
        message: 'Erreur de validation',
        errors: messages,
      });
    }

    return object;
  }

  private stripEmpty(value: any): any {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return value;
    const out: any = {};
    for (const [key, entry] of Object.entries(value)) {
      if (entry === '' || entry === undefined) continue;
      out[key] = entry;
    }
    return out;
  }

  private toValidate(metatype: Function): boolean {
    const types: Function[] = [String, Boolean, Number, Array, Object];
    return !types.includes(metatype);
  }

  private buildErrorMessages(errors: any[], parentPath = ''): any[] {
    const messages: any[] = [];

    for (const error of errors) {
      const propertyPath = parentPath
        ? `${parentPath}.${error.property}`
        : error.property;

      if (error.constraints) {
        const constraints = Object.values(error.constraints);
        for (const constraint of constraints) {
          messages.push({
            field: propertyPath,
            message: this.translateMessage(constraint as string),
          });
        }
      }

      if (error.children && error.children.length > 0) {
        messages.push(...this.buildErrorMessages(error.children, propertyPath));
      }
    }

    return messages;
  }

  private translateMessage(message: string): string {
    // Traductions basiques pour les messages class-validator
    const translations: Record<string, string> = {
      'must be a string': 'doit être une chaîne de caractères',
      'must be a number': 'doit être un nombre',
      'must be an email': "doit être une adresse email valide",
      'must be a uuid': 'doit être un UUID valide',
      'should not be empty': 'ne doit pas être vide',
      'is not empty': 'ne doit pas être vide',
      'must be longer than or equal to': 'doit contenir au moins',
      'must be shorter than or equal to': 'doit contenir au plus',
      'must be an integer': 'doit être un entier',
      'must be a boolean value': 'doit être un booléen',
      'must be a valid ISO 8601 date string': 'doit être une date valide',
    };

    for (const [en, fr] of Object.entries(translations)) {
      if (message.includes(en)) {
        return message.replace(en, fr);
      }
    }

    return message;
  }
}
