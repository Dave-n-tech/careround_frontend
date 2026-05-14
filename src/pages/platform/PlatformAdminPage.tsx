import { useMemo, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { Field, Icons, Modal, useToast } from "@/components/ui";
import {
  useGetHospitalsQuery,
  useListHospitalOnboardingRequestsQuery,
  useProvisionHospitalTenantMutation,
  useReviewHospitalOnboardingRequestMutation
} from "@/services/api";
import type { HospitalOnboarding, OnboardingStatus } from "@/types/domain";

const reviewStatuses: OnboardingStatus[] = ["CONTACTED", "APPROVED", "REJECTED"];

export default function PlatformAdminPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const token = localStorage.getItem("cr_platform_access_token");
  const [status, setStatus] = useState<OnboardingStatus | "ALL">("ALL");
  const { data: requests = [], isLoading } = useListHospitalOnboardingRequestsQuery(
    status === "ALL" ? undefined : { status }
  );
  const { data: hospitals = [] } = useGetHospitalsQuery();
  const [reviewRequest, { isLoading: isReviewing }] = useReviewHospitalOnboardingRequestMutation();
  const [provisionTenant, { isLoading: isProvisioning }] = useProvisionHospitalTenantMutation();
  const [selected, setSelected] = useState<HospitalOnboarding | null>(null);
  const [reviewStatus, setReviewStatus] = useState<OnboardingStatus>("CONTACTED");
  const [reviewNotes, setReviewNotes] = useState("");
  const [adminFirstName, setAdminFirstName] = useState("");
  const [adminLastName, setAdminLastName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");

  const pendingCount = useMemo(
    () => requests.filter((request) => request.status === "PENDING_REVIEW").length,
    [requests]
  );

  if (!token) return <Navigate to="/platform/login" replace />;

  function signOut() {
    localStorage.removeItem("cr_platform_access_token");
    localStorage.removeItem("cr_platform_role");
    navigate("/platform/login", { replace: true });
  }

  async function submitReview() {
    if (!selected) return;
    try {
      await reviewRequest({ id: selected.id, status: reviewStatus, reviewNotes: reviewNotes || undefined }).unwrap();
      toast({ kind: "success", title: "Request reviewed" });
      setSelected(null);
      setReviewNotes("");
    } catch {
      toast({ kind: "error", title: "Could not review request" });
    }
  }

  async function provision() {
    if (!selected || !adminFirstName || !adminLastName || !adminEmail) {
      toast({ kind: "error", title: "Admin contact is required" });
      return;
    }
    try {
      await provisionTenant({
        id: selected.id,
        hospitalName: selected.hospitalName,
        contactEmail: selected.contactEmail,
        contactPhone: selected.contactPhone || undefined,
        adminFirstName,
        adminLastName,
        adminEmail
      }).unwrap();
      toast({ kind: "success", title: "Hospital provisioned" });
      setSelected(null);
      setAdminFirstName("");
      setAdminLastName("");
      setAdminEmail("");
    } catch {
      toast({ kind: "error", title: "Could not provision hospital" });
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b hairline bg-white px-5 py-3">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded bg-[var(--cr-brand)] text-white grid place-items-center">
              <Icons.settings size={16} />
            </div>
            <div>
              <div className="font-semibold leading-tight">Platform admin</div>
              <div className="text-xs ink-mute">Hospital onboarding operations</div>
            </div>
          </div>
          <button className="btn" onClick={signOut}><Icons.logout size={14} />Sign out</button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-5 p-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="panel rounded p-4"><div className="field-label">Requests</div><div className="mt-1 text-3xl font-semibold">{requests.length}</div></div>
          <div className="panel rounded p-4"><div className="field-label">Pending review</div><div className="mt-1 text-3xl font-semibold">{pendingCount}</div></div>
          <div className="panel rounded p-4"><div className="field-label">Provisioned hospitals</div><div className="mt-1 text-3xl font-semibold">{hospitals.length}</div></div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {(["ALL", "PENDING_REVIEW", "CONTACTED", "APPROVED", "REJECTED", "PROVISIONED"] as const).map((option) => (
            <button key={option} className={`btn ${status === option ? "btn-primary" : ""}`} onClick={() => setStatus(option)}>
              {option.replace(/_/g, " ")}
            </button>
          ))}
        </div>

        <div className="panel rounded overflow-hidden">
          {isLoading ? (
            <div className="p-8 text-center ink-mute">Loading onboarding requests...</div>
          ) : (
            <table className="cr">
              <thead><tr><th>Hospital</th><th>Contact</th><th>Type</th><th>Status</th><th>Created</th><th></th></tr></thead>
              <tbody>
                {requests.map((request) => (
                  <tr key={request.id}>
                    <td className="font-medium">{request.hospitalName}</td>
                    <td className="mono text-xs ink-2">{request.contactEmail}</td>
                    <td className="ink-2">{request.hospitalType || "-"}</td>
                    <td><span className="chip">{request.status}</span></td>
                    <td className="mono text-xs ink-2">{request.createdAt?.slice(0, 10)}</td>
                    <td><button className="btn btn-ghost px-2 py-1 text-xs" onClick={() => setSelected(request)}>Manage</button></td>
                  </tr>
                ))}
                {requests.length === 0 && <tr><td colSpan={6} className="p-6 text-center ink-mute">No requests found.</td></tr>}
              </tbody>
            </table>
          )}
        </div>
      </main>

      <Modal open={!!selected} onClose={() => setSelected(null)} title={selected?.hospitalName || "Onboarding request"} width={680}
        footer={<button className="btn" onClick={() => setSelected(null)}>Close</button>}
      >
        {selected && (
          <div className="space-y-5">
            <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
              <div><div className="ink-mute text-xs">Contact</div><div className="font-semibold">{selected.contactEmail}</div></div>
              <div><div className="ink-mute text-xs">Phone</div><div className="font-semibold">{selected.contactPhone || "-"}</div></div>
              <div><div className="ink-mute text-xs">Region</div><div className="font-semibold">{selected.countryOrRegion || "-"}</div></div>
              <div><div className="ink-mute text-xs">Beds</div><div className="font-semibold">{selected.estimatedInpatientBeds || "-"}</div></div>
              <div className="sm:col-span-2"><div className="ink-mute text-xs">Primary need</div><div className="font-semibold">{selected.primaryNeed || "-"}</div></div>
            </div>

            <div className="border-t hairline pt-4 space-y-3">
              <div className="field-label">Review</div>
              <Field label="Status">
                <select className="select" value={reviewStatus} onChange={(e) => setReviewStatus(e.target.value as OnboardingStatus)}>
                  {reviewStatuses.map((option) => <option key={option}>{option}</option>)}
                </select>
              </Field>
              <Field label="Review notes">
                <textarea className="textarea" rows={3} value={reviewNotes} onChange={(e) => setReviewNotes(e.target.value)} />
              </Field>
              <button className="btn btn-primary" onClick={submitReview} disabled={isReviewing}>
                {isReviewing ? "Saving..." : "Save review"}
              </button>
            </div>

            <div className="border-t hairline pt-4 space-y-3">
              <div className="field-label">Provision tenant</div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <Field label="Admin first name"><input className="input" value={adminFirstName} onChange={(e) => setAdminFirstName(e.target.value)} /></Field>
                <Field label="Admin last name"><input className="input" value={adminLastName} onChange={(e) => setAdminLastName(e.target.value)} /></Field>
                <Field label="Admin email"><input className="input" type="email" value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} /></Field>
              </div>
              <button className="btn" onClick={provision} disabled={isProvisioning}>
                {isProvisioning ? "Provisioning..." : "Provision hospital"}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
