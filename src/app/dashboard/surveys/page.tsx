"use client";

import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";

import {
  Activity,
  ArrowUpRight,
  BarChart3,
  CalendarDays,
  Check,
  ChevronDown,
  ClipboardList,
  FileText,
  FolderKanban,
  Image as ImageIcon,
  Loader2,
  Mail,
  Map,
  MessageSquare,
  Mic,
  MoreHorizontal,
  Plus,
  Search,
  SlidersHorizontal,
  Trash2,
  Type,
  Video,
  X,
} from "lucide-react";

/*
|--------------------------------------------------------------------------
| IMPORTANT
|--------------------------------------------------------------------------
| Your API file is:
|
| src/api.ts
|
| NOT:
|
| src/lib/api.ts
|
*/

import {
  api,
  endpoints,
} from "@/api";

/* ==========================================================================
   TYPES
   ========================================================================== */

type Tab =
  | "projects"
  | "surveys";

type Project = {
  id: string | number;

  name: string;

  code?: string | null;

  description?: string | null;

  status?: string | null;

  color?: string | null;

  logo_url?: string | null;

  total_surveys?: number | null;

  total_submissions?: number | null;

  created_at?: string | null;

  start_date?: string | null;

  end_date?: string | null;
};

type Survey = {
  id: string | number;

  title: string;

  description?: string | null;

  survey_type?: string | null;

  field_count?: number | null;

  is_active?: boolean | null;

  project_id?: string | number | null;

  project_name?: string | null;

  created_at?: string | null;
};

type Field = {
  label: string;

  field_name: string;

  field_type: string;

  required: boolean;

  is_unique: boolean;

  placeholder: string;

  help_text: string;

  options: {
    values: string[];
  };

  validation: Record<
    string,
    unknown
  >;

  depends_on: Record<
    string,
    unknown
  >;

  sort_order: number;

  is_active: boolean;

  media_url: string;

  media_caption: string;

  media_table_columns: string[];
};

/* ==========================================================================
   FIELD TYPES
   ========================================================================== */

const FIELD_TYPES = [
  {
    value: "heading",
    label: "Heading",
    icon: Type,
  },
  {
    value: "text",
    label: "Short text",
    icon: Type,
  },
  {
    value: "textarea",
    label: "Long text",
    icon: FileText,
  },
  {
    value: "email",
    label: "Email",
    icon: Mail,
  },
  {
    value: "tel",
    label: "Phone",
    icon: MessageSquare,
  },
  {
    value: "number",
    label: "Number",
    icon: BarChart3,
  },
  {
    value: "float",
    label: "Decimal",
    icon: BarChart3,
  },
  {
    value: "date",
    label: "Date",
    icon: CalendarDays,
  },
  {
    value: "select",
    label: "Dropdown",
    icon: ChevronDown,
  },
  {
    value: "radio",
    label: "Radio",
    icon: Check,
  },
  {
    value: "checkbox",
    label: "Checkbox",
    icon: Check,
  },
  {
    value: "range",
    label: "Range",
    icon: SlidersHorizontal,
  },
  {
    value: "matrix",
    label: "Matrix",
    icon: Map,
  },
  {
    value: "image",
    label: "Image",
    icon: ImageIcon,
  },
  {
    value: "video",
    label: "Video",
    icon: Video,
  },
  {
    value: "audio",
    label: "Audio",
    icon: Mic,
  },
];

/* ==========================================================================
   HELPERS
   ========================================================================== */

function emptyField(
  sortOrder = 0
): Field {
  return {
    label: "",

    field_name: "",

    field_type: "text",

    required: false,

    is_unique: false,

    placeholder: "",

    help_text: "",

    options: {
      values: [],
    },

    validation: {},

    depends_on: {},

    sort_order: sortOrder,

    is_active: true,

    media_url: "",

    media_caption: "",

    media_table_columns: [],
  };
}

function unwrap<T = any>(
  response: any
): T {
  if (
    response &&
    response.data !== undefined
  ) {
    return response.data;
  }

  return response;
}

function normalizeList(
  response: any
): any[] {
  const data = unwrap<any>(
    response
  );

  if (Array.isArray(data)) {
    return data;
  }

  if (
    Array.isArray(data?.items)
  ) {
    return data.items;
  }

  if (
    Array.isArray(data?.projects)
  ) {
    return data.projects;
  }

  if (
    Array.isArray(data?.surveys)
  ) {
    return data.surveys;
  }

  if (
    Array.isArray(data?.data)
  ) {
    return data.data;
  }

  return [];
}

function getFieldIcon(
  type: string
) {
  return (
    FIELD_TYPES.find(
      (item) =>
        item.value === type
    )?.icon ?? FileText
  );
}

function getFieldLabel(
  type: string
) {
  return (
    FIELD_TYPES.find(
      (item) =>
        item.value === type
    )?.label ?? type
  );
}

function getSurveyTypeLabel(
  type?: string | null
) {
  if (!type) {
    return "General";
  }

  return type
    .replace(/_/g, " ")
    .replace(
      /\b\w/g,
      (letter) =>
        letter.toUpperCase()
    );
}

function formatNumber(
  value?: number | null
) {
  return new Intl.NumberFormat(
    "en-IN"
  ).format(Number(value ?? 0));
}

function getProjectStatus(
  status?: string | null
) {
  const value = String(
    status ?? "draft"
  ).toLowerCase();

  if (value === "active") {
    return {
      label: "Active",

      className:
        "bg-emerald-50 text-emerald-700",

      dot:
        "bg-emerald-500",
    };
  }

  if (
    value === "completed"
  ) {
    return {
      label: "Completed",

      className:
        "bg-red-50 text-red-700",

      dot:
        "bg-red-500",
    };
  }

  if (
    value === "archived"
  ) {
    return {
      label: "Archived",

      className:
        "bg-slate-50/80 text-slate-600",

      dot:
        "bg-slate-400",
    };
  }

  return {
    label: "Draft",

    className:
      "bg-slate-50/80 text-slate-700",

    dot:
      "bg-slate-400",
  };
}

function getProjectStatusText(
  status?: string | null
) {
  const value = String(
    status ?? "draft"
  ).toLowerCase();

  if (value === "active") {
    return "Active project";
  }

  if (
    value === "completed"
  ) {
    return "Completed project";
  }

  if (
    value === "archived"
  ) {
    return "Archived project";
  }

  return "Draft project";
}

/* ==========================================================================
   PAGE
   ========================================================================== */

