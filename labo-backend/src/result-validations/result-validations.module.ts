import { Module } from "@nestjs/common";
import { DatabaseModule } from "../database/database.module.js";
import { ResultValidationsService } from "./result-validations.service.js";
import { ResultValidationsController } from "./result-validations.controller.js";

@Module({
  imports: [DatabaseModule],
  controllers: [ResultValidationsController],
  providers: [ResultValidationsService],
  exports: [ResultValidationsService],
})
export class ResultValidationsModule {}
