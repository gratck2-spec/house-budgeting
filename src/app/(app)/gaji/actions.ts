'use server';

import { createClient } from '@/lib/supabase/server';
import { hitungGaji } from '@/lib/payroll';
import { revalidatePath } from 'next/cache';

export async function getPayroll(startDate: string, endDate: string) {
  const supabase = await createClient();

  const { data: workers, error: wErr } = await supabase
    .from('workers')
    .select('id, name, role, daily_rate')
    .eq('active', true)
    .order('name');

  if (wErr) throw new Error(wErr.message);

  const { data: attendance, error: aErr } = await supabase
    .from('attendance')
    .select('worker_id, day_weight, rate_snapshot')
    .gte('work_date', startDate)
    .lte('work_date', endDate);

  if (aErr) throw new Error(aErr.message);

  const { data: advances, error: advErr } = await supabase
    .from('advances')
    .select('worker_id, amount')
    .gte('paid_on', startDate)
    .lte('paid_on', endDate);

  if (advErr) throw new Error(advErr.message);

  const payrollResults = hitungGaji(attendance ?? [], advances ?? []);

  const workerMap = new Map(workers?.map((w) => [w.id, w]) ?? []);

  return payrollResults.map((result) => {
    const worker = workerMap.get(result.worker_id);
    return {
      ...result,
      name: worker?.name ?? 'Unknown',
      role: worker?.role ?? '',
      daily_rate: worker?.daily_rate ?? 0,
    };
  });
}

export async function getAdvances(startDate: string, endDate: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('advances')
    .select('*')
    .gte('paid_on', startDate)
    .lte('paid_on', endDate)
    .order('paid_on', { ascending: false });

  if (error) throw new Error(error.message);
  return data;
}

export async function addAdvance(workerId: string, amount: number, note: string, paidOn: string) {
  const supabase = await createClient();

  const { error } = await supabase.from('advances').insert({
    worker_id: workerId,
    amount,
    note,
    paid_on: paidOn,
  });

  if (error) return { error: error.message };

  revalidatePath('/gaji');
  return { success: true };
}

export async function recordPayrollToExpense(startDate: string, endDate: string, totalAmount: number) {
  const supabase = await createClient();

  const existing = await supabase
    .from('expenses')
    .select('id')
    .eq('category', 'Upah tukang')
    .eq('payroll_period', `${startDate}_${endDate}`)
    .limit(1);

  if (existing.data && existing.data.length > 0) {
    return { error: 'Gaji periode ini sudah dicatat ke pengeluaran' };
  }

  const { error } = await supabase.from('expenses').insert({
    spent_on: endDate,
    category: 'Upah tukang',
    description: `Gaji periode ${startDate} s/d ${endDate}`,
    amount: totalAmount,
    payroll_period: `${startDate}_${endDate}`,
  });

  if (error) return { error: error.message };

  revalidatePath('/pengeluaran');
  revalidatePath('/');
  return { success: true };
}