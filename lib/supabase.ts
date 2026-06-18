import { createClient, SupabaseClient } from '@supabase/supabase-js'

export type OpportunityType = 'conference' | 'event' | 'case_comp'
export type IndustryType = 'finance' | 'consulting' | 'both' | 'other'

export interface Opportunity {
  id: string
  title: string
  organizer: string
  type: OpportunityType
  industry: IndustryType
  grad_year: number[]
  location: string
  date_start: string
  date_end: string
  deadline: string
  description: string
  registration_url: string
  is_paid: boolean
  is_verified: boolean
  created_at: string
  source_url: string
}

let _supabase: SupabaseClient | null = null

export function getSupabase(): SupabaseClient {
  if (!_supabase) {
    _supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  }
  return _supabase
}


export function getServiceClient(): SupabaseClient {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}
