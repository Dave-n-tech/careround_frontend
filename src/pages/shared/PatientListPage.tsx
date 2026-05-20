import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Pill } from "lucide-react";
import { useAppSelector } from "@/app/hooks";
import { useGetPatientsQuery } from "@/services/api/patients";
import { useGetPatientVitalsQuery } from "@/services/api/vitals";
import { useGetPatientPrescriptionsQuery } from "@/services/api/prescriptions";
import { MOCK_PATIENTS, MOCK_VITALS, MOCK_PRESCRIPTIONS } from "@/lib/mock-data";
import type { AcuityColor, Patient, Role } from "@/types/domain";
import { AcuityStrip, VhiBadge } from "@/components/ui/badge";
import { timeAgo } from "@/utils/format";

// ─── Route prefix per role ────────────────────────────────────────────────────

const ROLE_PREFIX: Partial<Record<Role, string>> = {
  NURSE: "/nurse",
  SUPERVISOR: "/supervisor",
};

// ─── Patient card ─────────────────────────────────────────────────────────────

function PatientCard({ patient, onClick }: { patient: Patient; onClick: () => void }) {
  const { data: vitalsData } = useGetPatientVitalsQuery(patient.id);
  const { data: rxData } = useGetPatientPrescriptionsQuery(patient.id);

  const vitals = vitalsData ?? MOCK_VITALS[patient.id] ?? [];
  const prescriptions = rxData ?? MOCK_PRESCRIPTIONS[patient.id] ?? [];

  const latestVitals = vitals[0];
  const activeMedCount = prescriptions.filter((rx) => rx.status === "ACTIVE").length;

  return (
    <div
      className="relative flex bg-white border border-[var(--cr-line)] rounded-lg overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
      onClick={onClick}
    >
      <AcuityStrip color={patient.acuityColor} />

      <div className="flex-1 px-4 py-3 min-w-0">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-base font-bold text-[var(--cr-ink)] leading-tight truncate">
              {patient.firstName} {patient.lastName}
            </p>
            {patient.bedNumber && (
              <span className="inline-block mt-0.5 px-2 py-0.5 rounded text-xs bg-[var(--cr-surface-3)] text-[var(--cr-muted)]">
                Bed {patient.bedNumber}
              </span>
            )}
            {patient.primaryDiagnosis && (
              <p className="mt-1 text-sm text-[var(--cr-ink-2)] truncate">
                {patient.primaryDiagnosis}
              </p>
            )}
          </div>

          <div className="flex flex-col items-end gap-1 shrink-0">
            {latestVitals ? (
              <VhiBadge score={latestVitals.vhiScore} status={latestVitals.vhiStatus} />
            ) : (
              <span className="text-xs text-[var(--cr-muted)]">No vitals</span>
            )}
            {latestVitals && (
              <span className="text-xs text-[var(--cr-muted)]">
                Vitals {timeAgo(latestVitals.recordedAt)}
              </span>
            )}
            <div className="flex items-center gap-1 text-xs text-[var(--cr-muted)]">
              <Pill size={11} />
              <span>{activeMedCount} active med{activeMedCount !== 1 ? "s" : ""}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Acuity filter ────────────────────────────────────────────────────────────

type AcuityFilter = "ALL" | AcuityColor;

const FILTER_STYLES: Record<AcuityFilter, { active: string; inactive: string; label: string }> = {
  ALL:   { active: "bg-[var(--cr-ink)] text-white",    inactive: "bg-white text-[var(--cr-ink)] border border-[var(--cr-line)]", label: "All"   },
  RED:   { active: "bg-red-600 text-white",             inactive: "bg-white text-red-600 border border-red-300",                  label: "RED"   },
  AMBER: { active: "bg-amber-500 text-white",           inactive: "bg-white text-amber-600 border border-amber-300",              label: "AMBER" },
  GREEN: { active: "bg-green-500 text-white",           inactive: "bg-white text-green-600 border border-green-300",              label: "GREEN" },
};

function acuityOrder(c: AcuityColor) {
  return c === "RED" ? 0 : c === "AMBER" ? 1 : 2;
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function PatientListPage() {
  const navigate = useNavigate();
  const role = useAppSelector((s) => s.auth.role);
  const prefix = (role && ROLE_PREFIX[role]) ?? "/nurse";

  const { data: patientsData } = useGetPatientsQuery({});
  const allPatients = (patientsData ?? MOCK_PATIENTS).filter((p) => p.status === "ADMITTED");

  const [acuityFilter, setAcuityFilter] = useState<AcuityFilter>("ALL");
  const [search, setSearch] = useState("");

  const sorted = useMemo(
    () => [...allPatients].sort((a, b) => acuityOrder(a.acuityColor) - acuityOrder(b.acuityColor)),
    [allPatients],
  );

  const filtered = useMemo(() => {
    return sorted.filter((p) => {
      const matchAcuity = acuityFilter === "ALL" || p.acuityColor === acuityFilter;
      const q = search.toLowerCase();
      const matchSearch =
        !q ||
        `${p.firstName} ${p.lastName}`.toLowerCase().includes(q) ||
        p.hospitalNumber.toLowerCase().includes(q) ||
        (p.primaryDiagnosis ?? "").toLowerCase().includes(q);
      return matchAcuity && matchSearch;
    });
  }, [sorted, acuityFilter, search]);

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-4">
        <h1 className="text-xl font-bold text-[var(--cr-ink)]">Patients</h1>
        <p className="text-sm text-[var(--cr-muted)] mt-0.5">{allPatients.length} admitted</p>
      </div>

      {/* Filter + search */}
      <div className="flex flex-wrap items-center gap-2 mb-5">
        <div className="flex gap-1">
          {(["ALL", "RED", "AMBER", "GREEN"] as AcuityFilter[]).map((f) => {
            const s = FILTER_STYLES[f];
            return (
              <button
                key={f}
                onClick={() => setAcuityFilter(f)}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                  acuityFilter === f ? s.active : s.inactive
                }`}
              >
                {s.label}
              </button>
            );
          })}
        </div>
        <input
          type="text"
          placeholder="Search patients…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input flex-1 min-w-40 max-w-sm text-sm"
        />
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-[var(--cr-muted)]">
          <p className="text-sm">No patients match your filter.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((patient) => (
            <PatientCard
              key={patient.id}
              patient={patient}
              onClick={() => navigate(`${prefix}/patients/${patient.id}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
