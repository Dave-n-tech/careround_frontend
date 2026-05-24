import { useState, useMemo } from "react";
import { Plus, Eye } from "lucide-react";
import {
  useGetAllPatientsQuery,
  useRegisterPatientMutation,
  useUpdatePatientStatusMutation,
} from "@/services/api/patients";
import { useGetWardsQuery } from "@/services/api/wards";
import { MOCK_PATIENTS, MOCK_WARDS } from "@/lib/mock-data";
import type { AdmissionType, Patient, PatientGender } from "@/types/domain";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Modal } from "@/components/ui/modal";
import { EmptyState } from "@/components/ui/empty-state";
import { AcuityBadge } from "@/components/ui/badge";
import { ageFromDob, formatDate, formatDateTime } from "@/utils/format";

// ─── Shared form type ─────────────────────────────────────────────────────────

interface PatientForm {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  hospitalNumber: string;
  phoneNumber: string;
  address: string;
  previousConditions: string;
  currentMedications: string;
  allergies: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  wardId: string;
  bedNumber: string;
  admissionType: string;
  admissionDate: string;
}

const now = new Date().toISOString().slice(0, 16);

const EMPTY_FORM: PatientForm = {
  firstName: "",
  lastName: "",
  dateOfBirth: "",
  gender: "MALE",
  hospitalNumber: "",
  phoneNumber: "",
  address: "",
  previousConditions: "",
  currentMedications: "",
  allergies: "",
  emergencyContactName: "",
  emergencyContactPhone: "",
  wardId: "",
  bedNumber: "",
  admissionType: "EMERGENCY",
  admissionDate: now,
};

function patientToForm(p: Patient): PatientForm {
  return {
    firstName: p.firstName,
    lastName: p.lastName,
    dateOfBirth: p.dateOfBirth,
    gender: p.gender,
    hospitalNumber: p.hospitalNumber,
    phoneNumber: p.phoneNumber ?? "",
    address: p.address ?? "",
    previousConditions: p.previousConditions ?? "",
    currentMedications: p.currentMedications ?? "",
    allergies: p.allergies ?? "",
    emergencyContactName: p.emergencyContactName ?? "",
    emergencyContactPhone: p.emergencyContactPhone ?? "",
    wardId: p.wardId,
    bedNumber: p.bedNumber ?? "",
    admissionType: p.admissionType,
    admissionDate: new Date(p.admissionDate).toISOString().slice(0, 16),
  };
}

// ─── Section heading ──────────────────────────────────────────────────────────

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--cr-accent)] pt-2 pb-1 border-b border-[var(--cr-line)]">
      {children}
    </h3>
  );
}

// ─── Register / Edit modal ────────────────────────────────────────────────────

interface PatientFormModalProps {
  open: boolean;
  onClose: () => void;
  wards: { id: string; name: string }[];
  existing?: Patient;
  onSave: (form: PatientForm) => Promise<void>;
}

