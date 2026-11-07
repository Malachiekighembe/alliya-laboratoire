import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service.js';
import { MetricUtil } from '../common/utils/metric.util.js';
import { CreatePatientContactDto, CreatePatientDto, UpdatePatientContactDto, UpdatePatientDto } from './patients.dtos.js';
import { PaginationDto } from '../common/dto/pagination.dto.js';

@Injectable()
export class PatientsService {
  constructor(
    private readonly prisma: DatabaseService,
    private readonly metricUtil: MetricUtil,
  ) {}

  async create(createPatientDto: CreatePatientDto, laboratory_id: string) {
    const matricule = await this.metricUtil.generatePatientMatricule(laboratory_id);

    const data: any = {
      laboratory_id,
      matricule,
      first_name: createPatientDto.first_name,
      last_name: createPatientDto.last_name,
      birth_date: createPatientDto.birth_date ? new Date(createPatientDto.birth_date) : null,
      gender: createPatientDto.gender || 'UNKNOWN',
      phone: createPatientDto.phone || null,
      email: createPatientDto.email || null,
      address: createPatientDto.address || null,
      ssn: createPatientDto.ssn || null,
      is_active: true,
    };

    const patient = await this.prisma.patients.create({
      data,
    });

    return patient;
  }

  async createContact(patient_id: string, laboratory_id: string, createContactDto: CreatePatientContactDto) {
    // Vérifier que le patient existe et appartient au laboratoire
    const patient = await this.prisma.patients.findFirst({
      where: {
        id: patient_id,
        laboratory_id,
        deleted_at: null,
      },
    });

    if (!patient) {
      throw new NotFoundException('Patient non trouvé');
    }

    // Si le contact est marqué comme primaire, désactiver les autres contacts primaires
    if (createContactDto.is_primary) {
      await this.prisma.patient_contacts.updateMany({
        where: {
          patient_id,
          laboratory_id,
          is_primary: true,
        },
        data: {
          is_primary: false,
        },
      });
    }

    const contact = await this.prisma.patient_contacts.create({
      data: {
        patient_id,
        laboratory_id,
        first_name: createContactDto.first_name,
        last_name: createContactDto.last_name,
        relationship: createContactDto.relationship,
        phone: createContactDto.phone,
        email: createContactDto.email || null,
        is_primary: createContactDto.is_primary || false,
      },
    });

    return contact;
  }

