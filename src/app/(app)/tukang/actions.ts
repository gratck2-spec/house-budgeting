'use server';

import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';

const workerSchema = z.object({
  name: z.string().min(1, 'Nama wajib diisi'),
  role: z.enum(['tukang', 'kenek', 'lainnya']),
  daily_rate: z.coerce.number().int().min(0, 'Upah harus angka positif'),
});

export async function getWorkers() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('workers')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return data;
}

export async function addWorker(formData: FormData) {
  const supabase = await createClient();

  const result = workerSchema.safeParse({
    name: formData.get('name'),
    role: formData.get('role'),
    daily_rate: formData.get('daily_rate'),
  });

  if (!result.success) {
    return { error: result.error.issues[0].message };
  }

  const { error } = await supabase.from('workers').insert(result.data);

  if (error) return { error: error.message };

  revalidatePath('/tukang');
  return { success: true };
}

export async function updateWorker(id: string, formData: FormData) {
  const supabase = await createClient();

  const result = workerSchema.safeParse({
    name: formData.get('name'),
    role: formData.get('role'),
    daily_rate: formData.get('daily_rate'),
  });

  if (!result.success) {
    return { error: result.error.issues[0].message };
  }

  const { error } = await supabase
    .from('workers')
    .update(result.data)
    .eq('id', id);

  if (error) return { error: error.message };

  revalidatePath('/tukang');
  return { success: true };
}

export async function toggleWorkerActive(id: string, active: boolean) {
  const supabase = await createClient();

  const { error } = await supabase
    .from('workers')
    .update({ active: !active })
    .eq('id', id);

  if (error) return { error: error.message };

  revalidatePath('/tukang');
  return { success: true };
}