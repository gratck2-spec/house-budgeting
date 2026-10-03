'use server';

import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';

const expenseSchema = z.object({
  spent_on: z.string().min(1, 'Tanggal wajib diisi'),
  category: z.string().min(1, 'Kategori wajib diisi'),
  description: z.string().optional(),
  amount: z.coerce.number().int().min(1, 'Jumlah harus lebih dari 0'),
});

export async function getExpenses(category?: string, month?: string) {
  const supabase = await createClient();

  let query = supabase
    .from('expenses')
    .select('*')
    .order('spent_on', { ascending: false });

  if (category && category !== 'all') {
    query = query.eq('category', category);
  }

  if (month) {
    query = query
      .gte('spent_on', `${month}-01`)
      .lte('spent_on', `${month}-31`);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data;
}

export async function addExpense(formData: FormData) {
  const supabase = await createClient();

  const result = expenseSchema.safeParse({
    spent_on: formData.get('spent_on'),
    category: formData.get('category'),
    description: formData.get('description'),
    amount: formData.get('amount'),
  });

  if (!result.success) {
    return { error: result.error.issues[0].message };
  }

  const { error } = await supabase.from('expenses').insert(result.data);
  if (error) return { error: error.message };

  revalidatePath('/pengeluaran');
  revalidatePath('/');
  return { success: true };
}

export async function deleteExpense(id: string) {
  const supabase = await createClient();

  const { error } = await supabase.from('expenses').delete().eq('id', id);
  if (error) return { error: error.message };

  revalidatePath('/pengeluaran');
  revalidatePath('/');
  return { success: true };
}