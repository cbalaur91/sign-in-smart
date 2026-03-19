import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardSidebar } from "@/components/layout/dashboard-sidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: agent } = await supabase
    .from("agents")
    .select("*")
    .eq("id", user.id)
    .single();

  return (
    <div className="flex min-h-screen">
      <DashboardSidebar
        agentName={agent?.full_name ?? user.email ?? "Agent"}
        agentEmail={user.email ?? ""}
      />
      <main className="flex-1 overflow-auto">
        <div className="mx-auto max-w-6xl px-4 pt-16 pb-6 md:px-6 md:pt-8 md:pb-8">{children}</div>
      </main>
    </div>
  );
}