function PatientFormModal({ open, onClose, wards, existing, onSave }: PatientFormModalProps) {
  const [form, setForm] = useState<PatientForm>(existing ? patientToForm(existing) : EMPTY_FORM);
  const [errors, setErrors] = useState<Partial<PatientForm>>({});
  const [loading, setLoading] = useState(false);

  function set(field: keyof PatientForm, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
    setErrors((e) => ({ ...e, [field]: undefined }));
  }

  function validate(): boolean {
    const errs: Partial<PatientForm> = {};
    if (!form.firstName.trim()) errs.firstName = "Required";
    if (!form.lastName.trim()) errs.lastName = "Required";
    if (!form.dateOfBirth) errs.dateOfBirth = "Required";
    if (!form.gender) errs.gender = "Required";
    if (!existing && !form.hospitalNumber.trim()) errs.hospitalNumber = "Required";
    if (!form.wardId) errs.wardId = "Required";
    if (!form.admissionType) errs.admissionType = "Required";
    if (!form.admissionDate) errs.admissionDate = "Required";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      await onSave(form);
      setForm(EMPTY_FORM);
      onClose();
    } finally {
      setLoading(false);
    }
  }

  const wardOptions = wards.map((w) => ({ value: w.id, label: w.name }));
  const isEdit = !!existing;

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? "Edit Patient" : "Register Patient"} width="max-w-2xl">
      <form onSubmit={handleSubmit} className="px-6 py-5 flex flex-col gap-5">

        <SectionHeading>Identity</SectionHeading>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="First Name *"
            value={form.firstName}
            onChange={(e) => set("firstName", e.target.value)}
            error={errors.firstName}
          />
          <Input
            label="Last Name *"
            value={form.lastName}
            onChange={(e) => set("lastName", e.target.value)}
            error={errors.lastName}
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Date of Birth *"
            type="date"
            value={form.dateOfBirth}
            onChange={(e) => set("dateOfBirth", e.target.value)}
            error={errors.dateOfBirth}
          />
          <Select
            label="Gender *"
            value={form.gender}
            onChange={(e) => set("gender", e.target.value)}
            options={[
              { value: "MALE", label: "Male" },
              { value: "FEMALE", label: "Female" },
              { value: "OTHER", label: "Other" },
            ]}
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Hospital Number *"
            value={form.hospitalNumber}
            onChange={(e) => set("hospitalNumber", e.target.value)}
            placeholder="e.g. STM-0010"
            error={errors.hospitalNumber}
            disabled={isEdit}
          />
          <Input
            label="Phone Number"
            type="tel"
            value={form.phoneNumber}
            onChange={(e) => set("phoneNumber", e.target.value)}
          />
        </div>
        <Textarea
          label="Address"
          value={form.address}
          onChange={(e) => set("address", e.target.value)}
          rows={2}
        />

        <SectionHeading>Medical Background</SectionHeading>
        <Textarea
          label="Previous Conditions"
          value={form.previousConditions}
          onChange={(e) => set("previousConditions", e.target.value)}
          placeholder="e.g. Hypertension, Type 2 Diabetes"
          hint="Free text — list conditions separated by commas"
        />
        <Textarea
          label="Current Medications"
          value={form.currentMedications}
          onChange={(e) => set("currentMedications", e.target.value)}
          placeholder="Medications the patient was taking before admission"
        />
        <Textarea
          label="Allergies"
          value={form.allergies}
          onChange={(e) => set("allergies", e.target.value)}
          placeholder="e.g. Penicillin, Aspirin"
          rows={2}
        />

        <SectionHeading>Admission</SectionHeading>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="Ward *"
            value={form.wardId}
            onChange={(e) => set("wardId", e.target.value)}
            options={wardOptions}
            placeholder="Select ward"
            error={errors.wardId}
          />
          <Input
            label="Bed Number"
            value={form.bedNumber}
            onChange={(e) => set("bedNumber", e.target.value)}
            placeholder="e.g. 4"
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="Admission Type *"
            value={form.admissionType}
            onChange={(e) => set("admissionType", e.target.value)}
            options={[
              { value: "EMERGENCY", label: "Emergency" },
              { value: "ELECTIVE", label: "Elective" },
              { value: "TRANSFER", label: "Transfer" },
            ]}
          />
          <Input
            label="Admission Date *"
            type="datetime-local"
            value={form.admissionDate}
            onChange={(e) => set("admissionDate", e.target.value)}
            error={errors.admissionDate}
          />
        </div>

        <SectionHeading>Emergency Contact</SectionHeading>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Contact Name"
            value={form.emergencyContactName}
            onChange={(e) => set("emergencyContactName", e.target.value)}
          />
          <Input
            label="Contact Phone"
            type="tel"
            value={form.emergencyContactPhone}
            onChange={(e) => set("emergencyContactPhone", e.target.value)}
          />
        </div>

        <div className="flex justify-end gap-3 pt-2 border-t border-[var(--cr-line)]">
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={loading}>
            {isEdit ? "Save Changes" : "Register Patient"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

// ─── Patient view modal ───────────────────────────────────────────────────────

function Field({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <p className="text-xs text-[var(--cr-muted)] mb-0.5">{label}</p>
      <p className="text-sm text-[var(--cr-ink)]">{value || "—"}</p>
    </div>
  );
}

interface PatientViewModalProps {
  open: boolean;
  patient: Patient;
  wardName: string;
  onClose: () => void;
  onDischarge: () => void;
}

function PatientViewModal({ open, patient: p, wardName, onClose, onDischarge }: PatientViewModalProps) {
  const admissionTypeLabel: Record<string, string> = {
    EMERGENCY: "Emergency",
    ELECTIVE: "Elective",
    TRANSFER: "Transfer",
  };

  return (
    <Modal open={open} onClose={onClose} title="Patient Details" width="max-w-2xl">
      <div className="px-6 py-5 flex flex-col gap-5">

        <SectionHeading>Identity</SectionHeading>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
          <Field label="First Name" value={p.firstName} />
          <Field label="Last Name" value={p.lastName} />
          <Field label="Date of Birth" value={`${p.dateOfBirth} (age ${ageFromDob(p.dateOfBirth)})`} />
          <Field label="Gender" value={p.gender.charAt(0) + p.gender.slice(1).toLowerCase()} />
          <Field label="Hospital Number" value={p.hospitalNumber} />
          <Field label="Phone Number" value={p.phoneNumber} />
        </div>
        <Field label="Address" value={p.address} />

        <SectionHeading>Medical Background</SectionHeading>
        <div className="flex flex-col gap-3">
          <Field label="Previous Conditions" value={p.previousConditions} />
          <Field label="Current Medications" value={p.currentMedications} />
          <Field label="Allergies" value={p.allergies} />
        </div>

        <SectionHeading>Admission</SectionHeading>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
          <Field label="Ward" value={wardName} />
          <Field label="Bed Number" value={p.bedNumber} />
          <Field label="Admission Type" value={admissionTypeLabel[p.admissionType] ?? p.admissionType} />
          <Field label="Admission Date" value={formatDateTime(p.admissionDate)} />
          <Field label="Primary Diagnosis" value={p.primaryDiagnosis} />
          <div>
            <p className="text-xs text-[var(--cr-muted)] mb-0.5">Status</p>
            <span
              className={`inline-flex px-2 py-0.5 rounded text-xs font-semibold uppercase ${
                p.status === "ADMITTED" ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-500"
              }`}
            >
              {p.status === "ADMITTED" ? "Admitted" : "Discharged"}
            </span>
          </div>
        </div>

        <SectionHeading>Emergency Contact</SectionHeading>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
          <Field label="Contact Name" value={p.emergencyContactName} />
          <Field label="Contact Phone" value={p.emergencyContactPhone} />
        </div>

        <div className="flex justify-between items-center pt-2 border-t border-[var(--cr-line)]">
          <p className="text-xs text-[var(--cr-muted)]">Registered {formatDate(p.createdAt)}</p>
          <div className="flex gap-3">
            <Button type="button" variant="outline" onClick={onClose}>
              Close
            </Button>
            {p.status === "ADMITTED" && (
              <Button type="button" variant="outline-destructive" onClick={onDischarge}>
                Discharge
              </Button>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function AdminPatients() {
  const { data: patientsData } = useGetAllPatientsQuery();
  const { data: wardsData } = useGetWardsQuery();
  const [registerPatient] = useRegisterPatientMutation();
  const [updatePatientStatus] = useUpdatePatientStatusMutation();

  const patients = patientsData ?? MOCK_PATIENTS;
  const wards = wardsData ?? MOCK_WARDS;

  const [registerOpen, setRegisterOpen] = useState(false);
  const [viewTarget, setViewTarget] = useState<Patient | null>(null);
  const [search, setSearch] = useState("");
  const [wardFilter, setWardFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const filtered = useMemo(() => {
    return patients.filter((p) => {
      const q = search.toLowerCase();
      const matchSearch =
        !q ||
        `${p.firstName} ${p.lastName}`.toLowerCase().includes(q) ||
        p.hospitalNumber.toLowerCase().includes(q);
      const matchWard = !wardFilter || p.wardId === wardFilter;
      const matchStatus = !statusFilter || p.status === statusFilter;
      return matchSearch && matchWard && matchStatus;
    });
  }, [patients, search, wardFilter, statusFilter]);

  const wardMap = Object.fromEntries(wards.map((w) => [w.id, w.name]));

  async function handleRegister(form: PatientForm) {
    await registerPatient({
      firstName: form.firstName,
      lastName: form.lastName,
      dateOfBirth: form.dateOfBirth,
      gender: form.gender as PatientGender,
      hospitalNumber: form.hospitalNumber,
      phoneNumber: form.phoneNumber || undefined,
      address: form.address || undefined,
      previousConditions: form.previousConditions || undefined,
      currentMedications: form.currentMedications || undefined,
      allergies: form.allergies || undefined,
      emergencyContactName: form.emergencyContactName || undefined,
      emergencyContactPhone: form.emergencyContactPhone || undefined,
      wardId: form.wardId,
      bedNumber: form.bedNumber || undefined,
      admissionType: form.admissionType as AdmissionType,
    }).unwrap();
  }

  async function handleDischarge(patientId: string) {
    await updatePatientStatus({ patientId, status: "DISCHARGED" }).unwrap();
    setViewTarget(null);
  }

  const wardOptions = [{ value: "", label: "All Wards" }, ...wards.map((w) => ({ value: w.id, label: w.name }))];

  return (
    <div className="p-4 sm:p-8 max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[var(--cr-ink)]">Patients</h1>
          <p className="text-sm text-[var(--cr-muted)] mt-0.5">{patients.length} total</p>
        </div>
        <Button variant="primary" size="md" onClick={() => setRegisterOpen(true)}>
          <Plus size={14} />
          Register Patient
        </Button>
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap gap-3 mb-4">
        <input
          type="text"
          placeholder="Search by name or hospital number…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input flex-1 min-w-48 max-w-sm text-sm"
        />
        <select
          value={wardFilter}
          onChange={(e) => setWardFilter(e.target.value)}
          className="select text-sm w-44"
        >
          {wardOptions.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="select text-sm w-40"
        >
          <option value="">All Status</option>
          <option value="ADMITTED">Admitted</option>
          <option value="DISCHARGED">Discharged</option>
        </select>
      </div>

      <div className="bg-white border border-[var(--cr-line)] rounded-lg overflow-hidden">
        {filtered.length === 0 ? (
          <EmptyState
            message="No patients found"
            sub={search || wardFilter || statusFilter ? "Try adjusting your filters." : "Register the first patient to get started."}
            actionLabel={!search && !wardFilter && !statusFilter ? "Register Patient" : undefined}
            onAction={() => setRegisterOpen(true)}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="cr">
              <thead>
                <tr>
                  <th>Hospital No.</th>
                  <th>Full Name</th>
                  <th>Ward</th>
                  <th>Bed</th>
                  <th>Age</th>
                  <th>Acuity</th>
                  <th>Status</th>
                  <th>Registered</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((patient) => (
                  <tr key={patient.id} className="row-hover">
                    <td className="font-mono text-xs text-[var(--cr-muted)]">{patient.hospitalNumber}</td>
                    <td className="font-medium text-[var(--cr-ink)]">
                      {patient.firstName} {patient.lastName}
                    </td>
                    <td className="text-[var(--cr-ink-2)]">{wardMap[patient.wardId] ?? "—"}</td>
                    <td className="text-[var(--cr-ink-2)]">{patient.bedNumber ?? "—"}</td>
                    <td className="text-[var(--cr-ink-2)]">{ageFromDob(patient.dateOfBirth)}</td>
                    <td><AcuityBadge color={patient.acuityColor} /></td>
                    <td>
                      <span
                        className={`inline-flex px-2 py-0.5 rounded text-xs font-semibold uppercase ${
                          patient.status === "ADMITTED"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {patient.status === "ADMITTED" ? "Admitted" : "Discharged"}
                      </span>
                    </td>
                    <td className="text-[var(--cr-muted)] text-xs">{formatDate(patient.createdAt)}</td>
                    <td>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        title="View"
                        onClick={() => setViewTarget(patient)}
                      >
                        <Eye size={13} />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Register modal */}
      <PatientFormModal
        open={registerOpen}
        onClose={() => setRegisterOpen(false)}
        wards={wards.filter((w) => w.isActive)}
        onSave={handleRegister}
      />

      {/* View modal */}
      {viewTarget && (
        <PatientViewModal
          open={!!viewTarget}
          patient={viewTarget}
          wardName={wardMap[viewTarget.wardId] ?? "—"}
          onClose={() => setViewTarget(null)}
          onDischarge={() => handleDischarge(viewTarget.id)}
        />
      )}
    </div>
  );
}
