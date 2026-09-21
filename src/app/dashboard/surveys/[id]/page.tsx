"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  ClipboardList,
  FileText,
  Plus,
  Trash2,
  Users,
  Eye,
  RefreshCw,
} from "lucide-react";
import { api, endpoints } from "@/api";

interface Project {
  id: string;
  client_id: string;
  name: string;
  code?: string | null;
  description?: string | null;
  status?: string | null;
  project_type?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  color?: string | null;
  icon?: string | null;
  is_active?: boolean;
  total_surveys?: number;
  total_submissions?: number;
  created_by?: string;
  created_at?: string;
  updated_at?: string;
}

interface SurveyField {
  id?: string;
  label?: string;
  field_name?: string;
  field_type?: string;
  required?: boolean;
  is_unique?: boolean;
  placeholder?: string | null;
  help_text?: string | null;
  options?: {
    values?: string[];
  } | null;
  validation?: Record<string, any> | null;
  depends_on?: Record<string, any> | null;
  sort_order?: number;
  is_active?: boolean;
  media_url?: string | null;
  media_caption?: string | null;
  media_table_columns?: Record<string, any> | null;
}

interface Survey {
  id: string;
  client_id?: string;
  title?: string;
  description?: string | null;
  survey_type?: string;
  is_active?: boolean;
  status?: string;
  created_by?: string;
  created_at?: string;
  updated_at?: string;
  fields?: SurveyField[];
}

interface ProjectSurvey {
  id: string;
  survey_id: string;
  sort_order?: number;
  is_mandatory?: boolean;
  target_submissions?: number | null;
  notes?: string | null;

  /*
   * Some versions of the backend may already return
   * the survey object here.
   *
   * We still fetch the survey separately below so
   * that the card always gets the real survey details.
   */
  survey?: Survey | null;
}

function unwrapData(response: any): any {
  if (response?.data !== undefined) {
    return response.data;
  }

  return response;
}

function normalizeProjects(response: any): Project[] {
  if (Array.isArray(response)) {
    return response;
  }

  if (Array.isArray(response?.data)) {
    return response.data;
  }

  return [];
}

function normalizeProjectSurveys(
  response: any,
): ProjectSurvey[] {
  if (Array.isArray(response)) {
    return response;
  }

  if (Array.isArray(response?.data)) {
    return response.data;
  }

  return [];
}

function normalizeSurvey(response: any): Survey {
  const data = unwrapData(response);

  return {
    ...data,
    fields: Array.isArray(data?.fields)
      ? [...data.fields].sort(
          (a, b) =>
            Number(a?.sort_order ?? 0) -
            Number(b?.sort_order ?? 0),
        )
      : [],
  };
}

