export class CreateSubscriptionDto {
  laboratory_id: string;
  plan: string;
  plan_name?: string;
  status?: string;
  started_at?: string;
  expires_at?: string;
  price_monthly?: number;
  currency?: string;
  max_users?: number;
  max_patients?: number;
  max_analyses?: number;
  auto_renew?: boolean;
}

export class UpdateSubscriptionDto {
  plan?: string;
  plan_name?: string;
  status?: string;
  started_at?: string;
  expires_at?: string;
  price_monthly?: number;
  currency?: string;
  max_users?: number;
  max_patients?: number;
  max_analyses?: number;
  auto_renew?: boolean;
}
