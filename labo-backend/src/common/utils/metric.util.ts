import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service.js';

@Injectable()
export class MetricUtil {
  private readonly logger = new Logger(MetricUtil.name);

  constructor(private prisma: DatabaseService) {}

  /**
   * Genere un matricule au format LAB/<CODE>/<YEAR>/<4 chiffres>.
   * Tentative via RPC atomique, repli sur le compteur applicatif si la RPC est indisponible.
   */
  async generateMatricule(
    laboratoryId: string,
    entityType: string,
    prefix: string = 'LAB',
  ): Promise<string> {
    try {
      const matricule = await this.prisma.rpc('generate_matricule', {
        p_laboratory_id: laboratoryId,
        p_entity_type: entityType,
        p_prefix: prefix,
      });
      if (typeof matricule === 'string' && matricule) return matricule;
      throw new Error('Réponse RPC invalide');
    } catch (error: any) {
      this.logger.warn(
        `RPC generate_matricule indisponible pour ${entityType}, repli sur matricule_counters: ${error?.message || error}`,
      );
      return this.generateMatriculeFallback(laboratoryId, entityType, prefix);
    }
  }

  private async generateMatriculeFallback(
    laboratoryId: string,
    entityType: string,
    prefix: string,
  ): Promise<string> {
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
      return Number(counter.last_number);
    });
    return `${prefix}/${entityType}/${year}/${String(result).padStart(4, '0')}`;
  }

  /**
   * Génère un matricule utilisateur pour les rôles supportés.
   * receptionist -> REC, technician/laborant -> TEC, biologist -> BIO.
   * Les autres rôles conservent un identifiant USR-* (évite la collision avec DOC).
   */
  generateUserMatricule(laboratoryId: string, role: string): Promise<string> | string {
    const normalized = String(role || '').toLowerCase();
    if (normalized === 'receptionist') return this.generateMatricule(laboratoryId, 'REC', 'LAB');
    if (normalized === 'technician' || normalized === 'laborant') return this.generateMatricule(laboratoryId, 'TEC', 'LAB');
    if (normalized === 'biologist') return this.generateMatricule(laboratoryId, 'BIO', 'LAB');
    return `USR-${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
  }

  async generatePatientMatricule(laboratoryId: string): Promise<string> { return this.generateMatricule(laboratoryId, 'PAT', 'LAB'); }
  async generateVisitMatricule(laboratoryId: string): Promise<string> { return this.generateMatricule(laboratoryId, 'VIS', 'LAB'); }
  async generateOrderMatricule(laboratoryId: string): Promise<string> { return this.generateMatricule(laboratoryId, 'DEM', 'LAB'); }
  async generateCollectionMatricule(laboratoryId: string): Promise<string> { return this.generateMatricule(laboratoryId, 'PRE', 'LAB'); }
  async generateSpecimenMatricule(laboratoryId: string): Promise<string> { return this.generateMatricule(laboratoryId, 'ECH', 'LAB'); }
  async generateAnalysisMatricule(laboratoryId: string): Promise<string> { return this.generateMatricule(laboratoryId, 'ANA', 'LAB'); }
  async generateResultMatricule(laboratoryId: string): Promise<string> { return this.generateMatricule(laboratoryId, 'RES', 'LAB'); }
  async generateReportMatricule(laboratoryId: string): Promise<string> { return this.generateMatricule(laboratoryId, 'RAP', 'LAB'); }
  async generateCarnetMatricule(laboratoryId: string): Promise<string> { return this.generateMatricule(laboratoryId, 'CAR', 'LAB'); }
  async generateConsultationMatricule(laboratoryId: string): Promise<string> { return this.generateMatricule(laboratoryId, 'CON', 'LAB'); }
  async generatePrescriptionMatricule(laboratoryId: string): Promise<string> { return this.generateMatricule(laboratoryId, 'PRN', 'LAB'); }
  async generateAppointmentMatricule(laboratoryId: string): Promise<string> { return this.generateMatricule(laboratoryId, 'REN', 'LAB'); }

  async generateInvoiceNumber(laboratoryId: string): Promise<string> { return this.generateMatricule(laboratoryId, 'FAC', 'LAB'); }
  async generatePaymentMatricule(laboratoryId: string): Promise<string> { return this.generateMatricule(laboratoryId, 'PAY', 'LAB'); }
  async generateReceiptNumber(laboratoryId: string): Promise<string> { return this.generateMatricule(laboratoryId, 'REC', 'LAB'); }
}
