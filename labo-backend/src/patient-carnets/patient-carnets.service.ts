import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service.js';
import { MetricUtil } from '../common/utils/metric.util.js';
import { CreatePatientCarnetDto, UpdatePatientCarnetDto } from './patient-carnets.dtos.js';
import { PatientCarnet, PatientCarnetWithVisits } from './patient-carnets.interfaces.js';

@Injectable()
export class PatientCarnetsService {
  constructor(
    private readonly prisma: DatabaseService,
    private readonly metricUtil: MetricUtil,
  ) {}

  async createCarnet(laboratory_id: string, patient_id: string): Promise<PatientCarnet> {
    const existing = await this.prisma.patient_carnets.findFirst({
      where: {
        laboratory_id,
        patient_id,
        deleted_at: null,
      },
    });

    if (existing) {
      return existing;
    }

    const patient = await this.prisma.patients.findFirst({
      where: { id: patient_id, laboratory_id, deleted_at: null },
    });

    if (!patient) {
      throw new NotFoundException('Patient non trouvé');
    }

    const matricule = await this.metricUtil.generateMatricule(laboratory_id, 'CAR', 'LAB');

    const carnet = await this.prisma.patient_carnets.create({
      data: {
        laboratory_id,
        patient_id,
        matricule,
        visit_count: 0,
      },
    });

    return carnet;
  }

  async getCarnetByPatient(laboratory_id: string, patient_id: string): Promise<PatientCarnet | null> {
    return this.prisma.patient_carnets.findFirst({
      where: {
        laboratory_id,
        patient_id,
        deleted_at: null,
      },
    });
  }

  async getCarnetById(id: string, laboratory_id: string): Promise<PatientCarnet | null> {
    return this.prisma.patient_carnets.findFirst({
      where: { id, laboratory_id, deleted_at: null },
    });
  }

  async getCarnetWithVisits(laboratory_id: string, patient_id: string): Promise<PatientCarnetWithVisits | null> {
    const carnet = await this.getCarnetByPatient(laboratory_id, patient_id);
    if (!carnet) return null;

    const visits = await this.prisma.visits.findMany({
      where: {
        laboratory_id,
        patient_id,
        deleted_at: null,
      },
      orderBy: { visit_date: 'desc' },
    });

    return { ...carnet, visits };
  }

  async update(id: string, laboratory_id: string, dto: UpdatePatientCarnetDto): Promise<PatientCarnet> {
    const existing = await this.getCarnetById(id, laboratory_id);
    if (!existing) {
      throw new NotFoundException('Carnet non trouvé');
    }

    const data: any = {};
    if (dto.matricule !== undefined) data.matricule = dto.matricule;

    return this.prisma.patient_carnets.update({
      where: { id },
      data,
    });
  }

  async remove(id: string, laboratory_id: string): Promise<{ success: boolean }> {
    const existing = await this.getCarnetById(id, laboratory_id);
    if (!existing) {
      throw new NotFoundException('Carnet non trouvé');
    }

    await this.prisma.patient_carnets.update({
      where: { id },
      data: { deleted_at: new Date(), is_active: false },
    });

    return { success: true };
  }

  async incrementVisitCount(carnetId: string): Promise<void> {
    await this.prisma.patient_carnets.update({
      where: { id: carnetId },
      data: { visit_count: { increment: 1 } },
    });
  }
}
