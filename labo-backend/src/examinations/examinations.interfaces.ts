export interface TestCatalogStatistics {
  test_id: string;
  code: string;
  name: string;
  category?: string | null;
  usage_count: number;
}

export interface ExaminationListResult {
  items: any[];
  total: number;
}
