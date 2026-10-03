# Catatan Bangun Rumah — Agent Context

## Tujuan
Webapp untuk mencatat pengeluaran pembangunan rumah, absen tukang/kenek, dan menghitung gaji mingguan. Mobile-first, dibuka dari HP maupun laptop.

## Prinsip
- Mobile-first. Absen harus bisa diisi dengan 2-3 ketukan di HP.
- Uang disimpan sebagai **bilangan bulat Rupiah** (tanpa desimal). Jangan pakai float.
- Data harus bisa diekspor (CSV). Jangan terkunci di satu layanan.
- Mulai kecil. MVP dulu, fitur tambahan belakangan.

## Stack
- Next.js (App Router) + TypeScript
- Tailwind CSS + shadcn/ui
- Supabase (Postgres + Auth + RLS)
- Zod (validasi)
- Vitest (testing payroll)
- Hosting: Vercel

## Model Data

### workers
```sql
create table workers (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) default auth.uid(),
  name text not null,
  role text not null check (role in ('tukang','kenek','lainnya')),
  daily_rate integer not null check (daily_rate >= 0),
  active boolean not null default true,
  created_at timestamptz not null default now()
);
```

### attendance
```sql
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
```

### advances (kasbon)
```sql
create table advances (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) default auth.uid(),
  worker_id uuid not null references workers(id),
  paid_on date not null,
  amount integer not null check (amount > 0),
  note text,
  created_at timestamptz not null default now()
);
```

### expenses
```sql
create table expenses (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) default auth.uid(),
  spent_on date not null,
  category text not null,
  description text,
  amount integer not null check (amount > 0),
  receipt_url text,
  created_at timestamptz not null default now()
);
```

### settings
```sql
create table settings (
  owner_id uuid primary key references auth.users(id) default auth.uid(),
  total_budget bigint not null default 0,
  week_start int not null default 1
);
```

## RLS Pattern
Aktifkan di semua tabel:
```sql
alter table workers enable row level security;
create policy "owner only" on workers
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());
-- ulangi untuk attendance, advances, expenses, settings
```

## Aturan Bisnis
- **Bobot hari:** hadir = 1, lembur = 1,5, setengah hari = 0,5, absen = 0.
- **Gaji kotor** = jumlah dari (`day_weight` x `rate_snapshot`) pada periode.
- **Dibayar** = gaji kotor - total kasbon pada periode.
- Kalau kasbon lebih besar dari gaji kotor, tampilkan nilai negatif dan beri tanda. Jangan dipotong diam-diam.
- **Periode default:** Senin sampai Sabtu, bisa diubah.
- **Tanggal:** pakai zona waktu `Asia/Jakarta`. Simpan sebagai `date`, bukan timestamp.
- **Mencatat gaji ke pengeluaran:** tombol yang membuat satu baris `expenses` kategori "Upah tukang". Cegah dobel.
- **Format Rupiah:** `Intl.NumberFormat('id-ID')`, tanpa desimal.
- **Snapshot:** `rate_snapshot` dan `day_weight` disalin ke baris absen saat input. Kalau upah naik, absen lama tidak berubah.

## Struktur Folder
```
src/
  app/
    (auth)/login/page.tsx
    (app)/
      layout.tsx
      page.tsx
      pengeluaran/page.tsx
      tukang/page.tsx
      absen/page.tsx
      gaji/page.tsx
  components/
  lib/
    supabase/{client,server}.ts
    money.ts
    payroll.ts
    dates.ts
supabase/migrations/
public/manifest.json
```