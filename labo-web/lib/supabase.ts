import { createClient } from '@supabase/supabase-js'
import { createBrowserClient } from '@supabase/auth-helpers-nextjs'

// Create a singleton Supabase client for the frontend
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey)

// Helper functions for common operations
export const supabaseAuth = {
  signUp: async (email: string, password: string, metadata?: { first_name?: string; last_name?: string; laboratory_id?: string }) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata
      }
    })
    return { data, error }
  },

  signIn: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    return { data, error }
  },

  signOut: async () => {
    const { error } = await supabase.auth.signOut()
    return { error }
  },

  getUser: async () => {
    const { data, error } = await supabase.auth.getUser()
    return { user: data?.user, error }
  },

  onAuthStateChange: (callback: (event: string, session: any) => void) => {
    return supabase.auth.onAuthStateChange(callback)
  }
}

// Database operations
export const supabaseDb = {
  // Laboratories
  getLaboratories: () => supabase.from('laboratories').select('*, subscriptions(*), lab_stats(*)'),
  getLaboratory: (id: string) => supabase.from('laboratories').select('*').eq('id', id).single(),
  createLaboratory: (data: any) => supabase.from('laboratories').insert(data).select().single(),
  updateLaboratory: (id: string, data: any) => supabase.from('laboratories').update(data).eq('id', id).select().single(),
  deleteLaboratory: (id: string) => supabase.from('laboratories').delete().eq('id', id),

  // Subscriptions
  createSubscription: (data: any) => supabase.from('subscriptions').insert(data).select().single(),
  updateSubscription: (id: string, data: any) => supabase.from('subscriptions').update(data).eq('id', id).select().single(),
  
  // Users
  getUsers: (laboratory_id: string) => supabase.from('users').select('*').eq('laboratory_id', laboratory_id),
  getUser: (id: string) => supabase.from('users').select('*').eq('id', id).single(),
  
  // Patients
  getPatients: (laboratory_id: string) => supabase.from('patients').select('*').eq('laboratory_id', laboratory_id),
  getPatient: (id: string) => supabase.from('patients').select('*').eq('id', id).single(),
  createPatient: (data: any) => supabase.from('patients').insert(data),
  updatePatient: (id: string, data: any) => supabase.from('patients').update(data).eq('id', id),
  
  // Visits
  getVisits: (laboratory_id: string) => supabase.from('visits').select('*').eq('laboratory_id', laboratory_id),
  getVisit: (id: string) => supabase.from('visits').select('*').eq('id', id).single(),
  createVisit: (data: any) => supabase.from('visits').insert(data),
  
  // Orders
  getOrders: (laboratory_id: string) => supabase.from('orders').select('*').eq('laboratory_id', laboratory_id),
  getOrder: (id: string) => supabase.from('orders').select('*').eq('id', id).single(),
  createOrder: (data: any) => supabase.from('orders').insert(data),
  
  // Specimens
  getSpecimens: (laboratory_id: string) => supabase.from('specimens').select('*').eq('laboratory_id', laboratory_id),
  getSpecimen: (id: string) => supabase.from('specimens').select('*').eq('id', id).single(),
  createSpecimen: (data: any) => supabase.from('specimens').insert(data),
  
  // Results
  getResults: (laboratory_id: string) => supabase.from('results').select('*').eq('laboratory_id', laboratory_id),
  getResult: (id: string) => supabase.from('results').select('*').eq('id', id).single(),
  createResult: (data: any) => supabase.from('results').insert(data),
  updateResult: (id: string, data: any) => supabase.from('results').update(data).eq('id', id),
  
  // Test Catalog
  getTestCatalog: (laboratory_id: string) => supabase.from('test_catalog').select('*').eq('laboratory_id', laboratory_id),
  createTest: (data: any) => supabase.from('test_catalog').insert(data),
  
  // Invoices
  getInvoices: (laboratory_id: string) => supabase.from('invoices').select('*').eq('laboratory_id', laboratory_id),
  getInvoice: (id: string) => supabase.from('invoices').select('*').eq('id', id).single(),
  createInvoice: (data: any) => supabase.from('invoices').insert(data),
  
  // Products and Stock
  getProducts: (laboratory_id: string) => supabase.from('products').select('*').eq('laboratory_id', laboratory_id),
  createProduct: (data: any) => supabase.from('products').insert(data),
  
  // Audit Logs
  getAuditLogs: (laboratory_id: string) => supabase.from('audit_logs').select('*').eq('laboratory_id', laboratory_id).order('created_at', { ascending: false })
}