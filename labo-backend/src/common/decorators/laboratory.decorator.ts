import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentLaboratory = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.laboratory_id || request.user?.laboratory_id;
  },
);
