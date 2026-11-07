import { Injectable } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';

@Injectable()
export class SupabaseService {
  private readonly client: SupabaseClient;

  constructor() {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase URL and key must be provided');
    }

    this.client = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false,
      },
    });
  }

  getClient(): SupabaseClient {
    return this.client;
  }

  // Helper methods for common operations
  async getLaboratory(id: string) {
    const { data, error } = await this.client
      .from('laboratories')
      .select('*')
      .eq('id', id)
      .single();

    return { data, error };
  }

  async getLaboratoryByCode(code: string) {
    const { data, error } = await this.client
      .from('laboratories')
      .select('*')
      .eq('code', code)
      .single();

    return { data, error };
  }

  async getUser(id: string) {
    const { data, error } = await this.client
      .from('users')
      .select('*')
      .eq('id', id)
      .single();

    return { data, error };
  }

  async getUserByEmail(email: string, laboratoryId: string) {
    const { data, error } = await this.client
      .from('users')
      .select('*')
      .eq('email', email)
      .eq('laboratory_id', laboratoryId)
      .single();

    return { data, error };
  }

  async getPatients(laboratoryId: string, page = 1, limit = 50) {
    const offset = (page - 1) * limit;
    
    const { data, error } = await this.client
      .from('patients')
      .select('*')
      .eq('laboratory_id', laboratoryId)
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false });

    return { data, error };
  }

  async getPatient(id: string) {
    const { data, error } = await this.client
      .from('patients')
      .select('*')
      .eq('id', id)
      .single();

    return { data, error };
  }

  async createPatient(patient: any) {
    const { data, error } = await this.client
      .from('patients')
      .insert([patient])
      .select()
      .single();

    return { data, error };
  }

  async updatePatient(id: string, updates: any) {
    const { data, error } = await this.client
      .from('patients')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    return { data, error };
  }

  async getVisits(laboratoryId: string, page = 1, limit = 50) {
    const offset = (page - 1) * limit;
    
    const { data, error } = await this.client
      .from('visits')
      .select(`
        *,
        patient:patients(first_name, last_name),
        practitioner:practitioners(first_name, last_name),
        creator:users(first_name, last_name)
      `)
      .eq('laboratory_id', laboratoryId)
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false });

    return { data, error };
  }

  async getVisit(id: string) {
    const { data, error } = await this.client
      .from('visits')
      .select(`
        *,
        patient:patients(first_name, last_name),
        practitioner:practitioners(first_name, last_name),
        creator:users(first_name, last_name)
      `)
      .eq('id', id)
      .single();

    return { data, error };
  }

  async createVisit(visit: any) {
    const { data, error } = await this.client
      .from('visits')
      .insert([visit])
      .select()
      .single();

    return { data, error };
  }

  async getOrders(laboratoryId: string, page = 1, limit = 50) {
    const offset = (page - 1) * limit;
    
    const { data, error } = await this.client
      .from('orders')
      .select(`
        *,
        patient:patients(first_name, last_name),
        practitioner:practitioners(first_name, last_name),
        creator:users(first_name, last_name)
      `)
      .eq('laboratory_id', laboratoryId)
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false });

    return { data, error };
  }

  async getOrder(id: string) {
    const { data, error } = await this.client
      .from('orders')
      .select(`
        *,
        patient:patients(first_name, last_name),
        practitioner:practitioners(first_name, last_name),
        creator:users(first_name, last_name)
      `)
      .eq('id', id)
      .single();

    return { data, error };
  }

  async createOrder(order: any) {
    const { data, error } = await this.client
      .from('orders')
      .insert([order])
      .select()
      .single();

    return { data, error };
  }

  async getSpecimens(laboratoryId: string, page = 1, limit = 50) {
    const offset = (page - 1) * limit;
    
    const { data, error } = await this.client
      .from('specimens')
      .select(`
        *,
        patient:patients(first_name, last_name),
        collector:users(first_name, last_name),
        visit:visits(matricule)
      `)
      .eq('laboratory_id', laboratoryId)
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false });

    return { data, error };
  }

  async getSpecimen(id: string) {
    const { data, error } = await this.client
      .from('specimens')
      .select(`
        *,
        patient:patients(first_name, last_name),
        collector:users(first_name, last_name),
        visit:visits(matricule)
      `)
      .eq('id', id)
      .single();

    return { data, error };
  }

  async createSpecimen(specimen: any) {
    const { data, error } = await this.client
      .from('specimens')
      .insert([specimen])
      .select()
      .single();

    return { data, error };
  }

  async getResults(laboratoryId: string, page = 1, limit = 50) {
    const offset = (page - 1) * limit;
    
    const { data, error } = await this.client
      .from('results')
      .select(`
        *,
        specimen:specimens(matricule, patient:patients(first_name, last_name)),
        test_catalog:test_catalog(name, code),
        performed_by:users(first_name, last_name),
        validated_by:users(first_name, last_name)
      `)
      .eq('laboratory_id', laboratoryId)
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false });

    return { data, error };
  }

  async getResult(id: string) {
    const { data, error } = await this.client
      .from('results')
      .select(`
        *,
        specimen:specimens(matricule, patient:patients(first_name, last_name)),
        test_catalog:test_catalog(name, code),
        performed_by:users(first_name, last_name),
        validated_by:users(first_name, last_name)
      `)
      .eq('id', id)
      .single();

    return { data, error };
  }

  async createResult(result: any) {
    const { data, error } = await this.client
      .from('results')
      .insert([result])
      .select()
      .single();

    return { data, error };
  }

  async updateResult(id: string, updates: any) {
    const { data, error } = await this.client
      .from('results')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    return { data, error };
  }

  async getTestCatalog(laboratoryId: string) {
    const { data, error } = await this.client
      .from('test_catalog')
      .select('*')
      .eq('laboratory_id', laboratoryId)
      .eq('is_active', true)
      .order('name');

    return { data, error };
  }

  async createTest(test: any) {
    const { data, error } = await this.client
      .from('test_catalog')
      .insert([test])
      .select()
      .single();

    return { data, error };
  }

  async getInvoices(laboratoryId: string, page = 1, limit = 50) {
    const offset = (page - 1) * limit;
    
    const { data, error } = await this.client
      .from('invoices')
      .select(`
        *,
        patient:patients(first_name, last_name),
        visit:visits(matricule),
        order:orders(matricule)
      `)
      .eq('laboratory_id', laboratoryId)
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false });

    return { data, error };
  }

  async getInvoice(id: string) {
    const { data, error } = await this.client
      .from('invoices')
      .select(`
        *,
        patient:patients(first_name, last_name),
        visit:visits(matricule),
        order:orders(matricule)
      `)
      .eq('id', id)
      .single();

    return { data, error };
  }

  async createInvoice(invoice: any) {
    const { data, error } = await this.client
      .from('invoices')
      .insert([invoice])
      .select()
      .single();

    return { data, error };
  }

  async getProducts(laboratoryId: string) {
    const { data, error } = await this.client
      .from('products')
      .select('*')
      .eq('laboratory_id', laboratoryId)
      .eq('is_active', true)
      .order('name');

    return { data, error };
  }

  async createProduct(product: any) {
    const { data, error } = await this.client
      .from('products')
      .insert([product])
      .select()
      .single();

    return { data, error };
  }

  async getAuditLogs(laboratoryId: string, page = 1, limit = 50) {
    const offset = (page - 1) * limit;
    
    const { data, error } = await this.client
      .from('audit_logs')
      .select('*')
      .eq('laboratory_id', laboratoryId)
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false });

    return { data, error };
  }

  async createAuditLog(log: any) {
    const { data, error } = await this.client
      .from('audit_logs')
      .insert([{ id: randomUUID(), ...log }])
      .select()
      .single();

    return { data, error };
  }

  // Sync methods
  async syncLaboratory(laboratory: any) {
    const { data, error } = await this.client
      .from('laboratories')
      .upsert([laboratory])
      .eq('id', laboratory.id)
      .select()
      .single();

    return { data, error };
  }

  async syncUser(user: any) {
    const { data, error } = await this.client
      .from('users')
      .upsert([user])
      .eq('id', user.id)
      .select()
      .single();

    return { data, error };
  }

  async syncPatient(patient: any) {
    const { data, error } = await this.client
      .from('patients')
      .upsert([patient])
      .eq('id', patient.id)
      .select()
      .single();

    return { data, error };
  }

  async getOfflineData(laboratoryId: string, table: string, page = 1, limit = 50) {
    const offset = (page - 1) * limit;
    
    let query = this.client
      .from(table)
      .select('*')
      .eq('laboratory_id', laboratoryId)
      .eq('is_local_only', true)
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false });

    const { data, error } = await query;

    return { data, error };
  }

  async markAsSynced(table: string, id: string) {
    const { data, error } = await this.client
      .from(table)
      .update({
        sync_status: 'synced',
        sync_version: { increment: 1 },
        last_synced_at: new Date(),
        is_local_only: false,
      })
      .eq('id', id)
      .select()
      .single();

    return { data, error };
  }
}
