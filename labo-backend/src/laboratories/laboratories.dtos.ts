export class CreateLaboratoryDto {
  code?: string;
  name?: string;
  slug?: string;
  email?: string;
  phone?: string;
  address?: string;
  logo_url?: string | null;
  is_active?: boolean;
}

export class UpdateLaboratoryDto {
  code?: string;
  name?: string;
  slug?: string;
  email?: string;
  phone?: string;
  address?: string;
  logo_url?: string | null;
  is_active?: boolean;
}

