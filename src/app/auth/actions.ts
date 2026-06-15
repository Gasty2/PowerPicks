"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function formValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function safeNextPath(value: string) {
  return value.startsWith("/") && !value.startsWith("//") ? value : "/dashboard";
}

function redirectWithError(path: string, message: string): never {
  redirect(`${path}?error=${encodeURIComponent(message)}`);
}

export async function login(formData: FormData) {
  const email = formValue(formData, "email").toLowerCase();
  const password = formValue(formData, "password");
  const next = safeNextPath(formValue(formData, "next") || "/dashboard");

  if (!email || !password) {
    redirectWithError("/login", "Email and password are required.");
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    redirectWithError("/login", error.message);
  }

  revalidatePath("/", "layout");
  redirect(next);
}

export async function signup(formData: FormData) {
  const displayName = formValue(formData, "displayName");
  const email = formValue(formData, "email").toLowerCase();
  const password = formValue(formData, "password");

  if (!displayName || !email || !password) {
    redirectWithError("/signup", "Display name, email, and password are required.");
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    options: {
      data: {
        display_name: displayName,
      },
    },
    password,
  });

  if (error) {
    redirectWithError("/signup", error.message);
  }

  revalidatePath("/", "layout");

  if (data.session) {
    redirect("/dashboard");
  }

  redirect(
    `/login?message=${encodeURIComponent(
      "Check your email to confirm your account, then log in to see your fantasy points.",
    )}`,
  );
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();

  revalidatePath("/", "layout");
  redirect("/login");
}
