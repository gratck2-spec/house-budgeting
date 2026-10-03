'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { todayJakarta } from '@/lib/dates';

const STATUS_WEIGHT: Record<string, number> = {
  hadir: 1,
  lembur: 1.5,
  setengah: 0.5,
  absen: 0,
};

export async function getAttendance(date: string) {
  const supabase = await createClient();

  const { data: workers, error: wErr } = await supabase
    .from('workers')
    .select('id, name, role, daily_rate')
    .eq('active', true)
    .order('name');

  if (wErr) throw new Error(wErr.message);

  const { data: attendance, error: aErr } = await supabase
    .from('attendance')
    .select('worker_id, status')
    .eq('work_date', date);

  if (aErr) throw new Error(aErr.message);

  const attendanceMap = new Map(
    attendance?.map((a) => [a.worker_id, a.status]) ?? []
  );

  return (workers ?? []).map((w) => ({
    ...w,
    status: (attendanceMap.get(w.id) as string) ?? '',
  }));
}

export async function saveAttendance(date: string, records: { worker_id: string; status: string; daily_rate: number }[]) {
  const supabase = await createClient();

  const rows = records
    .filter((r) => r.status && r.status in STATUS_WEIGHT)
    .map((r) => ({
      worker_id: r.worker_id,
      work_date: date,
      status: r.status,
      day_weight: STATUS_WEIGHT[r.status],
      rate_snapshot: r.daily_rate,
    }));

  if (rows.length === 0) return { error: 'Tidak ada data untuk disimpan' };

  const { error } = await supabase
    .from('attendance')
    .upsert(rows, { onConflict: 'worker_id,work_date' });

  if (error) return { error: error.message };

  revalidatePath('/absen');
  revalidatePath('/gaji');
  return { success: true };
}