export class PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export class ApiResponseDto<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  pagination?: PaginationMeta;
  timestamp: string;

  constructor(partial: Partial<ApiResponseDto<T>>) {
    this.success = partial.success ?? true;
    this.data = partial.data;
    this.message = partial.message;
    this.pagination = partial.pagination;
    this.timestamp = partial.timestamp ?? new Date().toISOString();
  }

  static success<T>(data: T, message?: string): ApiResponseDto<T> {
    return new ApiResponseDto<T>({
      success: true,
      data,
      message,
    });
  }

  static successWithPagination<T>(
    data: T,
    pagination: PaginationMeta,
    message?: string,
  ): ApiResponseDto<T> {
    return new ApiResponseDto<T>({
      success: true,
      data,
      pagination,
      message,
    });
  }

  static error(message: string, data?: any): ApiResponseDto<any> {
    return new ApiResponseDto<any>({
      success: false,
      message,
      data,
    });
  }
}
