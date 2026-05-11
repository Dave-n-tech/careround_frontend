import { PageHeader } from "@/layouts/PageHeader";
import { RoundHistoryTable } from "./Reports";

export default function RoundHistory() {
  return (
    <div className="space-y-4">
      <PageHeader title="Round history" subtitle="Soyinka Ward" />
      <div className="panel rounded overflow-hidden">
        <RoundHistoryTable />
      </div>
    </div>
  );
}
