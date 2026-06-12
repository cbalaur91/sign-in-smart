 Improved Sign-Up Flow: Name, Phone, Confirm Password + Validation

 Context

 The sign-up form (a mode toggle on /login) currently asks only for email and password, with no validation library and no confirm-password check;
 full_name is faked from the email prefix. The user wants a proper sign-up collecting first name, last name, phone (required), email, password, confirm
 password, with solid validation and security, and the data stored in Supabase.

 Decisions confirmed with the user:
 - Add first_name/last_name columns to agents, keep full_name populated ("First Last") so dashboard/Stripe/email code is untouched.
 - Phone is required at sign-up (column agents.phone already exists, nullable).
 - Password policy: min 8 chars, at least one letter and one number, enforced client-side (zod) and mirrored in Supabase auth settings.
 - Keep email+password auth (magic links considered and rejected; Google OAuth possible later).

 Design choices:
 - Keep the single /login page with the signin/signup toggle; conditionally render the 4 extra fields in signup mode (surgical, no new route).
 - New zod schema following the existing visitor.ts / sign-in-form.tsx pattern (controlled inputs + safeParse, no react-hook-form).
 - DB trigger handle_new_user on auth.users becomes the canonical profile-creation path — it fires at signUp time so metadata survives the
 email-confirmation flow even if the user never returns through the client insert path. The two existing client/callback fallback inserts stay (updated
 to include the new fields) as defense-in-depth; trigger uses on conflict (id) do nothing for idempotency.

 Steps

 1. Database migration (MCP apply_migration, project gozdtaotxmhstcsxhqpq)

 Name: add_agent_name_columns_and_signup_trigger

 alter table public.agents
   add column if not exists first_name text,
   add column if not exists last_name text;

 create or replace function public.handle_new_user()
 returns trigger
 language plpgsql
 security definer
 set search_path = ''
 as $$
 begin
   insert into public.agents (id, full_name, first_name, last_name, phone, email)
   values (
     new.id,
     coalesce(nullif(new.raw_user_meta_data->>'full_name', ''),
              split_part(new.email, '@', 1), 'Agent'),
     new.raw_user_meta_data->>'first_name',
     new.raw_user_meta_data->>'last_name',
     new.raw_user_meta_data->>'phone',
     new.email
   )
   on conflict (id) do nothing;
   return new;
 end;
 $$;

 drop trigger if exists on_auth_user_created on auth.users;
 create trigger on_auth_user_created
   after insert on auth.users
   for each row execute function public.handle_new_user();

 Columns are nullable on purpose (future OAuth users won't have split names; full_name stays the NOT NULL canonical field). Also append this SQL to
 supabase/migration.sql to keep the schema doc in sync. (Note: that file has pre-existing drift — missing stripe_customer_id/credits — flag, don't
 fix.)

 2. Manual Supabase dashboard step (config, not code)

 Authentication → Providers → Email: minimum password length 8, required characters letters and digits. Mirrors the zod policy server-side.

 3. src/lib/types.ts

 Add first_name: string | null; last_name: string | null; to agents.Row, and optional variants to Insert/Update.

 4. New file src/lib/validators/agent.ts

 Import from "zod/v4" (matches visitor.ts):

 export const signUpSchema = z.object({
   first_name: z.string().trim().min(1, "First name is required").max(100),
   last_name: z.string().trim().min(1, "Last name is required").max(100),
   phone: z.string().trim().min(10, "Please enter a valid phone number")
     .max(20).regex(/^[+]?[\d\s()-]+$/, "Please enter a valid phone number"),
   email: z.email("Please enter a valid email address").max(255),
   password: z.string().min(8, "Password must be at least 8 characters")
     .regex(/[A-Za-z]/, "Password must contain at least one letter")
     .regex(/\d/, "Password must contain at least one number"),
   confirm_password: z.string(),
 }).refine((d) => d.password === d.confirm_password, {
   message: "Passwords do not match", path: ["confirm_password"],
 });

 Phone rule reuses the proven pattern from src/lib/validators/visitor.ts. Use z.flattenError(error).fieldErrors (v4 API) for per-field errors.

 5. Rework src/app/(auth)/login/page.tsx

 - Add state: firstName, lastName, phone, confirmPassword, fieldErrors.
 - Signup branch of handleSubmit: signUpSchema.safeParse first — on failure set per-field errors and return (no network call); on success call
 supabase.auth.signUp with options.data: { first_name, last_name, phone, full_name: \${first} ${last}` }using trimmedresult.data` values. Keep auto
 sign-in + "check your email to confirm" path unchanged.
 - Update the existing fallback insert (lines ~64–79) to include first_name/last_name/phone from user.user_metadata.
 - Markup: in signup mode render First/Last name (2-col grid), Phone, Confirm password — reusing the exact existing input/label Tailwind classes;
 inline <p className="text-sm text-destructive"> error under each field; noValidate on the form so zod messages replace browser bubbles; clear errors
 on mode toggle.
 - Security/UX attributes: autocomplete="given-name" / "family-name" / "tel" / "email" / "new-password" (both password fields in signup),
 "current-password" in signin; type="tel" inputMode="tel" for phone; password placeholder reflects 8-char policy in signup mode. No password visibility
 toggle (kept minimal). Signin side stays as-is (2 fields, Supabase error is clear).

 6. src/app/(auth)/auth/callback/route.ts

 Add first_name/last_name/phone from user.user_metadata to the fallback insert at lines 26–30 (mostly a no-op once the trigger exists; kept as
 defense-in-depth).

 Verification

 1. bun run typecheck passes.
 2. bun run dev → /login → toggle to Sign up:
   - Empty submit → inline per-field errors, no network call.
   - Failure cases: phone abc, password short, abcdefgh (no digit), 12345678 (no letter), mismatched confirm — each shows its specific message.
   - Valid signup → lands on /dashboard (or confirm-email message).
 3. MCP execute_sql: select full_name, first_name, last_name, phone, email, credits from public.agents order by created_at desc limit 1; — full_name =
 "First Last", phone set, credits = 1 default intact.
 4. Email-confirmation path: sign up, don't sign in, confirm via emailed link → agents row exists with all fields (created by trigger at signup time).
 5. Regression: sign in with new account; dashboard/Stripe/email paths read full_name unchanged.
 6. mcp__supabase__get_advisors (security) after migration — the security definer function with pinned search_path should raise no findings.

 Critical files

 - src/app/(auth)/login/page.tsx (rework)
 - src/lib/validators/agent.ts (new)
 - src/app/(auth)/auth/callback/route.ts (small update)
 - src/lib/types.ts (add columns)
 - supabase/migration.sql (doc sync; real change via MCP apply_migration)