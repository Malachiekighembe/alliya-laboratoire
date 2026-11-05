import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class PaginationDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'La page doit être un entier' })
  @Min(1, { message: 'La page doit être supérieure ou égale à 1' })
  page: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'La limite doit être un entier' })
  @Min(1, { message: 'La limite doit être supérieure ou égale à 1' })
  @Max(100, { message: 'La limite ne peut pas dépasser 100' })
  limit: number = 20;

  @IsOptional()
  @IsString({ message: 'La recherche doit être une chaîne de caractères' })
  search?: string;

  @IsOptional()
  @IsString({ message: 'Le tri doit être une chaîne de caractères' })
  sortBy?: string;

  @IsOptional()
  @IsString({ message: "L'ordre de tri doit être une chaîne de caractères" })
  sortOrder?: 'asc' | 'desc' = 'asc';

  get skip(): number {
    return (this.page - 1) * this.limit;
  }

  get take(): number {
    return this.limit;
  }
}
