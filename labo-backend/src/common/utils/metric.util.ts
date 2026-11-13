import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service.js';

@Injectable()
export class MetricUtil {
  constructor(private prisma: DatabaseService) {}

  /**
   * Génère un matricule au format LAB/CODE/ANNEE/0001
   * Génération atomique côté base de données (fonction generate_matricule)
   * @param laboratoryId ID du laboratoire
   * @param entityType Type d'entité (PAT, VIS, ORD, ECH, RES, CAR, FAC, REC, etc.)
   * @param prefix Préfixe (toujours LAB)
   */
  async generateMatricule(
    laboratoryId: string,
    entityType: string,
    prefix: string = 'LAB',
  ): Promise<string> {
    const year = new Date().getFullYear();

    try {
      const matricule: string = await this.prisma.rpc('generate_matricule', {
        p_laboratory_id: laboratoryId,
        p_entity_type: entityType,
        p_year: year,
      });
      return matricule;
    } catch (err) {
      // Fallback : transaction atomique côté application si la fonction DB est indisponible
      const result = await this.prisma.$transaction(async (tx: any) => {
        const counter = await tx.matricule_counters.upsert({
          where: {
            laboratory_id_entity_type_year: {
              laboratory_id: laboratoryId,
              entity_type: entityType,
              year: year,
            },
          },
          create: {
            laboratory_id: laboratoryId,
            entity_type: entityType,
            year: year,
            last_number: 1,
          },
          update: {
            last_number: {
              increment: 1,
            },
          },
          select: {
            last_number: true,
          },
        });

        return counter.last_number;
      });

      const formattedNumber = result.toString().padStart(4, '0');
      return `${prefix}/${entityType}/${year}/${formattedNumber}`;
    }
  }

  async generatePatientMatricule(laboratoryId: string): Promise<string> {
    return this.generateMatricule(laboratoryId, 'PAT', 'LAB');
  }

  async generateVisitMatricule(laboratoryId: string): Promise<string> {
    return this.generateMatricule(laboratoryId, 'VIS', 'LAB');
  }

  async generateOrderMatricule(laboratoryId: string): Promise<string> {
    return this.generateMatricule(laboratoryId, 'ORD', 'LAB');
  }

  async generateSpecimenMatricule(laboratoryId: string): Promise<string> {
    return this.generateMatricule(laboratoryId, 'ECH', 'LAB');
  }

  async generateResultMatricule(laboratoryId: string): Promise<string> {
    return this.generateMatricule(laboratoryId, 'RES', 'LAB');
  }

  async generateCarnetMatricule(laboratoryId: string): Promise<string> {
    return this.generateMatricule(laboratoryId, 'CAR', 'LAB');
  }

  async generateInvoiceNumber(laboratoryId: string): Promise<string> {
    const year = new Date().getFullYear();
    const result = await this.prisma.$transaction(async (tx: any) => {
      const counter = await tx.matricule_counters.upsert({
        where: {
          laboratory_id_entity_type_year: {
            laboratory_id: laboratoryId,
            entity_type: 'FAC',
            year: year,
          },
        },
        create: {
          laboratory_id: laboratoryId,
          entity_type: 'FAC',
          year: year,
          last_number: 1,
        },
        update: {
          last_number: {
            increment: 1,
          },
        },
        select: {
          last_number: true,
        },
      });

      return counter.last_number;
    });

    const formattedNumber = result.toString().padStart(6, '0');
    return `FAC-${year}-${formattedNumber}`;
  }

  async generateReceiptNumber(laboratoryId: string): Promise<string> {
    const year = new Date().getFullYear();
    const result = await this.prisma.$transaction(async (tx: any) => {
      const counter = await tx.matricule_counters.upsert({
        where: {
          laboratory_id_entity_type_year: {
            laboratory_id: laboratoryId,
            entity_type: 'REC',
            year: year,
          },
        },
        create: {
          laboratory_id: laboratoryId,
          entity_type: 'REC',
          year: year,
          last_number: 1,
        },
        update: {
          last_number: {
            increment: 1,
          },
        },
        select: {
          last_number: true,
        },
      });

      return counter.last_number;
    });

    const formattedNumber = result.toString().padStart(6, '0');
    return `REC-${year}-${formattedNumber}`;
  }
}
