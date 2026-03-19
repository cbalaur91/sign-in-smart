import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { EventForm } from "@/components/forms/event-form";

export default async function EditEventPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: event } = await supabase
    .from("events")
    .select("*")
    .eq("id", id)
    .eq("agent_id", user.id)
    .single();

  if (!event) {
    notFound();
  }

  return (
    <div>
      <h1 className="mb-8 text-2xl font-bold">Edit Open House</h1>
      <div className="max-w-2xl">
        <EventForm event={event} />
      </div>
    </div>
  );
}
