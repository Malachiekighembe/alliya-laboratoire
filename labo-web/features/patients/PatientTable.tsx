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
      <div className="text-center py-12 text-gray-500">
        Aucun patient trouvÃ©
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="text-left text-sm font-medium text-gray-600 w-24 py-3">Matricule</th>
            <th className="text-left text-sm font-medium text-gray-600 py-3">Nom</th>
            <th className="text-left text-sm font-medium text-gray-600 w-32 py-3">TÃ©lÃ©phone</th>
            <th className="text-left text-sm font-medium text-gray-600 w-24 py-3">Statut</th>
            <th className="text-right text-sm font-medium text-gray-600 w-32 py-3">Actions</th>
          </tr>
        </thead>
        <tbody>
          {patients.map((patient) => (
            <tr key={patient.id} className="border-b border-gray-100 hover:bg-gray-50">
              <td className="text-sm font-mono py-3">{patient.matricule}</td>
              <td className="text-sm py-3">
                {patient.first_name} {patient.last_name}
              </td>
              <td className="text-sm py-3">{patient.phone || 'â€”'}</td>
              <td className="text-sm py-3">
                {patient.is_active ? (
                  <span className="bg-[#3D9597]/15 text-[#2E7A7C] px-2 py-1 rounded-full text-xs font-medium">
                    Actif
                  </span>
                ) : (
                  <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-medium">
                    Inactif
                  </span>
                )}
              </td>
              <td className="text-right text-sm py-3 space-x-2">
                {onEdit && (
                  <button
                    onClick={() => onEdit(patient)}
                    className="text-[#07122E] hover:text-[#3D9597] font-medium text-sm"
                  >
                    Voir
                  </button>
                )}
                {onDelete && (
                  <button
                    onClick={() => onDelete(patient)}
                    className="text-red-600 hover:text-red-800 font-medium text-sm"
                  >
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
