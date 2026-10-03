'use server';

import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email('Email tidak valid'),
});

export async function signIn(formData: FormData) {
  const supabase = await createClient();

  const result = loginSchema.safeParse({
    email: formData.get('email'),
  });

  if (!result.success) {
    return { error: result.error.issues[0].message };
  }

  const { error } = await supabase.auth.signInWithOtp({
    email: result.data.email,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/confirm`,
    },
  });

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}