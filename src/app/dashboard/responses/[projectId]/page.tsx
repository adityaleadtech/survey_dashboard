"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, usePathname, useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  ClipboardList,
  FolderOpen,
  RefreshCw,
  Search,
  FileText,
  CheckCircle2,
  AlertCircle,
  X,
} from "lucide-react";

import { api, endpoints } from "@/api";

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

interface Project {
  id: string;
  client_id?: string;
  name?: string;
  title?: string;
  code?: string;
  description?: string | null;
  status?: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

interface ProjectSurvey {
  id: string;
  survey_id: string;
  is_mandatory?: boolean;
  sort_order?: number;
  target_submissions?: number | null;
  notes?: string | null;
  survey?: Survey | null;
}

interface Survey {
  id: string;
  client_id?: string;
  title?: string;
  description?: string | null;
  survey_type?: string;
  status?: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
  fields?: any[];
}

/* -------------------------------------------------------------------------- */
/* API helpers                                                                */
/* -------------------------------------------------------------------------- */

function unwrapData(response: any): any {
  if (response?.data !== undefined) {
    return response.data;
  }

  return response;
}

function normalizeArray(response: any): any[] {
  const data = unwrapData(response);

  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data?.data)) {
    return data.data;
  }

  return [];
}

function normalizeSurvey(response: any): Survey | null {
  const data = unwrapData(response);

  if (!data || typeof data !== "object") {
    return null;
  }

  return {
    ...data,
    fields: Array.isArray(data.fields)
      ? data.fields
      : [],
  };
}

/* -------------------------------------------------------------------------- */
/* Display helpers                                                            */
/* -------------------------------------------------------------------------- */

function getProjectName(
  project: Project | null
): string {
  if (!project) {
    return "Project";
  }

  return (
    project.name ||
    project.title ||
    project.code ||
    "Project"
  );
}

function getSurveyName(
  survey: Survey | null
): string {
  if (!survey) {
    return "Untitled Survey";
  }

  return survey.title || "Untitled Survey";
}

function getSurveyDescription(
  survey: Survey | null
): string {
  if (!survey?.description) {
    return "View submitted responses for this survey.";
  }

  return survey.description;
}

function formatDate(value?: string) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleDateString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/* -------------------------------------------------------------------------- */
/* Page                                                                       */
/* -------------------------------------------------------------------------- */