  async findAll(laboratory_id: string, pagination: PaginationDto, search?: string) {
    const where: any = {
      laboratory_id,
      deleted_at: null,
    };

    if (search || pagination.search) {
      const searchTerm = search || pagination.search;
      where.OR = [
        { first_name: { contains: searchTerm, mode: 'insensitive' } },
        { last_name: { contains: searchTerm, mode: 'insensitive' } },
        { matricule: { contains: searchTerm, mode: 'insensitive' } },
        { phone: { contains: searchTerm, mode: 'insensitive' } },
        { email: { contains: searchTerm, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.patients.findMany({
        where,
        skip: pagination.skip,
        take: pagination.take,
        orderBy: { created_at: 'desc' },
        include: {
          patient_contacts: true,
        },
      }),
      this.prisma.patients.count({ where }),
    ]);

    return { items, total };
  }

  async findById(id: string, laboratory_id: string) {
    const patient = await this.prisma.patients.findFirst({
      where: {
        id,
        laboratory_id,
        deleted_at: null,
      },
      include: {
        patient_contacts: true,
      },
    });

    if (!patient) {
      throw new NotFoundException('Patient non trouvé');
    }

    return patient;
  }

  async findByMatricule(matricule: string, laboratory_id: string) {
    const patient = await this.prisma.patients.findFirst({
      where: {
        matricule,
        laboratory_id,
        deleted_at: null,
      },
      include: {
        patient_contacts: true,
      },
    });

    if (!patient) {
      throw new NotFoundException('Patient non trouvé');
    }

    return patient;
  }

  async update(id: string, laboratory_id: string, updatePatientDto: UpdatePatientDto) {
    // Vérifier que le patient existe
    const existing = await this.prisma.patients.findFirst({
      where: {
        id,
        laboratory_id,
        deleted_at: null,
      },
    });

    if (!existing) {
      throw new NotFoundException('Patient non trouvé');
    }

    const data: any = {};

    if (updatePatientDto.first_name !== undefined) data.first_name = updatePatientDto.first_name;
    if (updatePatientDto.last_name !== undefined) data.last_name = updatePatientDto.last_name;
    if (updatePatientDto.birth_date !== undefined) {
      data.birth_date = updatePatientDto.birth_date ? new Date(updatePatientDto.birth_date) : null;
    }
    if (updatePatientDto.gender !== undefined) data.gender = updatePatientDto.gender;
    if (updatePatientDto.phone !== undefined) data.phone = updatePatientDto.phone || null;
    if (updatePatientDto.email !== undefined) data.email = updatePatientDto.email || null;
    if (updatePatientDto.address !== undefined) data.address = updatePatientDto.address || null;
    if (updatePatientDto.ssn !== undefined) data.ssn = updatePatientDto.ssn || null;

    const patient = await this.prisma.patients.update({
      where: { id },
      data,
    });

    return patient;
  }

  async updateContact(contactId: string, laboratory_id: string, dto: UpdatePatientContactDto) {
    const contact = await this.prisma.patient_contacts.findFirst({
      where: {
        id: contactId,
        laboratory_id,
      },
    });

    if (!contact) {
      throw new NotFoundException('Contact non trouvé');
    }

    // Si le contact est marqué comme primaire, désactiver les autres contacts primaires
    if (dto.is_primary && !contact.is_primary) {
      await this.prisma.patient_contacts.updateMany({
        where: {
          patient_id: contact.patient_id,
          laboratory_id,
          is_primary: true,
        },
        data: {
          is_primary: false,
        },
      });
    }

    const data: any = {};
    if (dto.first_name !== undefined) data.first_name = dto.first_name;
    if (dto.last_name !== undefined) data.last_name = dto.last_name;
    if (dto.relationship !== undefined) data.relationship = dto.relationship;
    if (dto.phone !== undefined) data.phone = dto.phone;
    if (dto.email !== undefined) data.email = dto.email || null;
    if (dto.is_primary !== undefined) data.is_primary = dto.is_primary;

    const updated = await this.prisma.patient_contacts.update({
      where: { id: contactId },
      data,
    });

    return updated;
  }

  async remove(id: string, laboratory_id: string) {
    const existing = await this.prisma.patients.findFirst({
      where: {
        id,
        laboratory_id,
        deleted_at: null,
      },
    });

    if (!existing) {
      throw new NotFoundException('Patient non trouvé');
    }

    await this.prisma.patients.update({
      where: { id },
      data: {
        deleted_at: new Date(),
        is_active: false,
      },
    });

    return { success: true };
  }

  async removeContact(contactId: string, laboratory_id: string) {
    const contact = await this.prisma.patient_contacts.findFirst({
      where: {
        id: contactId,
        laboratory_id,
      },
    });

    if (!contact) {
      throw new NotFoundException('Contact non trouvé');
    }

    await this.prisma.patient_contacts.delete({
      where: { id: contactId },
    });

    return { success: true };
  }

  async getContacts(patientId: string, laboratory_id: string) {
    const patient = await this.prisma.patients.findFirst({
      where: {
        id: patientId,
        laboratory_id,
        deleted_at: null,
      },
    });

    if (!patient) {
      throw new NotFoundException('Patient non trouvé');
    }

    const contacts = await this.prisma.patient_contacts.findMany({
      where: {
        patient_id: patientId,
        laboratory_id,
      },
      orderBy: [{ is_primary: 'desc' }, { created_at: 'asc' }],
    });

    return contacts;
  }

  async search(query: string, laboratory_id: string, limit: number = 10) {
    if (!query || query.trim() === '') {
      return [];
    }

    const searchTerm = query.trim();

    const patients = await this.prisma.patients.findMany({
      where: {
        laboratory_id,
        deleted_at: null,
        OR: [
          { first_name: { contains: searchTerm, mode: 'insensitive' } },
          { last_name: { contains: searchTerm, mode: 'insensitive' } },
          { matricule: { contains: searchTerm, mode: 'insensitive' } },
          { phone: { contains: searchTerm, mode: 'insensitive' } },
        ],
      },
      take: limit,
      orderBy: { created_at: 'desc' },
    });

    return patients;
  }
}
