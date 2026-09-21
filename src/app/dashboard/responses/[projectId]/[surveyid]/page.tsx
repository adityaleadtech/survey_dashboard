"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { useParams, usePathname, useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock3,
  FileText,
  Image as ImageIcon,
  MapPin,
  MessageSquare,
  Mic,
  RefreshCw,
  Search,
  Users,
  Video,
  X,
} from "lucide-react";
import { api, endpoints } from "@/api";

type Project = {
  id: string;
  name?: string;
  title?: string;
  code?: string;
  description?: string | null;
  status?: string | null;
  is_active?: boolean;
};

type Survey = {
  id: string;
  title?: string;
  description?: string | null;
  survey_type?: string;
  status?: string | null;
  is_active?: boolean;
  created_at?: string | null;
  fields?: any[];
};

type SurveyResponse = {
  id: string;
  survey_id?: string;
  user_id?: string;
  submitted_by?: string;
  respondent_name?: string;
  respondent_id?: string;
  user_name?: string;
  response?: Record<string, any> | null;
  media_files?: Record<string, any> | null;
  location?: Record<string, any> | null;
  latitude?: number | null;
  longitude?: number | null;
  location_name?: string | null;
  location_address?: string | null;
  submitted_at?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  status?: string | null;
  [key: string]: any;
};

/* -------------------------------------------------------------------------- */
/* API helpers                                                                */
/* -------------------------------------------------------------------------- */

function unwrapData(value: any): any {
  if (value?.data !== undefined) return value.data;
  return value;
}

function normalizeArray(value: any): any[] {
  const data = unwrapData(value);

  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.responses)) return data.responses;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.results)) return data.results;

  return [];
}

function normalizeObject(value: any): any | null {
  const data = unwrapData(value);
  return data && typeof data === "object" && !Array.isArray(data)
    ? data
    : null;
}

/* -------------------------------------------------------------------------- */
/* Display helpers                                                            */
/* -------------------------------------------------------------------------- */

function projectName(project: Project | null) {
  return project?.name || project?.title || project?.code || "Project";
}

function surveyName(survey: Survey | null) {
  return survey?.title || "Untitled Survey";
}

function surveyDescription(survey: Survey | null) {
  return (
    survey?.description ||
    "Review every submission collected for this survey."
  );
}

function respondentName(item: SurveyResponse) {
  return (
    item.respondent_name ||
    item.submitted_by ||
    item.user_name ||
    item.respondent_id ||
    item.user_id ||
    "Anonymous respondent"
  );
}

function formatDateTime(value?: string | null) {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);

  return date.toLocaleString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function responseObject(item: SurveyResponse) {
  return item.response &&
    typeof item.response === "object" &&
    !Array.isArray(item.response)
    ? item.response
    : {};
}

function mediaObject(item: SurveyResponse) {
  return item.media_files &&
    typeof item.media_files === "object" &&
    !Array.isArray(item.media_files)
    ? item.media_files
    : {};
}

function stringifyValue(value: any): string {
  if (value === null || value === undefined || value === "") return "";

  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  if (Array.isArray(value)) {
    return value
      .map(stringifyValue)
      .filter(Boolean)
      .join(", ");
  }

  if (typeof value === "object") {
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }

  return String(value);
}

function primaryPreview(item: SurveyResponse) {
  const entries = Object.entries(responseObject(item));

  for (const [, value] of entries) {
    const text = stringifyValue(value);
    if (text.trim()) return text;
  }

  const media = mediaObject(item);

  if (Object.keys(media).length) return "Media response submitted";

  if (
    item.location ||
    item.latitude !== null && item.latitude !== undefined ||
    item.longitude !== null && item.longitude !== undefined
  ) {
    return "Location response submitted";
  }

  return "No text response";
}

function answerCount(item: SurveyResponse) {
  return Object.keys(responseObject(item)).length;
}

function hasAudio(item: SurveyResponse) {
  const media = mediaObject(item);
  return Boolean(
    media.audio ||
      media.audios ||
      media.audio_url ||
      media.voice ||
      media.recording
  );
}

