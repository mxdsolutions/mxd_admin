"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { loginSchema, signupSchema } from "@/lib/validation";
import { getURL } from "@/lib/utils";

export async function signIn(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  // Use validation schema
  const validation = loginSchema.safeParse({ email, password });
  if (!validation.success) {
    return { 
      success: false, 
      error: validation.error.issues[0].message 
    };
  }

  try {
    const supabase = await createClient();

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error("[signIn] Supabase error:", error.message);
      return { success: false, error: error.message };
    }
  } catch (err: any) {
    console.error("[signIn] Unexpected error:", err);
    return { success: false, error: "An unexpected error occurred." };
  }

  return { success: true };
}

export async function signUp(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const fullName = formData.get("full_name") as string;

  if (!email || !password || !fullName) {
    return { success: false, error: "All fields are required" };
  }

  // Use validation schema
  const validation = signupSchema.safeParse({ email, password });
  if (!validation.success) {
    return { 
      success: false, 
      error: validation.error.issues[0].message 
    };
  }

  // Basic parsing for first/last name
  const nameParts = fullName.trim().split(" ");
  const firstName = nameParts[0];
  const lastName = nameParts.length > 1 ? nameParts.slice(1).join(" ") : "";

  try {
    const supabase = await createClient();

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: firstName,
          last_name: lastName,
          full_name: fullName,
        },
        emailRedirectTo: `${getURL()}auth/callback`,
      },
    });

    if (error) {
      return { success: false, error: error.message };
    }
    
    return { success: true, message: "Check your email to confirm your account" }
  } catch (err: any) {
    return { success: false, error: "An unexpected error occurred." };
  }
}

export async function signInWithMagicLink(formData: FormData) {
  const email = formData.get("email") as string;

  if (!email) {
    return { error: "Email is required" };
  }

  try {
    const supabase = await createClient();

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${getURL()}auth/callback`,
      },
    });

    if (error) {
      return { error: error.message };
    }
    
    return { success: "Magic link sent! Check your email." };
  } catch (err: any) {
    return { error: "An unexpected error occurred." };
  }
}

export async function resetPassword(formData: FormData) {
  const email = formData.get("email") as string;

  if (!email) {
    return { error: "Email is required" };
  }

  try {
    const supabase = await createClient();

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${getURL()}auth/callback?next=/reset-password`,
    });

    if (error) {
      return { error: error.message };
    }
    
    return { success: "Password reset instructions sent to your email." };
  } catch (err: any) {
    return { error: "An unexpected error occurred." };
  }
}

export async function updatePassword(formData: FormData) {
  const password = formData.get("password") as string;

  if (!password) {
    return { error: "Password is required" };
  }

  try {
    const supabase = await createClient();

    const { error } = await supabase.auth.updateUser({
      password: password,
    });

    if (error) {
      return { error: error.message };
    }
  } catch (err: any) {
    return { error: "An unexpected error occurred." };
  }

  return { success: true };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
