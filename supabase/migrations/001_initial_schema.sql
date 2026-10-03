-- Create tables for Catatan Bangun Rumah

-- Workers table
create table workers (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) default auth.uid(),
  name text not null,
  role text not null check (role in ('tukang','kenek','lainnya')),
  daily_rate integer not null check (daily_rate >= 0),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table workers enable row level security;
create policy "owner only" on workers
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

-- Attendance table
create table attendance (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) default auth.uid(),
  worker_id uuid not null references workers(id),
  work_date date not null,
  status text not null check (status in ('hadir','lembur','setengah','absen')),
  day_weight numeric(3,1) not null,
  rate_snapshot integer not null,
  created_at timestamptz not null default now(),
  unique (worker_id, work_date)
);

alter table attendance enable row level security;
create policy "owner only" on attendance
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

-- Advances (kasbon) table
create table advances (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) default auth.uid(),
  worker_id uuid not null references workers(id),
  paid_on date not null,
  amount integer not null check (amount > 0),
  note text,
  created_at timestamptz not null default now()
);

alter table advances enable row level security;
create policy "owner only" on advances
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

-- Expenses table
create table expenses (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) default auth.uid(),
  spent_on date not null,
  category text not null,
  description text,
  amount integer not null check (amount > 0),
  receipt_url text,
  payroll_period text,
  created_at timestamptz not null default now()
);

alter table expenses enable row level security;
create policy "owner only" on expenses
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

-- Settings table
create table settings (
  owner_id uuid primary key references auth.users(id) default auth.uid(),
  total_budget bigint not null default 0,
  week_start int not null default 1
);

alter table settings enable row level security;
create policy "owner only" on settings
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());