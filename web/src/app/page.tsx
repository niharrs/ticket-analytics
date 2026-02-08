import TicketFeed from "@/components/TicketFeed";

export default function HomePage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight gradient-text">Tickets</h1>
        <p className="mt-1 text-sm text-gray-500">Monitor and analyze support ticket transcripts</p>
      </div>
      <TicketFeed />
    </div>
  );
}
