"use client";

import { useState } from "react";
import { z } from "zod/v4";
import { createClient } from "@/lib/supabase/client";
import { signUpSchema } from "@/lib/validators/agent";

type FieldErrors = Partial<Record<string, string[]>>;

export default function LoginPage() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [mode, setMode] = useState<"signin" | "signup">("signin");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    const supabase = createClient();

    if (mode === "signup") {
      const result = signUpSchema.safeParse({
        first_name: firstName,
        last_name: lastName,
        phone,
        email,
        password,
        confirm_password: confirmPassword,
      });

      if (!result.success) {
        setFieldErrors(z.flattenError(result.error).fieldErrors);
        return;
      }

      setLoading(true);

      const { first_name, last_name, phone: trimmedPhone } = result.data;

      const { error } = await supabase.auth.signUp({
        email: result.data.email,
        password: result.data.password,
        options: {
          data: {
            first_name,
            last_name,
            phone: trimmedPhone,
            full_name: `${first_name} ${last_name}`,
          },
        },
      });

      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }

      // Auto sign-in after signup
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: result.data.email,
        password: result.data.password,
      });

      if (signInError) {
        setError("Account created! Check your email to confirm, then sign in.");
        setLoading(false);
        return;
      }
    } else {
      setLoading(true);

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }
    }

    // Create agent profile if needed
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const { data: agent } = await supabase
        .from("agents")
        .select("id")
        .eq("id", user.id)
        .single();

      if (!agent) {
        await supabase.from("agents").insert({
          id: user.id,
          full_name:
            user.user_metadata?.full_name ?? user.email?.split("@")[0] ?? "Agent",
          first_name: user.user_metadata?.first_name ?? null,
          last_name: user.user_metadata?.last_name ?? null,
          phone: user.user_metadata?.phone ?? null,
          email: user.email!,
        });
      }
    }

    // Full page navigation to ensure cookies are sent with proper headers
    window.location.href = "/dashboard";
  }

  function switchMode(next: "signin" | "signup") {
    setMode(next);
    setError(null);
    setFieldErrors({});
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight">SignIn<span className="text-neon-cyan">Smart</span></h1>
          <p className="mt-2 text-muted-foreground">
            {mode === "signin"
              ? "Sign in to manage your open houses"
              : "Create your account"}
          </p>
        </div>

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          {mode === "signup" && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="first_name"
                    className="block text-sm font-medium text-foreground"
                  >
                    First name
                  </label>
                  <input
                    id="first_name"
                    type="text"
                    autoComplete="given-name"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                    placeholder="Jane"
                    className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                  {fieldErrors.first_name && (
                    <p className="text-sm text-destructive">
                      {fieldErrors.first_name[0]}
                    </p>
                  )}
                </div>
                <div>
                  <label
                    htmlFor="last_name"
                    className="block text-sm font-medium text-foreground"
                  >
                    Last name
                  </label>
                  <input
                    id="last_name"
                    type="text"
                    autoComplete="family-name"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                    placeholder="Smith"
                    className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                  {fieldErrors.last_name && (
                    <p className="text-sm text-destructive">
                      {fieldErrors.last_name[0]}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label
                  htmlFor="phone"
                  className="block text-sm font-medium text-foreground"
                >
                  Phone number
                </label>
                <input
                  id="phone"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  placeholder="(555) 123-4567"
                  className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
                />
                {fieldErrors.phone && (
                  <p className="text-sm text-destructive">{fieldErrors.phone[0]}</p>
                )}
              </div>
            </>
          )}

          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-foreground"
            >
              Email address
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="agent@example.com"
              className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
            />
            {fieldErrors.email && (
              <p className="text-sm text-destructive">{fieldErrors.email[0]}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-foreground"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder={
                mode === "signup"
                  ? "8+ characters, letters and numbers"
                  : "Your password"
              }
              className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
            />
            {fieldErrors.password && (
              <p className="text-sm text-destructive">{fieldErrors.password[0]}</p>
            )}
          </div>

          {mode === "signup" && (
            <div>
              <label
                htmlFor="confirm_password"
                className="block text-sm font-medium text-foreground"
              >
                Confirm password
              </label>
              <input
                id="confirm_password"
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                placeholder="Re-enter your password"
                className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
              />
              {fieldErrors.confirm_password && (
                <p className="text-sm text-destructive">
                  {fieldErrors.confirm_password[0]}
                </p>
              )}
            </div>
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {loading
              ? "Loading..."
              : mode === "signin"
                ? "Sign In"
                : "Create Account"}
          </button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          {mode === "signin" ? (
            <>
              Don&apos;t have an account?{" "}
              <button
                type="button"
                onClick={() => switchMode("signup")}
                className="text-primary hover:underline"
              >
                Sign up
              </button>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => switchMode("signin")}
                className="text-primary hover:underline"
              >
                Sign in
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
