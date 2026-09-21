"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
} from "react";

import Link from "next/link";

import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Circle,
  ClipboardList,
  Clock3,
  Copy,
  FileText,
  GripVertical,
  Hash,
  Image as ImageIcon,
  Info,
  Mail,
  Pencil,
  Phone,
  Plus,
  Radio,
  CheckSquare,
  SlidersHorizontal,
  Table2,
  Video,
  Music,
  RefreshCw,
  Save,
  ShieldCheck,
  Sparkles,
  Trash2,
  Type,
  X,
} from "lucide-react";

import {
  api,
  endpoints,
} from "@/api";

/* ============================================================
   TYPES
============================================================ */

interface SurveyField {
  id?: string;

  label: string;

  field_name: string;

  field_type: string;

  required: boolean;

  is_unique: boolean;

  placeholder?: string | null;

  help_text?: string | null;

  options?: {
    values?: string[];
    min?: number;
    max?: number;
    step?: number;
    rows?: string[];
    columns?: string[];
    [key: string]: any;
  } | null;

  validation?: Record<string, any> | null;

  depends_on?: Record<string, any> | null;

  sort_order: number;

  is_active?: boolean;

  media_url?: string | null;

  media_caption?: string | null;

  media_table_columns?: Record<string, any> | null;
}

interface Survey {
  id: string;

  client_id?: string;

  title: string;

  description?: string | null;

  survey_type?: string;

  is_active?: boolean;

  status?: string;

  created_by?: string;

  created_at?: string;

  updated_at?: string;

  fields?: SurveyField[];
}

/* ============================================================
   CONSTANTS
============================================================ */

const FIELD_TYPES = [
  {
    value: "heading",
    label: "Heading",
    description: "Section title",
  },
  {
    value: "text",
    label: "Short text",
    description: "Single-line text",
  },
  {
    value: "textarea",
    label: "Long text",
    description: "Multi-line text",
  },
  {
    value: "email",
    label: "Email",
    description: "Validated email address",
  },
  {
    value: "tel",
    label: "Phone",
    description: "10-digit phone",
  },
  {
    value: "number",
    label: "Number",
    description: "Integer number",
  },
  {
    value: "float",
    label: "Decimal",
    description: "Decimal number",
  },
  {
    value: "date",
    label: "Date",
    description: "Date picker",
  },
  {
    value: "select",
    label: "Dropdown",
    description: "Single-choice dropdown",
  },
  {
    value: "radio",
    label: "Radio",
    description: "Single-choice options",
  },
  {
    value: "checkbox",
    label: "Checkbox",
    description: "Multiple-choice options",
  },
  {
    value: "range",
    label: "Range",
    description: "Numeric range slider",
  },
  {
    value: "matrix",
    label: "Matrix",
    description: "Rows and columns",
  },
  {
    value: "video",
    label: "Video",
    description: "Video media",
  },
  {
    value: "image",
    label: "Image",
    description: "Image media",
  },
  {
    value: "audio",
    label: "Audio",
    description: "Audio media",
  },
];

const SURVEY_TYPES = [
  {
    value: "normal",
    label: "Normal",
  },
  {
    value: "door_to_door",
    label: "Door to Door",
  },
  {
    value: "simple",
    label: "Simple",
  },
];

/* ============================================================
   HELPERS
============================================================ */

function unwrap(response: any) {
  return response?.data !== undefined
    ? response.data
    : response;
}