function hasImages(item: SurveyResponse) {
  const media = mediaObject(item);
  return Boolean(
    media.image ||
      media.images ||
      media.image_url ||
      media.photos
  );
}

function hasVideo(item: SurveyResponse) {
  const media = mediaObject(item);
  return Boolean(
    media.video ||
      media.videos ||
      media.video_url
  );
}

function hasLocation(item: SurveyResponse) {
  return Boolean(
    item.location ||
      item.latitude !== null && item.latitude !== undefined ||
      item.longitude !== null && item.longitude !== undefined ||
      item.location_name ||
      item.location_address
  );
}

function statusInfo(status?: string | null) {
  const value = String(status || "submitted").toLowerCase();

  if (
    value === "submitted" ||
    value === "completed" ||
    value === "complete"
  ) {
    return {
      label: value === "complete" ? "Completed" : value,
      className: "border-emerald-100 bg-emerald-50 text-emerald-700",
      dot: "bg-emerald-500",
    };
  }

  if (value === "pending") {
    return {
      label: "Pending",
      className: "border-amber-100 bg-amber-50 text-amber-700",
      dot: "bg-amber-500",
    };
  }

  return {
    label: value,
    className: "border-slate-200 bg-slate-100 text-slate-600",
    dot: "bg-slate-400",
  };
}

/* -------------------------------------------------------------------------- */
/* Page                                                                       */
/* -------------------------------------------------------------------------- */

