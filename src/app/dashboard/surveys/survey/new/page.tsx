"use client";

import {
  FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Plus,
  Trash2,
  ClipboardList,
  GripVertical,
  ChevronDown,
  Type,
  FileText,
  Mail,
  MessageSquare,
  BarChart3,
  CalendarDays,
  Check,
  SlidersHorizontal,
  Image as ImageIcon,
  Video,
  Mic,
  Map,
} from "lucide-react";
import { api, endpoints } from "@/api";

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
  validation: Record<string, unknown>;
  depends_on: Record<string, unknown>;
  sort_order: number;
  is_active: boolean;
  media_url: string;
  media_caption: string;
  media_table_columns: string[];
};

const FIELD_TYPES = [
  { value: "heading", label: "Heading", icon: Type },
  { value: "text", label: "Short text", icon: Type },
  { value: "textarea", label: "Long text", icon: FileText },
  { value: "email", label: "Email", icon: Mail },
  { value: "tel", label: "Phone", icon: MessageSquare },
  { value: "number", label: "Number", icon: BarChart3 },
  { value: "float", label: "Decimal", icon: BarChart3 },
  { value: "date", label: "Date", icon: CalendarDays },
  { value: "select", label: "Dropdown", icon: ChevronDown },
  { value: "radio", label: "Radio", icon: Check },
  { value: "checkbox", label: "Checkbox", icon: Check },
  { value: "range", label: "Range", icon: SlidersHorizontal },
  { value: "matrix", label: "Matrix", icon: Map },
  { value: "image", label: "Image", icon: ImageIcon },
  { value: "video", label: "Video", icon: Video },
  { value: "audio", label: "Audio", icon: Mic },
];

const emptyField = (sortOrder = 0): Field => ({
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
});

function unwrap<T = any>(response: any): T {
  return response?.data !== undefined ? response.data : response;
}

function getFieldIcon(type: string) {
  return (
    FIELD_TYPES.find((item) => item.value === type)?.icon ??
    Type
  );
}

function getFieldLabel(type: string) {
  return (
    FIELD_TYPES.find((item) => item.value === type)?.label ??
    type
  );
}

function fieldNeedsOptions(type: string) {
  return ["select", "radio", "checkbox"].includes(type);
}

function fieldNeedsMedia(type: string) {
  return ["image", "video", "audio"].includes(type);
}

function generateFieldName(label: string, index: number) {
  return (
    label
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "") ||
    `field_${index + 1}`
  );
}