function formatType(value?: string) {
  if (!value) {
    return "Normal";
  }

  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatFieldType(value?: string) {
  if (!value) {
    return "Text";
  }

  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatDateTime(value?: string | null) {
  if (!value) {
    return "â€”";
  }

  try {
    return new Date(value).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return value;
  }
}

function isOptionField(type: string) {
  return type === "select" || type === "radio" || type === "checkbox";
}

function getFieldIcon(type?: string) {
  const normalized = String(type || "").toLowerCase();

  if (normalized.includes("email")) {
    return <Mail size={17} />;
  }

  if (
    normalized.includes("tel") ||
    normalized.includes("phone")
  ) {
    return <Phone size={17} />;
  }

  if (
    normalized.includes("number") ||
    normalized.includes("float")
  ) {
    return <Hash size={17} />;
  }

  if (
    normalized.includes("select") ||
    normalized.includes("radio") ||
    normalized.includes("checkbox")
  ) {
    return <Radio size={17} />;
  }

  if (normalized.includes("checkbox")) {
    return <CheckSquare size={17} />;
  }

  if (normalized.includes("range")) {
    return <SlidersHorizontal size={17} />;
  }

  if (normalized.includes("matrix")) {
    return <Table2 size={17} />;
  }

  if (normalized.includes("video")) {
    return <Video size={17} />;
  }

  if (normalized.includes("audio")) {
    return <Music size={17} />;
  }

  if (normalized.includes("image")) {
    return <ImageIcon size={17} />;
  }

  if (normalized.includes("date")) {
    return <CalendarDays size={17} />;
  }

  if (normalized.includes("textarea")) {
    return <FileText size={17} />;
  }

  return <Type size={17} />;
}

function getFieldAccent(type?: string) {
  const normalized = String(type || "").toLowerCase();

  if (
    normalized.includes("select") ||
    normalized.includes("radio")
  ) {
    return {
      icon: "bg-violet-50 text-violet-600",
      badge: "bg-violet-50 text-violet-600",
    };
  }

  if (normalized.includes("range")) {
    return {
      icon: "bg-indigo-50 text-indigo-600",
      badge: "bg-indigo-50 text-indigo-600",
    };
  }

  if (normalized.includes("matrix")) {
    return {
      icon: "bg-teal-50 text-teal-600",
      badge: "bg-teal-50 text-teal-600",
    };
  }

  if (normalized.includes("video")) {
    return {
      icon: "bg-pink-50 text-pink-600",
      badge: "bg-pink-50 text-pink-600",
    };
  }

  if (normalized.includes("audio")) {
    return {
      icon: "bg-purple-50 text-purple-600",
      badge: "bg-purple-50 text-purple-600",
    };
  }

  if (normalized.includes("image")) {
    return {
      icon: "bg-sky-50 text-sky-600",
      badge: "bg-sky-50 text-sky-600",
    };
  }

  if (normalized.includes("date")) {
    return {
      icon: "bg-blue-50 text-blue-600",
      badge: "bg-blue-50 text-blue-600",
    };
  }

  if (
    normalized.includes("number") ||
    normalized.includes("float")
  ) {
    return {
      icon: "bg-amber-50 text-amber-600",
      badge: "bg-amber-50 text-amber-600",
    };
  }

  if (
    normalized.includes("email") ||
    normalized.includes("tel")
  ) {
    return {
      icon: "bg-cyan-50 text-cyan-600",
      badge: "bg-cyan-50 text-cyan-600",
    };
  }

  if (normalized === "heading") {
    return {
      icon: "bg-orange-50 text-orange-600",
      badge: "bg-orange-50 text-orange-600",
    };
  }

  return {
    icon: "bg-red-50 text-red-600",
    badge: "bg-red-50 text-red-600",
  };
}

function cloneFields(fields: SurveyField[]) {
  return fields.map((field, index) => ({
    ...field,
    options: field.options
      ? {
          ...field.options,
          values: Array.isArray(field.options.values)
            ? [...field.options.values]
            : undefined,
          rows: Array.isArray(field.options.rows)
            ? [...field.options.rows]
            : undefined,
          columns: Array.isArray(field.options.columns)
            ? [...field.options.columns]
            : undefined,
        }
      : null,
    sort_order: index,
  }));
}

function createEmptyField(index: number): SurveyField {
  return {
    label: "",
    field_name: `field_${index + 1}`,
    field_type: "text",
    required: false,
    is_unique: false,
    placeholder: "",
    help_text: "",
    options: null,
    validation: null,
    depends_on: null,
    sort_order: index,
    is_active: true,
    media_url: null,
    media_caption: null,
    media_table_columns: null,
  };
}

/* ============================================================
   PAGE
============================================================ */

export default function SurveyPage({
  params,
}: {
  params: Promise<{
    id: string;
  }>;
}) {
  const [id, setId] = useState("");

  const [survey, setSurvey] = useState<Survey | null>(null);

  const [loading, setLoading] = useState(true);

  const [saving, setSaving] = useState(false);

  const [editing, setEditing] = useState(false);

  const [error, setError] = useState("");

  const [saveMessage, setSaveMessage] = useState("");

  /* Editable survey */

  const [title, setTitle] = useState("");

  const [description, setDescription] = useState("");

  const [surveyType, setSurveyType] = useState("normal");

  const [isActive, setIsActive] = useState(true);

  const [fields, setFields] = useState<SurveyField[]>([]);

  /* Drag state */

  const [draggedIndex, setDraggedIndex] = useState<number | null>(
    null,
  );

  const [dragOverIndex, setDragOverIndex] = useState<number | null>(
    null,
  );

  /*
   * Auto-scroll while dragging a question near the top/bottom
   * of the browser viewport. This intentionally scrolls the
   * whole page, not an inner questions container.
   */
  const dragScrollIntervalRef =
    useRef<ReturnType<typeof setInterval> | null>(null);

  function stopDragAutoScroll() {
    if (dragScrollIntervalRef.current) {
      clearInterval(dragScrollIntervalRef.current);
      dragScrollIntervalRef.current = null;
    }
  }

  function updateDragAutoScroll(clientY: number) {
    stopDragAutoScroll();

    const edgeSize = 120;
    const maxSpeed = 18;
    const viewportHeight = window.innerHeight;

    let direction = 0;
    let distance = 0;

    if (clientY < edgeSize) {
      direction = -1;
      distance = edgeSize - clientY;
    } else if (clientY > viewportHeight - edgeSize) {
      direction = 1;
      distance = clientY - (viewportHeight - edgeSize);
    }

    if (direction === 0) {
      return;
    }

    const speed = Math.min(
      maxSpeed,
      Math.max(4, Math.round((distance / edgeSize) * maxSpeed)),
    );

    dragScrollIntervalRef.current = setInterval(() => {
      window.scrollBy({
        top: direction * speed,
        left: 0,
        behavior: "auto",
      });
    }, 16);
  }

  useEffect(() => {
    return () => {
      stopDragAutoScroll();
    };
  }, []);

  /* ==========================================================
     GET ID
  ========================================================== */

  useEffect(() => {
    params.then((p) => {
      setId(String(p.id));
    });
  }, [params]);

  /* ==========================================================
     LOAD SURVEY
  ========================================================== */

  useEffect(() => {
    if (!id) {
      return;
    }

    async function loadSurvey() {
      try {
        setLoading(true);
        setError("");

        const response = await api<any>(
          endpoints.survey(id),
        );

        const data = unwrap(response);

        const normalizedSurvey: Survey = {
          ...data,
          fields: Array.isArray(data?.fields)
            ? cloneFields(data.fields)
            : [],
        };

        setSurvey(normalizedSurvey);

        setTitle(normalizedSurvey.title || "");

        setDescription(
          normalizedSurvey.description || "",
        );

        setSurveyType(
          normalizedSurvey.survey_type || "normal",
        );

        setIsActive(
          normalizedSurvey.is_active !== false,
        );

        setFields(
          cloneFields(normalizedSurvey.fields || []),
        );
      } catch (e) {
        console.error(
          "Unable to load survey:",
          e,
        );

        setError(
          e instanceof Error
            ? e.message
            : "Unable to load survey.",
        );
      } finally {
        setLoading(false);
      }
    }

    void loadSurvey();
  }, [id]);

  /* ==========================================================
     COMPUTED
  ========================================================== */

  const requiredFields = useMemo(
    () =>
      fields.filter(
        (field) =>
          field.required &&
          field.field_type !== "heading",
      ).length,
    [fields],
  );

  const optionFields = useMemo(
    () =>
      fields.filter((field) =>
        isOptionField(field.field_type),
      ).length,
    [fields],
  );

  const questionFields = useMemo(
    () =>
      fields.filter(
        (field) => field.field_type !== "heading",
      ).length,
    [fields],
  );

  /* ==========================================================
     EDIT
  ========================================================== */

  function startEditing(focusIndex?: number) {
    if (!survey) {
      return;
    }

    setTitle(survey.title || "");

    setDescription(
      survey.description || "",
    );

    setSurveyType(
      survey.survey_type || "normal",
    );

    setIsActive(
      survey.is_active !== false,
    );

    setFields(
      cloneFields(survey.fields || []),
    );

    setError("");

    setSaveMessage("");

    setEditing(true);

    if (typeof focusIndex === "number") {
      window.setTimeout(() => {
        document
          .getElementById(`question-editor-${focusIndex}`)
          ?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 50);
    }
  }

  function cancelEditing() {
    if (!survey) {
      return;
    }

    setTitle(survey.title || "");

    setDescription(
      survey.description || "",
    );

    setSurveyType(
      survey.survey_type || "normal",
    );

    setIsActive(
      survey.is_active !== false,
    );

    setFields(
      cloneFields(survey.fields || []),
    );

    setError("");

    setSaveMessage("");

    setEditing(false);

    setDraggedIndex(null);

    setDragOverIndex(null);
  }

  /* ==========================================================
     FIELD UPDATE
  ========================================================== */

  function updateField(
    index: number,
    changes: Partial<SurveyField>,
  ) {
    setFields((current) =>
      current.map((field, fieldIndex) =>
        fieldIndex === index
          ? {
              ...field,
              ...changes,
            }
          : field,
      ),
    );
  }

  function changeFieldType(
    index: number,
    type: string,
  ) {
    const current = fields[index];

    if (!current) {
      return;
    }

    const changes: Partial<SurveyField> = {
      field_type: type,
    };

    if (type === "select" || type === "radio" || type === "checkbox") {
      changes.options =
        current.options &&
        Array.isArray(current.options.values)
          ? {
              ...current.options,
              values: [...current.options.values],
            }
          : {
              values: ["Option 1", "Option 2"],
            };
    } else if (type === "range") {
      changes.options = {
        min: Number(current.options?.min ?? 0),
        max: Number(current.options?.max ?? 100),
        step: Number(current.options?.step ?? 1),
      };
    } else if (type === "matrix") {
      changes.options = {
        rows:
          Array.isArray(current.options?.rows) &&
          current.options.rows.length > 0
            ? [...current.options.rows]
            : ["Row 1", "Row 2"],
        columns:
          Array.isArray(current.options?.columns) &&
          current.options.columns.length > 0
            ? [...current.options.columns]
            : ["Column 1", "Column 2"],
      };
    } else {
      changes.options = null;
    }

    updateField(index, changes);
  }

  /* ==========================================================
     ADD FIELD
  ========================================================== */

  function addField() {
    setFields((current) => [
      ...current,
      createEmptyField(current.length),
    ]);
  }

  /* ==========================================================
     DUPLICATE
  ========================================================== */

  function duplicateField(index: number) {
    const source = fields[index];

    if (!source) {
      return;
    }

    const copy: SurveyField = {
      ...source,
      id: undefined,

      label: source.label
        ? `${source.label} Copy`
        : "",

      field_name: source.field_name
        ? `${source.field_name}_copy`
        : `field_${fields.length + 1}`,

      options: source.options
        ? {
            ...source.options,
            values: Array.isArray(
              source.options.values,
            )
              ? [...source.options.values]
              : [],
          }
        : null,

      sort_order: index + 1,
    };

    setFields((current) => {
      const next = [...current];

      next.splice(index + 1, 0, copy);

      return next.map(
        (field, fieldIndex) => ({
          ...field,
          sort_order: fieldIndex,
        }),
      );
    });
  }

  /* ==========================================================
     DELETE
  ========================================================== */

  function deleteField(index: number) {
    const confirmed = window.confirm(
      "Remove this question from the survey?",
    );

    if (!confirmed) {
      return;
    }

    setFields((current) =>
      current
        .filter(
          (_, fieldIndex) =>
            fieldIndex !== index,
        )
        .map(
          (field, fieldIndex) => ({
            ...field,
            sort_order: fieldIndex,
          }),
        ),
    );
  }

  /* ==========================================================
     MOVE UP / DOWN
  ========================================================== */

  function moveField(
    index: number,
    direction: "up" | "down",
  ) {
    setFields((current) => {
      const next = [...current];

      const targetIndex =
        direction === "up"
          ? index - 1
          : index + 1;

      if (
        targetIndex < 0 ||
        targetIndex >= next.length
      ) {
        return current;
      }

      [
        next[index],
        next[targetIndex],
      ] = [
        next[targetIndex],
        next[index],
      ];

      return next.map(
        (field, fieldIndex) => ({
          ...field,
          sort_order: fieldIndex,
        }),
      );
    });
  }

  /* ==========================================================
     DRAG AND DROP
  ========================================================== */

  function handleDragStart(
    event: DragEvent<HTMLDivElement>,
    index: number,
  ) {
    setDraggedIndex(index);

    event.dataTransfer.effectAllowed = "move";

    event.dataTransfer.setData(
      "text/plain",
      String(index),
    );

    /*
     * A transparent/near-transparent drag image is not required.
     * Keep the browser's normal drag preview while the page itself
     * remains scrollable.
     */
  }

  function handleDragOver(
    event: DragEvent<HTMLDivElement>,
    index: number,
  ) {
    event.preventDefault();
    event.stopPropagation();

    event.dataTransfer.dropEffect = "move";

    setDragOverIndex(index);

    /*
     * IMPORTANT:
     * clientY is relative to the viewport. Therefore this keeps
     * working even after the document has already scrolled.
     *
     * When the cursor enters the 120px zone at either edge, the
     * entire browser document starts scrolling continuously.
     */
    updateDragAutoScroll(event.clientY);
  }

  function handleDragLeave() {
    setDragOverIndex(null);
  }

  function handleDrop(
    event: DragEvent<HTMLDivElement>,
    targetIndex: number,
  ) {
    event.preventDefault();
    event.stopPropagation();

    stopDragAutoScroll();

    const sourceIndexFromData =
      event.dataTransfer.getData(
        "text/plain",
      );

    const sourceIndex =
      draggedIndex !== null
        ? draggedIndex
        : Number(sourceIndexFromData);

    if (
      Number.isNaN(sourceIndex) ||
      sourceIndex === targetIndex
    ) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    setFields((current) => {
      const next = [...current];

      const [movedField] =
        next.splice(sourceIndex, 1);

      if (!movedField) {
        return current;
      }

      /*
       * After removing an item from above the target, the target
       * index shifts left by one. Correct that so dragging DOWN
       * behaves naturally.
       */
      const adjustedTargetIndex =
        sourceIndex < targetIndex
          ? targetIndex - 1
          : targetIndex;

      next.splice(
        adjustedTargetIndex,
        0,
        movedField,
      );

      return next.map(
        (field, fieldIndex) => ({
          ...field,
          sort_order: fieldIndex,
        }),
      );
    });

    setDraggedIndex(null);

    setDragOverIndex(null);
  }

  function handleDragEnd() {
    stopDragAutoScroll();

    setDraggedIndex(null);
    setDragOverIndex(null);
  }

  /* ==========================================================
     OPTIONS
  ========================================================== */

  function addOption(
    fieldIndex: number,
  ) {
    setFields((current) =>
      current.map((field, index) => {
        if (index !== fieldIndex) {
          return field;
        }

        const values = Array.isArray(
          field.options?.values,
        )
          ? [...field.options.values]
          : [];

        values.push(
          `Option ${values.length + 1}`,
        );

        return {
          ...field,
          options: {
            values,
          },
        };
      }),
    );
  }

  function updateOption(
    fieldIndex: number,
    optionIndex: number,
    value: string,
  ) {
    setFields((current) =>
      current.map((field, index) => {
        if (index !== fieldIndex) {
          return field;
        }

        const values = Array.isArray(
          field.options?.values,
        )
          ? [...field.options.values]
          : [];

        values[optionIndex] = value;

        return {
          ...field,
          options: {
            values,
          },
        };
      }),
    );
  }

  function deleteOption(
    fieldIndex: number,
    optionIndex: number,
  ) {
    setFields((current) =>
      current.map((field, index) => {
        if (index !== fieldIndex) {
          return field;
        }

        const values = Array.isArray(
          field.options?.values,
        )
          ? [...field.options.values]
          : [];

        values.splice(optionIndex, 1);

        return {
          ...field,
          options: {
            values,
          },
        };
      }),
    );
  }

  /* ==========================================================
     SAVE
  ========================================================== */

  async function saveSurvey() {
    if (!survey) {
      return;
    }

    setError("");

    setSaveMessage("");

    if (!title.trim()) {
      setError(
        "Survey title is required.",
      );
      return;
    }

    if (title.trim().length > 255) {
      setError(
        "Survey title cannot exceed 255 characters.",
      );
      return;
    }

    if (fields.length === 0) {
      setError(
        "Add at least one survey field.",
      );
      return;
    }

    for (
      let index = 0;
      index < fields.length;
      index++
    ) {
      const field = fields[index];

      if (
        field.field_type ===
        "heading"
      ) {
        if (!field.label.trim()) {
          setError(
            `Section ${index + 1} needs a title.`,
          );
          return;
        }

        continue;
      }

      if (!field.label.trim()) {
        setError(
          `Question ${index + 1} needs a label.`,
        );
        return;
      }

      if (!field.field_name.trim()) {
        setError(
          `Question ${index + 1} needs a field name.`,
        );
        return;
      }

      if (
        isOptionField(
          field.field_type,
        )
      ) {
        const values =
          field.options?.values ||
          [];

        if (values.length === 0) {
          setError(
            `Add at least one option to "${field.label}".`,
          );
          return;
        }

        if (
          values.some(
            (value) =>
              !String(value).trim(),
          )
        ) {
          setError(
            `All options for "${field.label}" must have a value.`,
          );
          return;
        }
      }
    }

    try {
      setSaving(true);

      const cleanFields =
        fields.map(
          (
            field,
            index,
          ) => ({
            label:
              field.label.trim(),

            field_name:
              field.field_name.trim(),

            field_type:
              field.field_type,

            required:
              Boolean(
                field.required,
              ),

            is_unique:
              Boolean(
                field.is_unique,
              ),

            placeholder:
              field.placeholder
                ?.trim() || null,

            help_text:
              field.help_text
                ?.trim() || null,

            options:
              isOptionField(field.field_type)
                ? {
                    values: (
                      field.options?.values || []
                    ).map((value) => String(value).trim()),
                  }
                : field.field_type === "range"
                  ? {
                      min: Number(field.options?.min ?? 0),
                      max: Number(field.options?.max ?? 100),
                      step: Number(field.options?.step ?? 1),
                    }
                  : field.field_type === "matrix"
                    ? {
                        rows: (
                          field.options?.rows || []
                        ).map((value) => String(value).trim()),
                        columns: (
                          field.options?.columns || []
                        ).map((value) => String(value).trim()),
                      }
                    : null,

            validation:
              field.validation ||
              null,

            depends_on:
              field.depends_on ||
              null,

            /*
             * THIS IS THE IMPORTANT
             * PART FOR QUESTION ORDER.
             *
             * Whatever order the user
             * creates/drags the fields
             * into becomes sort_order.
             */
            sort_order:
              index,

            media_url:
              field.media_url
                ?.trim() || null,

            media_caption:
              field.media_caption
                ?.trim() || null,

            media_table_columns:
              field.media_table_columns ||
              null,
          }),
        );

      const payload = {
        client_id:
          survey.client_id,

        title:
          title.trim(),

        description:
          description.trim() ||
          null,

        survey_type:
          surveyType,

        is_active:
          isActive,

        fields:
          cleanFields,
      };

      console.log(
        "UPDATE SURVEY PAYLOAD:",
        payload,
      );

      const response =
        await api<any>(
          endpoints.survey(id),
          {
            method: "PUT",
            body: JSON.stringify(
              payload,
            ),
          },
        );

      const updated =
        unwrap(response);

      const updatedSurvey: Survey =
        {
          ...updated,

          fields:
            Array.isArray(
              updated?.fields,
            )
              ? cloneFields(
                  updated.fields,
                )
              : [],
        };

      setSurvey(
        updatedSurvey,
      );

      setTitle(
        updatedSurvey.title ||
          "",
      );

      setDescription(
        updatedSurvey.description ||
          "",
      );

      setSurveyType(
        updatedSurvey.survey_type ||
          "normal",
      );

      setIsActive(
        updatedSurvey.is_active !==
          false,
      );

      setFields(
        cloneFields(
          updatedSurvey.fields ||
            [],
        ),
      );

      setEditing(false);

      setSaveMessage(
        "Survey updated successfully.",
      );

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    } catch (e) {
      console.error(
        "UPDATE SURVEY ERROR:",
        e,
      );

      setError(
        e instanceof Error
          ? e.message
          : "Unable to update survey.",
      );
    } finally {
      setSaving(false);
    }
  }

  /* ==========================================================
     LOADING
  ========================================================== */

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f5f7fb]">
        <div className="flex min-h-screen items-center justify-center">
          <div className="flex flex-col items-center">
            <div className="relative">
              <div className="h-14 w-14 animate-spin rounded-full border-4 border-slate-200 border-t-red-500" />

              <div className="absolute inset-0 flex items-center justify-center">
                <ClipboardList
                  size={18}
                  className="text-red-500"
                />
              </div>
            </div>

            <p className="mt-4 text-sm font-semibold text-slate-500">
              Loading survey...
            </p>
          </div>
        </div>
      </div>
    );
  }

  /* ==========================================================
     ERROR
  ========================================================== */

  if (error && !survey) {
    return (
      <div className="min-h-screen bg-[#f5f7fb]">
        <div className="flex min-h-screen items-center justify-center px-5">
          <div className="w-full max-w-lg overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-2xl">
            <div className="h-2 bg-gradient-to-r from-red-500 via-rose-500 to-orange-400" />

            <div className="p-10 text-center">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[24px] bg-red-50 text-red-500">
                <ClipboardList
                  size={30}
                />
              </div>

              <h1 className="mt-6 text-2xl font-black text-slate-950">
                Unable to load survey
              </h1>

              <p className="mt-3 text-sm leading-6 text-slate-500">
                {error}
              </p>

              <Link
                href="/dashboard/surveys"
                className="mt-7 inline-flex h-11 items-center gap-2 rounded-xl bg-slate-950 px-5 text-sm font-bold text-white"
              >
                <ArrowLeft
                  size={16}
                />
                Back to surveys
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!survey) {
    return null;
  }

  /* ==========================================================
     MAIN
  ========================================================== */

  return (
    <div className="min-h-screen bg-[#f5f7fb]">
      {/* ======================================================
          HERO
      ======================================================= */}

      <header className="relative overflow-hidden bg-gradient-to-br from-red-700 via-red-600 to-orange-500">
        <div className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-red-500/20 blur-3xl" />

        <div className="pointer-events-none absolute -right-32 -top-20 h-96 w-96 rounded-full bg-orange-400/15 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-5 pb-10 pt-6 lg:px-10">
          {/* Navigation */}

          <div className="flex items-center justify-between">
            <Link
              href="/dashboard/surveys"
              className="group inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.06] px-4 py-2.5 text-xs font-bold text-white/70 transition hover:bg-white/10 hover:text-white"
            >
              <ArrowLeft
                size={15}
                className="transition-transform group-hover:-translate-x-1"
              />

              Back to surveys
            </Link>

            {!editing ? (
              <button
                type="button"
                onClick={() => startEditing()}
                className="group flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-xs font-extrabold text-slate-950 transition hover:-translate-y-0.5 hover:bg-red-50 hover:text-red-600"
              >
                <Pencil
                  size={14}
                />

                Edit survey

                <ChevronRight
                  size={13}
                  className="transition-transform group-hover:translate-x-0.5"
                />
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={
                    cancelEditing
                  }
                  disabled={saving}
                  className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.06] px-4 py-2.5 text-xs font-bold text-white/70 transition hover:bg-white/10 hover:text-white disabled:opacity-50"
                >
                  <X size={14} />
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={
                    saveSurvey
                  }
                  disabled={saving}
                  className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-red-500 to-orange-400 px-5 py-2.5 text-xs font-extrabold text-white shadow-lg shadow-red-950/30 disabled:opacity-60"
                >
                  {saving ? (
                    <RefreshCw
                      size={14}
                      className="animate-spin"
                    />
                  ) : (
                    <Save
                      size={14}
                    />
                  )}

                  {saving
                    ? "Saving..."
                    : "Save changes"}
                </button>
              </div>
            )}
          </div>

          {/* ==================================================
              PREVIEW HERO
          =================================================== */}

          {!editing ? (
            <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
              <div>
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-[18px] bg-gradient-to-br from-red-500 to-orange-400 shadow-xl shadow-red-950/30">
                    <ClipboardList
                      size={25}
                      className="text-white"
                    />
                  </div>

                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.25em] text-red-400">
                      Jansetu survey
                    </p>

                    <div className="mt-1 flex flex-wrap gap-2">
                      <span className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 text-[10px] font-bold text-white/60">
                        {formatType(
                          survey.survey_type,
                        )}
                      </span>

                      <span
                        className={`rounded-full px-3 py-1.5 text-[10px] font-bold ${
                          survey.is_active ===
                          false
                            ? "bg-white/10 text-white/50"
                            : "bg-emerald-400/10 text-emerald-300"
                        }`}
                      >
                        <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-current" />

                        {survey.is_active ===
                        false
                          ? "Inactive"
                          : "Active"}
                      </span>
                    </div>
                  </div>
                </div>

                <h1 className="mt-7 max-w-4xl text-4xl font-black leading-[1.05] tracking-[-0.045em] text-white sm:text-5xl lg:text-6xl">
                  {survey.title ||
                    "Untitled Survey"}
                </h1>

                <p className="mt-5 max-w-3xl text-sm leading-7 text-white/55 sm:text-base">
                  {survey.description ||
                    "No description has been provided for this survey."}
                </p>
              </div>
            </div>
          ) : (
            /* ==================================================
               EDIT HERO
            =================================================== */

            <div className="mt-10">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-red-500 to-orange-400">
                  <Pencil
                    size={21}
                    className="text-white"
                  />
                </div>

                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-red-400">
                    Survey editor
                  </p>

                  <h1 className="mt-1 text-3xl font-black tracking-tight text-white sm:text-4xl">
                    Edit survey
                  </h1>
                </div>
              </div>

              <div className="mt-7 grid gap-5 lg:grid-cols-[1fr_280px]">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-[0.18em] text-white/40">
                    Survey title
                  </label>

                  <input
                    value={title}
                    onChange={(event) =>
                      setTitle(
                        event.target.value,
                      )
                    }
                    maxLength={255}
                    className="mt-2 w-full rounded-2xl border border-white/10 bg-white/[0.07] px-5 py-4 text-xl font-bold text-white outline-none placeholder:text-white/20 focus:border-red-400/50 focus:ring-4 focus:ring-red-500/10"
                    placeholder="Enter survey title"
                  />

                  <label className="mt-5 block text-[10px] font-black uppercase tracking-[0.18em] text-white/40">
                    Description
                  </label>

                  <textarea
                    value={description}
                    onChange={(event) =>
                      setDescription(
                        event.target.value,
                      )
                    }
                    rows={3}
                    className="mt-2 w-full resize-none rounded-2xl border border-white/10 bg-white/[0.07] px-5 py-4 text-sm leading-6 text-white outline-none placeholder:text-white/20 focus:border-red-400/50 focus:ring-4 focus:ring-red-500/10"
                    placeholder="Describe what this survey is about..."
                  />
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-5">
                  <label className="text-[10px] font-black uppercase tracking-[0.18em] text-white/40">
                    Survey type
                  </label>

                  <div className="relative mt-2">
                    <select
                      value={
                        surveyType
                      }
                      onChange={(
                        event,
                      ) =>
                        setSurveyType(
                          event.target
                            .value,
                        )
                      }
                      className="w-full appearance-none rounded-xl border border-white/10 bg-slate-900 px-3 py-3 text-sm font-bold text-white outline-none focus:border-red-400"
                    >
                      {SURVEY_TYPES.map(
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
                        ),
                      )}
                    </select>

                    <ChevronDown
                      size={15}
                      className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-white/40"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setIsActive(
                        (current) =>
                          !current,
                      )
                    }
                    className={`mt-4 flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left transition ${
                      isActive
                        ? "border-emerald-400/20 bg-emerald-400/10"
                        : "border-white/10 bg-white/[0.04]"
                    }`}
                  >
                    <div>
                      <p className="text-xs font-bold text-white">
                        Survey status
                      </p>

                      <p className="mt-0.5 text-[10px] text-white/40">
                        {isActive
                          ? "Visible and active"
                          : "Currently inactive"}
                      </p>
                    </div>

                    <span
                      className={`relative h-6 w-11 rounded-full transition ${
                        isActive
                          ? "bg-emerald-500"
                          : "bg-white/20"
                      }`}
                    >
                      <span
                        className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow transition ${
                          isActive
                            ? "left-6"
                            : "left-1"
                        }`}
                      />
                    </span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* ======================================================
          MESSAGES
      ======================================================= */}

      <div className="mx-auto max-w-7xl px-5 pt-6 lg:px-10">
        {saveMessage && (
          <div className="flex items-center gap-3 rounded-2xl border border-emerald-100 bg-emerald-50 px-5 py-4 text-sm font-semibold text-emerald-700">
            <CheckCircle2 size={18} />

            {saveMessage}
          </div>
        )}

        {error && survey && (
          <div className="mt-4 flex items-start gap-3 rounded-2xl border border-red-100 bg-red-50 px-5 py-4 text-sm font-semibold text-red-700">
            <Info
              size={18}
              className="mt-0.5 shrink-0"
            />

            <span>{error}</span>

            <button
              type="button"
              onClick={() =>
                setError("")
              }
              className="ml-auto text-red-400 hover:text-red-700"
            >
              <X size={16} />
            </button>
          </div>
        )}
      </div>

      {/* ======================================================
          CONTENT
      ======================================================= */}

      <main className="mx-auto max-w-7xl px-5 py-7 lg:px-10 lg:py-9">
        {/* ====================================================
            STATS
        ===================================================== */}

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            icon={
              <ClipboardList
                size={19}
              />
            }
            label="Total fields"
            value={String(
              fields.length,
            )}
            description="Configured fields"
            className="red"
          />

          <StatCard
            icon={
              <CheckCircle2
                size={19}
              />
            }
            label="Required"
            value={String(
              requiredFields,
            )}
            description="Mandatory questions"
            className="orange"
          />

          <StatCard
            icon={
              <Circle size={18} />
            }
            label="Questions"
            value={String(
              questionFields,
            )}
            description="Input questions"
            className="blue"
          />

          <StatCard
            icon={
              <Radio size={19} />
            }
            label="Choice fields"
            value={String(
              optionFields,
            )}
            description="Predefined options"
            className="purple"
          />
        </section>

        {/* ====================================================
            EDITOR
        ===================================================== */}

        {editing ? (
          <section className="mt-8">
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-red-500" />

                  <span className="text-[10px] font-black uppercase tracking-[0.22em] text-red-500">
                    Builder
                  </span>
                </div>

                <h2 className="mt-2 text-3xl font-black tracking-[-0.035em] text-slate-950">
                  Build your survey
                </h2>

                <p className="mt-1.5 text-sm text-slate-500">
                  Drag questions to change their order, or use the controls on each question.
                </p>
              </div>

              <button
                type="button"
                onClick={addField}
                className="group flex h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-red-500 to-orange-400 px-5 text-sm font-extrabold text-white shadow-lg shadow-red-200 transition hover:-translate-y-0.5"
              >
                <Plus
                  size={17}
                  className="transition-transform group-hover:rotate-90"
                />

                Add question
              </button>
            </div>

            {/* Drag hint */}

            {fields.length > 1 && (
              <div className="mb-5 flex items-center gap-3 rounded-2xl border border-red-100 bg-red-50/70 px-5 py-4">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-red-500 shadow-sm">
                  <GripVertical
                    size={17}
                  />
                </div>

                <div>
                  <p className="text-xs font-black text-red-800">
                    Reorder questions
                  </p>

                  <p className="mt-0.5 text-[11px] text-red-700/60">
                    Drag any question up or down to change its position.
                  </p>
                </div>
              </div>
            )}

            <div className="space-y-5">
              {fields.map(
                (
                  field,
                  index,
                ) => (
                  <div
                    id={`question-editor-${index}`}
                    key={
                      field.id ||
                      `new-${index}`
                    }
                    draggable={false}
                    onDragStart={(
                      event,
                    ) =>
                      handleDragStart(
                        event,
                        index,
                      )
                    }
                    onDragOver={(
                      event,
                    ) =>
                      handleDragOver(
                        event,
                        index,
                      )
                    }
                    onDragLeave={
                      handleDragLeave
                    }
                    onDrop={(
                      event,
                    ) =>
                      handleDrop(
                        event,
                        index,
                      )
                    }
                    onDragEnd={
                      handleDragEnd
                    }
                    className={`rounded-[27px] transition-all duration-200 ${
                      dragOverIndex ===
                      index
                        ? "scale-[1.01] ring-2 ring-red-400 ring-offset-4"
                        : ""
                    } ${
                      draggedIndex ===
                      index
                        ? "opacity-40"
                        : "opacity-100"
                    }`}
                  >
                    <EditableFieldCard
                      field={
                        field
                      }
                      index={
                        index
                      }
                      total={
                        fields.length
                      }
                      onChange={(
                        changes,
                      ) =>
                        updateField(
                          index,
                          changes,
                        )
                      }
                      onTypeChange={(
                        type,
                      ) =>
                        changeFieldType(
                          index,
                          type,
                        )
                      }
                      onMoveUp={() =>
                        moveField(
                          index,
                          "up",
                        )
                      }
                      onMoveDown={() =>
                        moveField(
                          index,
                          "down",
                        )
                      }
                      onDuplicate={() =>
                        duplicateField(
                          index,
                        )
                      }
                      onDelete={() =>
                        deleteField(
                          index,
                        )
                      }
                      onAddOption={() =>
                        addOption(
                          index,
                        )
                      }
                      onUpdateOption={(
                        optionIndex,
                        value,
                      ) =>
                        updateOption(
                          index,
                          optionIndex,
                          value,
                        )
                      }
                      onDeleteOption={(
                        optionIndex,
                      ) =>
                        deleteOption(
                          index,
                          optionIndex,
                        )
                      }
                    />
                  </div>
                ),
              )}
            </div>

            {fields.length === 0 && (
              <div className="rounded-[28px] border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-red-500">
                  <Plus size={27} />
                </div>

                <h3 className="mt-5 text-xl font-black text-slate-950">
                  Start building your survey
                </h3>

                <p className="mt-2 text-sm text-slate-500">
                  Add your first question to get started.
                </p>

                <button
                  type="button"
                  onClick={addField}
                  className="mt-6 rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white"
                >
                  Add first question
                </button>
              </div>
            )}

            {/* Sticky save */}

            {fields.length > 0 && (
              <div className="sticky bottom-5 z-20 mt-8">
                <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-2xl shadow-slate-300/30 backdrop-blur sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-red-600">
                      <Save
                        size={17}
                      />
                    </div>

                    <div>
                      <p className="text-sm font-black text-slate-950">
                        Changes are not saved yet
                      </p>

                      <p className="mt-0.5 text-xs text-slate-400">
                        {fields.length} fields â€¢{" "}
                        {requiredFields} required â€¢{" "}
                        Dragged order will be saved
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={
                        cancelEditing
                      }
                      disabled={
                        saving
                      }
                      className="flex h-11 items-center gap-2 rounded-xl border border-slate-200 px-5 text-sm font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                    >
                      <X size={16} />
                      Cancel
                    </button>

                    <button
                      type="button"
                      onClick={
                        saveSurvey
                      }
                      disabled={
                        saving
                      }
                      className="flex h-11 items-center gap-2 rounded-xl bg-slate-950 px-6 text-sm font-extrabold text-white transition hover:bg-red-600 disabled:opacity-50"
                    >
                      {saving ? (
                        <RefreshCw
                          size={16}
                          className="animate-spin"
                        />
                      ) : (
                        <Save
                          size={16}
                        />
                      )}

                      {saving
                        ? "Saving..."
                        : "Save survey"}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </section>
        ) : (
          /* ==================================================
             PREVIEW
          =================================================== */

          <div className="mt-8 grid items-start gap-7 lg:grid-cols-[minmax(0,1fr)_300px]">
            <div>
              <div className="mb-6 flex items-end justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-red-500" />

                    <span className="text-[10px] font-black uppercase tracking-[0.22em] text-red-500">
                      Questionnaire
                    </span>
                  </div>

                  <h2 className="mt-2 text-3xl font-black tracking-[-0.035em] text-slate-950">
                    Survey questions
                  </h2>

                  <p className="mt-1.5 text-sm text-slate-500">
                    Preview the configured survey form.
                  </p>
                </div>

                
              </div>

              {fields.length > 0 ? (
                <div className="space-y-5">
                  {fields.map(
                    (
                      field,
                      index,
                    ) => (
                      <PreviewFieldCard
                        key={
                          field.id ||
                          `${field.field_name}-${index}`
                        }
                        field={
                          field
                        }
                        index={
                          index
                        }
                        onEdit={() =>
                          startEditing(index)
                        }
                      />
                    ),
                  )}
                </div>
              ) : (
                <EmptyFields />
              )}
            </div>

            {/* SIDEBAR */}

            <aside className="space-y-5 lg:sticky lg:top-6">
              <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm">
                <div className="h-1.5 bg-gradient-to-r from-red-500 via-rose-500 to-orange-400" />

                <div className="p-5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-950 text-white">
                      <Info size={17} />
                    </div>

                    <div>
                      <h3 className="text-sm font-black text-slate-950">
                        Survey overview
                      </h3>

                      <p className="text-[10px] text-slate-400">
                        Configuration
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 space-y-4">
                    <SideInfo
                      icon={
                        <Radio
                          size={15}
                        />
                      }
                      label="Type"
                      value={formatType(
                        survey.survey_type,
                      )}
                    />

                    <SideInfo
                      icon={
                        <ShieldCheck
                          size={15}
                        />
                      }
                      label="Status"
                      value={
                        survey.is_active ===
                        false
                          ? "Inactive"
                          : "Active"
                      }
                    />

                    <SideInfo
                      icon={
                        <ClipboardList
                          size={15}
                        />
                      }
                      label="Fields"
                      value={`${fields.length}`}
                    />

                    <SideInfo
                      icon={
                        <CheckCircle2
                          size={15}
                        />
                      }
                      label="Required"
                      value={`${requiredFields}`}
                    />
                  </div>
                </div>
              </div>

              <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                    <Clock3 size={17} />
                  </div>

                  <div>
                    <h3 className="text-sm font-black text-slate-950">
                      Timeline
                    </h3>

                    <p className="text-[10px] text-slate-400">
                      Survey activity
                    </p>
                  </div>
                </div>

                <div className="mt-5 space-y-5">
                  <TimelineItem
                    label="Created"
                    value={formatDateTime(
                      survey.created_at,
                    )}
                    first
                  />

                  <TimelineItem
                    label="Last updated"
                    value={formatDateTime(
                      survey.updated_at,
                    )}
                  />
                </div>
              </div>

             
            </aside>
          </div>
        )}
      </main>
    </div>
  );
}

/* ============================================================
   EDITABLE FIELD CARD
============================================================ */

function EditableFieldCard({
  field,
  index,
  total,
  onChange,
  onTypeChange,
  onMoveUp,
  onMoveDown,
  onDuplicate,
  onDelete,
  onAddOption,
  onUpdateOption,
  onDeleteOption,
}: {
  field: SurveyField;
  index: number;
  total: number;
  onChange: (
    changes: Partial<SurveyField>,
  ) => void;
  onTypeChange: (
    type: string,
  ) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onAddOption: () => void;
  onUpdateOption: (
    optionIndex: number,
    value: string,
  ) => void;
  onDeleteOption: (
    optionIndex: number,
  ) => void;
}) {
  const options =
    field.options?.values ||
    [];

  return (
    <article className="overflow-hidden rounded-[26px] border border-slate-200 bg-white shadow-sm transition hover:shadow-lg">
      <div className="h-1.5 bg-gradient-to-r from-red-500 via-rose-500 to-orange-400" />

      <div className="p-5 sm:p-7">
        {/* Header */}

        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-start gap-4">
            {/* Drag handle */}

            <div
              title="Drag to reorder"
              draggable
              onDragStart={(event) => {
                event.dataTransfer.effectAllowed = "move";
                event.dataTransfer.setData(
                  "text/plain",
                  String(index),
                );
              }}
              className="mt-1 flex h-11 w-8 cursor-grab touch-none select-none items-center justify-center rounded-xl bg-slate-50 text-slate-300 active:cursor-grabbing"
            >
              <GripVertical
                size={18}
              />
            </div>

            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-sm font-black text-white">
              {String(
                index + 1,
              ).padStart(2, "0")}
            </div>

            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-red-500">
                Field {index + 1}
              </p>

              <h3 className="mt-1 text-lg font-black text-slate-950">
                {field.label ||
                  "Untitled field"}
              </h3>

              <p className="mt-1 text-xs text-slate-400">
                Drag this card to change its order
              </p>
            </div>
          </div>

          {/* Controls */}

          <div className="flex items-center gap-1">
            <IconButton
              title="Move up"
              disabled={
                index === 0
              }
              onClick={
                onMoveUp
              }
            >
              <ArrowUp
                size={15}
              />
            </IconButton>

            <IconButton
              title="Move down"
              disabled={
                index ===
                total - 1
              }
              onClick={
                onMoveDown
              }
            >
              <ArrowDown
                size={15}
              />
            </IconButton>

            <IconButton
              title="Duplicate"
              onClick={
                onDuplicate
              }
            >
              <Copy
                size={15}
              />
            </IconButton>

            <button
              type="button"
              onClick={
                onDelete
              }
              className="ml-1 flex h-9 w-9 items-center justify-center rounded-xl text-slate-300 transition hover:bg-red-50 hover:text-red-600"
              title="Delete field"
            >
              <Trash2
                size={16}
              />
            </button>
          </div>
        </div>

        {/* Main fields */}

        <div className="mt-7 grid gap-5 md:grid-cols-2">
          <EditInput
            label="Question label"
            value={
              field.label
            }
            placeholder="Example: What is your name?"
            onChange={(
              event,
            ) =>
              onChange({
                label:
                  event.target
                    .value,
              })
            }
          />

          <div>
            <label className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
              Field type
            </label>

            <div className="relative mt-2">
              <select
                value={
                  field.field_type
                }
                onChange={(
                  event,
                ) =>
                  onTypeChange(
                    event.target
                      .value,
                  )
                }
                className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-800 outline-none transition focus:border-red-300 focus:bg-white focus:ring-4 focus:ring-red-50"
              >
                {FIELD_TYPES.map(
                  (
                    type,
                  ) => (
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
                  ),
                )}
              </select>

              <ChevronDown
                size={15}
                className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
              />
            </div>
          </div>

          <EditInput
            label="Field name"
            value={
              field.field_name
            }
            placeholder="example: full_name"
            onChange={(
              event,
            ) =>
              onChange({
                field_name:
                  event.target
                    .value
                    .replace(
                      /\s+/g,
                      "_",
                    ),
              })
            }
          />

          <EditInput
            label="Placeholder"
            value={
              field.placeholder ||
              ""
            }
            placeholder="Optional placeholder"
            onChange={(
              event,
            ) =>
              onChange({
                placeholder:
                  event.target
                    .value,
              })
            }
          />
        </div>

        {/* Toggles */}

        {field.field_type !==
          "heading" && (
          <div className="mt-5 flex flex-wrap gap-3">
            <ToggleButton
              active={
                field.required
              }
              onClick={() =>
                onChange({
                  required:
                    !field.required,
                })
              }
              icon={
                <CheckCircle2
                  size={15}
                />
              }
              label="Required"
            />

            <ToggleButton
              active={
                field.is_unique
              }
              onClick={() =>
                onChange({
                  is_unique:
                    !field.is_unique,
                })
              }
              icon={
                <ShieldCheck
                  size={15}
                />
              }
              label="Unique value"
            />
          </div>
        )}

        {/* Help text */}

        <div className="mt-5">
          <label className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
            Help text
          </label>

          <textarea
            value={
              field.help_text ||
              ""
            }
            onChange={(
              event,
            ) =>
              onChange({
                help_text:
                  event.target
                    .value,
              })
            }
            rows={2}
            placeholder="Optional guidance shown to the respondent..."
            className="mt-2 w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-300 focus:border-red-300 focus:bg-white focus:ring-4 focus:ring-red-50"
          />
        </div>

        {/* Options */}

        {isOptionField(
          field.field_type,
        ) && (
          <div className="mt-6 rounded-2xl border border-violet-100 bg-violet-50/40 p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-violet-500">
                  Answer options
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  Configure the choices respondents can select.
                </p>
              </div>

              <button
                type="button"
                onClick={
                  onAddOption
                }
                className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-violet-600 px-4 py-2.5 text-xs font-extrabold text-white hover:bg-violet-700"
              >
                <Plus size={14} />

                Add option
              </button>
            </div>

            <div className="mt-4 space-y-2">
              {options.map(
                (
                  option,
                  optionIndex,
                ) => (
                  <div
                    key={
                      optionIndex
                    }
                    className="flex items-center gap-3"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-xs font-black text-violet-500 shadow-sm">
                      {optionIndex +
                        1}
                    </div>

                    <input
                      value={
                        option
                      }
                      onChange={(
                        event,
                      ) =>
                        onUpdateOption(
                          optionIndex,
                          event
                            .target
                            .value,
                        )
                      }
                      className="h-11 flex-1 rounded-xl border border-violet-100 bg-white px-4 text-sm font-medium text-slate-700 outline-none focus:border-violet-300 focus:ring-4 focus:ring-violet-100"
                      placeholder={`Option ${
                        optionIndex +
                        1
                      }`}
                    />

                    <button
                      type="button"
                      onClick={() =>
                        onDeleteOption(
                          optionIndex,
                        )
                      }
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-slate-300 hover:bg-red-50 hover:text-red-500"
                    >
                      <Trash2
                        size={15}
                      />
                    </button>
                  </div>
                ),
              )}

              {options.length ===
                0 && (
                <div className="rounded-xl border border-dashed border-violet-200 bg-white p-5 text-center text-xs text-slate-400">
                  No options yet. Add an option above.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Range */}
        {field.field_type === "range" && (
          <div className="mt-6 rounded-2xl border border-indigo-100 bg-indigo-50/40 p-5">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-indigo-500">
                Range settings
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Define the minimum, maximum and step for the numeric range.
              </p>
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              {(["min", "max", "step"] as const).map((key) => (
                <div key={key}>
                  <label className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
                    {key}
                  </label>
                  <input
                    type="number"
                    value={Number(field.options?.[key] ?? (key === "max" ? 100 : key === "step" ? 1 : 0))}
                    onChange={(event) =>
                      onChange({
                        options: {
                          ...(field.options || {}),
                          [key]: Number(event.target.value),
                        },
                      })
                    }
                    className="mt-2 h-11 w-full rounded-xl border border-indigo-100 bg-white px-4 text-sm font-medium text-slate-700 outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Matrix */}
        {field.field_type === "matrix" && (
          <div className="mt-6 rounded-2xl border border-teal-100 bg-teal-50/40 p-5">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-teal-600">
                Matrix settings
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Configure the rows and columns respondents will see.
              </p>
            </div>

            <div className="mt-5 grid gap-6 lg:grid-cols-2">
              {(["rows", "columns"] as const).map((key) => {
                const values = Array.isArray(field.options?.[key])
                  ? (field.options?.[key] as string[])
                  : [];

                return (
                  <div key={key}>
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-xs font-black capitalize text-slate-800">
                        {key}
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          const next = [...values, `${key === "rows" ? "Row" : "Column"} ${values.length + 1}`];
                          onChange({
                            options: {
                              ...(field.options || {}),
                              [key]: next,
                            },
                          });
                        }}
                        className="inline-flex items-center gap-1 rounded-lg bg-teal-600 px-3 py-2 text-[10px] font-extrabold text-white hover:bg-teal-700"
                      >
                        <Plus size={13} />
                        Add {key === "rows" ? "row" : "column"}
                      </button>
                    </div>

                    <div className="mt-3 space-y-2">
                      {values.map((value, itemIndex) => (
                        <div key={itemIndex} className="flex items-center gap-2">
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-[10px] font-black text-teal-600 shadow-sm">
                            {itemIndex + 1}
                          </span>
                          <input
                            value={value}
                            onChange={(event) => {
                              const next = [...values];
                              next[itemIndex] = event.target.value;
                              onChange({
                                options: {
                                  ...(field.options || {}),
                                  [key]: next,
                                },
                              });
                            }}
                            className="h-10 flex-1 rounded-xl border border-teal-100 bg-white px-3 text-xs font-medium text-slate-700 outline-none focus:border-teal-300 focus:ring-4 focus:ring-teal-100"
                            placeholder={`${key === "rows" ? "Row" : "Column"} ${itemIndex + 1}`}
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const next = [...values];
                              next.splice(itemIndex, 1);
                              onChange({
                                options: {
                                  ...(field.options || {}),
                                  [key]: next,
                                },
                              });
                            }}
                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-300 hover:bg-red-50 hover:text-red-500"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}

                      {values.length === 0 && (
                        <div className="rounded-xl border border-dashed border-teal-200 bg-white p-4 text-center text-xs text-slate-400">
                          No {key} configured.
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Media */}

        <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50/60 p-5">
          <div className="flex items-center gap-2">
            <ImageIcon
              size={16}
              className="text-slate-400"
            />

            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
              Media
            </p>
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <EditInput
              label="Media URL"
              value={
                field.media_url ||
                ""
              }
              placeholder="https://..."
              onChange={(
                event,
              ) =>
                onChange({
                  media_url:
                    event.target
                      .value,
                })
              }
            />

            <EditInput
              label="Media caption"
              value={
                field.media_caption ||
                ""
              }
              placeholder="Optional media caption"
              onChange={(
                event,
              ) =>
                onChange({
                  media_caption:
                    event.target
                      .value,
                })
              }
            />
          </div>

          {(field.field_type === "image" ||
            field.field_type === "audio") && (
            <div className="mt-4">
              <label className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
                Media table columns
              </label>
              <textarea
                value={
                  Array.isArray(field.media_table_columns?.columns)
                    ? field.media_table_columns.columns.join(", ")
                    : ""
                }
                onChange={(event) => {
                  const columns = event.target.value
                    .split(",")
                    .map((value) => value.trim())
                    .filter(Boolean);

                  onChange({
                    media_table_columns:
                      columns.length > 0 ? { columns } : null,
                  });
                }}
                rows={2}
                placeholder="Example: URL, Caption, Uploaded At"
                className="mt-2 w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none focus:border-red-300 focus:ring-4 focus:ring-red-50"
              />
              <p className="mt-1 text-[10px] text-slate-400">
                Stored as media_table_columns.columns.
              </p>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

/* ============================================================
   PREVIEW FIELD
============================================================ */

function PreviewFieldCard({
  field,
  index,
  onEdit,
}: {
  field: SurveyField;
  index: number;
  onEdit: () => void;
}) {
  const options =
    field.options?.values ||
    [];

  const accent =
    getFieldAccent(
      field.field_type,
    );

  if (
    field.field_type ===
    "heading"
  ) {
    return (
      <section className="overflow-hidden rounded-[24px] border border-orange-100 bg-gradient-to-br from-orange-50 to-amber-50 p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-100 text-orange-600">
            <Type size={18} />
          </div>

          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.18em] text-orange-500">
              Section
            </p>

            <h3 className="mt-1 text-xl font-black text-slate-950">
              {field.label ||
                "Untitled section"}
            </h3>
          </div>
        </div>

        {field.help_text && (
          <p className="mt-4 text-sm leading-6 text-slate-500">
            {field.help_text}
          </p>
        )}
      </section>
    );
  }

  return (
    <article className="overflow-hidden rounded-[26px] border border-slate-200/80 bg-white shadow-sm transition hover:shadow-lg">
      <div className="h-1 bg-gradient-to-r from-red-500 via-rose-500 to-orange-400" />

      <div className="p-5 sm:p-7">
        <div className="flex items-start gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-sm font-black text-white">
            {String(
              index + 1,
            ).padStart(2, "0")}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[9px] font-black uppercase tracking-wider ${accent.badge}`}
              >
                {getFieldIcon(
                  field.field_type,
                )}

                {formatFieldType(
                  field.field_type,
                )}
              </span>

              {field.required && (
                <span className="rounded-full bg-red-50 px-2.5 py-1.5 text-[9px] font-black uppercase tracking-wider text-red-600">
                  * Required
                </span>
              )}

              {field.is_unique && (
                <span className="rounded-full bg-blue-50 px-2.5 py-1.5 text-[9px] font-black uppercase tracking-wider text-blue-600">
                  Unique
                </span>
              )}

              <button
                type="button"
                onClick={onEdit}
                className="ml-auto inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-[9px] font-extrabold text-slate-500 shadow-sm transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                title="Edit this question"
              >
                <Pencil size={12} />
                Edit question
              </button>
            </div>

            <h3 className="mt-3 text-lg font-black leading-snug text-slate-950 sm:text-xl">
              {field.label ||
                `Question ${
                  index + 1
                }`}
            </h3>
          </div>
        </div>

        <div className="mt-6">
          <PreviewInput
            field={field}
            options={options}
          />
        </div>

        {field.help_text && (
          <div className="mt-5 flex gap-3 rounded-2xl border border-blue-100 bg-blue-50/60 p-4">
            <Info
              size={16}
              className="mt-0.5 shrink-0 text-blue-500"
            />

            <div>
              <p className="text-[9px] font-black uppercase tracking-wider text-blue-500">
                Help text
              </p>

              <p className="mt-1 text-xs leading-5 text-blue-900/70">
                {field.help_text}
              </p>
            </div>
          </div>
        )}

        {field.media_url && (
          <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
            <div className="flex items-center gap-3 p-4">
              <ImageIcon
                size={17}
                className="text-slate-400"
              />

              <a
                href={
                  field.media_url
                }
                target="_blank"
                rel="noreferrer"
                className="truncate text-xs font-bold text-red-600 hover:underline"
              >
                Open attached media
              </a>
            </div>

            {field.media_caption && (
              <p className="border-t border-slate-200 px-4 py-3 text-xs text-slate-500">
                {
                  field.media_caption
                }
              </p>
            )}
          </div>
        )}
      </div>
    </article>
  );
}

