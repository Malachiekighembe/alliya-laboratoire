export class CreateLaboratoryDto {
  code: string;
  name: string;
  slug: string;
  email?: string;
  phone?: string;
  address?: string;
  is_active?: boolean;
}

export class UpdateLaboratoryDto {
  code?: string;
  name?: string;
  slug?: string;
  email?: string;
  phone?: string;
  address?: string;
  is_active?: boolean;
}
