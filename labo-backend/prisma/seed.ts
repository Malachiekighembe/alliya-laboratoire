import { PrismaClient } from "@prisma/client";
import { randomUUID } from "node:crypto";

const prisma = new PrismaClient();

// 8 roles system par defaut
const ROLES = [
  { code: "SUPER_ADMIN", name: "Super Administrateur" },
  { code: "LAB_ADMIN", name: "Administrateur Laboratoire" },
  { code: "LAB_MANAGER", name: "Responsable Laboratoire" },
  { code: "BIOLOGIST", name: "Biologiste" },
  { code: "TECHNICIEN", name: "Technicien" },
  { code: "PHLEBOTOMIST", name: "Preleveur" },
  { code: "RECEPTIONNISTE", name: "Receptionniste" },
  { code: "COMPTABLE", name: "Comptable" },
];

const PERMISSIONS: Array<{
  code: string;
  name: string;
  module: string;
  action: string;
}> = [
  { code: "LAB_READ", name: "Lire laboratoire", module: "laboratory", action: "read" },
  { code: "LAB_WRITE", name: "Ecrire laboratoire", module: "laboratory", action: "write" },
  { code: "PATIENT_READ", name: "Lire patient", module: "patients", action: "read" },
  { code: "PATIENT_WRITE", name: "Ecrire patient", module: "patients", action: "write" },
  { code: "ORDER_READ", name: "Lire commande", module: "orders", action: "read" },
  { code: "ORDER_WRITE", name: "Ecrire commande", module: "orders", action: "write" },
  { code: "RESULT_READ", name: "Lire resultado", module: "results", action: "read" },
  { code: "RESULT_WRITE", name: "Ecrire resultado", module: "results", action: "write" },
  { code: "RESULT_VALIDATE", name: "Valider resultado", module: "results", action: "validate" },
  { code: "INVOICE_READ", name: "Lire facture", module: "invoices", action: "read" },
  { code: "INVOICE_WRITE", name: "Ecrire facture", module: "invoices", action: "write" },
  { code: "STOCK_READ", name: "Lire stock", module: "stock", action: "read" },
  { code: "STOCK_WRITE", name: "Ecrire stock", module: "stock", action: "write" },
];

async function main(): Promise<void> {
  console.log("Debut du seed Alliya Laboratoire...");

  // 1. Laboratoire par defaut
  const lab = await prisma.laboratories.upsert({
    where: { code: "LAB-DEFAULT" },
    update: {},
    create: {
      id: randomUUID(),
      code: "LAB-DEFAULT",
      name: "Laboratoire par defaut",
      slug: "laboratoire-par-defaut",
      email: "contact@alliya-laboratoire.fr",
      is_active: true,
    },
  });
  console.log(`Laboratoire cree : ${lab.id}`);

  // 2. Roles
  for (const role of ROLES) {
    await prisma.roles.upsert({
      where: { code: role.code },
      update: {},
      create: {
        id: randomUUID(),
        code: role.code,
        name: role.name,
        is_system: true,
      },
    });
  }
  console.log(`${ROLES.length} roles crees`);

  // 3. Permissions
  for (const perm of PERMISSIONS) {
    await prisma.permissions.upsert({
      where: { code: perm.code },
      update: {},
      create: {
        id: randomUUID(),
        code: perm.code,
        name: perm.name,
        module: perm.module,
        action: perm.action,
      },
    });
  }
  console.log(`${PERMISSIONS.length} permissions creees`);

  console.log("Seed termine avec succès.");
}

main()
  .catch((err: unknown) => {
    console.error("Seed error:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
