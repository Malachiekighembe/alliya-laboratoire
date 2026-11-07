import { Module } from "@nestjs/common";
import { DatabaseModule } from "../database/database.module.js";
import { OrdersService } from "./orders.service.js";
import { OrdersController } from "./orders.controller.js";

@Module({
  imports: [DatabaseModule],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}