/* ============================================================
   PREVIEW INPUT
============================================================ */

function PreviewInput({
  field,
  options,
}: {
  field: SurveyField;
  options: string[];
}) {
  const type =
    String(
      field.field_type ||
        "text",
    ).toLowerCase();

  if (
    type === "select" ||
    type === "radio" ||
    type === "checkbox"
  ) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-[9px] font-black uppercase tracking-[0.16em] text-slate-400">
            Answer options
          </span>

          <span className="text-[10px] font-semibold text-slate-400">
            {type === "checkbox" ? "Multiple choice" : "Single choice"}
          </span>
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          {options.map(
            (
              option,
              optionIndex,
            ) => (
              <div
                key={
                  optionIndex
                }
                className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3"
              >
                <span
                  className={`flex h-6 w-6 shrink-0 items-center justify-center border-2 border-slate-200 ${
                    type === "checkbox" ? "rounded-md" : "rounded-full"
                  }`}
                >
                  <span
                    className={`h-2 w-2 bg-red-500 opacity-0 ${
                      type === "checkbox" ? "rounded-sm" : "rounded-full"
                    }`}
                  />
                </span>

                <span className="text-xs font-semibold text-slate-700">
                  {option}
                </span>
              </div>
            ),
          )}
        </div>
      </div>
    );
  }

  if (type === "range") {
    const min = Number(field.options?.min ?? 0);
    const max = Number(field.options?.max ?? 100);
    const step = Number(field.options?.step ?? 1);

    return (
      <div className="rounded-2xl border border-indigo-100 bg-indigo-50/40 p-5">
        <div className="flex items-center justify-between text-xs font-bold text-slate-500">
          <span>{min}</span>
          <span>Step: {step}</span>
          <span>{max}</span>
        </div>
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          defaultValue={min}
          className="mt-4 w-full accent-red-500"
        />
      </div>
    );
  }

  if (type === "matrix") {
    const rows = Array.isArray(field.options?.rows)
      ? (field.options?.rows as string[])
      : [];
    const columns = Array.isArray(field.options?.columns)
      ? (field.options?.columns as string[])
      : [];

    return (
      <div className="overflow-x-auto rounded-2xl border border-teal-100 bg-teal-50/30">
        <table className="min-w-full border-collapse">
          <thead>
            <tr>
              <th className="border-b border-teal-100 bg-white px-4 py-3 text-left text-[10px] font-black uppercase tracking-wider text-slate-400">
                Question
              </th>
              {columns.map((column, index) => (
                <th
                  key={index}
                  className="border-b border-teal-100 bg-white px-4 py-3 text-center text-[10px] font-black text-slate-500"
                >
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIndex) => (
              <tr key={rowIndex}>
                <td className="border-b border-teal-100 bg-white px-4 py-3 text-xs font-semibold text-slate-700">
                  {row}
                </td>
                {columns.map((_, columnIndex) => (
                  <td
                    key={columnIndex}
                    className="border-b border-teal-100 px-4 py-3 text-center"
                  >
                    <span className="inline-flex h-5 w-5 rounded-full border-2 border-slate-200" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (type === "video") {
    return (
      <div className="flex h-28 items-center justify-center rounded-2xl border border-pink-100 bg-pink-50/40 text-xs font-semibold text-pink-500">
        <Video size={18} className="mr-2" />
        Video preview
      </div>
    );
  }

  if (type === "image") {
    return (
      <div className="flex h-28 items-center justify-center rounded-2xl border border-sky-100 bg-sky-50/40 text-xs font-semibold text-sky-500">
        <ImageIcon size={18} className="mr-2" />
        Image preview
      </div>
    );
  }

  if (type === "audio") {
    return (
      <div className="flex h-20 items-center justify-center rounded-2xl border border-purple-100 bg-purple-50/40 text-xs font-semibold text-purple-500">
        <Music size={18} className="mr-2" />
        Audio preview
      </div>
    );
  }

  if (
    type === "textarea"
  ) {
    return (
      <div className="h-28 rounded-2xl border border-slate-200 bg-slate-50/60 px-4 py-4">
        <span className="text-xs text-slate-300">
          {field.placeholder ||
            "Long answer..."}
        </span>
      </div>
    );
  }

  if (type === "date") {
    return (
      <div className="flex h-12 items-center justify-between rounded-2xl border border-slate-200 bg-slate-50/60 px-4">
        <span className="text-xs text-slate-300">
          {field.placeholder ||
            "Select a date"}
        </span>

        <CalendarDays
          size={17}
          className="text-slate-300"
        />
      </div>
    );
  }

  return (
    <div className="flex h-12 items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50/60 px-4">
      <span className="text-slate-300">
        {getFieldIcon(
          field.field_type,
        )}
      </span>

      <span className="text-xs text-slate-300">
        {field.placeholder ||
          "Enter your answer"}
      </span>
    </div>
  );
}

/* ============================================================
   EDIT INPUT
============================================================ */

function EditInput({
  label,
  value,
  placeholder,
  onChange,
}: {
  label: string;
  value: string;
  placeholder?: string;
  onChange: (
    event: ChangeEvent<HTMLInputElement>,
  ) => void;
}) {
  return (
    <div>
      <label className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
        {label}
      </label>

      <input
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-medium text-slate-700 outline-none transition placeholder:text-slate-300 focus:border-red-300 focus:bg-white focus:ring-4 focus:ring-red-50"
      />
    </div>
  );
}

/* ============================================================
   TOGGLE
============================================================ */

function ToggleButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-xs font-bold transition ${
        active
          ? "border-red-100 bg-red-50 text-red-600"
          : "border-slate-200 bg-white text-slate-500 hover:border-slate-300"
      }`}
    >
      {icon}

      {label}

      {active && (
        <Check size={13} />
      )}
    </button>
  );
}

/* ============================================================
   ICON BUTTON
============================================================ */

function IconButton({
  children,
  title,
  disabled,
  onClick,
}: {
  children: React.ReactNode;
  title: string;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onClick={onClick}
      className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-400 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-25"
    >
      {children}
    </button>
  );
}

/* ============================================================
   STAT CARD
============================================================ */

function StatCard({
  icon,
  label,
  value,
  description,
  className,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  description: string;
  className:
    | "red"
    | "orange"
    | "blue"
    | "purple";
}) {
  const styles = {
    red: "bg-red-50 text-red-600",
    orange:
      "bg-orange-50 text-orange-600",
    blue: "bg-blue-50 text-blue-600",
    purple:
      "bg-violet-50 text-violet-600",
  };

  return (
    <div className="group relative overflow-hidden rounded-[22px] border border-slate-200/80 bg-white p-5 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl">
      <div className="relative flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
            {label}
          </p>

          <p className="mt-2 text-3xl font-black tracking-[-0.04em] text-slate-950">
            {value}
          </p>

          <p className="mt-1 text-[10px] leading-4 text-slate-400">
            {description}
          </p>
        </div>

        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${styles[className]}`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   SIDE INFO
============================================================ */

function SideInfo({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-2.5">
        <span className="text-slate-400">
          {icon}
        </span>

        <span className="text-xs font-medium text-slate-500">
          {label}
        </span>
      </div>

      <span className="text-xs font-extrabold text-slate-800">
        {value}
      </span>
    </div>
  );
}

/* ============================================================
   TIMELINE
============================================================ */

function TimelineItem({
  label,
  value,
  first,
}: {
  label: string;
  value: string;
  first?: boolean;
}) {
  return (
    <div className="relative flex gap-3">
      {!first && (
        <div className="absolute bottom-7 left-[6px] top-[-20px] w-px bg-slate-100" />
      )}

      <div className="relative mt-1 h-3 w-3 shrink-0 rounded-full border-2 border-white bg-red-500 shadow-sm ring-2 ring-red-100" />

      <div>
        <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">
          {label}
        </p>

        <p className="mt-1 text-xs font-bold text-slate-700">
          {value}
        </p>
      </div>
    </div>
  );
}

/* ============================================================
   EMPTY
============================================================ */

function EmptyFields() {
  return (
    <div className="rounded-[26px] border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-50 text-slate-300">
        <ClipboardList
          size={27}
        />
      </div>

      <h3 className="mt-5 text-lg font-black text-slate-900">
        No questions configured
      </h3>

      <p className="mt-2 text-sm text-slate-400">
        This survey currently has no configured fields.
      </p>
    </div>
  );
}