export default function SurveyResponsesPage() {
  const router = useRouter();
  const pathname = usePathname();

  const params = useParams<{
    projectid?: string;
    surveyid?: string;
  }>();

  const paramProjectId = params?.projectid
    ? String(params.projectid)
    : "";

  const paramSurveyId = params?.surveyid
    ? String(params.surveyid)
    : "";

  /* Fallback to the real pathname so dynamic route params cannot silently
     disappear during client navigation. */
  const pathnameIds = useMemo(() => {
    const parts = (pathname || "")
      .split("/")
      .filter(Boolean);

    const index = parts.indexOf("responses");

    return {
      projectId: index >= 0 ? parts[index + 1] || "" : "",
      surveyId: index >= 0 ? parts[index + 2] || "" : "",
    };
  }, [pathname]);

  const projectId = paramProjectId || pathnameIds.projectId;
  const surveyId = paramSurveyId || pathnameIds.surveyId;

  const [project, setProject] = useState<Project | null>(null);
  const [survey, setSurvey] = useState<Survey | null>(null);
  const [responses, setResponses] = useState<SurveyResponse[]>([]);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadPage() {
    if (!projectId || !surveyId) {
      setError(
        !projectId
          ? "Project ID is missing from the URL."
          : "Survey ID is missing from the URL."
      );
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      /* Project title: use the already-working projects list endpoint. */
      try {
        const projectResponse = await api<any>(endpoints.projects);
        const projects = normalizeArray(projectResponse) as Project[];

        const found = projects.find(
          (item) => String(item?.id) === String(projectId)
        );

        setProject(found || null);
      } catch (projectError) {
        console.error("Unable to load project:", projectError);
        setProject(null);
      }

      /* Survey information. */
      const surveyResponse = await api<any>(
        endpoints.survey(surveyId)
      );

      const loadedSurvey = normalizeObject(surveyResponse);

      if (!loadedSurvey) {
        throw new Error("Unable to read survey information.");
      }

      setSurvey({
        ...loadedSurvey,
        fields: Array.isArray(loadedSurvey.fields)
          ? loadedSurvey.fields
          : [],
      });

      /* Actual response data. */
      const responsesResponse = await api<any>(
        endpoints.surveyResponses(surveyId)
      );

      console.log("Survey responses API:", responsesResponse);

      const responseList = normalizeArray(
        responsesResponse
      ) as SurveyResponse[];

      console.log("Normalized survey responses:", responseList);

      setResponses(responseList);
    } catch (err) {
      console.error("Survey responses loading error:", err);

      setResponses([]);
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load survey responses."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPage();
    // IDs are the only values that should trigger a new API load.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, surveyId]);

  const filteredResponses = useMemo(() => {
    const query = search.trim().toLowerCase();

    return responses.filter((item) => {
      const status = String(
        item.status || "submitted"
      ).toLowerCase();

      if (
        statusFilter !== "all" &&
        status !== statusFilter
      ) {
        return false;
      }

      if (!query) return true;

      const responseText = JSON.stringify(
        item.response || {}
      ).toLowerCase();

      const mediaText = JSON.stringify(
        item.media_files || {}
      ).toLowerCase();

      const respondent = respondentName(item).toLowerCase();
      const id = String(item.id || "").toLowerCase();

      return (
        responseText.includes(query) ||
        mediaText.includes(query) ||
        respondent.includes(query) ||
        id.includes(query)
      );
    });
  }, [responses, search, statusFilter]);

  const submittedCount = responses.filter((item) => {
    const status = String(
      item.status || "submitted"
    ).toLowerCase();

    return (
      status === "submitted" ||
      status === "completed" ||
      status === "complete" ||
      !item.status
    );
  }).length;

  const mediaCount = responses.filter(
    (item) =>
      hasAudio(item) ||
      hasImages(item) ||
      hasVideo(item)
  ).length;

  const locationCount = responses.filter(hasLocation).length;

  function openResponse(id: string) {
    if (!id) return;

    router.push(
      `/dashboard/responses/response/${id}`
    );
  }

  /* ------------------------------------------------------------------------ */
  /* Invalid route                                                            */
  /* ------------------------------------------------------------------------ */

  if (!projectId || !surveyId) {
    return (
      <PageShell>
        <div className="flex min-h-[70vh] items-center justify-center px-5">
          <EmptyCard
            icon={<AlertCircle size={26} />}
            title="Unable to open survey responses"
            description={
              !projectId
                ? "Project ID is missing from the URL."
                : "Survey ID is missing from the URL."
            }
          >
            <Link
              href={
                projectId
                  ? `/dashboard/responses/${projectId}`
                  : "/dashboard/responses"
              }
              className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-5 py-3 text-xs font-black text-white shadow-lg shadow-red-600/20 transition hover:bg-red-700"
            >
              <ArrowLeft size={15} />
              Back
            </Link>
          </EmptyCard>
        </div>
      </PageShell>
    );
  }

  /* ------------------------------------------------------------------------ */
  /* Loading                                                                  */
  /* ------------------------------------------------------------------------ */

  if (loading) {
    return (
      <PageShell>
        <div className="flex min-h-[70vh] items-center justify-center px-5">
          <div className="rounded-3xl border border-slate-200 bg-white px-8 py-7 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-50 text-red-600">
                <RefreshCw
                  size={19}
                  className="animate-spin"
                />
              </div>
              <div>
                <p className="text-sm font-black text-slate-900">
                  Loading survey responses
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  Fetching submitted responses...
                </p>
              </div>
            </div>
          </div>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      {/* ------------------------------------------------------------------ */}
      {/* Header                                                             */}
      {/* ------------------------------------------------------------------ */}

      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-[1500px] px-5 py-7 sm:px-7 lg:px-9">
          <div className="flex flex-col gap-6">
            {/* Breadcrumb */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <Link
                href="/dashboard/responses"
                className="font-bold text-slate-400 transition hover:text-slate-900"
              >
                Responses
              </Link>

              <ChevronRight
                size={14}
                className="text-slate-300"
              />

              <Link
                href={`/dashboard/responses/${projectId}`}
                className="max-w-[220px] truncate font-bold text-slate-400 transition hover:text-slate-900"
              >
                {projectName(project)}
              </Link>

              <ChevronRight
                size={14}
                className="text-slate-300"
              />

              <span className="max-w-[300px] truncate font-black text-slate-900">
                {surveyName(survey)}
              </span>
            </div>

            {/* Main heading */}
            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div className="flex min-w-0 items-start gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[18px] bg-red-600 text-white shadow-lg shadow-red-600/20">
                  <MessageSquare size={24} />
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em]">
                    <span className="text-red-600">
                      Jansetu
                    </span>
                    <span className="h-1 w-1 rounded-full bg-slate-300" />
                    <span className="text-slate-400">
                      Survey Responses
                    </span>
                  </div>

                  <h1 className="mt-1 truncate text-3xl font-black tracking-[-0.04em] text-slate-950 sm:text-4xl">
                    {surveyName(survey)}
                  </h1>

                  <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
                    {surveyDescription(survey)}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={loadPage}
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-black text-slate-700 transition hover:border-red-200 hover:bg-red-50 hover:text-red-700"
              >
                <RefreshCw size={15} />
                Refresh
              </button>
            </div>

            {/* Response-only navigation */}
            <ResponseFlow
              projectId={projectId}
              surveyId={surveyId}
              current="responses"
            />
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1500px] space-y-6 px-5 py-7 sm:px-7 lg:px-9 lg:py-9">
        {/* Error */}
        {error && (
          <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-5 py-4">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-600">
              <AlertCircle size={17} />
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-sm font-black text-red-800">
                Something went wrong
              </p>
              <p className="mt-1 break-words text-xs leading-5 text-red-600">
                {error}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setError("")}
              className="rounded-lg p-1.5 text-red-400 transition hover:bg-red-100 hover:text-red-700"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* Summary */}
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            icon={<FileText size={19} />}
            label="Total responses"
            value={responses.length}
            caption="All submissions received"
          />

          <StatCard
            icon={<CheckCircle2 size={19} />}
            label="Submitted"
            value={submittedCount}
            caption="Completed submissions"
          />

          <StatCard
            icon={<Mic size={19} />}
            label="Media"
            value={mediaCount}
            caption="Audio, image or video"
          />

          <StatCard
            icon={<MapPin size={19} />}
            label="Location"
            value={locationCount}
            caption="Responses with location"
          />
        </section>

        {/* Response workspace */}
        <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_10px_35px_rgba(15,23,42,0.045)]">
          <div className="border-b border-slate-100 bg-slate-50/70 px-5 py-5 sm:px-7">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-black tracking-tight text-slate-950">
                    Survey responses
                  </h2>

                  <span className="rounded-full bg-red-50 px-2.5 py-1 text-[11px] font-black text-red-700">
                    {filteredResponses.length}
                  </span>
                </div>

                <p className="mt-1 text-xs text-slate-400">
                  Select a submission to open its complete response.
                </p>
              </div>

              <div className="flex w-full flex-col gap-3 sm:flex-row xl:w-auto">
                <div className="relative sm:w-[330px]">
                  <Search
                    size={16}
                    className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    value={search}
                    onChange={(event) =>
                      setSearch(event.target.value)
                    }
                    placeholder="Search responses..."
                    className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-10 text-xs font-semibold text-slate-800 outline-none transition placeholder:text-slate-400 hover:border-red-200 focus:border-red-400 focus:ring-4 focus:ring-red-100"
                  />

                  {search && (
                    <button
                      type="button"
                      onClick={() => setSearch("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-slate-100 p-1 text-slate-400 transition hover:bg-slate-200 hover:text-slate-700"
                    >
                      <X size={13} />
                    </button>
                  )}
                </div>

                <select
                  value={statusFilter}
                  onChange={(event) =>
                    setStatusFilter(event.target.value)
                  }
                  className="h-11 rounded-xl border border-slate-200 bg-white px-4 text-xs font-black text-slate-700 outline-none transition hover:border-red-200 focus:border-red-400 focus:ring-4 focus:ring-red-100"
                >
                  <option value="all">All status</option>
                  <option value="submitted">Submitted</option>
                  <option value="completed">Completed</option>
                  <option value="complete">Complete</option>
                  <option value="pending">Pending</option>
                </select>
              </div>
            </div>
          </div>

          {/* No responses */}
          {responses.length === 0 && (
            <EmptyCard
              compact
              icon={<FileText size={28} />}
              title="No responses yet"
              description="This survey does not have any submitted responses yet."
            >
              <button
                type="button"
                onClick={loadPage}
                className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-xs font-black text-white shadow-lg shadow-red-600/20 transition hover:bg-red-700"
              >
                <RefreshCw size={14} />
                Refresh
              </button>
            </EmptyCard>
          )}

          {/* Filtered empty */}
          {responses.length > 0 &&
            filteredResponses.length === 0 && (
              <EmptyCard
                compact
                icon={<Search size={26} />}
                title="No matching responses"
                description="Try another search term or change the status filter."
              >
                <button
                  type="button"
                  onClick={() => {
                    setSearch("");
                    setStatusFilter("all");
                  }}
                  className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-xs font-black text-white shadow-lg shadow-red-600/20 transition hover:bg-red-700"
                >
                  Clear filters
                </button>
              </EmptyCard>
            )}

          {/* List */}
          {filteredResponses.length > 0 && (
            <div className="divide-y divide-slate-100">
              {filteredResponses.map((item, index) => {
                const status = statusInfo(item.status);
                const audio = hasAudio(item);
                const images = hasImages(item);
                const video = hasVideo(item);
                const location = hasLocation(item);
                const preview = primaryPreview(item);
                const count = answerCount(item);
                const submittedAt =
                  item.submitted_at || item.created_at;

                return (
                  <button
                    key={String(item.id || index)}
                    type="button"
                    onClick={() =>
                      openResponse(String(item.id))
                    }
                    className="group w-full text-left transition hover:bg-slate-50/80 focus:outline-none focus:bg-slate-50"
                  >
                    <div className="px-5 py-5 sm:px-7">
                      <div className="flex items-start gap-4">
                        <div className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-xs font-black text-slate-500 sm:flex">
                          {index + 1}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-sm font-black text-slate-900">
                                  {respondentName(item)}
                                </span>

                                <span
                                  className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-wide ${status.className}`}
                                >
                                  <span
                                    className={`h-1.5 w-1.5 rounded-full ${status.dot}`}
                                  />
                                  {status.label}
                                </span>
                              </div>

                              <p className="mt-1 font-mono text-[10px] text-slate-400">
                                {item.id}
                              </p>
                            </div>

                            <div className="flex shrink-0 items-center gap-2 text-[11px] font-bold text-slate-400">
                              <Clock3 size={13} />
                              {formatDateTime(submittedAt)}
                            </div>
                          </div>

                          <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
                            <p className="line-clamp-2 text-xs leading-5 text-slate-600">
                              {preview}
                            </p>
                          </div>

                          <div className="mt-3 flex flex-wrap items-center gap-2">
                            <MetaPill
                              icon={<FileText size={12} />}
                              label={`${count} ${
                                count === 1
                                  ? "answer"
                                  : "answers"
                              }`}
                            />

                            {audio && (
                              <MetaPill
                                icon={<Mic size={12} />}
                                label="Audio"
                                tone="violet"
                              />
                            )}

                            {images && (
                              <MetaPill
                                icon={<ImageIcon size={12} />}
                                label="Image"
                                tone="blue"
                              />
                            )}

                            {video && (
                              <MetaPill
                                icon={<Video size={12} />}
                                label="Video"
                                tone="pink"
                              />
                            )}

                            {location && (
                              <MetaPill
                                icon={<MapPin size={12} />}
                                label="Location"
                                tone="green"
                              />
                            )}
                          </div>
                        </div>

                        <div className="hidden pt-1 sm:flex">
                          <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-400 transition group-hover:border-red-100 group-hover:bg-red-50 group-hover:text-red-600">
                            <ArrowRight
                              size={16}
                              className="transition-transform group-hover:translate-x-0.5"
                            />
                          </span>
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </PageShell>
  );
}

/* -------------------------------------------------------------------------- */
/* Response flow                                                              */
/* -------------------------------------------------------------------------- */

function ResponseFlow({
  projectId,
  surveyId,
  current,
}: {
  projectId: string;
  surveyId: string;
  current: "responses";
}) {
  const steps = [
    {
      label: "Projects",
      href: "/dashboard/responses",
      icon: <span className="text-[10px] font-black">1</span>,
    },
    {
      label: "Surveys",
      href: `/dashboard/responses/${projectId}`,
      icon: <span className="text-[10px] font-black">2</span>,
    },
    {
      label: "Survey Responses",
      href: `/dashboard/responses/${projectId}/${surveyId}`,
      icon: <span className="text-[10px] font-black">3</span>,
    },
    {
      label: "Response Detail",
      href: "#",
      icon: <span className="text-[10px] font-black">4</span>,
    },
  ];

  return (
    <nav
      aria-label="Response navigation"
      className="flex items-center overflow-x-auto rounded-2xl border border-slate-200 bg-slate-50 p-1.5"
    >
      {steps.map((step, index) => {
        const active =
          step.label === "Survey Responses" &&
          current === "responses";

        const content = (
          <>
            <span
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
                active
                  ? "bg-red-600 text-white"
                  : "bg-slate-200 text-slate-400"
              }`}
            >
              {step.icon}
            </span>
            <span>{step.label}</span>
          </>
        );

        return (
          <div
            key={step.label}
            className="flex min-w-max flex-1 items-center"
          >
            {index === 0 ? null : (
              <ArrowRight
                size={14}
                className="mx-1 shrink-0 text-slate-300"
              />
            )}

            {active ? (
              <div className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-xs font-black text-red-700 shadow-sm ring-1 ring-red-100">
                {content}
              </div>
            ) : (
              <Link
                href={step.href}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-400 transition hover:bg-white hover:text-slate-700"
              >
                {content}
              </Link>
            )}
          </div>
        );
      })}
    </nav>
  );
}

/* -------------------------------------------------------------------------- */
/* Shared UI                                                                  */
/* -------------------------------------------------------------------------- */

function PageShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#f4f5f7] text-slate-900">
      {children}
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  caption,
}: {
  icon: ReactNode;
  label: string;
  value: number;
  caption: string;
}) {
  return (
    <div className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_5px_20px_rgba(15,23,42,0.035)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_12px_30px_rgba(15,23,42,0.07)]">
      <div className="flex items-start justify-between gap-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600 transition group-hover:bg-red-50 group-hover:text-red-600">
          {icon}
        </div>

        <span className="mt-2 h-2 w-2 rounded-full bg-red-500" />
      </div>

      <p className="mt-5 text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">
        {label}
      </p>

      <p className="mt-1 text-2xl font-black tracking-tight text-slate-900">
        {value}
      </p>

      <p className="mt-1 text-xs text-slate-400">
        {caption}
      </p>
    </div>
  );
}

function MetaPill({
  icon,
  label,
  tone = "slate",
}: {
  icon: ReactNode;
  label: string;
  tone?: "slate" | "violet" | "blue" | "pink" | "green";
}) {
  const classes = {
    slate: "bg-slate-100 text-slate-500",
    violet: "bg-violet-50 text-violet-700",
    blue: "bg-blue-50 text-blue-700",
    pink: "bg-pink-50 text-pink-700",
    green: "bg-emerald-50 text-emerald-700",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[10px] font-black ${classes[tone]}`}
    >
      {icon}
      {label}
    </span>
  );
}

function EmptyCard({
  icon,
  title,
  description,
  children,
  compact = false,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  children?: ReactNode;
  compact?: boolean;
}) {
  return (
    <div
      className={`text-center ${
        compact ? "px-6 py-20" : "w-full max-w-xl rounded-3xl border border-slate-200 bg-white p-8"
      }`}
    >
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
        {icon}
      </div>

      <h2 className="mt-5 text-lg font-black text-slate-900">
        {title}
      </h2>

      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-400">
        {description}
      </p>

      {children && (
        <div className="mt-6">
          {children}
        </div>
      )}
    </div>
  );
}