export default function ProjectInteriorPage() {
  const router = useRouter();

  const params = useParams<{ id: string }>();

  /*
   * THIS IS THE PROJECT ID.
   *
   * Example:
   *
   * e3f383e2-ca9d-4039-86d1-92f4b4116db3
   */
  const projectId = params?.id || "";

  const [project, setProject] =
    useState<Project | null>(null);

  const [projectSurveys, setProjectSurveys] =
    useState<ProjectSurvey[]>([]);

  const [loadingProject, setLoadingProject] =
    useState(true);

  const [loadingSurveys, setLoadingSurveys] =
    useState(true);

  const [error, setError] = useState("");

  const [deletingProject, setDeletingProject] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [toast, setToast] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const [surveyError, setSurveyError] =
    useState("");

  /*
   * Stores the ACTUAL survey data.
   *
   * Key:
   * survey ID
   *
   * Value:
   * complete survey returned by:
   *
   * GET /surveys/{survey_id}
   */
  const [surveyDetails, setSurveyDetails] =
    useState<Record<string, Survey>>({});

  useEffect(() => {
    if (!projectId) {
      setError("Project ID is missing.");
      setLoadingProject(false);
      return;
    }

    loadProject();
    loadProjectSurveys();
  }, [projectId]);

  /*
   * ---------------------------------------------------------
   * LOAD PROJECT
   * ---------------------------------------------------------
   *
   * We intentionally use the working project list endpoint.
   *
   * GET:
   *
   * /projects/?client_id=...&is_active=true&skip=0&limit=100
   *
   * We do NOT call:
   *
   * /projects/{projectId}
   */
  async function loadProject() {
    try {
      setLoadingProject(true);
      setError("");

      const response = await api<any>(
        `${endpoints.projects}?client_id=0a9d7f2c-cc88-4173-b274-69239dc2a417&is_active=true&skip=0&limit=100`,
      );

      const data = unwrapData(response);

      const projects = normalizeProjects(data);

      const foundProject = projects.find(
        (item) =>
          String(item?.id) ===
          String(projectId),
      );

      if (!foundProject) {
        throw new Error(
          `Project with identifier '${projectId}' not found`,
        );
      }

      setProject(foundProject);
    } catch (err) {
      console.error(
        "Project loading error:",
        err,
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load project.",
      );
    } finally {
      setLoadingProject(false);
    }
  }

  /*
   * ---------------------------------------------------------
   * LOAD PROJECT SURVEYS
   * ---------------------------------------------------------
   *
   * First:
   *
   * GET /projects/{projectId}/surveys
   *
   * This gives us survey_id values.
   *
   * Then for EVERY survey_id:
   *
   * GET /surveys/{survey_id}
   *
   * This gives us:
   *
   * title
   * description
   * survey_type
   * fields
   * etc.
   */
  async function loadProjectSurveys() {
    try {
      setLoadingSurveys(true);
      setSurveyError("");

      const response = await api<any>(
        endpoints.projectSurveys(projectId),
      );

      const data = unwrapData(response);

      const projectSurveyList =
        normalizeProjectSurveys(data);

      setProjectSurveys(projectSurveyList);

      /*
       * If there are no attached surveys,
       * there is nothing else to fetch.
       */
      if (projectSurveyList.length === 0) {
        setSurveyDetails({});
        return;
      }

      /*
       * Fetch complete survey information
       * for every survey attached to this project.
       */
      const results = await Promise.all(
        projectSurveyList.map(async (projectSurvey) => {
          const surveyId =
            projectSurvey.survey_id;

          /*
           * If backend already returned the survey
           * object, we still fetch the actual survey
           * endpoint so the data is authoritative.
           */
          try {
            const surveyResponse =
              await api<any>(
                endpoints.survey(surveyId),
              );

            const survey =
              normalizeSurvey(
                surveyResponse,
              );

            return {
              surveyId,
              survey,
            };
          } catch (err) {
            console.error(
              `Unable to load survey ${surveyId}:`,
              err,
            );

            return {
              surveyId,
              survey:
                projectSurvey.survey || null,
            };
          }
        }),
      );

      const details: Record<string, Survey> =
        {};

      for (const result of results) {
        if (result.survey) {
          details[result.surveyId] =
            result.survey;
        }
      }

      setSurveyDetails(details);
    } catch (err) {
      console.error(
        "Project surveys loading error:",
        err,
      );

      setSurveyError(
        err instanceof Error
          ? err.message
          : "Unable to load project surveys.",
      );

      setProjectSurveys([]);
      setSurveyDetails({});
    } finally {
      setLoadingSurveys(false);
    }
  }

  /*
   * ---------------------------------------------------------
   * CREATE SURVEY
   * ---------------------------------------------------------
   *
   * projectId is the PROJECT ID.
   *
   * URL:
   *
   * /dashboard/surveys/{PROJECT_ID}/survey/new
   */
  function createSurvey() {
    router.push(
      `/dashboard/surveys/${projectId}/survey/new`,
    );
  }

  /*
   * ---------------------------------------------------------
   * DELETE PROJECT
   * ---------------------------------------------------------
   *
   * Backend:
   * DELETE /projects/{project_id}?soft_delete=true
   *
   * The backend defaults soft_delete to true, so this removes
   * the project from the active project list without hard
   * deleting it.
   */
  async function deleteProject() {
    if (!projectId || deletingProject) return;

    try {
      setDeletingProject(true);
      setShowDeleteModal(false);

      await api(endpoints.project(projectId), {
        method: "DELETE",
      });

      setToast({
        type: "success",
        message: "Project deleted successfully.",
      });

      setTimeout(() => {
        router.push("/dashboard/surveys");
      }, 900);
    } catch (err) {
      setDeletingProject(false);

      setToast({
        type: "error",
        message:
          err instanceof Error
            ? err.message
            : "Unable to delete project.",
      });
    }
  }

  /*
   * ---------------------------------------------------------
   * OPEN SURVEY PREVIEW
   * ---------------------------------------------------------
   *
   * IMPORTANT:
   *
   * We use projectSurvey.survey_id.
   *
   * NOT projectId.
   */
  function openSurvey(surveyId: string) {
    router.push(
      `/dashboard/surveys/survey/${surveyId}`,
    );
  }

  /*
   * ---------------------------------------------------------
   * REMOVE SURVEY FROM PROJECT
   * ---------------------------------------------------------
   */
  async function removeSurvey(
    projectSurveyId: string,
  ) {
    const confirmed = window.confirm(
      "Are you sure you want to remove this survey from the project?",
    );

    if (!confirmed) {
      return;
    }

    try {
      await api(
        endpoints.removeProjectSurvey(
          projectId,
          projectSurveyId,
        ),
        {
          method: "DELETE",
        },
      );

      await loadProjectSurveys();
      await loadProject();
    } catch (err) {
      window.alert(
        err instanceof Error
          ? err.message
          : "Unable to remove survey.",
      );
    }
  }

  /*
   * ---------------------------------------------------------
   * LOADING PROJECT
   * ---------------------------------------------------------
   */
  if (loadingProject) {
    return (
      <main className="min-h-screen bg-[#f7f8fb]">
        <div className="flex min-h-screen items-center justify-center">
          <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-7 py-6 shadow-sm">
            <RefreshCw
              size={18}
              className="animate-spin text-red-600"
            />

            <p className="text-sm font-semibold text-slate-600">
              Loading project...
            </p>
          </div>
        </div>
      </main>
    );
  }

  /*
   * ---------------------------------------------------------
   * PROJECT ERROR
   * ---------------------------------------------------------
   */
  if (!project || error) {
    return (
      <main className="min-h-screen bg-[#f7f8fb]">
        <div className="mx-auto max-w-2xl px-5 py-20">
          <div className="rounded-2xl border border-red-200 bg-white p-8 text-center shadow-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-600">
              <FileText size={24} />
            </div>

            <h1 className="mt-5 text-xl font-bold text-slate-950">
              Unable to load project
            </h1>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              {error ||
                "Project was not found."}
            </p>

            <button
              type="button"
              onClick={() =>
                router.push(
                  "/dashboard/surveys",
                )
              }
              className="mt-6 inline-flex h-11 items-center gap-2 rounded-xl bg-red-600 px-5 text-sm font-bold text-white transition hover:bg-red-700"
            >
              <ArrowLeft size={16} />
              Back to projects
            </button>
          </div>
        </div>
      </main>
    );
  }

  const surveyCount =
    project.total_surveys ??
    projectSurveys.length;

  return (
    <main className="min-h-screen bg-[#f7f8fb]">
      {/* =====================================================
          HEADER
      ====================================================== */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-5 py-5">
          <div className="flex items-center justify-between gap-4">
            {/* Left */}
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                onClick={() =>
                  router.push(
                    "/dashboard/surveys",
                  )
                }
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
              >
                <ArrowLeft size={18} />
              </button>

              <div className="min-w-0">
                <div className="text-xs font-bold uppercase tracking-[0.16em] text-red-600">
                  Project
                </div>

                <h1 className="truncate text-2xl font-bold text-slate-950">
                  {project.name}
                </h1>

                {project.code && (
                  <p className="mt-1 text-sm text-slate-400">
                    {project.code}
                  </p>
                )}
              </div>
            </div>

            {/* Project actions */}
            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                onClick={() => setShowDeleteModal(true)}
                disabled={deletingProject}
                title="Delete project"
                className="flex h-11 w-11 items-center justify-center rounded-xl border border-red-200 bg-red-50 text-red-600 transition hover:border-red-300 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:px-4"
              >
                <Trash2 size={17} />

                <span className="ml-2 hidden text-sm font-bold sm:inline">
                  Delete
                </span>
              </button>

              <button
                type="button"
                onClick={createSurvey}
                disabled={deletingProject}
                className="flex h-11 shrink-0 items-center gap-2 rounded-xl bg-red-600 px-5 text-sm font-bold text-white shadow-lg shadow-red-600/20 transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Plus size={17} />

                <span className="hidden sm:inline">
                  Create survey
                </span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* =====================================================
          CONTENT
      ====================================================== */}
      <div className="mx-auto max-w-7xl px-5 py-7">
        {/* PROJECT SUMMARY */}
        <section className="grid gap-5 md:grid-cols-3">
          <SummaryCard
            icon={
              <ClipboardList size={19} />
            }
            label="Surveys"
            value={String(surveyCount)}
          />

          <SummaryCard
            icon={<Users size={19} />}
            label="Project type"
            value={
              project.project_type ||
              "survey"
            }
          />

          <SummaryCard
            icon={
              <CalendarDays size={19} />
            }
            label="Status"
            value={
              project.status || "draft"
            }
          />
        </section>

        {/* PROJECT DESCRIPTION */}
        {project.description && (
          <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-sm font-bold text-slate-900">
              Project description
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              {project.description}
            </p>
          </section>
        )}

        {/* PROJECT DATES */}
        {(project.start_date ||
          project.end_date) && (
          <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="grid gap-5 sm:grid-cols-2">
              {project.start_date && (
                <DateInfo
                  label="Start date"
                  value={project.start_date}
                />
              )}

              {project.end_date && (
                <DateInfo
                  label="End date"
                  value={project.end_date}
                />
              )}
            </div>
          </section>
        )}

        {/* ===================================================
            SURVEYS
        ==================================================== */}
        <section className="mt-8">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-950">
                Project surveys
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Surveys attached to this project.
              </p>
            </div>

            <button
              type="button"
              onClick={createSurvey}
              className="hidden h-10 items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 text-sm font-bold text-red-600 transition hover:bg-red-100 sm:flex"
            >
              <Plus size={16} />
              Add survey
            </button>
          </div>

          {/* LOADING */}
          {loadingSurveys ? (
            <div className="rounded-2xl border border-slate-200 bg-white px-6 py-12 text-center shadow-sm">
              <div className="flex items-center justify-center gap-3">
                <RefreshCw
                  size={17}
                  className="animate-spin text-red-600"
                />

                <p className="text-sm font-semibold text-slate-500">
                  Loading surveys...
                </p>
              </div>
            </div>
          ) : surveyError ? (
            /* ERROR */
            <div className="rounded-2xl border border-red-200 bg-red-50 px-6 py-8 text-center">
              <p className="text-sm font-semibold text-red-700">
                {surveyError}
              </p>

              <button
                type="button"
                onClick={
                  loadProjectSurveys
                }
                className="mt-4 inline-flex h-10 items-center gap-2 rounded-xl bg-red-600 px-4 text-sm font-bold text-white hover:bg-red-700"
              >
                <RefreshCw size={15} />
                Try again
              </button>
            </div>
          ) : projectSurveys.length ===
            0 ? (
            /* EMPTY */
            <EmptySurveys
              onCreate={createSurvey}
            />
          ) : (
            /* SURVEY TABLE */
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-red-600">
                      <th className="px-5 py-3.5 text-left text-[11px] font-bold uppercase tracking-[0.1em] text-white">
                        Survey
                      </th>
                      <th className="px-5 py-3.5 text-left text-[11px] font-bold uppercase tracking-[0.1em] text-white">
                        Type
                      </th>
                      <th className="px-5 py-3.5 text-center text-[11px] font-bold uppercase tracking-[0.1em] text-white">
                        Fields
                      </th>
                      
                      <th className="px-5 py-3.5 text-right text-[11px] font-bold uppercase tracking-[0.1em] text-white">
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {projectSurveys.map((projectSurvey) => {
                      const survey =
                        surveyDetails[projectSurvey.survey_id] ||
                        projectSurvey.survey ||
                        null;

                      const title =
                        survey?.title ||
                        `Survey ${projectSurvey.survey_id}`;

                      const surveyType =
                        survey?.survey_type || "normal";

                      const fieldCount =
                        survey?.fields?.length ?? 0;

                      return (
                        <tr
                          key={projectSurvey.id}
                          className="group cursor-pointer transition-colors hover:bg-red-50/60"
                          onClick={() => openSurvey(projectSurvey.survey_id)}
                        >
                          <td className="px-5 py-3.5">
                            <div className="flex min-w-0 items-center gap-3">
                              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-600 transition group-hover:bg-red-100">
                                <ClipboardList size={17} />
                              </div>

                              <div className="min-w-0">
                                <p className="truncate text-sm font-semibold tracking-[-0.01em] text-slate-900">
                                  {title}
                                </p>
                                {survey?.description && (
                                  <p className="mt-0.5 max-w-[520px] truncate text-xs text-slate-400">
                                    {survey.description}
                                  </p>
                                )}
                              </div>
                            </div>
                          </td>

                          <td className="px-5 py-3.5">
                            <span className="inline-flex rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold capitalize text-slate-600">
                              {surveyType.replace(/_/g, " ")}
                            </span>
                          </td>

                          <td className="px-5 py-3.5 text-center">
                            <span className="text-sm font-semibold text-slate-700">
                              {fieldCount}
                            </span>
                          </td>

                          

                          <td className="px-5 py-3.5">
                            <div className="flex items-center justify-end gap-2">
                             

                              <button
                                type="button"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  removeSurvey(projectSurvey.id);
                                }}
                                title="Remove survey"
                                className="group/delete flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-400 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-red-200 hover:bg-red-50 hover:text-red-600 hover:shadow-md"
                              >
                                <Trash2
                                  size={15}
                                  strokeWidth={2.2}
                                  className="transition-transform duration-200 group-hover/delete:scale-105"
                                />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>
      </div>

      {/* =====================================================
          DELETE CONFIRMATION MODAL
      ====================================================== */}
      {showDeleteModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-5 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setShowDeleteModal(false);
            }
          }}
        >
          <div className="w-full max-w-md overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
            <div className="p-6 sm:p-7">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-600">
                <Trash2 size={24} />
              </div>

              <h2 className="mt-5 text-xl font-extrabold text-slate-950">
                Delete project?
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Are you sure you want to delete{" "}
                <span className="font-bold text-slate-800">
                  "{project.name}"
                </span>
                ? The project will be removed from your active projects.
              </p>

              <div className="mt-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3">
                <p className="text-xs leading-5 text-red-700">
                  This action will soft-delete the project. You can keep
                  the project data without permanently removing it.
                </p>
              </div>
            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-slate-100 bg-slate-50/70 p-5 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="h-11 rounded-xl border border-slate-200 bg-white px-5 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={deleteProject}
                disabled={deletingProject}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-red-600 px-5 text-sm font-bold text-white shadow-lg shadow-red-600/20 transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Trash2 size={16} />

                {deletingProject
                  ? "Deleting..."
                  : "Delete project"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================
          TOAST
      ====================================================== */}
      {toast && (
        <div className="fixed right-5 top-5 z-[60] w-[calc(100%-40px)] max-w-sm">
          <div
            className={`flex items-start gap-3 rounded-2xl border bg-white p-4 shadow-2xl ${
              toast.type === "success"
                ? "border-emerald-200"
                : "border-red-200"
            }`}
          >
            <div
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                toast.type === "success"
                  ? "bg-emerald-50 text-emerald-600"
                  : "bg-red-50 text-red-600"
              }`}
            >
              {toast.type === "success" ? (
                <span className="text-lg font-black">✓</span>
              ) : (
                <span className="text-lg font-black">!</span>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-sm font-extrabold text-slate-900">
                {toast.type === "success"
                  ? "Success"
                  : "Something went wrong"}
              </p>

              <p className="mt-0.5 text-xs leading-5 text-slate-500">
                {toast.message}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setToast(null)}
              className="text-xs font-bold text-slate-400 hover:text-slate-700"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </main>
  );
}

/* ============================================================
   SUMMARY CARD
============================================================ */

function SummaryCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-red-600">
          {icon}
        </div>

        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
            {label}
          </p>

          <p className="mt-1 truncate text-lg font-bold capitalize text-slate-900">
            {value}
          </p>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   DATE INFO
============================================================ */

function DateInfo({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  let formatted = value;

  try {
    formatted = new Date(
      value,
    ).toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    formatted = value;
  }

  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
        {label}
      </p>

      <div className="mt-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
        <CalendarDays
          size={16}
          className="text-red-600"
        />

        {formatted}
      </div>
    </div>
  );
}

/* ============================================================
   EMPTY SURVEYS
============================================================ */

function EmptySurveys({
  onCreate,
}: {
  onCreate: () => void;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center shadow-sm">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-600">
        <ClipboardList size={24} />
      </div>

      <h3 className="mt-4 text-lg font-bold text-slate-950">
        No surveys yet
      </h3>

      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
        Create the first survey for
        this project.
      </p>

      <button
        type="button"
        onClick={onCreate}
        className="mt-6 inline-flex h-11 items-center gap-2 rounded-xl bg-red-600 px-5 text-sm font-bold text-white shadow-lg shadow-red-600/20 transition hover:bg-red-700"
      >
        <Plus size={17} />
        Create survey
      </button>
    </div>
  );
}
