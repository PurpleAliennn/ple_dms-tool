'use server'

import { createClient } from "@/utils/supabase/server"; 
import { supabaseAdmin } from '@/lib/supabase-admin';
import { redirect } from "next/navigation";

// The first argument 'prevState' is required by useActionState
export async function signUp(prevState: any, formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
    },
  });

  if (error) {
    return { error: error.message };
  }

  return { data };
}

export async function signIn(prevState: any, formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: error.message };
  }

  // Redirect to dashboard after successful login
  redirect('/dashboard');
}

export async function deleteUserAccount(userId: string) {

  const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
  
  if (error) {
    console.error("Admin delete error:", error);
    throw error;
  }
  
  return { success: true };
}