function FieldEditor({
  field,
  index,
  onChange,
  onRemove,
  canRemove,
}: {
  field: Field;
  index: number;
  onChange: (
    index: number,
    key: keyof Field,
    value: unknown
  ) => void;
  onRemove: (index: number) => void;
  canRemove: boolean;
}) {
  const Icon = getFieldIcon(field.field_type);
  const needsOptions = fieldNeedsOptions(field.field_type);
  const needsMedia = fieldNeedsMedia(field.field_type);

  const updateOption = (optionIndex: number, value: string) => {
    const values = [...field.options.values];
    values[optionIndex] = value;
    onChange(index, "options", { values });
  };

  const addOption = () => {
    onChange(index, "options", {
      values: [...field.options.values, ""],
    });
  };

  const removeOption = (optionIndex: number) => {
    onChange(index, "options", {
      values: field.options.values.filter(
        (_, itemIndex) => itemIndex !== optionIndex
      ),
    });
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-start gap-3 border-b border-slate-100 p-4">
        <div className="mt-1 text-slate-300">
          <GripVertical size={18} />
        </div>

        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-50">
          <Icon size={18} className="text-red-600" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">
                Field {index + 1}
              </div>
              <div className="mt-0.5 font-bold text-slate-900">
                {getFieldLabel(field.field_type)}
              </div>
            </div>

            <button
              type="button"
              onClick={() => onRemove(index)}
              disabled={!canRemove}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-25"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-5 p-5">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="block">
            <span className="mb-2 block text-xs font-bold text-slate-700">
              Label <span className="text-red-600">*</span>
            </span>
            <input
              required
              value={field.label}
              onChange={(event) =>
                onChange(index, "label", event.target.value)
              }
              placeholder="What should the respondent enter?"
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm outline-none transition placeholder:text-slate-300 focus:border-red-400 focus:ring-4 focus:ring-red-50"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-xs font-bold text-slate-700">
              Field type
            </span>
            <select
              value={field.field_type}
              onChange={(event) =>
                onChange(index, "field_type", event.target.value)
              }
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm outline-none transition focus:border-red-400 focus:ring-4 focus:ring-red-50"
            >
              {FIELD_TYPES.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        {field.field_type !== "heading" && (
          <div className="grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-xs font-bold text-slate-700">
                Field name
              </span>
              <input
                value={field.field_name}
                onChange={(event) =>
                  onChange(
                    index,
                    "field_name",
                    event.target.value
                  )
                }
                placeholder={generateFieldName(field.label, index)}
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm outline-none transition placeholder:text-slate-300 focus:border-red-400 focus:ring-4 focus:ring-red-50"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-xs font-bold text-slate-700">
                Placeholder
              </span>
              <input
                value={field.placeholder}
                onChange={(event) =>
                  onChange(
                    index,
                    "placeholder",
                    event.target.value
                  )
                }
                placeholder="Optional hint"
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm outline-none transition placeholder:text-slate-300 focus:border-red-400 focus:ring-4 focus:ring-red-50"
              />
            </label>
          </div>
        )}

        {field.field_type !== "heading" && (
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 px-3.5 py-3">
              <input
                type="checkbox"
                checked={field.required}
                onChange={(event) =>
                  onChange(
                    index,
                    "required",
                    event.target.checked
                  )
                }
                className="h-4 w-4 accent-red-600"
              />
              <span>
                <span className="block text-sm font-semibold text-slate-800">
                  Required
                </span>
                <span className="block text-xs text-slate-400">
                  Respondent must answer
                </span>
              </span>
            </label>

            <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 px-3.5 py-3">
              <input
                type="checkbox"
                checked={field.is_unique}
                onChange={(event) =>
                  onChange(
                    index,
                    "is_unique",
                    event.target.checked
                  )
                }
                className="h-4 w-4 accent-red-600"
              />
              <span>
                <span className="block text-sm font-semibold text-slate-800">
                  Unique
                </span>
                <span className="block text-xs text-slate-400">
                  Prevent duplicate values
                </span>
              </span>
            </label>
          </div>
        )}

        <label className="block">
          <span className="mb-2 block text-xs font-bold text-slate-700">
            Help text
          </span>
          <textarea
            rows={2}
            value={field.help_text}
            onChange={(event) =>
              onChange(index, "help_text", event.target.value)
            }
            placeholder="Optional instructions for the respondent"
            className="w-full resize-none rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm outline-none transition placeholder:text-slate-300 focus:border-red-400 focus:ring-4 focus:ring-red-50"
          />
        </label>

        {needsOptions && (
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-sm font-bold text-slate-800">
                  Options
                </div>
                <div className="mt-0.5 text-xs text-slate-400">
                  Add the choices respondents can select.
                </div>
              </div>

              <button
                type="button"
                onClick={addOption}
                className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-bold text-red-600 transition hover:bg-red-50"
              >
                <Plus size={14} />
                Add option
              </button>
            </div>

            <div className="mt-3 space-y-2">
              {field.options.values.map((value, optionIndex) => (
                <div
                  key={optionIndex}
                  className="flex items-center gap-2"
                >
                  <input
                    value={value}
                    onChange={(event) =>
                      updateOption(
                        optionIndex,
                        event.target.value
                      )
                    }
                    placeholder={`Option ${optionIndex + 1}`}
                    className="h-10 min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-red-400 focus:ring-4 focus:ring-red-50"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      removeOption(optionIndex)
                    }
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}

              {!field.options.values.length && (
                <button
                  type="button"
                  onClick={addOption}
                  className="w-full rounded-lg border border-dashed border-slate-300 bg-white px-3 py-3 text-xs font-semibold text-slate-400 hover:border-red-300 hover:text-red-600"
                >
                  Add the first option
                </button>
              )}
            </div>
          </div>
        )}

        {needsMedia && (
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="text-sm font-bold text-slate-800">
              Media
            </div>

            <div className="mt-3 grid gap-4 md:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-xs font-bold text-slate-700">
                  Media URL
                </span>
                <input
                  value={field.media_url}
                  onChange={(event) =>
                    onChange(
                      index,
                      "media_url",
                      event.target.value
                    )
                  }
                  placeholder="https://..."
                  className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-red-400 focus:ring-4 focus:ring-red-50"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-xs font-bold text-slate-700">
                  Caption
                </span>
                <input
                  value={field.media_caption}
                  onChange={(event) =>
                    onChange(
                      index,
                      "media_caption",
                      event.target.value
                    )
                  }
                  placeholder="Optional caption"
                  className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-red-400 focus:ring-4 focus:ring-red-50"
                />
              </label>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function NewSurveyPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const projectId = searchParams.get("projectId") ?? "";

  const [project, setProject] = useState<any>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [surveyType, setSurveyType] = useState("normal");
  const [fields, setFields] = useState<Field[]>([
    emptyField(0),
  ]);

  const [loadingProject, setLoadingProject] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    async function loadProject() {
      if (!projectId) {
        setLoadingProject(false);
        setError("Project ID is missing.");
        return;
      }

      try {
        setLoadingProject(true);
        setError("");

        const response = await api<any>(
          endpoints.project(projectId)
        );

        setProject(unwrap(response));
      } catch (err) {
        console.error("Unable to load project:", err);
        setError(
          err instanceof Error
            ? err.message
            : "Unable to load project."
        );
      } finally {
        setLoadingProject(false);
      }
    }

    loadProject();
  }, [projectId]);

  const updateField = (
    index: number,
    key: keyof Field,
    value: unknown
  ) => {
    setFields((current) =>
      current.map((field, fieldIndex) =>
        fieldIndex === index
          ? {
              ...field,
              [key]: value,
            }
          : field
      )
    );
  };

  const addField = () => {
    setFields((current) => [
      ...current,
      emptyField(current.length),
    ]);
  };

  const removeField = (index: number) => {
    setFields((current) =>
      current
        .filter((_, fieldIndex) => fieldIndex !== index)
        .map((field, fieldIndex) => ({
          ...field,
          sort_order: fieldIndex,
        }))
    );
  };

  const validFieldCount = useMemo(
    () =>
      fields.filter(
        (field) =>
          field.field_type === "heading" ||
          field.label.trim()
      ).length,
    [fields]
  );

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!projectId || !project) {
      setError("Project information is not available.");
      return;
    }

    if (!title.trim()) {
      setError("Survey title is required.");
      return;
    }

    const preparedFields = fields
      .filter(
        (field) =>
          field.field_type === "heading" ||
          field.label.trim()
      )
      .map((field, index) => ({
        ...field,
        label: field.label.trim(),
        field_name:
          field.field_name.trim() ||
          generateFieldName(field.label, index),
        sort_order: index,
        options: fieldNeedsOptions(field.field_type)
          ? {
              values: field.options.values
                .map((value) => value.trim())
                .filter(Boolean),
            }
          : field.options,
      }));

    if (!preparedFields.length) {
      setError("Add at least one survey field.");
      return;
    }

    const invalidOptions = preparedFields.some(
      (field) =>
        fieldNeedsOptions(field.field_type) &&
        field.options.values.length === 0
    );

    if (invalidOptions) {
      setError(
        "Dropdown, radio, and checkbox fields need at least one option."
      );
      return;
    }

    try {
      setSaving(true);

      /*
       * The backend survey service stores client_id on Survey.
       * The project-survey endpoint stores the project relationship.
       *
       * Therefore this flow intentionally does:
       *
       * 1. Create survey for the project's client.
       * 2. Attach the newly-created survey to this project.
       */
      const surveyResponse = await api<any>(
        endpoints.surveys,
        {
          method: "POST",
          body: JSON.stringify({
            client_id: String(project.client_id),
            title: title.trim(),
            description: description.trim() || null,
            survey_type: surveyType,
            fields: preparedFields,
          }),
        }
      );

      const surveyData = unwrap<any>(surveyResponse);
      const surveyId =
        surveyData?.id ??
        surveyData?.data?.id;

      if (!surveyId) {
        throw new Error(
          "Survey was created but its ID was not returned."
        );
      }

      await api(
        endpoints.addSurveyToProject(projectId),
        {
          method: "POST",
          body: JSON.stringify({
            survey_id: String(surveyId),
            is_mandatory: true,
            sort_order: 0,
          }),
        }
      );

      setSuccess(
        "Survey created and added to the project successfully."
      );

      setTimeout(() => {
        router.push(
          `/dashboard/surveys/survey/${surveyId}`
        );
      }, 500);
    } catch (err) {
      console.error("Unable to create survey:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Unable to create the survey."
      );
    } finally {
      setSaving(false);
    }
  };

  if (loadingProject) {
    return (
      <div className="min-h-full bg-[#f8f9fb]">
        <div className="flex min-h-[500px] items-center justify-center">
          <div className="text-sm font-semibold text-slate-400">
            Loading project...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-[#f8f9fb]">
      <header className="border-b border-slate-200/80 bg-white">
        <div className="px-6 py-6 lg:px-9">
          <Link
            href={`/dashboard/surveys/${projectId}`}
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 transition hover:text-slate-900"
          >
            <ArrowLeft size={15} />
            {project?.name || "Project"}
          </Link>

          <div className="mt-5 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-red-600">
                <ClipboardList size={14} />
                New survey
              </div>

              <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950">
                Create survey
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                Build a questionnaire specifically for this project.
                You do not need to select a project here.
              </p>
            </div>

            {project && (
              <div className="rounded-2xl border border-red-100 bg-red-50/70 px-4 py-3">
                <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-red-500">
                  Project
                </div>
                <div className="mt-1 text-sm font-extrabold text-slate-900">
                  {project.name}
                </div>
                {project.code && (
                  <div className="mt-0.5 text-xs font-semibold text-slate-500">
                    {project.code}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="p-6 lg:p-9">
        <form
          onSubmit={handleSubmit}
          className="mx-auto max-w-6xl"
        >
          {error && (
            <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
              {success}
            </div>
          )}

          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
            <div className="space-y-6">
              <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">
                    Survey details
                  </div>
                  <h2 className="mt-1 text-xl font-extrabold text-slate-950">
                    Basic information
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Give your survey a clear title and choose its
                    collection type.
                  </p>
                </div>

                <div className="mt-6 space-y-5">
                  <label className="block">
                    <span className="mb-2 block text-xs font-bold text-slate-700">
                      Survey title{" "}
                      <span className="text-red-600">*</span>
                    </span>
                    <input
                      required
                      value={title}
                      onChange={(event) =>
                        setTitle(event.target.value)
                      }
                      placeholder="Community feedback survey"
                      className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium outline-none transition placeholder:text-slate-300 focus:border-red-400 focus:ring-4 focus:ring-red-50"
                    />
                  </label>

                  <div className="grid gap-5 md:grid-cols-2">
                    <label className="block">
                      <span className="mb-2 block text-xs font-bold text-slate-700">
                        Survey type
                      </span>
                      <select
                        value={surveyType}
                        onChange={(event) =>
                          setSurveyType(event.target.value)
                        }
                        className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium outline-none transition focus:border-red-400 focus:ring-4 focus:ring-red-50"
                      >
                        <option value="normal">Normal</option>
                        <option value="door_to_door">
                          Door to door
                        </option>
                        <option value="simple">Simple</option>
                      </select>
                    </label>

                    <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                      <div className="text-xs font-bold text-slate-500">
                        Project
                      </div>
                      <div className="mt-1 truncate text-sm font-extrabold text-slate-900">
                        {project?.name || "—"}
                      </div>
                      <div className="mt-0.5 text-xs text-slate-400">
                        Automatically assigned
                      </div>
                    </div>
                  </div>

                  <label className="block">
                    <span className="mb-2 block text-xs font-bold text-slate-700">
                      Description
                    </span>
                    <textarea
                      rows={4}
                      value={description}
                      onChange={(event) =>
                        setDescription(event.target.value)
                      }
                      placeholder="Describe what this survey is intended to collect."
                      className="w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium outline-none transition placeholder:text-slate-300 focus:border-red-400 focus:ring-4 focus:ring-red-50"
                    />
                  </label>
                </div>
              </section>

              <section>
                <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
                  <div>
                    <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">
                      Questionnaire
                    </div>
                    <h2 className="mt-1 text-xl font-extrabold text-slate-950">
                      Survey fields
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                      Define exactly what respondents will see.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={addField}
                    className="inline-flex min-h-[42px] items-center justify-center gap-2 rounded-xl border border-red-200 bg-white px-4 text-sm font-bold text-red-600 transition hover:bg-red-50"
                  >
                    <Plus size={16} />
                    Add field
                  </button>
                </div>

                <div className="space-y-4">
                  {fields.map((field, index) => (
                    <FieldEditor
                      key={index}
                      field={field}
                      index={index}
                      onChange={updateField}
                      onRemove={removeField}
                      canRemove={fields.length > 1}
                    />
                  ))}
                </div>
              </section>
            </div>

            <aside className="lg:sticky lg:top-6 lg:self-start">
              <div className="space-y-4">
                <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">
                    Summary
                  </div>

                  <div className="mt-4 space-y-3">
                    <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3.5 py-3">
                      <span className="text-xs font-semibold text-slate-500">
                        Project
                      </span>
                      <span className="max-w-[150px] truncate text-xs font-extrabold text-slate-900">
                        {project?.name || "—"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3.5 py-3">
                      <span className="text-xs font-semibold text-slate-500">
                        Fields
                      </span>
                      <span className="text-xs font-extrabold text-slate-900">
                        {validFieldCount}
                      </span>
                    </div>

                    <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3.5 py-3">
                      <span className="text-xs font-semibold text-slate-500">
                        Type
                      </span>
                      <span className="text-xs font-extrabold capitalize text-slate-900">
                        {surveyType.replaceAll("_", " ")}
                      </span>
                    </div>
                  </div>
                </section>

                <section className="rounded-2xl border border-red-100 bg-red-50/70 p-5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white">
                    <ClipboardList
                      size={18}
                      className="text-red-600"
                    />
                  </div>

                  <h3 className="mt-4 font-extrabold text-slate-900">
                    Project-linked survey
                  </h3>

                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    When you create this survey, Jansetu will create
                    the survey and automatically attach it to{" "}
                    <span className="font-bold">
                      {project?.name || "this project"}
                    </span>
                    .
                  </p>
                </section>

                <div className="flex flex-col gap-2">
                  <button
                    type="submit"
                    disabled={saving || loadingProject}
                    className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-red-600 px-5 text-sm font-bold text-white shadow-sm transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Plus size={17} />
                    {saving
                      ? "Creating survey..."
                      : "Create survey"}
                  </button>

                  <Link
                    href={`/dashboard/surveys/${projectId}`}
                    className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-slate-200 bg-white px-5 text-sm font-bold text-slate-600 transition hover:bg-slate-50"
                  >
                    Cancel
                  </Link>
                </div>
              </div>
            </aside>
          </div>
        </form>
      </main>
    </div>
  );
}
