import { createLazyFileRoute } from "@tanstack/react-router";

export const Route = createLazyFileRoute("/approval-requests/")({
  component: ApprovalRequests,
});

function ApprovalRequests() {
  return (
    <div className="container flex h-full flex-col items-center justify-center gap-4 py-6">
      <h3>Under development</h3>
    </div>
  );
}
