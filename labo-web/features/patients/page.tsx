"use client";
import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { PatientTable } from './PatientTable';
import { fetchPatients, createPatient } from './api';
import { api, Patient } from "../../lib/api-client";

export default function PatientsPage() {
  const { user, hasPermission } = useAuth();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    first_name: '', last_name: '', birth_date: '', gender: 'UNKNOWN',
    phone: '', email: '', address: '', ssn: '',
  });

  const load = async () => {
    if (!user) return;
    const res = await fetchPatients(user.laboratory_id, 1, 20, search || undefined);
    if (res.success) setPatients(res.data);
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Non authentifié</p>
      </div>
    );
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await createPatient(user.laboratory_id, formData);
      if (res.success) {
        setPatients((prev) => [res.data, ...prev]);
        setShowForm(false);
        setFormData({ first_name: '', last_name: '', birth_date: '', gender: 'UNKNOWN', phone: '', email: '', address: '', ssn: '' });
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Échec');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Gestion des Patients</h1>
            <p className="text-sm text-muted-foreground">Carnet médical</p>
          </div>
          {hasPermission('patients.create') && (
            <button onClick={() => setShowForm(!showForm)} className="btn-primary">
              {showForm ? 'Annuler' : '+ Nouveau patient'}
            </button>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {showForm && (
          <div className="card p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4">Nouveau patient</h2>
            <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">Prénom *</label>
                <input className="input" value={formData.first_name} onChange={(e) => setFormData({ ...formData, first_name: e.target.value })} required />
              </div>
              <div>
                <label className="label">Nom *</label>
                <input className="input" value={formData.last_name} onChange={(e) => setFormData({ ...formData, last_name: e.target.value })} required />
              </div>
              <div>
                <label className="label">Date de naissance</label>
                <input type="date" className="input" value={formData.birth_date} onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })} />
              </div>
              <div>
                <label className="label">Genre</label>
                <select className="input" value={formData.gender} onChange={(e) => setFormData({ ...formData, gender: e.target.value })}>
                  <option value="UNKNOWN">Inconnu</option>
                  <option value="M">Masculin</option>
                  <option value="F">Féminin</option>
                  <option value="OTHER">Autre</option>
                </select>
              </div>
              <div>
                <label className="label">Téléphone</label>
                <input className="input" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
              </div>
              <div>
                <label className="label">Email</label>
                <input type="email" className="input" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
              </div>
              <div className="md:col-span-2">
                <label className="label">Adresse</label>
                <input className="input" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} />
              </div>
              <div className="md:col-span-2 flex gap-2">
                <button type="submit" className="btn-primary">Enregistrer</button>
                <button type="button" onClick={() => setShowForm(false)} className="btn-ghost">Annuler</button>
              </div>
            </form>
          </div>
        )}

        <div className="card p-6">
          <div className="mb-4">
            <input
              className="input max-w-sm"
              placeholder="Rechercher par nom, prénom, matricule..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <PatientTable patients={patients} />
        </div>
      </main>
    </div>
  );
}