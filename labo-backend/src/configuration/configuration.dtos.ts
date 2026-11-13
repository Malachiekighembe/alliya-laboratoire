import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { CONFIGURATION_CATEGORIES } from './configuration.constants.js';

export { CONFIGURATION_CATEGORIES };

export class SearchConfigurationDto {
  @IsOptional()
  @IsIn(CONFIGURATION_CATEGORIES as unknown as string[], {
    message: 'Catégorie de configuration invalide',
  })
  category?: string;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  include_inactive?: number;
}

export class CreateConfigurationItemDto {
  @IsIn(CONFIGURATION_CATEGORIES as unknown as string[], {
    message: 'Catégorie de configuration invalide',
  })
  category: string;

  @IsString()
  code: string;

  @IsString()
  label: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  unit?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  price?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  tax_rate?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  sort_order?: number;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;

  @IsOptional()
  @IsBoolean()
  is_default?: boolean;
}

export class UpdateConfigurationItemDto {
  @IsOptional()
  @IsString()
  label?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  unit?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  price?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  tax_rate?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  sort_order?: number;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;

  @IsOptional()
  @IsBoolean()
  is_default?: boolean;
}

/** Corps accepté par /configuration/seed : catégories à (re)charger. */
export class SeedConfigurationDto {
  @IsOptional()
  categories?: string[];
}