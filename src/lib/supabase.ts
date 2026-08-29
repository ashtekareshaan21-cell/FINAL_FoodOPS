import { createClient, User } from '@supabase/supabase-js';

// Read env variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Supabase environment variables NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are required in production.');
  } else {
    console.warn('Supabase environment variables are missing. Please define NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your .env file.');
  }
}

// Client-side/Isomorphic Supabase client (using anon key)
export const supabase = createClient(
  supabaseUrl || 'https://placeholder-url.supabase.co',
  supabaseAnonKey || 'placeholder-anon-key'
);

// Server-side admin client (using service role key)
export function getSupabaseAdmin() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable. This is required for server-side admin queries.');
  }
  return createClient(
    supabaseUrl || 'https://placeholder-url.supabase.co',
    serviceKey,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  );
}

// ==========================================
// TYPES & SCHEMAS
// ==========================================

export type UserRole = 'DONOR' | 'NGO' | 'VOLUNTEER' | 'ADMIN';

export interface UserProfile {
  id: string;
  email: string;
  phone_number?: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface DonorProfile {
  id: string;
  organization_name: string;
  organization_type: string;
  contact_person: string;
  address: string;
  latitude: number;
  longitude: number;
  created_at: string;
  updated_at: string;
}

export interface NGOProfile {
  id: string;
  organization_name: string;
  registration_number: string;
  status: 'PENDING_VERIFICATION' | 'VERIFIED' | 'SUSPENDED' | 'INACTIVE';
  base_address: string;
  base_latitude: number;
  base_longitude: number;
  service_radius_km: number;
  availability: 'AVAILABLE' | 'BUSY' | 'OFFLINE';
  contact_person: string;
  contact_phone: string;
  created_at: string;
  updated_at: string;
}

export interface Volunteer {
  id: string;
  ngo_id: string;
  name: string;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  phone_number: string;
  created_at: string;
  updated_at: string;
}

export interface Donation {
  id: string;
  donor_id: string;
  title: string;
  description: string;
  food_category: string;
  veg_non_veg_mixed: string;
  quantity: string;
  quantity_unit: string;
  estimated_servings?: number;
  preparation_time?: string;
  pickup_available_at: string;
  pickup_deadline_at: string;
  pickup_address: string;
  pickup_latitude: number;
  pickup_longitude: number;
  special_notes?: string;
  photo_url?: string;
  status:
    | 'AVAILABLE'
    | 'ACCEPTED'
    | 'VOLUNTEER_ASSIGNED'
    | 'PICKUP_IN_PROGRESS'
    | 'PICKED_UP'
    | 'DELIVERY_IN_PROGRESS'
    | 'DELIVERED'
    | 'COMPLETED'
    | 'CANCELLED'
    | 'EXPIRED'
    | 'RECOVERY_ESCALATED'
    | 'ORGANIC_RECOVERY';
  accepted_ngo_id?: string;
  created_at: string;
  updated_at: string;
  cancelled_at?: string;
  cancelled_by?: string;
  cancel_reason?: string;
}

export interface VolunteerAssignment {
  id: string;
  donation_id: string;
  volunteer_id: string;
  ngo_id: string;
  status: 'ASSIGNED' | 'STARTED' | 'ARRIVED' | 'COMPLETED' | 'CANCELLED';
  assigned_at: string;
  started_at?: string;
  arrived_at?: string;
  pickup_confirmed_at?: string;
  delivery_started_at?: string;
  delivery_confirmed_at?: string;
  cancelled_at?: string;
  cancel_reason?: string;
  last_location_update?: string;
  last_latitude?: number;
  last_longitude?: number;
  pickup_otp_hash?: string;
  pickup_otp_expires_at?: string;
  pickup_otp_attempts: number;
}

// ==========================================
// AUTH SESSION HELPER UTILITIES
// ==========================================

/**
 * Gets the currently authenticated user in Supabase auth session.
 */
export async function getAuthUser(): Promise<User | null> {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) {
    console.error('Error fetching Supabase auth user:', error.message);
    return null;
  }
  return user;
}

