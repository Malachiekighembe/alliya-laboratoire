import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service.js';

/** Correspondance rôle → code de matricule utilisateur (§1.2). */
const ROLE_MATRICULE_CODES: Record<string, string> = {
  super_admin: 'ADM',
  admin: 'ADM',
  lab_manager: 'ADM',
  receptionist: 'REC',
  technician: 'TEC',
  laborant: 'TEC',
  biologist: 'BIO',
  doctor: 'DOC',
  viewer: 'SUP',
};

@Injectable()
export class MetricUtil {
  constructor(private prisma: DatabaseService) {}

  /**
   * Incrémente et retourne le compteur d'un type d'entité pour un laboratoire.
   * Utilisé pour les numéros au format préfixe-ANNEE-000000 (FAC, REC).
   */
  private async nextCounter(laboratoryId: string, entityType: string): Promise<number> {
    const year = new Date().getFullYear();
    const result = await this.prisma.$transaction(async (tx: any) => {
      const counter = await tx.matricule_counters.upsert({
        where: {
          laboratory_id_entity_type_year: {
            laboratory_id: laboratoryId,
            entity_type: entityType,
            year,
          },
        },
        create: { laboratory_id: laboratoryId, entity_type: entityType, year, last_number: 1 },
        update: { last_number: { increment: 1 } },
        select: { last_number: true },
      });
      return counter.last_number;
    });
    return Number(result);
  }

  /**
   * Génère un matricule au format LAB/CODE/ANNEE/0001
   * Génération atomique côté base de données (fonction generate_matricule)
   * @param laboratoryId ID du laboratoire
   * @param entityType Type d'entité (PAT, VIS, DEM, PRE, ECH, ANA, RES, RAP, FAC, PAY, REN, ...)
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
    } catch {
      // Fallback : transaction atomique côté application si la fonction DB est indisponible
      const result = await this.prisma.$transaction(async (tx: any) => {
        const counter = await tx.matricule_counters.upsert({
          where: {
            laboratory_id_entity_type_year: {
              laboratory_id: laboratoryId,
              entity_type: entityType,
              year,
            },
          },
          create: { laboratory_id: laboratoryId, entity_type: entityType, year, last_number: 1 },
          update: { last_number: { increment: 1 } },
          select: { last_number: true },
        });
        return counter.last_number;
      });

      const formattedNumber = result.toString().padStart(4, '0');
      return `${prefix}/${entityType}/${year}/${formattedNumber}`;
    }
  }

  // --- Utilisateurs (§1.2) -------------------------------------------------
  async generateUserMatricule(laboratoryId: string, role: string): Promise<string> {
    return this.generateMatricule(laboratoryId, ROLE_MATRICULE_CODES[role] ?? 'USR', 'LAB');
  }

  // --- Dossiers et opérations (§1.3) --------------------------------------
  async generatePatientMatricule(laboratoryId: string): Promise<string> {
    return this.generateMatricule(laboratoryId, 'PAT', 'LAB');
  }

  async generateVisitMatricule(laboratoryId: string): Promise<string> {
    return this.generateMatricule(laboratoryId, 'VIS', 'LAB');
  }

  /** Demande d'analyses (table orders). */
  async generateOrderMatricule(laboratoryId: string): Promise<string> {
    return this.generateMatricule(laboratoryId, 'DEM', 'LAB');
  }

  async generateCollectionMatricule(laboratoryId: string): Promise<string> {
    return this.generateMatricule(laboratoryId, 'PRE', 'LAB');
  }

  async generateSpecimenMatricule(laboratoryId: string): Promise<string> {
    return this.generateMatricule(laboratoryId, 'ECH', 'LAB');
  }

  async generateAnalysisMatricule(laboratoryId: string): Promise<string> {
    return this.generateMatricule(laboratoryId, 'ANA', 'LAB');
  }

  async generateResultMatricule(laboratoryId: string): Promise<string> {
    return this.generateMatricule(laboratoryId, 'RES', 'LAB');
  }

  async generateReportMatricule(laboratoryId: string): Promise<string> {
    return this.generateMatricule(laboratoryId, 'RAP', 'LAB');
  }

  async generateCarnetMatricule(laboratoryId: string): Promise<string> {
    return this.generateMatricule(laboratoryId, 'CAR', 'LAB');
  }

  async generateConsultationMatricule(laboratoryId: string): Promise<string> {
    return this.generateMatricule(laboratoryId, 'CON', 'LAB');
  }

  async generatePrescriptionMatricule(laboratoryId: string): Promise<string> {
    return this.generateMatricule(laboratoryId, 'PRN', 'LAB');
  }

  async generateAppointmentMatricule(laboratoryId: string): Promise<string> {
    return this.generateMatricule(laboratoryId, 'REN', 'LAB');
  }

  // --- Facturation (§6) ----------------------------------------------------
  async generateInvoiceNumber(laboratoryId: string): Promise<string> {
    const year = new Date().getFullYear();
    const next = await this.nextCounter(laboratoryId, 'FAC');
    return `FAC-${year}-${next.toString().padStart(6, '0')}`;
  }

  async generatePaymentMatricule(laboratoryId: string): Promise<string> {
    return this.generateMatricule(laboratoryId, 'PAY', 'LAB');
  }

  async generateReceiptNumber(laboratoryId: string): Promise<string> {
    const year = new Date().getFullYear();
    const next = await this.nextCounter(laboratoryId, 'RCP');
    return `REC-${year}-${next.toString().padStart(6, '0')}`;
  }
}