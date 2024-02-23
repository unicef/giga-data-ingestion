import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/ingest-api/ingestion/add")({
  component: AddIngestion,
});

function AddIngestion() {
  return <div>A new ingestion</div>;
}
