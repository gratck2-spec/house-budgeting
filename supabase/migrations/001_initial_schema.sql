-- Create tables for Catatan Bangun Rumah (single-user, no RLS)

-- Drop existing tables (in reverse dependency order)
drop table if exists attendance;
drop table if exists advances;
drop table if exists workers;
drop table if exists expenses;
drop table if exists settings;

-- Workers table
create table workers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  role text not null check (role in ('tukang','kenek','lainnya')),
  daily_rate integer not null check (daily_rate >= 0),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Attendance table
create table attendance (
  id uuid primary key default gen_random_uuid(),
  worker_id uuid not null references workers(id),
  work_date date not null,
  status text not null check (status in ('hadir','lembur','setengah','absen')),
  day_weight numeric(3,1) not null,
  rate_snapshot integer not null,
  created_at timestamptz not null default now(),
  unique (worker_id, work_date)
);

-- Advances (kasbon) table
create table advances (
  id uuid primary key default gen_random_uuid(),
  worker_id uuid not null references workers(id),
  paid_on date not null,
  amount integer not null check (amount > 0),
  note text,
  created_at timestamptz not null default now()
);

-- Expenses table
create table expenses (
  id uuid primary key default gen_random_uuid(),
  spent_on date not null,
  category text not null,
  description text,
  amount integer not null check (amount > 0),
  receipt_url text,
  payroll_period text,
  created_at timestamptz not null default now()
);

-- Settings table
create table settings (
  id uuid primary key default gen_random_uuid(),
  total_budget bigint not null default 0,
  week_start int not null default 1
);