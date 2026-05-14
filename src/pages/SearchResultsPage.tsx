import type { FormEvent } from "react";
import { skipToken } from "@reduxjs/toolkit/query/react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAppSelector } from "@/app/hooks";
import { PageHeader } from "@/layouts/PageHeader";
import { useGlobalSearchQuery } from "@/services/api";
import { resolvePatientRoute } from "@/utils/searchRoutes";

export default function SearchResultsPage() {
  const navigate = useNavigate();
  const role = useAppSelector((state) => state.auth.role);
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get("q") ?? "";
  const trimmedQuery = query.trim();
  const { data, isFetching } = useGlobalSearchQuery(trimmedQuery.length >= 2 ? trimmedQuery : skipToken);

  // Only show patient results
  const patientGroup = data?.groups.find((g) => g.type.toLowerCase().includes("patient"));
  const patientResults = patientGroup?.results ?? [];

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextQuery = new FormData(event.currentTarget).get("q")?.toString().trim() ?? "";
    setSearchParams(nextQuery ? { q: nextQuery } : {});
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Patient Search"
        subtitle="Find patients by name or hospital number."
      />

      <form className="panel rounded p-4" onSubmit={submitSearch}>
        <label className="field-label mb-2 block" htmlFor="patient-search">
          Search patients
        </label>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            key={query}
            id="patient-search"
            name="q"
            className="input"
            defaultValue={query}
            placeholder="Patient name or hospital number"
            autoFocus
          />
          <button className="btn btn-primary shrink-0" type="submit">
            Search
          </button>
        </div>
      </form>

      {trimmedQuery.length < 2 ? (
        <div className="panel rounded p-5 text-sm ink-mute">Enter at least 2 characters to search for patients.</div>
      ) : isFetching ? (
        <div className="panel rounded p-5 text-sm ink-mute">Searching…</div>
      ) : patientResults.length === 0 ? (
        <div className="panel rounded p-5 text-sm ink-mute">No patients found for "{trimmedQuery}".</div>
      ) : (
        <div className="panel rounded overflow-hidden">
          <div className="border-b hairline px-4 py-3">
            <div className="text-sm font-semibold">Patients</div>
            <div className="text-xs ink-mute">{patientResults.length} result{patientResults.length === 1 ? "" : "s"} for "{trimmedQuery}"</div>
          </div>
          <div>
            {patientResults.map((result) => {
              const route = result.routeTarget
                ? result.routeTarget.startsWith("/") ? result.routeTarget : `/${result.routeTarget}`
                : resolvePatientRoute(role, result.id);
              return (
                <button
                  key={result.id}
                  className="block w-full border-b hairline px-4 py-3 text-left last:border-b-0 hover:bg-slate-50"
                  onClick={() => route && navigate(route)}
                  type="button"
                >
                  <div className="text-sm font-medium">{result.title}</div>
                  {result.subtitle && <div className="mt-0.5 text-xs ink-mute">{result.subtitle}</div>}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
