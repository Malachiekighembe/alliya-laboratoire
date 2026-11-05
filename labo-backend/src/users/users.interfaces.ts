export interface UserWithRoles {
  id: string;
  laboratory_id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  is_active: boolean;
  email_verified: boolean;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
  roles: { id: string; code: string; name: string }[];
}

export interface PaginationParams {
  page: number;
  limit: number;
  skip: number;
  take: number;
}
