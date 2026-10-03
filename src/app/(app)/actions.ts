'use server';

import { createClient } from '@/lib/supabase/server';

export async function getSettings() {
  const supabase = await createClient();
  const { data } = await supabase
    .from('settings')
    .select('total_budget, week_start')
    .single();
  return data ?? { total_budget: 0, week_start: 1 };
}

export async function updateBudget(totalBudget: number) {
  const supabase = await createClient();

  // Get existing settings row
  const { data: existing } = await supabase
    .from('settings')
    .select('id')
    .limit(1)
    .single();

  if (existing) {
    const { error } = await supabase
      .from('settings')
      .update({ total_budget: totalBudget })
      .eq('id', existing.id);
    if (error) return { error: error.message };
  } else {
    const { error } = await supabase
      .from('settings')
      .insert({ total_budget: totalBudget });
    if (error) return { error: error.message };
  }

  return { success: true };
}

export async function getExpensesByCategory() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('expenses')
    .select('category, amount');
  if (error) throw new Error(error.message);

  const categoryMap = new Map<string, number>();
  for (const row of data ?? []) {
    categoryMap.set(row.category, (categoryMap.get(row.category) ?? 0) + row.amount);
  }

  return Array.from(categoryMap.entries())
    .map(([category, total]) => ({ category, total }))
    .sort((a, b) => b.total - a.total);
}