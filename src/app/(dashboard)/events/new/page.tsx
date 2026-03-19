import { EventForm } from "@/components/forms/event-form";

export default function NewEventPage() {
  return (
    <div>
      <h1 className="mb-8 text-2xl font-bold">Create Open House</h1>
      <div className="max-w-2xl">
        <EventForm />
      </div>
    </div>
  );
}
