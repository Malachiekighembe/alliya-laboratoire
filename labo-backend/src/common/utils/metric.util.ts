import { PrismaService } from '../../prisma/prisma.service.js';

export class MetricUtil {
  constructor(private prisma: PrismaService) {}

  /**
   * Génère un matricule au format LAB/PAT/YYYY/0001
   * @param laboratoryId ID du laboratoire
   * @param entityType Type d'entité (PAT, VIS, ORD, etc.)
   * @param prefix Préfixe personnalisé (défaut: LAB)
   */
  async generateMatricule(
    laboratoryId: string,
    entityType: string,
    prefix: string = 'LAB',
  ): Promise<string> {
    const year = new Date().getFullYear();

    const result = await this.prisma.$transaction(async (tx: any) => {
      // Récupérer ou créer le compteur pour ce laboratoire, entité et année
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

  /**
   * Génère un matricule pour un patient
   */
  async generatePatientMatricule(laboratoryId: string): Promise<string> {
    return this.generateMatricule(laboratoryId, 'PAT', 'LAB');
  }

  /**
   * Génère un matricule pour une visite
   */
  async generateVisitMatricule(laboratoryId: string): Promise<string> {
    return this.generateMatricule(laboratoryId, 'VIS', 'LAB');
  }

  /**
   * Génère un matricule pour une ordonnance
   */
  async generateOrderMatricule(laboratoryId: string): Promise<string> {
    return this.generateMatricule(laboratoryId, 'ORD', 'LAB');
  }

  /**
   * Génère un matricule pour un échantillon
   */
  async generateSpecimenMatricule(laboratoryId: string): Promise<string> {
    return this.generateMatricule(laboratoryId, 'ECH', 'LAB');
  }

  /**
   * Génère un matricule pour un résultat
   */
  async generateResultMatricule(laboratoryId: string): Promise<string> {
    return this.generateMatricule(laboratoryId, 'RES', 'LAB');
  }

  /**
   * Génère un numéro de facture
   */
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

  /**
   * Génère un numéro de reçu
   */
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
