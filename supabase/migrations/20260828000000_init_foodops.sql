-- Initial Migration for FoodOPS
-- Setup schemas, tables, triggers, and Row Level Security (RLS) policies

-- Enable pgcrypto for random UUID generation
create extension if not exists pgcrypto;

-- =========================================================================
-- TRIGGER FUNCTION: updated_at auto-updating
-- =========================================================================
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- =========================================================================
-- TABLES CREATION
-- =========================================================================

-- 1. PROFILES (Base User Table linked to auth.users)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text unique not null,
  phone_number text,
  role text check (role in ('DONOR', 'NGO', 'VOLUNTEER', 'ADMIN')) not null default 'DONOR',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Trigger for profiles
create trigger set_profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.handle_updated_at();

-- 2. DONOR PROFILES
create table public.donor_profiles (
  id uuid references public.profiles(id) on delete cascade primary key,
  organization_name text not null,
  organization_type text not null,
  contact_person text not null,
  address text not null,
  latitude double precision not null,
  longitude double precision not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Trigger for donor profiles
create trigger set_donor_profiles_updated_at
  before update on public.donor_profiles
  for each row execute procedure public.handle_updated_at();

-- 3. NGO PROFILES
create table public.ngo_profiles (
  id uuid references public.profiles(id) on delete cascade primary key,
  organization_name text unique not null,
  registration_number text unique not null,
  status text check (status in ('PENDING_VERIFICATION', 'VERIFIED', 'SUSPENDED', 'INACTIVE')) not null default 'PENDING_VERIFICATION',
  base_address text not null,
  base_latitude double precision not null,
  base_longitude double precision not null,
  service_radius_km integer not null default 10,
  availability text check (availability in ('AVAILABLE', 'BUSY', 'OFFLINE')) not null default 'AVAILABLE',
  contact_person text not null,
  contact_phone text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Trigger for ngo profiles
create trigger set_ngo_profiles_updated_at
  before update on public.ngo_profiles
  for each row execute procedure public.handle_updated_at();

-- 4. VOLUNTEERS
create table public.volunteers (
  id uuid references public.profiles(id) on delete cascade primary key,
  ngo_id uuid references public.ngo_profiles(id) on delete cascade not null,
  name text not null,
  status text check (status in ('ACTIVE', 'INACTIVE', 'SUSPENDED')) not null default 'ACTIVE',
  phone_number text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Trigger for volunteers
create trigger set_volunteers_updated_at
  before update on public.volunteers
  for each row execute procedure public.handle_updated_at();

-- 5. DONATIONS
create table public.donations (
  id uuid default gen_random_uuid() primary key,
  donor_id uuid references public.donor_profiles(id) on delete cascade not null,
  title text not null,
  description text not null,
  food_category text not null,
  veg_non_veg_mixed text not null,
  quantity text not null,
  quantity_unit text not null,
  estimated_servings integer,
  preparation_time timestamp with time zone,
  pickup_available_at timestamp with time zone not null,
  pickup_deadline_at timestamp with time zone not null,
  pickup_address text not null,
  pickup_latitude double precision not null,
  pickup_longitude double precision not null,
  special_notes text,
  photo_url text,
  status text check (status in ('AVAILABLE', 'ACCEPTED', 'VOLUNTEER_ASSIGNED', 'PICKUP_IN_PROGRESS', 'PICKED_UP', 'DELIVERY_IN_PROGRESS', 'DELIVERED', 'COMPLETED', 'CANCELLED', 'EXPIRED', 'RECOVERY_ESCALATED', 'ORGANIC_RECOVERY')) not null default 'AVAILABLE',
  accepted_ngo_id uuid references public.ngo_profiles(id) on delete set null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  cancelled_at timestamp with time zone,
  cancelled_by text,
  cancel_reason text
);

-- Trigger for donations
create trigger set_donations_updated_at
  before update on public.donations
  for each row execute procedure public.handle_updated_at();

-- 6. VOLUNTEER ASSIGNMENTS
create table public.volunteer_assignments (
  id uuid default gen_random_uuid() primary key,
  donation_id uuid references public.donations(id) on delete cascade unique not null,
  volunteer_id uuid references public.volunteers(id) on delete restrict not null,
  ngo_id uuid references public.ngo_profiles(id) on delete cascade not null,
  status text check (status in ('ASSIGNED', 'STARTED', 'ARRIVED', 'COMPLETED', 'CANCELLED')) not null default 'ASSIGNED',
  assigned_at timestamp with time zone default timezone('utc'::text, now()) not null,
  started_at timestamp with time zone,
  arrived_at timestamp with time zone,
  pickup_confirmed_at timestamp with time zone,
  delivery_started_at timestamp with time zone,
  delivery_confirmed_at timestamp with time zone,
  cancelled_at timestamp with time zone,
  cancel_reason text,
  last_location_update timestamp with time zone,
  last_latitude double precision,
  last_longitude double precision,
  pickup_otp_hash text,
  pickup_otp_expires_at timestamp with time zone,
  pickup_otp_attempts integer not null default 0
);

-- Trigger for volunteer assignments
create trigger set_volunteer_assignments_updated_at
  before update on public.volunteer_assignments
  for each row execute procedure public.handle_updated_at();

-- =========================================================================
-- TRIGGER FUNCTION: Sync Auth Signup to Public Profiles
-- =========================================================================
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, phone_number, role)
  values (
    new.id,
    new.email,
    new.phone,
    coalesce((new.raw_user_meta_data->>'role')::text, 'DONOR')
  );
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to sync auth signup
create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- =========================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =========================================================================

-- Enable RLS on all tables
alter table public.profiles enable row level security;
alter table public.donor_profiles enable row level security;
alter table public.ngo_profiles enable row level security;
alter table public.volunteers enable row level security;
alter table public.donations enable row level security;
alter table public.volunteer_assignments enable row level security;

-- 1. Profiles Policies
create policy "Public profiles are viewable by everyone."
  on public.profiles for select
  using (true);

create policy "Users can update their own profile."
  on public.profiles for update
  using (auth.uid() = id);

-- 2. Donor Profiles Policies
create policy "Donor profiles are viewable by authenticated users."
  on public.donor_profiles for select
  using (auth.role() = 'authenticated');

create policy "Users can insert their own donor profile."
  on public.donor_profiles for insert
  with check (auth.uid() = id);

create policy "Users can update their own donor profile."
  on public.donor_profiles for update
  using (auth.uid() = id);

-- 3. NGO Profiles Policies
create policy "NGO profiles are viewable by authenticated users."
  on public.ngo_profiles for select
  using (auth.role() = 'authenticated');

create policy "Users can insert their own NGO profile."
  on public.ngo_profiles for insert
  with check (auth.uid() = id);

create policy "Users can update their own NGO profile."
  on public.ngo_profiles for update
  using (auth.uid() = id);

-- 4. Volunteers Policies
create policy "Volunteers are viewable by authenticated users."
  on public.volunteers for select
  using (auth.role() = 'authenticated');

create policy "NGOs can register/update their own volunteers."
  on public.volunteers for all
  using (
    exists (
      select 1 from public.ngo_profiles
      where ngo_profiles.id = volunteers.ngo_id and ngo_profiles.id = auth.uid()
    )
  );

create policy "Volunteers can view and update their own volunteer record."
  on public.volunteers for update
  using (auth.uid() = id);

-- 5. Donations Policies
create policy "Donations are viewable by authenticated users."
  on public.donations for select
  using (auth.role() = 'authenticated');

create policy "Donors can create donations."
  on public.donations for insert
  with check (
    exists (
      select 1 from public.donor_profiles
      where donor_profiles.id = donations.donor_id and donor_profiles.id = auth.uid()
    )
  );

create policy "Donors can update their own donations."
  on public.donations for update
  using (
    exists (
      select 1 from public.donor_profiles
      where donor_profiles.id = donations.donor_id and donor_profiles.id = auth.uid()
    )
  );

create policy "NGOs can update donations to claim or process them."
  on public.donations for update
  using (
    exists (
      select 1 from public.ngo_profiles
      where ngo_profiles.id = auth.uid()
    )
  );

-- 6. Volunteer Assignments Policies
create policy "Assignments are viewable by authenticated users."
  on public.volunteer_assignments for select
  using (auth.role() = 'authenticated');

create policy "NGOs can manage assignments."
  on public.volunteer_assignments for all
  using (
    exists (
      select 1 from public.ngo_profiles
      where ngo_profiles.id = volunteer_assignments.ngo_id and ngo_profiles.id = auth.uid()
    )
  );

create policy "Assigned volunteers can update their assignments."
  on public.volunteer_assignments for update
  using (volunteer_id = auth.uid());
