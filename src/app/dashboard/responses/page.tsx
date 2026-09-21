"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  ClipboardList,
  FolderKanban,
  MessageSquare,
  RefreshCw,
  Search,
  Users,
  X,
} from "lucide-react";
import { api, endpoints } from "@/api";

type Project = {
  id: string | number;
  name?: string;
  code?: string | null;
  description?: string | null;
  status?: string | null;
  color?: string | null;
  logo_url?: string | null;
  total_surveys?: number | null;
  total_submissions?: number | null;
  created_at?: string | null;
};

function unwrapList(value: any): any[] {
  const data = value?.data ?? value;

  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.projects)) return data.projects;
  if (Array.isArray(data?.results)) return data.results;

  return [];
}

function formatNumber(value: unknown) {
  return new Intl.NumberFormat("en-IN").format(Number(value ?? 0));
}

function formatDate(value?: string | null) {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function statusInfo(status?: string | null) {
  const value = String(status ?? "draft").toLowerCase();

  if (value === "active") {
    return {
      label: "Active",
      classes: "border-emerald-100 bg-emerald-50 text-emerald-700",
      dot: "bg-emerald-500",
    };
  }

  if (value === "completed") {
    return {
      label: "Completed",
      classes: "border-blue-100 bg-blue-50 text-blue-700",
      dot: "bg-blue-500",
    };
  }

  if (value === "paused") {
    return {
      label: "Paused",
      classes: "border-amber-100 bg-amber-50 text-amber-700",
      dot: "bg-amber-500",
    };
  }

  if (value === "archived") {
    return {
      label: "Archived",
      classes: "border-slate-200 bg-slate-100 text-slate-600",
      dot: "bg-slate-400",
    };
  }

  return {
    label: "Draft",
    classes: "border-slate-200 bg-slate-100 text-slate-600",
    dot: "bg-slate-400",
  };
}

export default function ResponsesProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadProjects() {
    try {
      setLoading(true);
      setError("");

      // Response flow starts with projects.
      // The existing projects API is used here because projects are
      // the first level of the response hierarchy.
      const response = await api<any>(endpoints.projects);

      setProjects(unwrapList(response) as Project[]);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load projects.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProjects();
  }, []);

  const filteredProjects = useMemo(() => {
    const query = search.trim().toLowerCase();

    return projects.filter((project) => {
      const matchesSearch =
        !query ||
        String(project.name ?? "").toLowerCase().includes(query) ||
        String(project.code ?? "").toLowerCase().includes(query) ||
        String(project.description ?? "").toLowerCase().includes(query);

      const matchesStatus =
        statusFilter === "all" ||
        String(project.status ?? "draft").toLowerCase() ===
          statusFilter.toLowerCase();

      return matchesSearch && matchesStatus;
    });
  }, [projects, search, statusFilter]);

  const totalSurveys = useMemo(
    () =>
      projects.reduce(
        (sum, project) => sum + Number(project.total_surveys ?? 0),
        0,
      ),
    [projects],
  );

  const totalResponses = useMemo(
    () =>
      projects.reduce(
        (sum, project) => sum + Number(project.total_submissions ?? 0),
        0,
      ),
    [projects],
  );

  return (
    <div className="min-h-screen bg-[#f4f5f7] text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-[1500px] px-5 py-7 sm:px-7 lg:px-9 lg:py-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex items-start gap-4">
              <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-[18px] bg-slate-950 text-white shadow-[0_12px_28px_rgba(15,23,42,0.15)]">
                <MessageSquare size={24} />
                <span className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-[3px] border-white bg-red-600" />
              </div>

              <div>
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.22em]">
                  <span className="text-red-600">Jansetu</span>
                  <span className="h-1 w-1 rounded-full bg-slate-300" />
                  <span className="text-slate-400">Response Center</span>
                </div>

                <h1 className="mt-1 text-3xl font-black tracking-[-0.04em] text-slate-950 sm:text-4xl">
                  Responses
                </h1>

                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                  Choose a project first. You will then select a survey and
                  view the responses collected for that survey.
                </p>
              </div>
            </div>
          </div>

          {/* Response navigation — only the response flow */}
          <nav
            aria-label="Response navigation"
            className="mt-7 flex items-center overflow-x-auto rounded-2xl border border-slate-200 bg-slate-50 p-1.5"
          >
            <div className="flex min-w-[150px] flex-1 items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-xs font-black text-slate-950 shadow-sm ring-1 ring-slate-200">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-600 text-white">
                <FolderKanban size={13} />
              </span>
              <span>Projects</span>
            </div>

            <ArrowRight size={14} className="mx-1 shrink-0 text-slate-300" />

            <div className="flex min-w-[150px] flex-1 items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold text-slate-400">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-200 text-slate-400">
                <ClipboardList size={13} />
              </span>
              <span>Surveys</span>
            </div>

            <ArrowRight size={14} className="mx-1 shrink-0 text-slate-300" />

            <div className="flex min-w-[150px] flex-1 items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold text-slate-400">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-200 text-slate-400">
                <MessageSquare size={13} />
              </span>
              <span>Responses</span>
            </div>

            <ArrowRight size={14} className="mx-1 shrink-0 text-slate-300" />

            <div className="flex min-w-[170px] flex-1 items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold text-slate-400">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-200 text-slate-400">
                <Users size={13} />
              </span>
              <span>Response detail</span>
            </div>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-[1500px] px-5 py-7 sm:px-7 lg:px-9 lg:py-9">
        {error && (
          <div className="mb-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-4">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-600">
              <X size={17} />
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-sm font-black text-red-800">
                Could not load projects
              </p>
              <p className="mt-1 text-xs leading-5 text-red-700">
                {error}
              </p>
            </div>

            <button
              type="button"
              onClick={loadProjects}
              className="inline-flex h-9 items-center gap-2 rounded-lg bg-white px-3 text-xs font-bold text-red-700 shadow-sm ring-1 ring-red-100 hover:bg-red-50"
            >
              <RefreshCw size={13} />
              Retry
            </button>
          </div>
        )}

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <SummaryCard
            icon={<FolderKanban size={18} />}
            label="Projects"
            value={projects.length}
            caption="Projects available"
          />
          <SummaryCard
            icon={<ClipboardList size={18} />}
            label="Surveys"
            value={totalSurveys}
            caption="Across all projects"
          />
          <SummaryCard
            icon={<MessageSquare size={18} />}
            label="Responses"
            value={totalResponses}
            caption="Collected submissions"
          />
        </section>

        <section className="mt-7 overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_10px_35px_rgba(15,23,42,0.045)]">
          <div className="border-b border-slate-100 bg-slate-50/70 px-5 py-5 sm:px-7">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-red-600">
                  Step 1
                </p>
                <h2 className="mt-1 text-xl font-black tracking-tight text-slate-950">
                  Select a project
                </h2>
                <p className="mt-1 text-xs leading-5 text-slate-400">
                  Choose the project whose surveys contain the responses you
                  want to review.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <div className="relative sm:w-[330px]">
                  <Search
                    size={16}
                    className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search projects..."
                    className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-xs font-semibold text-slate-800 outline-none transition hover:border-red-200 focus:border-red-400 focus:ring-4 focus:ring-red-100"
                  />
                </div>

                <select
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                  className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 outline-none hover:border-red-200 focus:border-red-400 focus:ring-4 focus:ring-red-100"
                >
                  <option value="all">All status</option>
                  <option value="active">Active</option>
                  <option value="draft">Draft</option>
                  <option value="paused">Paused</option>
                  <option value="completed">Completed</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
            </div>
          </div>

          {loading ? (
            <ProjectSkeleton />
          ) : filteredProjects.length === 0 ? (
            <EmptyProjects
              filtered={Boolean(search || statusFilter !== "all")}
              onClear={() => {
                setSearch("");
                setStatusFilter("all");
              }}
            />
          ) : (
            <div className="grid gap-5 p-5 sm:p-6 md:grid-cols-2 xl:grid-cols-3">
              {filteredProjects.map((project) => (
                <ResponseProjectCard
                  key={String(project.id)}
                  project={project}
                />
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

function ResponseProjectCard({ project }: { project: Project }) {
  const status = statusInfo(project.status);
  const color = project.color || "#DC2626";

  return (
    <Link
      href={`/dashboard/responses/${project.id}`}
      className="group relative block overflow-hidden rounded-[26px] border border-slate-200 bg-white p-5 shadow-[0_8px_28px_rgba(15,23,42,0.04)] transition duration-300 hover:-translate-y-1 hover:border-red-200 hover:shadow-[0_18px_40px_rgba(15,23,42,0.09)] focus:outline-none focus:ring-4 focus:ring-red-100"
    >
      <div
        className="absolute inset-x-0 top-0 h-1.5"
        style={{ backgroundColor: color }}
      />

      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border bg-white"
            style={{ borderColor: `${color}35` }}
          >
            <FolderKanban size={21} style={{ color }} />
          </div>

          <div className="min-w-0">
            <h3 className="truncate text-base font-black text-slate-950 group-hover:text-red-700">
              {project.name || "Untitled project"}
            </h3>

            {project.code && (
              <p className="mt-1 truncate text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {project.code}
              </p>
            )}
          </div>
        </div>

        <span
          className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-[9px] font-black ${status.classes}`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
          {status.label}
        </span>
      </div>

      <p className="mt-5 min-h-[40px] line-clamp-2 text-xs leading-5 text-slate-500">
        {project.description ||
          "Open this project to choose one of its surveys and review responses."}
      </p>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3.5">
          <div className="flex items-center gap-2 text-slate-400">
            <ClipboardList size={14} />
            <span className="text-[9px] font-black uppercase tracking-wider">
              Surveys
            </span>
          </div>
          <p className="mt-1 text-xl font-black text-slate-950">
            {formatNumber(project.total_surveys)}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3.5">
          <div className="flex items-center gap-2 text-slate-400">
            <MessageSquare size={14} />
            <span className="text-[9px] font-black uppercase tracking-wider">
              Responses
            </span>
          </div>
          <p className="mt-1 text-xl font-black text-slate-950">
            {formatNumber(project.total_submissions)}
          </p>
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
        <span className="inline-flex items-center gap-2 text-[10px] font-medium text-slate-400">
          <CalendarDays size={13} />
          Created {formatDate(project.created_at)}
        </span>

        <span className="inline-flex items-center gap-1.5 rounded-xl bg-slate-950 px-3.5 py-2 text-[10px] font-black text-white transition group-hover:bg-red-600">
          Select project
          <ArrowRight size={13} />
        </span>
      </div>
    </Link>
  );
}

function SummaryCard({
  icon,
  label,
  value,
  caption,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  caption: string;
}) {
  return (
    <div className="rounded-[22px] border border-slate-200 bg-white p-5 shadow-[0_7px_25px_rgba(15,23,42,0.035)]">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-950 text-white">
        {icon}
      </div>
      <p className="mt-4 text-[9px] font-black uppercase tracking-[0.16em] text-slate-400">
        {label}
      </p>
      <p className="mt-1 text-2xl font-black tracking-tight text-slate-950">
        {formatNumber(value)}
      </p>
      <p className="mt-1 text-[11px] text-slate-400">{caption}</p>
    </div>
  );
}

function ProjectSkeleton() {
  return (
    <div className="grid gap-5 p-5 sm:p-6 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <div
          key={index}
          className="animate-pulse rounded-[26px] border border-slate-200 p-5"
        >
          <div className="flex justify-between">
            <div className="h-12 w-12 rounded-2xl bg-slate-100" />
            <div className="h-7 w-20 rounded-full bg-slate-100" />
          </div>
          <div className="mt-5 h-4 w-2/3 rounded bg-slate-100" />
          <div className="mt-2 h-3 w-24 rounded bg-slate-100" />
          <div className="mt-5 h-10 rounded bg-slate-100" />
          <div className="mt-5 grid grid-cols-2 gap-3">
            <div className="h-20 rounded-2xl bg-slate-100" />
            <div className="h-20 rounded-2xl bg-slate-100" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyProjects({
  filtered,
  onClear,
}: {
  filtered: boolean;
  onClear: () => void;
}) {
  return (
    <div className="px-6 py-24 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[22px] bg-red-50 text-red-600">
        {filtered ? <Search size={27} /> : <FolderKanban size={27} />}
      </div>

      <h2 className="mt-5 text-xl font-black text-slate-950">
        {filtered ? "No projects found" : "No projects available"}
      </h2>

      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-400">
        {filtered
          ? "Try another search term or clear the status filter."
          : "Projects will appear here when they are available."}
      </p>

      {filtered && (
        <button
          type="button"
          onClick={onClear}
          className="mt-5 rounded-xl bg-slate-950 px-4 py-2.5 text-xs font-bold text-white hover:bg-red-600"
        >
          Clear filters
        </button>
      )}
    </div>
  );
}