/**
 * Checks if a session is currently active and valid.
 */
export async function getAuthSession() {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error) {
    console.error('Error fetching Supabase session:', error.message);
    return null;
  }
  return session;
}

// ==========================================
// DATABASE QUERY HELPERS
// ==========================================

/**
 * Retrieves the public profile matching the user ID.
 */
export async function fetchUserProfile(userId: string): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    console.error(`Error fetching user profile for ${userId}:`, error.message);
    return null;
  }
  return data as UserProfile;
}

/**
 * Retrieves donor profile information for the given user ID.
 */
export async function fetchDonorProfile(userId: string): Promise<DonorProfile | null> {
  const { data, error } = await supabase
    .from('donor_profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    console.error(`Error fetching donor profile for ${userId}:`, error.message);
    return null;
  }
  return data as DonorProfile;
}

/**
 * Retrieves NGO profile information for the given user ID.
 */
export async function fetchNGOProfile(userId: string): Promise<NGOProfile | null> {
  const { data, error } = await supabase
    .from('ngo_profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    console.error(`Error fetching NGO profile for ${userId}:`, error.message);
    return null;
  }
  return data as NGOProfile;
}

/**
 * Retrieves volunteer profile information for the given user ID.
 */
export async function fetchVolunteer(userId: string): Promise<Volunteer | null> {
  const { data, error } = await supabase
    .from('volunteers')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    console.error(`Error fetching volunteer for ${userId}:`, error.message);
    return null;
  }
  return data as Volunteer;
}

/**
 * Fetches all available donations.
 */
export async function fetchAvailableDonations(): Promise<Donation[]> {
  const { data, error } = await supabase
    .from('donations')
    .select('*')
    .eq('status', 'AVAILABLE')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching available donations:', error.message);
    return [];
  }
  return data as Donation[];
}

/**
 * Fetches details of a specific donation by ID.
 */
export async function fetchDonationById(donationId: string): Promise<Donation | null> {
  const { data, error } = await supabase
    .from('donations')
    .select('*')
    .eq('id', donationId)
    .single();

  if (error) {
    console.error(`Error fetching donation ${donationId}:`, error.message);
    return null;
  }
  return data as Donation;
}

/**
 * Creates a new donation listing in the system.
 */
export async function createDonation(
  donation: Omit<Donation, 'id' | 'created_at' | 'updated_at' | 'status'>
): Promise<Donation | null> {
  const { data, error } = await supabase
    .from('donations')
    .insert([
      {
        ...donation,
        status: 'AVAILABLE',
      },
    ])
    .select()
    .single();

  if (error) {
    console.error('Error creating donation:', error.message);
    return null;
  }
  return data as Donation;
}

/**
 * Updates the status of a donation.
 */
export async function updateDonationStatus(
  donationId: string,
  status: Donation['status'],
  additionalFields: Partial<Donation> = {}
): Promise<Donation | null> {
  const { data, error } = await supabase
    .from('donations')
    .update({
      status,
      ...additionalFields,
      updated_at: new Date().toISOString(),
    })
    .eq('id', donationId)
    .select()
    .single();

  if (error) {
    console.error(`Error updating donation status for ${donationId}:`, error.message);
    return null;
  }
  return data as Donation;
}

/**
 * Assigns a volunteer to a donation event.
 */
export async function createVolunteerAssignment(
  donationId: string,
  volunteerId: string,
  ngoId: string
): Promise<VolunteerAssignment | null> {
  const { data, error } = await supabase
    .from('volunteer_assignments')
    .insert([
      {
        donation_id: donationId,
        volunteer_id: volunteerId,
        ngo_id: ngoId,
        status: 'ASSIGNED',
      },
    ])
    .select()
    .single();

  if (error) {
    console.error(`Error assigning volunteer to donation ${donationId}:`, error.message);
    return null;
  }
  return data as VolunteerAssignment;
}