export default function SurveysPage() {
  const router = useRouter();

  const [
    activeTab,
    setActiveTab,
  ] = useState<Tab>(
    "projects"
  );

  const [
    projects,
    setProjects,
  ] = useState<Project[]>(
    []
  );

  const [
    surveys,
    setSurveys,
  ] = useState<Survey[]>(
    []
  );

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    saving,
    setSaving,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  const [
    search,
    setSearch,
  ] = useState("");

  const [
    statusFilter,
    setStatusFilter,
  ] = useState("all");

  const [
    showProjectModal,
    setShowProjectModal,
  ] = useState(false);

  const [
    showSurveyModal,
    setShowSurveyModal,
  ] = useState(false);

  /* ------------------------------------------------------------------------
     PROJECT FORM
     ------------------------------------------------------------------------ */

  const [
    projectForm,
    setProjectForm,
  ] = useState({
    name: "",

    code: "",

    description: "",

    status: "draft",

    color: "#DC2626",

    start_date: "",

    end_date: "",
  });

  /* ------------------------------------------------------------------------
     SURVEY FORM
     ------------------------------------------------------------------------ */

  const [
    surveyForm,
    setSurveyForm,
  ] = useState({
    title: "",

    description: "",

    survey_type: "general",

    project_id: "",
  });

  /* ------------------------------------------------------------------------
     FIELDS
     ------------------------------------------------------------------------ */

  const [
    fields,
    setFields,
  ] = useState<Field[]>([
    emptyField(0),
  ]);

  /* ==========================================================================
     LOAD
     ========================================================================== */

  const load = async () => {
    try {
      setLoading(true);

      setError("");

      /*
       * Uses the EXISTING src/api.ts
       *
       * endpoints.projects = "/projects/"
       * endpoints.surveys  = "/surveys/"
       *
       * Therefore requests go to:
       *
       * https://jansetu.leadtech.in/api/v1/projects/
       * https://jansetu.leadtech.in/api/v1/surveys/
       */

      const [
        projectsResponse,
        surveysResponse,
      ] = await Promise.all([
        api<any>(
          endpoints.projects
        ),

        api<any>(
          endpoints.surveys
        ),
      ]);

      const projectsData =
        normalizeList(
          projectsResponse
        );

      const surveysData =
        normalizeList(
          surveysResponse
        );

      setProjects(
        projectsData as Project[]
      );

      setSurveys(
        surveysData as Survey[]
      );
    } catch (err: any) {
      console.error(
        "Failed to load projects/surveys:",
        err
      );

      setError(
        err?.message ||
          "Failed to load projects and surveys."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  /* ==========================================================================
     FILTER PROJECTS
     ========================================================================== */

  const filteredProjects =
    useMemo(() => {
      const query =
        search
          .trim()
          .toLowerCase();

      return projects.filter(
        (project) => {
          const matchesSearch =
            !query ||
            String(
              project.name ?? ""
            )
              .toLowerCase()
              .includes(query) ||
            String(
              project.code ?? ""
            )
              .toLowerCase()
              .includes(query) ||
            String(
              project.description ??
                ""
            )
              .toLowerCase()
              .includes(query);

          const matchesStatus =
            statusFilter ===
              "all" ||
            String(
              project.status ??
                "draft"
            ).toLowerCase() ===
              statusFilter.toLowerCase();

          return (
            matchesSearch &&
            matchesStatus
          );
        }
      );
    }, [
      projects,
      search,
      statusFilter,
    ]);

  /* ==========================================================================
     FILTER SURVEYS
     ========================================================================== */

  const filteredSurveys =
    useMemo(() => {
      const query =
        search
          .trim()
          .toLowerCase();

      return surveys.filter(
        (survey) => {
          const matchesSearch =
            !query ||
            String(
              survey.title ?? ""
            )
              .toLowerCase()
              .includes(query) ||
            String(
              survey.description ??
                ""
            )
              .toLowerCase()
              .includes(query) ||
            String(
              survey.project_name ??
                ""
            )
              .toLowerCase()
              .includes(query);

          let matchesStatus =
            true;

          if (
            statusFilter ===
            "active"
          ) {
            matchesStatus =
              survey.is_active !==
              false;
          }

          if (
            statusFilter ===
            "inactive"
          ) {
            matchesStatus =
              survey.is_active ===
              false;
          }

          return (
            matchesSearch &&
            matchesStatus
          );
        }
      );
    }, [
      surveys,
      search,
      statusFilter,
    ]);

  /* ==========================================================================
     STATS
     ========================================================================== */

  const activeSurveys =
    surveys.filter(
      (survey) =>
        survey.is_active !==
        false
    ).length;

  const totalResponses =
    projects.reduce(
      (total, project) =>
        total +
        Number(
          project.total_submissions ??
            0
        ),
      0
    );

  /* ==========================================================================
     FIELD FUNCTIONS
     ========================================================================== */

  const updateField = (
    index: number,
    key: keyof Field,
    value: any
  ) => {
    setFields(
      (current) =>
        current.map(
          (field, fieldIndex) =>
            fieldIndex ===
            index
              ? {
                  ...field,
                  [key]: value,
                }
              : field
        )
    );
  };

  const addField = () => {
    setFields(
      (current) => [
        ...current,
        emptyField(
          current.length
        ),
      ]
    );
  };

  const removeField = (
    index: number
  ) => {
    setFields(
      (current) => {
        const next =
          current.filter(
            (_, i) =>
              i !== index
          );

        return next.map(
          (
            field,
            fieldIndex
          ) => ({
            ...field,
            sort_order:
              fieldIndex,
          })
        );
      }
    );
  };

  const addOption = (
    index: number
  ) => {
    setFields(
      (current) =>
        current.map(
          (field, fieldIndex) =>
            fieldIndex ===
            index
              ? {
                  ...field,

                  options: {
                    ...field.options,

                    values: [
                      ...field
                        .options
                        .values,

                      "",
                    ],
                  },
                }
              : field
        )
    );
  };

  const updateOption = (
    fieldIndex: number,
    optionIndex: number,
    value: string
  ) => {
    setFields(
      (current) =>
        current.map(
          (field, index) => {
            if (
              index !==
              fieldIndex
            ) {
              return field;
            }

            const values = [
              ...field.options
                .values,
            ];

            values[
              optionIndex
            ] = value;

            return {
              ...field,

              options: {
                ...field.options,

                values,
              },
            };
          }
        )
    );
  };

  const removeOption = (
    fieldIndex: number,
    optionIndex: number
  ) => {
    setFields(
      (current) =>
        current.map(
          (field, index) => {
            if (
              index !==
              fieldIndex
            ) {
              return field;
            }

            return {
              ...field,

              options: {
                ...field.options,

                values:
                  field.options.values.filter(
                    (_, i) =>
                      i !==
                      optionIndex
                  ),
              },
            };
          }
        )
    );
  };

  /* ==========================================================================
     CREATE PROJECT
     ========================================================================== */

  const createProject =
    async () => {
      if (
        !projectForm.name.trim()
      ) {
        setError(
          "Project name is required."
        );

        return;
      }

      try {
        setSaving(true);

        setError("");

        const payload: Record<
          string,
          any
        > = {
          name:
            projectForm.name.trim(),

          code:
            projectForm.code.trim() ||
            undefined,

          description:
            projectForm.description.trim() ||
            undefined,

          status:
            projectForm.status,

          color:
            projectForm.color,
        };

        if (
          projectForm.start_date
        ) {
          payload.start_date =
            new Date(
              projectForm.start_date
            ).toISOString();
        }

        if (
          projectForm.end_date
        ) {
          payload.end_date =
            new Date(
              projectForm.end_date
            ).toISOString();
        }

        await api(
          endpoints.projects,
          {
            method: "POST",

            body: JSON.stringify(
              payload
            ),
          }
        );

        setShowProjectModal(
          false
        );

        setProjectForm({
          name: "",

          code: "",

          description: "",

          status: "draft",

          color: "#DC2626",

          start_date: "",

          end_date: "",
        });

        await load();
      } catch (err: any) {
        console.error(
          "Failed to create project:",
          err
        );

        setError(
          err?.message ||
            "Failed to create project."
        );
      } finally {
        setSaving(false);
      }
    };

  /* ==========================================================================
     CREATE SURVEY
     ========================================================================== */

  const createSurvey =
    async () => {
      if (
        !surveyForm.title.trim()
      ) {
        setError(
          "Survey title is required."
        );

        return;
      }

      const preparedFields =
        fields
          .filter(
            (field) =>
              field.label.trim()
          )
          .map(
            (field, index) => {
              const generatedName =
                field.label
                  .trim()
                  .toLowerCase()
                  .replace(
                    /[^a-z0-9]+/g,
                    "_"
                  )
                  .replace(
                    /^_+|_+$/g,
                    "") ||
                `field_${index + 1}`;

              return {
                ...field,

                label:
                  field.label.trim(),

                field_name:
                  field.field_name.trim() ||
                  generatedName,

                sort_order:
                  index,

                options: [
                  "select",
                  "radio",
                  "checkbox",
                ].includes(
                  field.field_type
                )
                  ? {
                      values:
                        field.options.values.filter(
                          (value) =>
                            value.trim()
                        ),
                    }
                  : field.options,
              };
            }
          );

      try {
        setSaving(true);

        setError("");

        const payload: Record<
          string,
          any
        > = {
          title:
            surveyForm.title.trim(),

          description:
            surveyForm.description.trim() ||
            undefined,

          survey_type:
            surveyForm.survey_type,

          fields:
            preparedFields,
        };

        if (
          surveyForm.project_id
        ) {
          payload.project_id =
            Number(
              surveyForm.project_id
            );
        }

        await api(
          endpoints.surveys,
          {
            method: "POST",

            body: JSON.stringify(
              payload
            ),
          }
        );

        setShowSurveyModal(
          false
        );

        setSurveyForm({
          title: "",

          description: "",

          survey_type:
            "general",

          project_id: "",
        });

        setFields([
          emptyField(0),
        ]);

        await load();
      } catch (err: any) {
        console.error(
          "Failed to create survey:",
          err
        );

        setError(
          err?.message ||
            "Failed to create survey."
        );
      } finally {
        setSaving(false);
      }
    };

  /* ==========================================================================
     RENDER
     ========================================================================== */

  return (
    <div style={{ fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, \"Segoe UI\", sans-serif" }} className="min-h-full antialiased bg-[#f8fafc] bg-[radial-gradient(circle_at_top_right,_rgba(79,70,229,0.10),_transparent_32%),radial-gradient(circle_at_top_left,_rgba(14,165,233,0.06),_transparent_28%)]">
      {/* =====================================================================
          HEADER
          ===================================================================== */}

      <div className="border-b border-slate-200/70 bg-white/85 backdrop-blur-xl">
        <div className="px-7 py-8 lg:px-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="mb-3 inline-flex items-center gap-2.5 rounded-full border border-red-100 bg-red-50/80 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-red-700">
                <ClipboardList className="h-4 w-4" />

                JANSETU
              </div>

              <h1 className="text-3xl font-extrabold tracking-[-0.04em] text-slate-950 sm:text-4xl">
                Projects & Surveys
              </h1>

              <p className="mt-1 text-[13px] leading-5 text-slate-500">
                Create projects,
                build surveys and
                manage responses.
              </p>
            </div>

            <div className="flex gap-3.5">
              <button
                type="button"
                onClick={() =>
                  router.push("/dashboard/surveys/project/new")
                }
               className="inline-flex h-11 items-center justify-center gap-2.5 rounded-2xl bg-red-500 px-5 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(15,23,42,0.14)] transition hover:bg-red-600">
                <FolderKanban className="h-4 w-4" />

                New project
              </button>

              
                
            </div>
          </div>
        </div>
      </div>

      {/* =====================================================================
          MAIN
          ===================================================================== */}

      <main className="px-7 py-8 lg:px-8">
        {/* STATS */}



        <div className="mb-6 grid grid-cols-2 gap-3.5 xl:grid-cols-3">

           <StatCard
            label="Projects"
            value={
              projects.length
            }
            icon={FolderKanban}
          />
          <StatCard
            label="Total surveys"
            value={
              surveys.length
            }
            icon={ClipboardList}
          />

          <StatCard
            label="Active surveys"
            value={
              activeSurveys
            }
            icon={Activity}
          />

         

          
        </div>

        {/* ERROR */}

        {error && (
          <div className="mb-5 flex items-start gap-3.5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-100">
              <X className="h-3.5 w-3.5" />
            </div>

            <div className="flex-1">
              {error}
            </div>

            <button
              type="button"
              onClick={() =>
                setError("")
              }
              className="text-red-500 hover:text-red-700"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* ===================================================================
            TOOLBAR
            =================================================================== */}

        <div className="mb-5 flex flex-col gap-4 rounded-2xl border border-slate-200/80 bg-white/70 p-2 shadow-[0_6px_24px_rgba(15,23,42,0.035)] backdrop-blur-sm xl:flex-row xl:items-center xl:justify-center">
          {/* TABS */}

         

          {/* SEARCH + FILTER */}

          <div className="flex flex-col gap-3.5 sm:flex-row items-center sm:justify-start xl:flex-1">
            <div className="relative min-w-[1000px] max-w-[1000px] flex-1 left-0 float-left">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

              <input
                type="text"
                value={search}
                onChange={(
                  event
                ) =>
                  setSearch(
                    event.target
                      .value
                  )
                }
                placeholder={
                  activeTab ===
                  "projects"
                    ? "Search projects..."
                    : "Search surveys..."
                }
                className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-4 text-sm font-medium text-slate-900 shadow-sm outline-none transition-all duration-200 placeholder:text-slate-400 hover:border-red-200 hover:bg-red-50/20 focus:border-red-400 focus:bg-white focus:ring-2 focus:ring-red-100"
              />
            </div>

            <div className="group relative min-w-[170px] w-[350px]">
              <SlidersHorizontal className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-red-500 transition group-focus-within:text-red-700" />

              <select
                value={
                  statusFilter
                }
                onChange={(
                  event
                ) =>
                  setStatusFilter(
                    event.target
                      .value
                  )
                }
                className="h-10 w-full appearance-none rounded-lg border border-slate-200 bg-white pl-10 pr-10 text-sm font-semibold text-slate-700 shadow-sm outline-none transition-all duration-200 hover:border-red-200 hover:bg-red-50/60 hover:shadow-[inset_3px_0_0_#ef4444] focus:border-red-400 focus:bg-white focus:ring-2 focus:ring-red-100"
              >
                <option value="all">
                  All status
                </option>

                {activeTab ===
                "projects" ? (
                  <>
                    <option value="draft">
                      Draft
                    </option>

                    <option value="active">
                      Active
                    </option>

                    <option value="completed">
                      Completed
                    </option>

                    <option value="archived">
                      Archived
                    </option>
                  </>
                ) : (
                  <>
                    <option value="active">
                      Active
                    </option>

                    <option value="inactive">
                      Inactive
                    </option>
                  </>
                )}
              </select>

              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-red-500 transition group-focus-within:rotate-180 group-focus-within:text-red-700" />
            </div>
          </div>
        </div>

        {/* ===================================================================
            CONTENT
            =================================================================== */}

        {loading ? (
          activeTab ===
          "projects" ? (
            <ProjectSkeleton />
          ) : (
            <SurveySkeleton />
          )
        ) : activeTab ===
          "projects" ? (
          filteredProjects.length >
          0 ? (
            <ProjectTable projects={filteredProjects} />
          ) : (
            <EmptyState
              icon={FolderKanban}
              title={
                search ||
                statusFilter !==
                  "all"
                  ? "No matching projects"
                  : "No projects yet"
              }
              description={
                search ||
                statusFilter !==
                  "all"
                  ? "Try changing your search or filters."
                  : "Create your first project to organize your surveys."
              }
              actionLabel={
                search ||
                statusFilter !==
                  "all"
                  ? undefined
                  : "Create project"
              }
              onAction={
                search ||
                statusFilter !==
                  "all"
                  ? undefined
                  : () =>
                      router.push(
                        "/dashboard/surveys/project/new"
                      )
              }
            />
          )
        ) : filteredSurveys.length >
          0 ? (
          <SurveyTable surveys={filteredSurveys} />
        ) : (
          <EmptyState
            icon={ClipboardList}
            title={
              search ||
              statusFilter !==
                "all"
                ? "No matching surveys"
                : "No surveys yet"
            }
            description={
              search ||
              statusFilter !==
                "all"
                ? "Try changing your search or filters."
                : "Create a survey and start collecting responses."
            }
            actionLabel={
              search ||
              statusFilter !==
                "all"
                ? undefined
                : "Create survey"
            }
            onAction={
              search ||
              statusFilter !==
                "all"
                ? undefined
                : () =>
                    setShowSurveyModal(
                      true
                    )
            }
          />
        )}
      </main>

      {/* =====================================================================
          PROJECT MODAL
          ===================================================================== */}

      {showProjectModal && (
        <Modal
          title="Create project"
          description="Set up a workspace for your surveys and responses."
          onClose={() =>
            setShowProjectModal(
              false
            )
          }
        >
          <div className="space-y-7">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                label="Project name"
                required
              >
                <input
                  value={
                    projectForm.name
                  }
                  onChange={(
                    event
                  ) =>
                    setProjectForm(
                      (
                        current
                      ) => ({
                        ...current,

                        name: event
                          .target
                          .value,
                      })
                    )
                  }
                  placeholder="e.g. Delhi Survey 2026"
                  className="form-input transition-shadow focus:shadow-[0_0_0_4px_rgba(220,38,38,0.10)]"
                  autoFocus
                />
              </FormField>

              <FormField label="Project code">
                <input
                  value={
                    projectForm.code
                  }
                  onChange={(
                    event
                  ) =>
                    setProjectForm(
                      (
                        current
                      ) => ({
                        ...current,

                        code: event
                          .target
                          .value,
                      })
                    )
                  }
                  placeholder="e.g. DEL-2026"
                  className="form-input transition-shadow focus:shadow-[0_0_0_4px_rgba(220,38,38,0.10)]"
                />
              </FormField>
            </div>

            <FormField label="Description">
              <textarea
                value={
                  projectForm.description
                }
                onChange={(
                  event
                ) =>
                  setProjectForm(
                    (
                      current
                    ) => ({
                      ...current,

                      description:
                        event
                          .target
                          .value,
                    })
                  )
                }
                placeholder="Describe what this project is for..."
                rows={4}
                className="form-input resize-none"
              />
            </FormField>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Start date">
                <input
                  type="date"
                  value={
                    projectForm.start_date
                  }
                  onChange={(
                    event
                  ) =>
                    setProjectForm(
                      (
                        current
                      ) => ({
                        ...current,

                        start_date:
                          event
                            .target
                            .value,
                      })
                    )
                  }
                  className="form-input transition-shadow focus:shadow-[0_0_0_4px_rgba(220,38,38,0.10)]"
                />
              </FormField>

              <FormField label="End date">
                <input
                  type="date"
                  value={
                    projectForm.end_date
                  }
                  onChange={(
                    event
                  ) =>
                    setProjectForm(
                      (
                        current
                      ) => ({
                        ...current,

                        end_date:
                          event
                            .target
                            .value,
                      })
                    )
                  }
                  className="form-input transition-shadow focus:shadow-[0_0_0_4px_rgba(220,38,38,0.10)]"
                />
              </FormField>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Status">
                <select
                  value={
                    projectForm.status
                  }
                  onChange={(
                    event
                  ) =>
                    setProjectForm(
                      (
                        current
                      ) => ({
                        ...current,

                        status:
                          event
                            .target
                            .value,
                      })
                    )
                  }
                  className="form-input transition-shadow focus:shadow-[0_0_0_4px_rgba(220,38,38,0.10)]"
                >
                  <option value="draft">
                    Draft
                  </option>

                  <option value="active">
                    Active
                  </option>

                  <option value="completed">
                    Completed
                  </option>

                  <option value="archived">
                    Archived
                  </option>
                </select>
              </FormField>

              <FormField label="Project color">
                <div className="flex h-11 items-center gap-3.5 rounded-2xl border border-slate-200/80 bg-white/90 shadow-[0_8px_28px_rgba(15,23,42,0.04)] px-3">
                  <input
                    type="color"
                    value={
                      projectForm.color
                    }
                    onChange={(
                      event
                    ) =>
                      setProjectForm(
                        (
                          current
                        ) => ({
                          ...current,

                          color:
                            event
                              .target
                              .value,
                        })
                      )
                    }
                    className="h-7 w-7 cursor-pointer rounded-lg border-0 bg-transparent p-0"
                  />

                  <span className="text-sm text-slate-600">
                    {
                      projectForm.color
                    }
                  </span>
                </div>
              </FormField>
            </div>

            <div className="flex justify-end gap-3.5 border-t border-slate-100 pt-5">
              <button
                type="button"
                onClick={() =>
                  setShowProjectModal(
                    false
                  )
                }
                className="h-11 rounded-2xl px-4 text-sm font-medium text-slate-600 hover:bg-slate-50/80"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={saving}
                onClick={
                  createProject
                }
                className="inline-flex h-11 items-center gap-2.5 rounded-2xl bg-red-600 px-5 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}

                Create project
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* =====================================================================
          SURVEY MODAL
          ===================================================================== */}

      {showSurveyModal && (
        <SurveyModal
          form={surveyForm}
          setForm={
            setSurveyForm
          }
          fields={fields}
          projects={projects}
          saving={saving}
          onClose={() =>
            setShowSurveyModal(
              false
            )
          }
          onCreate={
            createSurvey
          }
          updateField={
            updateField
          }
          addField={
            addField
          }
          removeField={
            removeField
          }
          addOption={
            addOption
          }
          updateOption={
            updateOption
          }
          removeOption={
            removeOption
          }
        />
      )}

      {/* =====================================================================
          GLOBAL INPUT STYLE
          ===================================================================== */}

      <style jsx global>{`
        .form-input {
          width: 100%;
          min-height: 44px;
          border-radius: 12px;
          border: 1px solid rgb(226 232 240);
          background: white;
          padding: 0 14px;
          font-size: 14px;
          color: rgb(15 23 42);
          outline: none;
          transition: all 150ms ease;
        }

        textarea.form-input {
          padding-top: 12px;
          padding-bottom: 12px;
        }

        .form-input::placeholder {
          color: rgb(148 163 184);
        }

        .form-input:focus {
          border-color: rgb(148 163 184);
          box-shadow:
            0 0 0 4px
            rgb(241 245 249);
        }
      `}</style>
    </div>
  );
}

/* ==========================================================================
   PROJECT GRID
   ========================================================================== */

function ProjectLogo({
  project,
}: {
  project: Project;
}) {
  const [imageFailed, setImageFailed] = useState(false);
  const background = project.color || "#DC2626";

  if (!project.logo_url || imageFailed) {
    return (
      <div
        className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl border shadow-sm"
        style={{
          borderColor: `${background}30`,
          backgroundColor: `${background}0D`,
        }}
      >
        <FolderKanban
          className="h-6 w-6"
          style={{ color: background }}
          strokeWidth={1.8}
        />
      </div>
    );
  }

  return (
    <div
      className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl border bg-white shadow-sm"
      style={{ borderColor: `${background}30` }}
    >
      <img
        src={project.logo_url}
        alt={`${project.name} logo`}
        className="h-full w-full object-cover"
        onError={() => setImageFailed(true)}
      />
    </div>
  );
}

function ProjectMetric({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2.5 text-slate-400">
        <Icon className="h-4 w-4" />
        <span className="text-xs font-medium">{label}</span>
      </div>
      <div className="mt-2 text-[21px] font-semibold tracking-[-0.025em] tracking-tight text-slate-950">
        {value}
      </div>
    </div>
  );
}

function ProjectTable({ projects }: { projects: Project[] }) {
  const router = useRouter();

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_10px_35px_rgba(15,23,42,0.045)]">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[820px] text-left text-[13px]">
          <thead className="border-b border-slate-200 bg-[#fafafa]/80/80">
            <tr>
              <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">Project</th>
              <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">Code</th>
              <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">Surveys</th>
              
              <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">Status</th>
              <th className="px-5 py-3 text-right text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100/90">
            {projects.map((project) => {
              const status = getProjectStatus(project.status);
              const href = `/dashboard/surveys/${project.id}`;

              return (
                <tr
                  key={String(project.id)}
                  tabIndex={0}
                  role="link"
                  onClick={() => router.push(href)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      router.push(href);
                    }
                  }}
                  className="cursor-pointer transition-colors hover:bg-red-50/45 focus:bg-red-50/70 focus:outline-none"
                >
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3.5">
                      <div className="h-9 w-9 shrink-0 overflow-hidden rounded-2xl [&>div]:!h-9 [&>div]:!w-9 [&>div]:!rounded-2xl [&>div]:!shadow-none">
                        <ProjectLogo project={project} />
                      </div>
                      <div className="min-w-0">
                        <div className="truncate text-[13px] font-bold text-slate-950">{project.name}</div>
                        <div className="max-w-[360px] truncate text-xs text-slate-400">
                          {project.description || "Survey project and response collection workspace"}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-[13px] text-slate-500">{project.code || "—"}</td>
                  <td className="px-5 py-3 text-[13px] font-semibold text-slate-900">{formatNumber(project.total_surveys)}</td>
                  
                  <td className="px-5 py-3">
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${status.className}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
                      {status.label}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <span className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[12px] font-semibold text-slate-600 transition hover:bg-red-50 hover:text-red-700">
                      Open <ArrowUpRight className="h-4 w-4" />
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SurveyTable({ surveys }: { surveys: Survey[] }) {
  const router = useRouter();

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_10px_35px_rgba(15,23,42,0.045)]">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[820px] text-left text-[13px]">
          <thead className="border-b border-slate-200 bg-[#fafafa]/80/80">
            <tr>
              <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">Survey</th>
              <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">Type</th>
              <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">Project</th>
              <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">Fields</th>
              <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">Status</th>
              <th className="px-5 py-3 text-right text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100/90">
            {surveys.map((survey) => {
              const active = survey.is_active !== false;
              const href = `/dashboard/surveys/survey/${survey.id}`;

              return (
                <tr
                  key={String(survey.id)}
                  tabIndex={0}
                  role="link"
                  onClick={() => router.push(href)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      router.push(href);
                    }
                  }}
                  className="cursor-pointer transition-colors hover:bg-red-50/45 focus:bg-red-50/70 focus:outline-none"
                >
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3.5">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-red-50 to-rose-50 ring-1 ring-red-100/80">
                        <ClipboardList className="h-4 w-4 text-red-600" />
                      </div>
                      <div className="min-w-0">
                        <div className="truncate text-[13px] font-bold text-slate-950">{survey.title}</div>
                        <div className="max-w-[340px] truncate text-xs text-slate-400">
                          {survey.description || "No survey description provided."}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-[13px] text-slate-600">{getSurveyTypeLabel(survey.survey_type)}</td>
                  <td className="px-5 py-3 text-[13px] text-slate-600">{survey.project_name || "General"}</td>
                  <td className="px-5 py-3 text-[13px] font-semibold text-slate-900">{formatNumber(survey.field_count)}</td>
                  <td className="px-5 py-3">
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${active ? "bg-emerald-50 text-emerald-700" : "bg-slate-50/80 text-slate-500"}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${active ? "bg-emerald-500" : "bg-slate-400"}`} />
                      {active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <span className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[12px] font-semibold text-slate-600 transition hover:bg-red-50 hover:text-red-700">
                      View <ArrowUpRight className="h-4 w-4" />
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
function SurveyModal({
  form,
  setForm,
  fields,
  projects,
  saving,
  onClose,
  onCreate,
  updateField,
  addField,
  removeField,
  addOption,
  updateOption,
  removeOption,
}: {
  form: {
    title: string;

    description: string;

    survey_type: string;

    project_id: string;
  };

  setForm: React.Dispatch<
    React.SetStateAction<{
      title: string;

      description: string;

      survey_type: string;

      project_id: string;
    }>
  >;

  fields: Field[];

  projects: Project[];

  saving: boolean;

  onClose: () => void;

  onCreate: () => void;

  updateField: (
    index: number,
    key: keyof Field,
    value: any
  ) => void;

  addField: () => void;

  removeField: (
    index: number
  ) => void;

  addOption: (
    index: number
  ) => void;

  updateOption: (
    fieldIndex: number,
    optionIndex: number,
    value: string
  ) => void;

  removeOption: (
    fieldIndex: number,
    optionIndex: number
  ) => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm">
      <div className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-[2rem] border border-white/60 bg-white/95 shadow-[0_28px_80px_rgba(15,23,42,0.22)]">
        {/* HEADER */}

        <div className="flex items-center justify-between border-b border-slate-200 px-7 py-5">
          <div>
            <h2 className="text-[18px] font-semibold tracking-[-0.02em] text-slate-950">
              Create survey
            </h2>

            <p className="mt-1 text-[13px] leading-5 text-slate-500">
              Define the survey and
              add its fields.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-2xl text-slate-400 hover:bg-red-50 hover:text-red-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* BODY */}

        <div className="overflow-y-auto px-7 py-8">
          <div className="grid gap-7 lg:grid-cols-[320px_1fr]">
            {/* DETAILS */}

            <div className="space-y-7">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">
                  Survey details
                </h3>

                <p className="mt-1 text-xs leading-5 text-slate-400">
                  Basic information
                  about this survey.
                </p>
              </div>

              <FormField
                label="Survey title"
                required
              >
                <input
                  value={form.title}
                  onChange={(
                    event
                  ) =>
                    setForm(
                      (
                        current
                      ) => ({
                        ...current,

                        title:
                          event
                            .target
                            .value,
                      })
                    )
                  }
                  placeholder="e.g. Household Survey"
                  className="form-input transition-shadow focus:shadow-[0_0_0_4px_rgba(220,38,38,0.10)]"
                  autoFocus
                />
              </FormField>

              <FormField label="Description">
                <textarea
                  value={
                    form.description
                  }
                  onChange={(
                    event
                  ) =>
                    setForm(
                      (
                        current
                      ) => ({
                        ...current,

                        description:
                          event
                            .target
                            .value,
                      })
                    )
                  }
                  placeholder="Describe this survey..."
                  rows={5}
                  className="form-input resize-none"
                />
              </FormField>

              <FormField label="Survey type">
                <select
                  value={
                    form.survey_type
                  }
                  onChange={(
                    event
                  ) =>
                    setForm(
                      (
                        current
                      ) => ({
                        ...current,

                        survey_type:
                          event
                            .target
                            .value,
                      })
                    )
                  }
                  className="form-input transition-shadow focus:shadow-[0_0_0_4px_rgba(220,38,38,0.10)]"
                >
                  <option value="general">
                    General
                  </option>

                  <option value="household">
                    Household
                  </option>

                  <option value="voter">
                    Voter
                  </option>

                  <option value="field">
                    Field survey
                  </option>

                  <option value="feedback">
                    Feedback
                  </option>

                  <option value="audit">
                    Audit
                  </option>
                </select>
              </FormField>

              <FormField label="Project">
                <select
                  value={
                    form.project_id
                  }
                  onChange={(
                    event
                  ) =>
                    setForm(
                      (
                        current
                      ) => ({
                        ...current,

                        project_id:
                          event
                            .target
                            .value,
                      })
                    )
                  }
                  className="form-input transition-shadow focus:shadow-[0_0_0_4px_rgba(220,38,38,0.10)]"
                >
                  <option value="">
                    No project
                  </option>

                  {projects.map(
                    (project) => (
                      <option
                        key={String(
                          project.id
                        )}
                        value={String(
                          project.id
                        )}
                      >
                        {
                          project.name
                        }
                      </option>
                    )
                  )}
                </select>
              </FormField>
            </div>

            {/* FIELDS */}

            <div className="rounded-2xl border border-slate-200 bg-[#fafafa]/80/90 p-4 sm:p-5">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">
                    Survey fields
                  </h3>

                  <p className="mt-1 text-xs text-slate-400">
                    Add the questions
                    and inputs users
                    will complete.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={addField}
                  className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 shadow-sm hover:bg-red-50/60 hover:shadow-[inset_3px_0_0_#ef4444]/80"
                >
                  <Plus className="h-3.5 w-3.5" />

                  Add field
                </button>
              </div>

              <div className="space-y-6">
                {fields.map(
                  (
                    field,
                    index
                  ) => (
                    <FieldEditor
                      key={index}
                      field={field}
                      index={index}
                      canRemove={
                        fields.length >
                        1
                      }
                      updateField={
                        updateField
                      }
                      removeField={
                        removeField
                      }
                      addOption={
                        addOption
                      }
                      updateOption={
                        updateOption
                      }
                      removeOption={
                        removeOption
                      }
                    />
                  )
                )}
              </div>
            </div>
          </div>
        </div>

        {/* FOOTER */}

        <div className="flex items-center justify-between border-t border-slate-200 bg-white px-7 py-4">
          <span className="text-xs text-slate-400">
            {
              fields.filter(
                (field) =>
                  field.label.trim()
              ).length
            }{" "}
            configured field
            {fields.filter(
              (field) =>
                field.label.trim()
            ).length === 1
              ? ""
              : "s"}
          </span>

          <div className="flex gap-3.5">
            <button
              type="button"
              onClick={onClose}
              className="h-10 rounded-2xl px-4 text-sm font-medium text-slate-600 hover:bg-slate-50/80"
            >
              Cancel
            </button>

            <button
              type="button"
              disabled={saving}
              onClick={onCreate}
              className="inline-flex h-10 items-center gap-2.5 rounded-2xl bg-red-600 px-5 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}

              Create survey
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ==========================================================================
   FIELD EDITOR
   ========================================================================== */

function FieldEditor({
  field,
  index,
  canRemove,
  updateField,
  removeField,
  addOption,
  updateOption,
  removeOption,
}: {
  field: Field;

  index: number;

  canRemove: boolean;

  updateField: (
    index: number,
    key: keyof Field,
    value: any
  ) => void;

  removeField: (
    index: number
  ) => void;

  addOption: (
    index: number
  ) => void;

  updateOption: (
    fieldIndex: number,
    optionIndex: number,
    value: string
  ) => void;

  removeOption: (
    fieldIndex: number,
    optionIndex: number
  ) => void;
}) {
  const Icon =
    getFieldIcon(
      field.field_type
    );

  const hasOptions = [
    "select",
    "radio",
    "checkbox",
  ].includes(
    field.field_type
  );

  const hasMedia = [
    "image",
    "video",
    "audio",
  ].includes(
    field.field_type
  );

  return (
    <div className="rounded-2xl border border-slate-200/70 bg-white p-4 shadow-[0_12px_34px_rgba(15,23,42,0.06)]">
      <div className="flex items-start gap-3.5">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-slate-50/80">
          <Icon
            className="h-4 w-4 text-slate-600"
            strokeWidth={1.8}
          />
        </div>

        <div className="min-w-0 flex-1">
          <div className="mb-4 flex items-center justify-between gap-3.5">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">
                Field{" "}
                {index + 1}
              </div>

              <div className="mt-0.5 text-sm font-semibold text-slate-800">
                {getFieldLabel(
                  field.field_type
                )}
              </div>
            </div>

            <button
              type="button"
              disabled={!canRemove}
              onClick={() =>
                removeField(
                  index
                )
              }
              className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-30"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              label="Label"
              required
            >
              <input
                value={field.label}
                onChange={(
                  event
                ) =>
                  updateField(
                    index,
                    "label",
                    event.target
                      .value
                  )
                }
                placeholder="What should the user enter?"
                className="form-input transition-shadow focus:shadow-[0_0_0_4px_rgba(220,38,38,0.10)]"
              />
            </FormField>

            <FormField label="Field type">
              <select
                value={
                  field.field_type
                }
                onChange={(
                  event
                ) =>
                  updateField(
                    index,
                    "field_type",
                    event.target
                      .value
                  )
                }
                className="form-input transition-shadow focus:shadow-[0_0_0_4px_rgba(220,38,38,0.10)]"
              >
                {FIELD_TYPES.map(
                  (type) => (
                    <option
                      key={
                        type.value
                      }
                      value={
                        type.value
                      }
                    >
                      {
                        type.label
                      }
                    </option>
                  )
                )}
              </select>
            </FormField>

            <FormField label="Field name">
              <input
                value={
                  field.field_name
                }
                onChange={(
                  event
                ) =>
                  updateField(
                    index,
                    "field_name",
                    event.target
                      .value
                  )
                }
                placeholder="Auto-generated if empty"
                className="form-input transition-shadow focus:shadow-[0_0_0_4px_rgba(220,38,38,0.10)]"
              />
            </FormField>

            <FormField label="Placeholder">
              <input
                value={
                  field.placeholder
                }
                onChange={(
                  event
                ) =>
                  updateField(
                    index,
                    "placeholder",
                    event.target
                      .value
                  )
                }
                placeholder="Enter placeholder..."
                className="form-input transition-shadow focus:shadow-[0_0_0_4px_rgba(220,38,38,0.10)]"
              />
            </FormField>
          </div>

          <div className="mt-4">
            <FormField label="Help text">
              <input
                value={
                  field.help_text
                }
                onChange={(
                  event
                ) =>
                  updateField(
                    index,
                    "help_text",
                    event.target
                      .value
                  )
                }
                placeholder="Optional instructions for users"
                className="form-input transition-shadow focus:shadow-[0_0_0_4px_rgba(220,38,38,0.10)]"
              />
            </FormField>
          </div>

          {/* OPTIONS */}

          {hasOptions && (
            <div className="mt-5 rounded-2xl border border-slate-200 bg-[#fafafa]/80 p-4">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-slate-700">
                    Options
                  </div>

                  <div className="mt-0.5 text-[11px] text-slate-400">
                    Add the choices
                    users can
                    select.
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    addOption(
                      index
                    )
                  }
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-red-50/60 hover:shadow-[inset_3px_0_0_#ef4444]/80"
                >
                  <Plus className="h-3 w-3" />

                  Add
                </button>
              </div>

              <div className="space-y-2">
                {field.options.values.map(
                  (
                    option,
                    optionIndex
                  ) => (
                    <div
                      key={
                        optionIndex
                      }
                      className="flex gap-2.5"
                    >
                      <input
                        value={
                          option
                        }
                        onChange={(
                          event
                        ) =>
                          updateOption(
                            index,
                            optionIndex,
                            event
                              .target
                              .value
                          )
                        }
                        placeholder={`Option ${
                          optionIndex +
                          1
                        }`}
                        className="form-input transition-shadow focus:shadow-[0_0_0_4px_rgba(220,38,38,0.10)]"
                      />

                      <button
                        type="button"
                        onClick={() =>
                          removeOption(
                            index,
                            optionIndex
                          )
                        }
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-slate-200/80 bg-white/90 shadow-[0_8px_28px_rgba(15,23,42,0.04)] text-slate-400 hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  )
                )}

                {field.options
                  .values.length ===
                  0 && (
                  <div className="rounded-2xl border border-dashed border-slate-300 px-4 py-5 text-center text-xs text-slate-400">
                    No options added
                    yet.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* MEDIA */}

          {hasMedia && (
            <div className="mt-5 rounded-2xl border border-slate-200 bg-[#fafafa]/80 p-4">
              <div className="mb-3 text-xs font-semibold text-slate-700">
                Media
              </div>

              <div className="space-y-3">
                <input
                  value={
                    field.media_url
                  }
                  onChange={(
                    event
                  ) =>
                    updateField(
                      index,
                      "media_url",
                      event.target
                        .value
                    )
                  }
                  placeholder="Media URL"
                  className="form-input transition-shadow focus:shadow-[0_0_0_4px_rgba(220,38,38,0.10)]"
                />

                <input
                  value={
                    field.media_caption
                  }
                  onChange={(
                    event
                  ) =>
                    updateField(
                      index,
                      "media_caption",
                      event.target
                        .value
                    )
                  }
                  placeholder="Media caption"
                  className="form-input transition-shadow focus:shadow-[0_0_0_4px_rgba(220,38,38,0.10)]"
                />
              </div>
            </div>
          )}

          {/* TOGGLES */}

          <div className="mt-5 flex flex-wrap gap-3.5">
            <Toggle
              checked={
                field.required
              }
              onChange={(
                value
              ) =>
                updateField(
                  index,
                  "required",
                  value
                )
              }
              label="Required"
            />

            <Toggle
              checked={
                field.is_unique
              }
              onChange={(
                value
              ) =>
                updateField(
                  index,
                  "is_unique",
                  value
                )
              }
              label="Unique"
            />

            <Toggle
              checked={
                field.is_active
              }
              onChange={(
                value
              ) =>
                updateField(
                  index,
                  "is_active",
                  value
                )
              }
              label="Active"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ==========================================================================
   TOGGLE
   ========================================================================== */

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;

  onChange: (
    value: boolean
  ) => void;

  label: string;
}) {
  return (
    <button
      type="button"
      onClick={() =>
        onChange(!checked)
      }
      className="inline-flex items-center gap-2.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600"
    >
      <span
        className={`relative h-5 w-9 rounded-full transition ${
          checked
            ? "bg-slate-900"
            : "bg-slate-200"
        }`}
      >
        <span
          className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition ${
            checked
              ? "left-[18px]"
              : "left-0.5"
          }`}
        />
      </span>

      {label}
    </button>
  );
}

/* ==========================================================================
   FORM FIELD
   ========================================================================== */

function FormField({
  label,
  required,
  children,
}: {
  label: string;

  required?: boolean;

  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <div className="mb-2 text-xs font-semibold text-slate-600">
        {label}

        {required && (
          <span className="ml-1 text-red-500">
            *
          </span>
        )}
      </div>

      {children}
    </label>
  );
}

/* ==========================================================================
   MODAL
   ========================================================================== */

function Modal({
  title,
  description,
  onClose,
  children,
}: {
  title: string;

  description?: string;

  onClose: () => void;

  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg overflow-hidden rounded-[2rem] border border-white/60 bg-white/95 shadow-[0_28px_80px_rgba(15,23,42,0.22)]">
        <div className="flex items-start justify-between border-b border-slate-200 px-7 py-5">
          <div>
            <h2 className="text-[18px] font-semibold tracking-[-0.02em] text-slate-950">
              {title}
            </h2>

            {description && (
              <p className="mt-1 text-[13px] leading-5 text-slate-500">
                {
                  description
                }
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-2xl text-slate-400 hover:bg-red-50 hover:text-red-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="max-h-[75vh] overflow-y-auto px-7 py-8">
          {children}
        </div>
      </div>
    </div>
  );
}

/* ==========================================================================
   STAT CARD
   ========================================================================== */

function StatCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;

  value: number;

  icon: React.ElementType;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium text-slate-500">
          {label}
        </div>

        <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-[#fafafa]/80">
          <Icon
            className="h-4 w-4 text-slate-500"
            strokeWidth={1.8}
          />
        </div>
      </div>

      <div className="mt-4 text-[28px] font-semibold tracking-[-0.03em] tracking-tight text-slate-950">
        {formatNumber(value)}
      </div>
    </div>
  );
}

/* ==========================================================================
   EMPTY STATE
   ========================================================================== */

function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
}: {
  icon: React.ElementType;

  title: string;

  description: string;

  actionLabel?: string;

  onAction?: () => void;
}) {
  return (
    <div className="flex min-h-[360px] flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-white px-7 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50/80">
        <Icon
          className="h-6 w-6 text-slate-500"
          strokeWidth={1.7}
        />
      </div>

      <h2 className="mt-5 text-[18px] font-semibold tracking-[-0.02em] text-slate-900">
        {title}
      </h2>

      <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
        {description}
      </p>

      {actionLabel &&
        onAction && (
          <button
            type="button"
            onClick={onAction}
            className="mt-5 inline-flex h-10 items-center gap-2.5 rounded-2xl bg-slate-950 px-4 text-sm font-semibold text-white hover:bg-red-700"
          >
            <Plus className="h-4 w-4" />

            {actionLabel}
          </button>
        )}
    </div>
  );
}

/* ==========================================================================
   PROJECT SKELETON
   ========================================================================== */

function ProjectSkeleton() {
  return (
    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({
        length: 3,
      }).map((_, index) => (
        <div
          key={index}
          className="animate-pulse rounded-[24px] border border-slate-200 bg-white p-7"
        >
          <div className="flex justify-between">
            <div className="h-14 w-14 rounded-2xl bg-slate-50/80" />

            <div className="h-7 w-20 rounded-full bg-slate-50/80" />
          </div>

          <div className="mt-6 h-3 w-16 rounded bg-slate-50/80" />

          <div className="mt-4 h-6 w-32 rounded bg-slate-50/80" />

          <div className="mt-3 h-10 w-full rounded bg-slate-50/80" />

          <div className="mt-4 grid grid-cols-2 gap-2.5">
            <div className="h-24 rounded-2xl bg-slate-50/80" />

            <div className="h-24 rounded-2xl bg-slate-50/80" />
          </div>

          <div className="mt-6 h-20 rounded-2xl bg-slate-50/80" />

          <div className="mt-6 border-t border-slate-100 pt-5">
            <div className="h-5 w-full rounded bg-slate-50/80" />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ==========================================================================
   SURVEY SKELETON
   ========================================================================== */

function SurveySkeleton() {
  return (
    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({
        length: 6,
      }).map((_, index) => (
        <div
          key={index}
          className="animate-pulse rounded-[24px] border border-slate-200 bg-white p-7"
        >
          <div className="flex justify-between">
            <div className="h-12 w-12 rounded-2xl bg-slate-50/80" />

            <div className="h-7 w-20 rounded-full bg-slate-50/80" />
          </div>

          <div className="mt-6 h-3 w-20 rounded bg-slate-50/80" />

          <div className="mt-3 h-6 w-40 rounded bg-slate-50/80" />

          <div className="mt-3 h-10 w-full rounded bg-slate-50/80" />

          <div className="mt-4 grid grid-cols-2 gap-2.5">
            <div className="h-20 rounded-2xl bg-slate-50/80" />

            <div className="h-20 rounded-2xl bg-slate-50/80" />
          </div>
        </div>
      ))}
    </div>
  );
}
