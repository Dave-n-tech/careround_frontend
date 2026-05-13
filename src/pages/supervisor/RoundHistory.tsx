import { PageHeader } from "@/layouts/PageHeader";
import { RoundHistoryTable } from "./Reports";
import { useGetRoundHistoryReportQuery } from "@/services/api";
import { useCurrentWardId } from "@/features/ward/currentWard";

export default function RoundHistory() {
  const wardId = useCurrentWardId();
  const to = new Date();
  const from = new Date(to);
  from.setDate(from.getDate() - 30);
  const { data: rounds = [], isLoading } = useGetRoundHistoryReportQuery({
    wardId,
    from: from.toISOString().slice(0, 10),
    to: to.toISOString().slice(0, 10)
  });

  return (
    <div className="space-y-4">
      <PageHeader title="Round history" subtitle="Last 30 days" />
      <div className="panel rounded overflow-hidden">
        <RoundHistoryTable rows={rounds} loading={isLoading} />
      </div>
    </div>
  );
}
