import type { FormEvent } from "react";
import { skipToken } from "@reduxjs/toolkit/query/react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAppSelector } from "@/app/hooks";
import { PageHeader } from "@/layouts/PageHeader";
import { useGlobalSearchQuery } from "@/services/api";
import { resolveSearchResultRoute } from "@/utils/searchRoutes";

export default function SearchResultsPage() {
  const navigate = useNavigate();
  const role = useAppSelector((state) => state.auth.role);
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get("q") ?? "";
  const trimmedQuery = query.trim();
  const { data, isFetching } = useGlobalSearchQuery(trimmedQuery.length >= 2 ? trimmedQuery : skipToken);
  const groups = data?.groups ?? [];
  const totalResults = groups.reduce((count, group) => count + group.results.length, 0);

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextQuery = new FormData(event.currentTarget).get("q")?.toString().trim() ?? "";
    setSearchParams(nextQuery ? { q: nextQuery } : {});
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Search"
        subtitle="Find patients, staff, tasks, wards, teams, and rounds from one place."
      />

      <form className="panel rounded p-4" onSubmit={submitSearch}>
        <label className="field-label mb-2 block" htmlFor="dashboard-search-results">
          Search the hospital
        </label>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            key={query}
            id="dashboard-search-results"
            name="q"
            className="input"
            defaultValue={query}
            placeholder="Search patients, staff, tasks"
          />
          <button className="btn btn-primary shrink-0" type="submit">
            Search
          </button>
        </div>
      </form>

      {trimmedQuery.length < 2 ? (
        <div className="panel rounded p-5 text-sm ink-mute">Enter at least 2 characters to search.</div>
      ) : isFetching ? (
        <div className="panel rounded p-5 text-sm ink-mute">Searching...</div>
      ) : totalResults === 0 ? (
        <div className="panel rounded p-5 text-sm ink-mute">No results found for "{trimmedQuery}".</div>
      ) : (
        <div className="space-y-4">
          <div className="text-sm ink-mute">
            {totalResults} result{totalResults === 1 ? "" : "s"} for "{trimmedQuery}"
          </div>
          {groups.map((group) => (
            <section className="panel rounded overflow-hidden" key={group.type}>
              <div className="border-b hairline px-4 py-3">
                <div className="text-sm font-semibold">{group.type}</div>
                <div className="text-xs ink-mute">{group.results.length} result{group.results.length === 1 ? "" : "s"}</div>
              </div>
              <div>
                {group.results.map((result) => {
                  const route = resolveSearchResultRoute(role, result);
                  return (
                    <button
                      key={`${result.type}-${result.id}`}
                      className={`block w-full border-b hairline px-4 py-3 text-left last:border-b-0 ${
                        route ? "hover:bg-slate-50" : "cursor-default"
                      }`}
                      disabled={!route}
                      onClick={() => route && navigate(route)}
                      type="button"
                    >
                      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
                        <span className="text-sm font-medium">{result.title}</span>
                        <span className="field-label shrink-0">{result.type}</span>
                      </div>
                      {result.subtitle && <div className="mt-1 text-xs ink-mute">{result.subtitle}</div>}
                      {!route && <div className="mt-1 text-xs ink-mute">No destination is available for this result.</div>}
                    </button>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