export default function ProjectResponsesPage() {
  const router = useRouter();
  const pathname = usePathname();

  /*
   * Keep useParams, but don't depend on it exclusively.
   */
  const params = useParams<{
    projectid?: string;
  }>();

  /*
   * Primary source:
   * /dashboard/responses/{projectid}
   */
  const paramProjectId = params?.projectid
    ? String(params.projectid)
    : "";

  /*
   * Fallback:
   * Read the actual browser pathname.
   *
   * Example:
   * /dashboard/responses/e3f383e2-ca9d-4039-86d1-92f4b4116db3
   *
   * pathname.split("/") gives:
   * ["", "dashboard", "responses", "PROJECT_ID"]
   */
  const pathnameProjectId = useMemo(() => {
    if (!pathname) {
      return "";
    }

    const parts = pathname
      .split("/")
      .filter(Boolean);

    const responsesIndex =
      parts.indexOf("responses");

    if (responsesIndex === -1) {
      return "";
    }

    const possibleProjectId =
      parts[responsesIndex + 1];

    if (!possibleProjectId) {
      return "";
    }

    return possibleProjectId;
  }, [pathname]);

  /*
   * Final project ID.
   */
  const projectId =
    paramProjectId || pathnameProjectId;

  /* ---------------------------------------------------------------------- */
  /* State                                                                  */
  /* ---------------------------------------------------------------------- */

  const [project, setProject] =
    useState<Project | null>(null);

  const [projectSurveys, setProjectSurveys] =
    useState<ProjectSurvey[]>([]);

  const [surveyDetails, setSurveyDetails] =
    useState<Record<string, Survey>>({});

  const [search, setSearch] = useState("");

  const [loadingProject, setLoadingProject] =
    useState(true);

  const [loadingSurveys, setLoadingSurveys] =
    useState(true);

  const [error, setError] = useState("");

  /* ---------------------------------------------------------------------- */
  /* Debug                                                                  */
  /* ---------------------------------------------------------------------- */

  useEffect(() => {
    console.log(
      "Responses page pathname:",
      pathname
    );

    console.log(
      "Responses page params:",
      params
    );

    console.log(
      "Responses page paramProjectId:",
      paramProjectId
    );

    console.log(
      "Responses page pathnameProjectId:",
      pathnameProjectId
    );

    console.log(
      "Responses page final projectId:",
      projectId
    );
  }, [
    pathname,
    params,
    paramProjectId,
    pathnameProjectId,
    projectId,
  ]);

  /* ---------------------------------------------------------------------- */
  /* Load data                                                              */
  /* ---------------------------------------------------------------------- */

  useEffect(() => {
    if (!projectId) {
      setError("Project ID is missing.");
      setLoadingProject(false);
      setLoadingSurveys(false);
      return;
    }

    loadProject();
    loadProjectSurveys();
  }, [projectId]);

  /* ---------------------------------------------------------------------- */
  /* Load project                                                           */
  /* ---------------------------------------------------------------------- */

  async function loadProject() {
    try {
      setLoadingProject(true);
      setError("");

      console.log(
        "Loading project using ID:",
        projectId
      );

      const response = await api<any>(
        endpoints.projects
      );

      console.log(
        "Responses - projects API:",
        response
      );

      const projects =
        normalizeArray(response) as Project[];

      console.log(
        "Responses - normalized projects:",
        projects
      );

      const foundProject =
        projects.find(
          (item) =>
            String(item?.id) ===
            String(projectId)
        );

      console.log(
        "Responses - found project:",
        foundProject
      );

      if (!foundProject) {
        throw new Error(
          `Project with ID "${projectId}" was not found.`
        );
      }

      setProject(foundProject);
    } catch (err) {
      console.error(
        "Responses project loading error:",
        err
      );

      setProject(null);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load project."
      );
    } finally {
      setLoadingProject(false);
    }
  }

  /* ---------------------------------------------------------------------- */
  /* Load surveys                                                           */
  /* ---------------------------------------------------------------------- */

  async function loadProjectSurveys() {
    if (!projectId) {
      return;
    }

    try {
      setLoadingSurveys(true);

      setError("");

      console.log(
        "Loading project surveys:",
        projectId
      );

      const response = await api<any>(
        endpoints.projectSurveys(projectId)
      );

      console.log(
        "Responses - project surveys API:",
        response
      );

      const projectSurveyList =
        normalizeArray(response) as ProjectSurvey[];

      console.log(
        "Responses - normalized project surveys:",
        projectSurveyList
      );

      setProjectSurveys(
        projectSurveyList
      );

      if (
        projectSurveyList.length === 0
      ) {
        setSurveyDetails({});
        return;
      }

      /*
       * Fetch survey details.
       */
      const results =
        await Promise.all(
          projectSurveyList.map(
            async (projectSurvey) => {
              const surveyId =
                projectSurvey?.survey_id;

              if (!surveyId) {
                return {
                  surveyId: "",
                  survey: null,
                };
              }

              try {
                const surveyResponse =
                  await api<any>(
                    endpoints.survey(
                      String(surveyId)
                    )
                  );

                const survey =
                  normalizeSurvey(
                    surveyResponse
                  );

                return {
                  surveyId:
                    String(surveyId),
                  survey,
                };
              } catch (err) {
                console.error(
                  `Unable to load survey ${surveyId}:`,
                  err
                );

                /*
                 * If project-survey response
                 * already contains survey data,
                 * use that.
                 */
                return {
                  surveyId:
                    String(surveyId),
                  survey:
                    projectSurvey.survey ||
                    null,
                };
              }
            }
          )
        );

      const details: Record<
        string,
        Survey
      > = {};

      for (const result of results) {
        if (
          result.surveyId &&
          result.survey
        ) {
          details[
            result.surveyId
          ] = result.survey;
        }
      }

      setSurveyDetails(details);

      console.log(
        "Responses - survey details:",
        details
      );
    } catch (err) {
      console.error(
        "Responses survey loading error:",
        err
      );

      setProjectSurveys([]);
      setSurveyDetails({});

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load project surveys."
      );
    } finally {
      setLoadingSurveys(false);
    }
  }

  /* ---------------------------------------------------------------------- */
  /* Surveys                                                                 */
  /* ---------------------------------------------------------------------- */

  const surveys = useMemo(() => {
    return projectSurveys
      .map((projectSurvey) => {
        const surveyId =
          String(
            projectSurvey.survey_id || ""
          );

        const survey =
          surveyDetails[surveyId] ||
          projectSurvey.survey ||
          null;

        return {
          projectSurvey,
          surveyId,
          survey,
        };
      })
      .filter(
        (item) => item.surveyId
      );
  }, [
    projectSurveys,
    surveyDetails,
  ]);

  /* ---------------------------------------------------------------------- */
  /* Search                                                                  */
  /* ---------------------------------------------------------------------- */

  const filteredSurveys = useMemo(() => {
    const query =
      search.trim().toLowerCase();

    if (!query) {
      return surveys;
    }

    return surveys.filter((item) => {
      const title =
        getSurveyName(
          item.survey
        ).toLowerCase();

      const description =
        getSurveyDescription(
          item.survey
        ).toLowerCase();

      const type =
        String(
          item.survey?.survey_type ||
            ""
        ).toLowerCase();

      return (
        title.includes(query) ||
        description.includes(query) ||
        type.includes(query)
      );
    });
  }, [
    surveys,
    search,
  ]);

  /* ---------------------------------------------------------------------- */
  /* Stats                                                                   */
  /* ---------------------------------------------------------------------- */

  const totalSurveys =
    surveys.length;

  const activeSurveys =
    surveys.filter((item) => {
      const status =
        String(
          item.survey?.status || ""
        ).toLowerCase();

      return (
        item.survey?.is_active !== false &&
        status !== "inactive" &&
        status !== "disabled"
      );
    }).length;

  /* ---------------------------------------------------------------------- */
  /* Navigation                                                              */
  /* ---------------------------------------------------------------------- */

  function openSurveyResponses(
    surveyId: string
  ) {
    if (!surveyId || !projectId) {
      return;
    }

    router.push(
      `/dashboard/responses/${projectId}/${surveyId}`
    );
  }

  /* ---------------------------------------------------------------------- */
  /* Loading                                                                 */
  /* ---------------------------------------------------------------------- */

  if (loadingProject) {
    return (
      <main className="min-h-screen bg-[#f7f8fb]">
        <div className="flex min-h-screen items-center justify-center px-5">
          <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-7 py-6 shadow-sm">
            <RefreshCw
              size={19}
              className="animate-spin text-red-600"
            />

            <div>
              <p className="text-sm font-bold text-slate-800">
                Loading project
              </p>

              <p className="mt-0.5 text-xs text-slate-400">
                Fetching project information...
              </p>
            </div>
          </div>
        </div>
      </main>
    );
  }

  /* ---------------------------------------------------------------------- */
  /* Project error                                                           */
  /* ---------------------------------------------------------------------- */

  if (!project) {
    return (
      <main className="min-h-screen bg-[#f7f8fb]">
        <div className="mx-auto flex min-h-screen max-w-xl items-center justify-center px-5">
          <div className="w-full rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">

            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-red-600">
              <AlertCircle size={28} />
            </div>

            <h1 className="mt-5 text-xl font-extrabold text-slate-900">
              Unable to load project
            </h1>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              {error ||
                "The requested project could not be found."}
            </p>

            <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">

              <Link
                href="/dashboard/responses"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 transition hover:bg-slate-50"
              >
                <ArrowLeft size={15} />
                Back to Projects
              </Link>

              <button
                type="button"
                onClick={() => {
                  setError("");
                  loadProject();
                  loadProjectSurveys();
                }}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-red-600/20 transition hover:bg-red-700"
              >
                <RefreshCw size={15} />
                Try Again
              </button>

            </div>
          </div>
        </div>
      </main>
    );
  }

  /* ---------------------------------------------------------------------- */
  /* Main page                                                               */
  /* ---------------------------------------------------------------------- */

  return (
    <div className="min-h-screen bg-[#f7f8fb]">

      {/* Header */}
      <header className="border-b border-slate-200/80 bg-white">
        <div className="mx-auto max-w-[1600px] px-5 py-6 lg:px-9">

          <Link
            href="/dashboard/responses"
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 transition hover:text-slate-900"
          >
            <ArrowLeft size={15} />
            All Projects
          </Link>

          <div className="mt-6 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">

            <div className="min-w-0">

              <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-red-600">
                <FolderOpen size={14} />
                Response Center
              </div>

              <h1 className="mt-2 truncate text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
                {getProjectName(project)}
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                Select a survey to view its submitted
                responses.
              </p>

            </div>

            <div className="shrink-0 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">

              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
                Project ID
              </p>

              <p className="mt-1 max-w-[260px] truncate font-mono text-xs font-semibold text-slate-600">
                {projectId}
              </p>

            </div>

          </div>
        </div>
      </header>

      {/* Response flow */}
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-[1600px] px-5 lg:px-9">

          <div className="flex items-center gap-2 overflow-x-auto py-4">

            <Link
              href="/dashboard/responses"
              className="flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold text-slate-500 transition hover:bg-slate-50 hover:text-slate-900"
            >
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-slate-100 text-[10px] font-black">
                1
              </span>
              Projects
            </Link>

            <ArrowRight
              size={14}
              className="shrink-0 text-slate-300"
            />

            <div className="flex shrink-0 items-center gap-2 rounded-xl bg-red-50 px-3 py-2 text-xs font-bold text-red-700">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-red-600 text-[10px] font-black text-white">
                2
              </span>
              Surveys
            </div>

            <ArrowRight
              size={14}
              className="shrink-0 text-slate-300"
            />

            <div className="flex shrink-0 items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-400">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-slate-100 text-[10px] font-black">
                3
              </span>
              Survey Responses
            </div>

            <ArrowRight
              size={14}
              className="shrink-0 text-slate-300"
            />

            <div className="flex shrink-0 items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-400">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-slate-100 text-[10px] font-black">
                4
              </span>
              Response Detail
            </div>

          </div>
        </div>
      </div>

      {/* Main */}
      <main className="mx-auto w-full max-w-[1600px] space-y-7 px-5 py-6 lg:px-9 lg:py-9">

        {/* Error */}
        {error && (
          <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-5 py-4">

            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-600">
              <AlertCircle size={17} />
            </div>

            <div className="min-w-0 flex-1">

              <p className="text-sm font-bold text-red-800">
                Something went wrong
              </p>

              <p className="mt-1 break-words text-xs leading-5 text-red-600">
                {error}
              </p>

            </div>

            <button
              type="button"
              onClick={() =>
                setError("")
              }
              className="rounded-lg p-1.5 text-red-400 transition hover:bg-red-100 hover:text-red-700"
            >
              <X size={16} />
            </button>

          </div>
        )}

        {/* Stats */}
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">

          <StatCard
            icon={
              <ClipboardList size={19} />
            }
            label="Total Surveys"
            value={totalSurveys}
            description="Surveys attached to this project"
          />

          <StatCard
            icon={
              <CheckCircle2 size={19} />
            }
            label="Active Surveys"
            value={activeSurveys}
            description="Currently available surveys"
          />

          <StatCard
            icon={
              <FolderOpen size={19} />
            }
            label="Project"
            value={
              project.code ||
              getProjectName(project)
            }
            description={`Created ${formatDate(
              project.created_at
            )}`}
          />

        </section>

        {/* Survey workspace */}
        <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_10px_40px_rgba(15,23,42,0.04)]">

          <div className="border-b border-slate-100 px-5 py-5 sm:px-6">

            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

              <div>

                <div className="flex items-center gap-2">

                  <h2 className="text-lg font-extrabold tracking-tight text-slate-900">
                    Surveys
                  </h2>

                  <span className="rounded-full bg-red-50 px-2.5 py-1 text-[11px] font-bold text-red-700">
                    {filteredSurveys.length}
                  </span>

                </div>

                <p className="mt-1 text-xs text-slate-400">
                  Choose a survey to open its response
                  collection.
                </p>

              </div>

              <div className="flex h-11 w-full max-w-md items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3.5 transition focus-within:border-red-400 focus-within:bg-white focus-within:ring-4 focus-within:ring-red-100">

                <Search
                  size={17}
                  className="shrink-0 text-slate-400"
                />

                <input
                  value={search}
                  onChange={(event) =>
                    setSearch(
                      event.target.value
                    )
                  }
                  placeholder="Search surveys..."
                  className="w-full bg-transparent text-sm font-medium text-slate-700 outline-none placeholder:text-slate-400"
                />

                {search && (
                  <button
                    type="button"
                    onClick={() =>
                      setSearch("")
                    }
                    className="shrink-0 rounded-full bg-slate-200 p-1 text-slate-500 transition hover:bg-slate-300"
                  >
                    <X size={13} />
                  </button>
                )}

              </div>

            </div>
          </div>

          {/* Loading */}
          {loadingSurveys && (
            <div className="flex min-h-[360px] items-center justify-center px-6">

              <div className="flex flex-col items-center text-center">

                <div className="relative h-12 w-12">

                  <div className="absolute inset-0 rounded-full border-4 border-slate-100" />

                  <div className="absolute inset-0 animate-spin rounded-full border-4 border-transparent border-t-red-600" />

                </div>

                <p className="mt-5 text-sm font-bold text-slate-700">
                  Loading surveys
                </p>

                <p className="mt-1 text-xs text-slate-400">
                  Fetching surveys attached to this
                  project...
                </p>

              </div>

            </div>
          )}

          {/* No surveys */}
          {!loadingSurveys &&
            projectSurveys.length === 0 && (
              <div className="px-6 py-24 text-center">

                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[24px] bg-slate-100 text-slate-400">
                  <ClipboardList
                    size={32}
                    strokeWidth={1.7}
                  />
                </div>

                <h3 className="mt-6 text-lg font-extrabold text-slate-800">
                  No surveys in this project
                </h3>

                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-400">
                  There are currently no surveys attached
                  to this project, so there are no survey
                  responses to display.
                </p>

                <button
                  type="button"
                  onClick={() =>
                    loadProjectSurveys()
                  }
                  className="mt-6 inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-red-600/20 transition hover:bg-red-700"
                >
                  <RefreshCw size={14} />
                  Refresh
                </button>

              </div>
            )}

          {/* No search results */}
          {!loadingSurveys &&
            projectSurveys.length > 0 &&
            filteredSurveys.length === 0 && (
              <div className="px-6 py-20 text-center">

                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                  <Search size={26} />
                </div>

                <h3 className="mt-5 text-base font-extrabold text-slate-800">
                  No matching surveys
                </h3>

                <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-400">
                  Try another search term or clear the
                  search field.
                </p>

                <button
                  type="button"
                  onClick={() =>
                    setSearch("")
                  }
                  className="mt-5 rounded-xl bg-red-600 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-red-600/20 transition hover:bg-red-700"
                >
                  Clear Search
                </button>

              </div>
            )}

          {/* Survey cards */}
          {!loadingSurveys &&
            filteredSurveys.length > 0 && (
              <div className="grid grid-cols-1 gap-4 p-5 sm:p-6 lg:grid-cols-2 xl:grid-cols-3">

                {filteredSurveys.map(
                  (item, index) => {
                    const survey =
                      item.survey;

                    const surveyName =
                      getSurveyName(
                        survey
                      );

                    const description =
                      getSurveyDescription(
                        survey
                      );

                    const fieldCount =
                      Array.isArray(
                        survey?.fields
                      )
                        ? survey.fields.length
                        : 0;

                    const isActive =
                      survey?.is_active !==
                        false &&
                      String(
                        survey?.status ||
                          ""
                      ).toLowerCase() !==
                        "inactive";

                    return (
                      <button
                        key={`${item.surveyId}-${item.projectSurvey.id || index}`}
                        type="button"
                        onClick={() =>
                          openSurveyResponses(
                            item.surveyId
                          )
                        }
                        className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white text-left shadow-[0_5px_20px_rgba(15,23,42,0.03)] transition duration-200 hover:-translate-y-0.5 hover:border-red-200 hover:shadow-[0_14px_35px_rgba(15,23,42,0.08)]"
                      >

                        <div className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-red-50 opacity-0 blur-2xl transition group-hover:opacity-100" />

                        <div className="relative p-5">

                          <div className="flex items-start justify-between gap-4">

                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600 transition group-hover:bg-red-600 group-hover:text-white">
                              <ClipboardList
                                size={19}
                              />
                            </div>

                            <span
                              className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${
                                isActive
                                  ? "bg-emerald-50 text-emerald-700"
                                  : "bg-slate-100 text-slate-500"
                              }`}
                            >
                              {isActive
                                ? "Active"
                                : "Inactive"}
                            </span>

                          </div>

                          <h3 className="mt-5 line-clamp-2 text-base font-extrabold leading-6 text-slate-900 transition group-hover:text-red-700">
                            {surveyName}
                          </h3>

                          <p className="mt-2 line-clamp-2 min-h-[40px] text-xs leading-5 text-slate-500">
                            {description}
                          </p>

                          <div className="mt-5 grid grid-cols-2 gap-2">

                            <div className="rounded-xl bg-slate-50 px-3 py-2.5">

                              <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                                Questions
                              </p>

                              <p className="mt-1 text-sm font-extrabold text-slate-700">
                                {fieldCount}
                              </p>

                            </div>

                            <div className="rounded-xl bg-slate-50 px-3 py-2.5">

                              <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                                Type
                              </p>

                              <p className="mt-1 truncate text-sm font-extrabold capitalize text-slate-700">
                                {survey?.survey_type ||
                                  "Normal"}
                              </p>

                            </div>

                          </div>

                          <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">

                            <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-400">
                              <FileText
                                size={13}
                              />
                              View responses
                            </div>

                            <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-400 transition group-hover:border-red-100 group-hover:bg-red-50 group-hover:text-red-600">

                              <ArrowRight
                                size={15}
                                className="transition-transform group-hover:translate-x-0.5"
                              />

                            </div>

                          </div>

                        </div>
                      </button>
                    );
                  }
                )}

              </div>
            )}

        </section>
      </main>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Stat Card                                                                  */
/* -------------------------------------------------------------------------- */

function StatCard({
  icon,
  label,
  value,
  description,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  description: string;
}) {
  return (
    <div className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_5px_20px_rgba(15,23,42,0.035)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_12px_30px_rgba(15,23,42,0.07)]">

      <div className="flex items-start justify-between gap-4">

        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600 transition group-hover:bg-red-50 group-hover:text-red-600">
          {icon}
        </div>

        <span className="mt-2 h-2 w-2 rounded-full bg-red-500" />

      </div>

      <p className="mt-5 text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400">
        {label}
      </p>

      <p className="mt-1 truncate text-2xl font-extrabold tracking-tight text-slate-900">
        {value}
      </p>

      <p className="mt-1 truncate text-xs text-slate-400">
        {description}
      </p>

    </div>
  );
}