import React from 'react';
import { Patient } from "../../lib/api-client";

interface PatientTableProps {
  patients: Patient[];
  onEdit?: (patient: Patient) => void;
  onDelete?: (patient: Patient) => void;
}

export function PatientTable({ patients, onEdit, onDelete }: PatientTableProps) {
  if (patients.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Aucun patient trouvé
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left text-sm font-medium text-muted-foreground w-24">Matricule</th>
            <th className="text-left text-sm font-medium text-muted-foreground">Nom</th>
            <th className="text-left text-sm font-medium text-muted-foreground w-32">Téléphone</th>
            <th className="text-left text-sm font-medium text-muted-foreground w-24">Statut</th>
            <th className="text-right text-sm font-medium text-muted-foreground w-32">Actions</th>
          </tr>
        </thead>
        <tbody>
          {patients.map((patient) => (
            <tr key={patient.id} className="border-b border-border/50 hover:bg-muted/50">
              <td className="text-sm font-mono">{patient.matricule}</td>
              <td className="text-sm">
                {patient.first_name} {patient.last_name}
              </td>
              <td className="text-sm">{patient.phone || '—'}</td>
              <td className="text-sm">
                {patient.is_active ? (
                  <span className="text-green-600 font-medium">Actif</span>
                ) : (
                  <span className="text-red-600 font-medium">Inactif</span>
                )}
              </td>
              <td className="text-right text-sm space-x-2">
                {onEdit && (
                  <button onClick={() => onEdit(patient)} className="text-primary hover:underline">
                    Voir
                  </button>
                )}
                {onDelete && (
                  <button onClick={() => onDelete(patient)} className="text-destructive hover:underline">
                    Supprimer
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}