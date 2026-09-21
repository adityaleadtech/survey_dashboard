"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { useParams, usePathname, useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Check,
  CheckCircle2,
  ClipboardList,
  Clock3,
  Database,
  FileAudio,
  FileImage,
  FileText,
  FileVideo,
  Info,
  MapPin,
  MessageSquare,
  MessageSquareText,
  RefreshCw,
  UserRound,
  Users,
  X,
} from "lucide-react";
import { api, endpoints } from "@/api";

type SurveyField = {
  id?: string;
  label?: string;
  field_name?: string;
  field_type?: string;
  required?: boolean;
  help_text?: string | null;
  options?: any;
  validation?: any;
};

type Survey = {
  id?: string;
  title?: string;
  description?: string | null;
  survey_type?: string | null;
  fields?: SurveyField[];
};

type ResponseData = {
  id?: string;
  survey_id?: string;
  project_id?: string;
  user_id?: string;
  submitted_by?: string;
  respondent_name?: string;
  respondent_id?: string;
  user_name?: string;
  response?: Record<string, any> | null;
  voters?: any[];
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

function normalizeObject(value: any): any | null {
  const data = unwrapData(value);

  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return null;
  }

  if (
    data.data &&
    typeof data.data === "object" &&
    !Array.isArray(data.data)
  ) {
    return data.data;
  }

  return data;
}

function getFields(survey: Survey | null): SurveyField[] {
  const raw = survey as any;

  if (Array.isArray(survey?.fields)) return survey.fields;
  if (Array.isArray(raw?.survey_fields)) return raw.survey_fields;
  if (Array.isArray(raw?.questions)) return raw.questions;

  return [];
}

/* -------------------------------------------------------------------------- */
/* Formatting                                                                 */
/* -------------------------------------------------------------------------- */

function typeLabel(type?: string | null) {
  const labels: Record<string, string> = {
    heading: "Heading",
    text: "Short text",
    textarea: "Long text",
    email: "Email",
    tel: "Phone",
    number: "Number",
    float: "Decimal",
    date: "Date",
    select: "Dropdown",
    radio: "Radio",
    checkbox: "Checkbox",
    range: "Range",
    matrix: "Matrix",
    image: "Image",
    video: "Video",
    audio: "Audio",
  };

  return labels[type || ""] || String(type || "Answer").replace(/_/g, " ");
}

function typeIcon(type?: string | null) {
  if (type === "image") return FileImage;
  if (type === "video") return FileVideo;
  if (type === "audio") return FileAudio;
  if (
    type === "number" ||
    type === "float" ||
    type === "range"
  ) {
    return Database;
  }
  if (type === "date") return CalendarDays;
  if (
    type === "matrix" ||
    type === "select" ||
    type === "radio" ||
    type === "checkbox"
  ) {
    return CheckCircle2;
  }

  return MessageSquareText;
}

function formatDateTime(value?: string | null) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function scalar(value: any): string {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return "No answer";
  }

  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }

  if (
    typeof value === "string" ||
    typeof value === "number"
  ) {
    return String(value);
  }

  if (Array.isArray(value)) {
    return value.map(scalar).join(", ");
  }

  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function statusInfo(status?: string | null) {
  const value = String(
    status || "submitted"
  ).toLowerCase();

  if (
    value === "submitted" ||
    value === "completed" ||
    value === "complete"
  ) {
    return {
      label:
        value === "complete"
          ? "Complete"
          : value.charAt(0).toUpperCase() + value.slice(1),
      classes:
        "border-emerald-100 bg-emerald-50 text-emerald-700",
      dot: "bg-emerald-500",
    };
  }

  if (value === "pending") {
    return {
      label: "Pending",
      classes:
        "border-amber-100 bg-amber-50 text-amber-700",
      dot: "bg-amber-500",
    };
  }

  return {
    label:
      value.charAt(0).toUpperCase() + value.slice(1),
    classes:
      "border-slate-200 bg-slate-100 text-slate-600",
    dot: "bg-slate-400",
  };
}

/* -------------------------------------------------------------------------- */
/* Response helpers                                                           */
/* -------------------------------------------------------------------------- */

function getResponseObject(data: ResponseData | null) {
  if (
    data?.response &&
    typeof data.response === "object" &&
    !Array.isArray(data.response)
  ) {
    return data.response;
  }

  return {};
}

function getMediaObject(data: ResponseData | null) {
  if (
    data?.media_files &&
    typeof data.media_files === "object" &&
    !Array.isArray(data.media_files)
  ) {
    return data.media_files;
  }

  return {};
}

function getMediaEntries(data: ResponseData | null) {
  return Object.entries(
    getMediaObject(data)
  ).flatMap(([field, files]) => {
    const list = Array.isArray(files)
      ? files
      : files
        ? [files]
        : [];

    return list.map((file: any, index) => ({
      field,
      file,
      index,
    }));
  });
}

function getLocation(data: ResponseData | null) {
  const location =
    data?.location &&
    typeof data.location === "object"
      ? data.location
      : {};

  return {
    latitude:
      data?.latitude ??
      location.latitude ??
      location.lat ??
      null,

    longitude:
      data?.longitude ??
      location.longitude ??
      location.lng ??
      null,

    name:
      data?.location_name ??
      location.name ??
      location.location_name ??
      null,

    address:
      data?.location_address ??
      location.address ??
      location.location_address ??
      null,
  };
}

function getRespondentName(data: ResponseData) {
  return (
    data.respondent_name ||
    data.submitted_by ||
    data.user_name ||
    data.respondent_id ||
    data.user_id ||
    "Anonymous respondent"
  );
}

/* -------------------------------------------------------------------------- */
/* Matrix                                                                     */
/* -------------------------------------------------------------------------- */

function MatrixAnswer({
  value,
  field,
}: {
  value: any;
  field: SurveyField;
}) {
  const options = field.options || {};

  const rows = Array.isArray(options.rows)
    ? options.rows
    : [];

  const columns = Array.isArray(options.columns)
    ? options.columns
    : [];

  const selected =
    value &&
    typeof value === "object" &&
    !Array.isArray(value)
      ? value
      : {};

  if (!rows.length || !columns.length) {
    return (
      <ValueBox>
        <pre className="whitespace-pre-wrap break-words text-xs leading-6 text-slate-600">
          {scalar(value)}
        </pre>
      </ValueBox>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
      <table className="min-w-[700px] w-full border-collapse">
        <thead>
          <tr className="bg-slate-50">
            <th className="border-b border-r border-slate-200 px-4 py-3 text-left text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">
              Question
            </th>

            {columns.map((column: any, index: number) => {
              const label =
                typeof column === "object"
                  ? column.label ||
                    column.value ||
                    column.id ||
                    `Column ${index + 1}`
                  : String(column);

              return (
                <th
                  key={index}
                  className="border-b border-slate-200 px-4 py-3 text-center text-[10px] font-black uppercase tracking-[0.1em] text-slate-400"
                >
                  {label}
                </th>
              );
            })}
          </tr>
        </thead>

        <tbody>
          {rows.map((row: any, rowIndex: number) => {
            const rowKey =
              typeof row === "object"
                ? row.value ||
                  row.id ||
                  row.key ||
                  row.label
                : String(row);

            const rowLabel =
              typeof row === "object"
                ? row.label ||
                  row.value ||
                  row.id ||
                  `Row ${rowIndex + 1}`
                : String(row);

            const selectedValue = selected[rowKey];

            return (
              <tr
                key={rowIndex}
                className="border-b border-slate-100 last:border-0"
              >
                <td className="border-r border-slate-100 bg-slate-50/70 px-4 py-4 text-xs font-black text-slate-700">
                  {rowLabel}
                </td>

                {columns.map(
                  (column: any, columnIndex: number) => {
                    const columnKey =
                      typeof column === "object"
                        ? column.value ||
                          column.id ||
                          column.key ||
                          column.label
                        : String(column);

                    const selectedCell =
                      String(selectedValue ?? "") ===
                        String(columnKey) ||
                      (Array.isArray(selectedValue) &&
                        selectedValue
                          .map(String)
                          .includes(String(columnKey)));

                    return (
                      <td
                        key={columnIndex}
                        className="px-4 py-4 text-center"
                      >
                        <div
                          className={`mx-auto flex h-8 w-8 items-center justify-center rounded-full border-2 ${
                            selectedCell
                              ? "border-red-600 bg-red-600 text-white"
                              : "border-slate-200 bg-white text-transparent"
                          }`}
                        >
                          <Check
                            size={14}
                            strokeWidth={3}
                          />
                        </div>

                        {selectedCell && (
                          <p className="mt-1 text-[9px] font-black text-red-600">
                            Selected
                          </p>
                        )}
                      </td>
                    );
                  }
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Answer rendering                                                           */
/* -------------------------------------------------------------------------- */

function AnswerValue({
  value,
  field,
}: {
  value: any;
  field: SurveyField;
}) {
  const type = field.field_type || "text";

  if (
    type === "heading"
  ) {
    return (
      <ValueBox>
        <p className="text-sm font-black text-slate-700">
          Section heading
        </p>
      </ValueBox>
    );
  }

  if (type === "matrix") {
    return (
      <MatrixAnswer
        value={value}
        field={field}
      />
    );
  }

  if (
    type === "image" ||
    type === "video" ||
    type === "audio"
  ) {
    const items = Array.isArray(value)
      ? value
      : [value];

    return (
      <div className="space-y-3">
        {items.map((item, index) => {
          const url =
            typeof item === "string"
              ? item
              : item &&
                  typeof item === "object"
                ? String(
                    item.url ||
                      item.file_url ||
                      item.fileUrl ||
                      ""
                  )
                : "";

          if (!url) {
            return null;
          }

          if (type === "image") {
            return (
              <a
                key={index}
                href={url}
                target="_blank"
                rel="noreferrer"
                className="group block overflow-hidden rounded-2xl border border-slate-200 bg-slate-50"
              >
                <img
                  src={url}
                  alt={
                    field.label ||
                    "Response image"
                  }
                  className="max-h-[480px] w-full object-contain transition group-hover:scale-[1.01]"
                />

                <div className="border-t border-slate-200 bg-white px-4 py-3 text-xs font-black text-slate-500">
                  Open full image
                </div>
              </a>
            );
          }

          if (type === "audio") {
            return (
              <div
                key={index}
                className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
              >
                <div className="mb-3 flex items-center gap-2 text-xs font-black text-slate-700">
                  <FileAudio
                    size={16}
                    className="text-red-600"
                  />
                  Audio response
                </div>

                <audio
                  controls
                  src={url}
                  className="w-full"
                >
                  Your browser does not support
                  audio playback.
                </audio>
              </div>
            );
          }

          return (
            <div
              key={index}
              className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-950"
            >
              <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3 text-xs font-black text-white">
                <FileVideo
                  size={16}
                  className="text-red-400"
                />
                Video response
              </div>

              <video
                controls
                src={url}
                className="max-h-[480px] w-full"
              >
                Your browser does not support
                video playback.
              </video>
            </div>
          );
        })}
      </div>
    );
  }

  if (Array.isArray(value)) {
    return (
      <div className="flex flex-wrap gap-2">
        {value.length ? (
          value.map((item, index) => (
            <span
              key={index}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-700"
            >
              <Check
                size={12}
                className="text-red-600"
              />
              {scalar(item)}
            </span>
          ))
        ) : (
          <ValueBox>
            <span className="text-xs text-slate-400">
              No answer
            </span>
          </ValueBox>
        )}
      </div>
    );
  }

  if (
    value &&
    typeof value === "object"
  ) {
    return (
      <pre className="overflow-x-auto whitespace-pre-wrap break-words rounded-xl bg-slate-950 p-4 text-xs leading-6 text-slate-200">
        {JSON.stringify(value, null, 2)}
      </pre>
    );
  }

  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return (
      <ValueBox>
        <span className="text-sm font-semibold text-slate-400">
          No answer
        </span>
      </ValueBox>
    );
  }

  return (
    <ValueBox>
      <p className="whitespace-pre-wrap break-words text-sm font-semibold leading-7 text-slate-800">
        {String(value)}
      </p>
    </ValueBox>
  );
}

function ValueBox({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
      {children}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Flow navigation                                                            */
/* -------------------------------------------------------------------------- */

function ResponseFlow({
  projectId,
  surveyId,
}: {
  projectId?: string;
  surveyId?: string;
}) {
  return (
    <nav
      aria-label="Response navigation"
      className="flex items-center overflow-x-auto rounded-2xl border border-slate-200 bg-slate-50 p-1.5"
    >
      <Link
        href="/dashboard/responses"
        className="flex min-w-[150px] flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-400 transition hover:bg-white hover:text-slate-700"
      >
        <FlowNumber number="1" />
        Projects
      </Link>

      <ArrowRight
        size={14}
        className="mx-1 shrink-0 text-slate-300"
      />

      <Link
        href={
          projectId
            ? `/dashboard/responses/${projectId}`
            : "/dashboard/responses"
        }
        className="flex min-w-[150px] flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-400 transition hover:bg-white hover:text-slate-700"
      >
        <FlowNumber number="2" />
        Surveys
      </Link>

      <ArrowRight
        size={14}
        className="mx-1 shrink-0 text-slate-300"
      />

      <Link
        href={
          projectId && surveyId
            ? `/dashboard/responses/${projectId}/${surveyId}`
            : "/dashboard/responses"
        }
        className="flex min-w-[170px] flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-400 transition hover:bg-white hover:text-slate-700"
      >
        <FlowNumber number="3" />
        Survey Responses
      </Link>

      <ArrowRight
        size={14}
        className="mx-1 shrink-0 text-slate-300"
      />

      <div className="flex min-w-[170px] flex-1 items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-xs font-black text-red-700 shadow-sm ring-1 ring-red-100">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-600 text-white">
          <span className="text-[10px] font-black">
            4
          </span>
        </span>
        Response Detail
      </div>
    </nav>
  );
}

function FlowNumber({
  number,
}: {
  number: string;
}) {
  return (
    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-200 text-slate-400">
      <span className="text-[10px] font-black">
        {number}
      </span>
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/* Page                                                                       */
/* -------------------------------------------------------------------------- */

export default function ResponseDetailPage() {
  const router = useRouter();
  const pathname = usePathname();

  const params = useParams<{
    id?: string;
  }>();

  const routeId = params?.id
    ? String(params.id)
    : "";

  const pathnameId = useMemo(() => {
    const parts = (pathname || "")
      .split("/")
      .filter(Boolean);

    const responseIndex =
      parts.indexOf("response");

    if (responseIndex === -1) {
      return "";
    }

    return parts[responseIndex + 1] || "";
  }, [pathname]);

  const id = routeId || pathnameId;

  const [data, setData] =
    useState<ResponseData | null>(null);

  const [survey, setSurvey] =
    useState<Survey | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  async function loadResponse() {
    if (!id) {
      setError("Response ID is missing from the URL.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const responseResult =
        await api<any>(
          endpoints.response(id)
        );

      const responseData =
        normalizeObject(responseResult) as
          | ResponseData
          | null;

      if (!responseData) {
        throw new Error(
          "Unable to read response data."
        );
      }

      setData(responseData);

      if (responseData.survey_id) {
        try {
          const surveyResult =
            await api<any>(
              endpoints.survey(
                String(responseData.survey_id)
              )
            );

          const surveyData =
            normalizeObject(surveyResult);

          if (surveyData) {
            setSurvey({
              ...surveyData,
              fields: Array.isArray(
                surveyData.fields
              )
                ? surveyData.fields
                : Array.isArray(
                    surveyData.survey_fields
                  )
                  ? surveyData.survey_fields
                  : Array.isArray(
                      surveyData.questions
                    )
                    ? surveyData.questions
                    : [],
            });
          } else {
            setSurvey(null);
          }
        } catch (surveyError) {
          console.error(
            "Unable to load survey:",
            surveyError
          );
          setSurvey(null);
        }
      }
    } catch (err) {
      console.error(
        "Response detail loading error:",
        err
      );

      setData(null);
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load response details."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadResponse();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const responseValues =
    getResponseObject(data);

  const mediaEntries =
    useMemo(
      () => getMediaEntries(data),
      [data]
    );

  const questions = useMemo(() => {
    const fields = getFields(survey);

    const known = fields
      .filter((field) => field.field_name)
      .filter((field) =>
        Object.prototype.hasOwnProperty.call(
          responseValues,
          String(field.field_name)
        )
      )
      .map((field) => ({
        key: String(field.field_name),
        field,
        value:
          responseValues[
            String(field.field_name)
          ],
      }));

    const knownKeys = new Set(
      known.map((item) => item.key)
    );

    const extra = Object.entries(
      responseValues
    )
      .filter(
        ([key]) => !knownKeys.has(key)
      )
      .map(([key, value]) => ({
        key,
        value,
        field: {
          field_name: key,
          label: key,
          field_type: "text",
        } as SurveyField,
      }));

    /* Media may exist in media_files while response is {}. */
    const mediaQuestions =
      mediaEntries.map(
        ({ field, file, index }) => {
          const rawType =
            String(
              file?.file_type ||
                file?.type ||
                field ||
                "file"
            ).toLowerCase();

          const type =
            rawType === "image" ||
            rawType === "video" ||
            rawType === "audio"
              ? rawType
              : field === "image" ||
                  field === "video" ||
                  field === "audio"
                ? field
                : "text";

          return {
            key: `__media_${field}_${index}`,
            value: file,
            field: {
              field_name:
                `__media_${field}_${index}`,
              label:
                file?.caption ||
                file?.file_name ||
                `${typeLabel(type)} response`,
              field_type: type,
            } as SurveyField,
          };
        }
      );

    return [
      ...known,
      ...extra,
      ...mediaQuestions,
    ];
  }, [survey, responseValues, mediaEntries]);

  const answeredCount = questions.filter(
    ({ value }) =>
      value !== null &&
      value !== undefined &&
      value !== "" &&
      !(
        Array.isArray(value) &&
        value.length === 0
      )
  ).length;

  const completion = questions.length
    ? Math.round(
        (answeredCount /
          questions.length) *
          100
      )
    : mediaEntries.length
      ? 100
      : 0;

  const location = getLocation(data);

  const status = statusInfo(
    data?.status
  );

  /* ------------------------------------------------------------------------ */
  /* Loading                                                                  */
  /* ------------------------------------------------------------------------ */

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f4f5f7]">
        <div className="mx-auto max-w-[1440px] px-5 py-7 sm:px-7 lg:px-9">
          <div className="animate-pulse">
            <div className="h-4 w-32 rounded bg-slate-200" />

            <div className="mt-7 h-14 w-14 rounded-[18px] bg-slate-200" />

            <div className="mt-5 h-10 w-2/3 rounded bg-slate-200" />

            <div className="mt-3 h-5 w-1/2 rounded bg-slate-200" />

            <div className="mt-7 h-14 rounded-2xl bg-white" />

            <div className="mt-7 grid gap-5 lg:grid-cols-3">
              <div className="h-32 rounded-2xl bg-white" />
              <div className="h-32 rounded-2xl bg-white" />
              <div className="h-32 rounded-2xl bg-white" />
            </div>

            <div className="mt-7 grid gap-5 lg:grid-cols-[1fr_340px]">
              <div className="space-y-4">
                {[1, 2, 3].map(
                  (item) => (
                    <div
                      key={item}
                      className="h-48 rounded-[26px] bg-white"
                    />
                  )
                )}
              </div>

              <div className="h-80 rounded-[26px] bg-white" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ------------------------------------------------------------------------ */
  /* Error                                                                    */
  /* ------------------------------------------------------------------------ */

  if (error || !data) {
    return (
      <div className="min-h-screen bg-[#f4f5f7] text-slate-900">
        <div className="mx-auto flex min-h-screen max-w-3xl items-center justify-center px-5">
          <div className="w-full rounded-[28px] border border-slate-200 bg-white p-7 text-center shadow-[0_10px_35px_rgba(15,23,42,0.06)] sm:p-9">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-red-600">
              <AlertCircle size={28} />
            </div>

            <p className="mt-5 text-[10px] font-black uppercase tracking-[0.2em] text-red-600">
              Response Center
            </p>

            <h1 className="mt-2 text-2xl font-black tracking-tight text-slate-950">
              Unable to load response
            </h1>

            <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-500">
              {error ||
                "The requested response could not be found."}
            </p>

            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <button
                type="button"
                onClick={loadResponse}
                className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-5 py-3 text-xs font-black text-white shadow-lg shadow-red-600/20 transition hover:bg-red-700"
              >
                <RefreshCw size={14} />
                Try again
              </button>

              <Link
                href="/dashboard/responses"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-xs font-black text-slate-700 transition hover:border-red-200 hover:bg-red-50 hover:text-red-700"
              >
                <ArrowLeft size={14} />
                Response Center
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const respondent =
    getRespondentName(data);

  const submittedAt =
    data.submitted_at ||
    data.created_at;

  return (
    <div className="min-h-screen bg-[#f4f5f7] text-slate-900">
      {/* ------------------------------------------------------------------ */}
      {/* Header                                                             */}
      {/* ------------------------------------------------------------------ */}

      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-[1440px] px-5 py-6 sm:px-7 lg:px-9">
          <div className="flex flex-col gap-6">
            {/* Breadcrumb */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <Link
                href="/dashboard/responses"
                className="font-bold text-slate-400 transition hover:text-slate-900"
              >
                Responses
              </Link>

              <ArrowRight
                size={13}
                className="text-slate-300"
              />

              {data.project_id ? (
                <>
                  <Link
                    href={`/dashboard/responses/${data.project_id}`}
                    className="font-bold text-slate-400 transition hover:text-slate-900"
                  >
                    Project
                  </Link>

                  <ArrowRight
                    size={13}
                    className="text-slate-300"
                  />
                </>
              ) : null}

              {data.survey_id ? (
                <>
                  <Link
                    href={
                      data.project_id
                        ? `/dashboard/responses/${data.project_id}/${data.survey_id}`
                        : "/dashboard/responses"
                    }
                    className="max-w-[260px] truncate font-bold text-slate-400 transition hover:text-slate-900"
                  >
                    {survey?.title ||
                      "Survey Responses"}
                  </Link>

                  <ArrowRight
                    size={13}
                    className="text-slate-300"
                  />
                </>
              ) : null}

              <span className="font-black text-slate-900">
                Response Detail
              </span>
            </div>

            {/* Heading */}
            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div className="flex min-w-0 items-start gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[18px] bg-red-600 text-white shadow-lg shadow-red-600/20">
                  <MessageSquare size={24} />
                </div>

                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-red-600">
                      Jansetu
                    </span>

                    <span className="h-1 w-1 rounded-full bg-slate-300" />

                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                      Response Detail
                    </span>

                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-wide ${status.classes}`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${status.dot}`}
                      />
                      {status.label}
                    </span>
                  </div>

                  <h1 className="mt-2 truncate text-3xl font-black tracking-[-0.04em] text-slate-950 sm:text-4xl">
                    {survey?.title ||
                      "Survey Response"}
                  </h1>

                  <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-bold text-slate-400">
                    <span className="inline-flex items-center gap-2">
                      <UserRound
                        size={13}
                        className="text-red-600"
                      />
                      {respondent}
                    </span>

                    <span className="inline-flex items-center gap-2">
                      <Clock3
                        size={13}
                        className="text-red-600"
                      />
                      {formatDateTime(
                        submittedAt
                      )}
                    </span>

                    <span className="font-mono text-[10px]">
                      {String(data.id || id)}
                    </span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={loadResponse}
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-black text-slate-700 transition hover:border-red-200 hover:bg-red-50 hover:text-red-700"
              >
                <RefreshCw size={14} />
                Refresh
              </button>
            </div>

            {/* Flow */}
            <ResponseFlow
              projectId={data.project_id}
              surveyId={data.survey_id}
            />
          </div>
        </div>
      </header>

      {/* ------------------------------------------------------------------ */}
      {/* Main                                                               */}
      {/* ------------------------------------------------------------------ */}

      <main className="mx-auto max-w-[1440px] px-5 py-7 sm:px-7 lg:px-9 lg:py-9">
        {/* Summary */}
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCard
            icon={<FileText size={18} />}
            label="Answers"
            value={answeredCount}
            caption={`${questions.length} recorded questions`}
          />

          <SummaryCard
            icon={<CheckCircle2 size={18} />}
            label="Completion"
            value={`${completion}%`}
            caption="Response completion"
          />

          <SummaryCard
            icon={<UserRound size={18} />}
            label="Respondent"
            value={respondent}
            caption="Submission owner"
            textValue
          />

          <SummaryCard
            icon={<CalendarDays size={18} />}
            label="Submitted"
            value={formatDateTime(
              submittedAt
            )}
            caption="Submission time"
            textValue
          />
        </section>

        <div className="mt-7 grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
          {/* Questions */}
          <section>
            <div className="mb-5 flex items-end justify-between gap-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-red-600">
                  Submission
                </p>

                <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-950">
                  Questions & answers
                </h2>

                <p className="mt-1 text-xs text-slate-400">
                  Complete submitted values for this response.
                </p>
              </div>

              <span className="hidden rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-500 shadow-sm sm:inline-flex">
                {answeredCount} / {questions.length}
              </span>
            </div>

            <div className="space-y-4">
              {questions.map(
                (
                  { key, field, value },
                  index
                ) => {
                  const Icon =
                    typeIcon(
                      field.field_type
                    );

                  const hasAnswer =
                    value !== null &&
                    value !== undefined &&
                    value !== "" &&
                    !(
                      Array.isArray(value) &&
                      value.length === 0
                    );

                  return (
                    <article
                      key={key}
                      className="overflow-hidden rounded-[26px] border border-slate-200 bg-white shadow-[0_8px_30px_rgba(15,23,42,0.045)]"
                    >
                      <div className="bg-slate-50/80 px-5 py-5 sm:px-6">
                        <div className="flex items-start gap-4">
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600">
                            <Icon size={18} />
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                              <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">
                                    Question{" "}
                                    {String(
                                      index + 1
                                    ).padStart(
                                      2,
                                      "0"
                                    )}
                                  </span>

                                  {field.required && (
                                    <span className="rounded-full bg-red-50 px-2 py-0.5 text-[9px] font-black uppercase text-red-600">
                                      Required
                                    </span>
                                  )}
                                </div>

                                <h3 className="mt-1.5 text-[16px] font-black leading-6 text-slate-950">
                                  {field.label ||
                                    field.field_name ||
                                    key}
                                </h3>

                                {field.field_name &&
                                  field.label !==
                                    field.field_name && (
                                    <p className="mt-1 font-mono text-[10px] text-slate-400">
                                      {
                                        field.field_name
                                      }
                                    </p>
                                  )}
                              </div>

                              <div className="flex shrink-0 items-center gap-2">
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-[10px] font-black uppercase tracking-wide text-slate-500 ring-1 ring-slate-200">
                                  <Icon size={11} />
                                  {typeLabel(
                                    field.field_type
                                  )}
                                </span>

                                <span
                                  className={`hidden rounded-full px-3 py-1.5 text-[10px] font-black uppercase tracking-wide sm:inline-flex ${
                                    hasAnswer
                                      ? "bg-emerald-50 text-emerald-700"
                                      : "bg-slate-100 text-slate-400"
                                  }`}
                                >
                                  {hasAnswer
                                    ? "Answered"
                                    : "No answer"}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="border-t border-slate-100 bg-white px-5 py-5 sm:px-6">
                        <div className="mb-3 flex items-center gap-2">
                          <span className="h-1.5 w-1.5 rounded-full bg-red-500" />

                          <p className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">
                            Submitted value
                          </p>
                        </div>

                        <AnswerValue
                          value={value}
                          field={field}
                        />

                        {field.help_text && (
                          <div className="mt-4 flex gap-2 rounded-xl border border-slate-100 bg-slate-50 px-3.5 py-3 text-xs leading-5 text-slate-500">
                            <Info
                              size={14}
                              className="mt-0.5 shrink-0 text-slate-400"
                            />
                            <span>
                              {field.help_text}
                            </span>
                          </div>
                        )}
                      </div>
                    </article>
                  );
                }
              )}

              {!questions.length && (
                <div className="rounded-[26px] border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-300">
                    <FileText size={27} />
                  </div>

                  <h3 className="mt-4 text-base font-black text-slate-800">
                    No answer fields
                  </h3>

                  <p className="mt-1 text-sm text-slate-400">
                    This response does not contain
                    structured answer fields.
                  </p>
                </div>
              )}
            </div>
          </section>

          {/* Sidebar */}
          <aside className="space-y-4 xl:sticky xl:top-6 xl:self-start">
            {/* Response overview */}
            <section className="overflow-hidden rounded-[26px] border border-slate-200 bg-white shadow-[0_8px_30px_rgba(15,23,42,0.045)]">
              <div className="bg-slate-950 p-5 text-white">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10">
                    <ClipboardList size={19} />
                  </div>

                  <div className="min-w-0">
                    <p className="text-[9px] font-black uppercase tracking-[0.16em] text-white/45">
                      Response
                    </p>

                    <h2 className="truncate text-sm font-black">
                      Submission overview
                    </h2>
                  </div>
                </div>
              </div>

              <div className="space-y-2 p-4">
                <InfoRow
                  label="Survey"
                  value={
                    survey?.title ||
                    "Survey"
                  }
                />

                <InfoRow
                  label="Response ID"
                  value={String(
                    data.id || id
                  )}
                  mono
                />

                <InfoRow
                  label="Respondent"
                  value={respondent}
                />

                <InfoRow
                  label="Submitted"
                  value={formatDateTime(
                    submittedAt
                  )}
                />

                <InfoRow
                  label="Status"
                  value={status.label}
                />
              </div>
            </section>

            {/* Completion */}
            <section className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-[0_8px_30px_rgba(15,23,42,0.045)]">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">
                    Completion
                  </p>

                  <p className="mt-1 text-2xl font-black tracking-tight text-slate-950">
                    {completion}%
                  </p>
                </div>

                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-xs font-black text-red-600">
                  {answeredCount}/
                  {questions.length}
                </div>
              </div>

              <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-red-600 transition-all"
                  style={{
                    width: `${completion}%`,
                  }}
                />
              </div>
            </section>

            {/* Location */}
            {(location.latitude !== null ||
              location.longitude !== null ||
              location.name ||
              location.address) && (
              <section className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-[0_8px_30px_rgba(15,23,42,0.045)]">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-red-600">
                    <MapPin size={17} />
                  </div>

                  <div>
                    <h2 className="text-sm font-black text-slate-900">
                      Location
                    </h2>

                    <p className="text-[10px] text-slate-400">
                      Captured with submission
                    </p>
                  </div>
                </div>

                <div className="mt-4 space-y-2">
                  {location.name && (
                    <InfoRow
                      label="Location name"
                      value={String(
                        location.name
                      )}
                    />
                  )}

                  {location.address && (
                    <InfoRow
                      label="Address"
                      value={String(
                        location.address
                      )}
                    />
                  )}

                  {location.latitude !==
                    null &&
                    location.longitude !==
                      null && (
                      <InfoRow
                        label="Coordinates"
                        value={`${location.latitude}, ${location.longitude}`}
                        mono
                      />
                    )}
                </div>

                {location.latitude !==
                  null &&
                  location.longitude !==
                    null && (
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${location.latitude},${location.longitude}`}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-3 flex items-center justify-center gap-2 rounded-xl bg-slate-50 px-4 py-2.5 text-xs font-black text-slate-600 transition hover:bg-red-50 hover:text-red-700"
                    >
                      <MapPin size={13} />
                      Open location
                    </a>
                  )}
              </section>
            )}

            {/* Media */}
            {!!mediaEntries.length && (
              <section className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-[0_8px_30px_rgba(15,23,42,0.045)]">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-red-600">
                    <FileImage size={17} />
                  </div>

                  <div>
                    <h2 className="text-sm font-black text-slate-900">
                      Media
                    </h2>

                    <p className="text-[10px] text-slate-400">
                      {mediaEntries.length} uploaded{" "}
                      {mediaEntries.length === 1
                        ? "file"
                        : "files"}
                    </p>
                  </div>
                </div>

                <div className="mt-4 space-y-2">
                  {mediaEntries.map(
                    ({
                      field,
                      file,
                      index,
                    }) => {
                      const kind =
                        String(
                          file?.file_type ||
                            file?.type ||
                            field ||
                            "file"
                        ).toLowerCase();

                      const Icon =
                        kind === "audio"
                          ? FileAudio
                          : kind === "video"
                            ? FileVideo
                            : FileImage;

                      const url =
                        typeof file ===
                        "string"
                          ? file
                          : file?.file_url ||
                            file?.url ||
                            file?.fileUrl ||
                            "";

                      return (
                        <a
                          key={`${field}-${index}`}
                          href={
                            url || undefined
                          }
                          target="_blank"
                          rel="noreferrer"
                          className="group flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50/80 p-3 transition hover:border-red-100 hover:bg-red-50/40"
                        >
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white ring-1 ring-slate-200">
                            <Icon
                              size={15}
                              className="text-red-600"
                            />
                          </div>

                          <div className="min-w-0 flex-1">
                            <p className="truncate text-xs font-black text-slate-700">
                              {file?.file_name ||
                                file?.name ||
                                "Uploaded file"}
                            </p>

                            <p className="mt-0.5 truncate text-[10px] text-slate-400">
                              {field} · {kind}
                            </p>
                          </div>

                          {url && (
                            <span className="text-slate-300 transition group-hover:text-red-500">
                              ↗
                            </span>
                          )}
                        </a>
                      );
                    }
                  )}
                </div>
              </section>
            )}

            {/* Voters */}
            {!!data.voters?.length && (
              <section className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-[0_8px_30px_rgba(15,23,42,0.045)]">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-red-600">
                      <Users size={17} />
                    </div>

                    <div>
                      <h2 className="text-sm font-black text-slate-900">
                        Voters
                      </h2>

                      <p className="text-[10px] text-slate-400">
                        Linked to response
                      </p>
                    </div>
                  </div>

                  <span className="rounded-full bg-red-50 px-2.5 py-1 text-[10px] font-black text-red-700">
                    {data.voters.length}
                  </span>
                </div>

                <div className="mt-4 space-y-2">
                  {data.voters.map(
                    (v: any, index) => (
                      <div
                        key={index}
                        className="rounded-2xl border border-slate-100 bg-slate-50 p-3"
                      >
                        <div className="flex items-center gap-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white ring-1 ring-slate-200">
                            <UserRound
                              size={14}
                              className="text-slate-400"
                            />
                          </div>

                          <p className="text-xs font-black text-slate-700">
                            {v?.voter_name ||
                              "Unnamed voter"}
                          </p>
                        </div>

                        {v?.voter_id && (
                          <p className="mt-2 break-all pl-10 font-mono text-[10px] text-slate-400">
                            {v.voter_id}
                          </p>
                        )}
                      </div>
                    )
                  )}
                </div>
              </section>
            )}
          </aside>
        </div>
      </main>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Small UI components                                                        */
/* -------------------------------------------------------------------------- */

function SummaryCard({
  icon,
  label,
  value,
  caption,
  textValue = false,
}: {
  icon: ReactNode;
  label: string;
  value: string | number;
  caption: string;
  textValue?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_5px_20px_rgba(15,23,42,0.035)]">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
        {icon}
      </div>

      <p className="mt-4 text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">
        {label}
      </p>

      <p
        className={`mt-1 truncate font-black tracking-tight text-slate-900 ${
          textValue
            ? "text-base"
            : "text-2xl"
        }`}
        title={String(value)}
      >
        {value}
      </p>

      <p className="mt-1 text-xs text-slate-400">
        {caption}
      </p>
    </div>
  );
}

function InfoRow({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="rounded-xl bg-slate-50 p-3">
      <p className="text-[9px] font-black uppercase tracking-[0.13em] text-slate-400">
        {label}
      </p>

      <p
        className={`mt-1 break-all text-xs font-bold text-slate-700 ${
          mono ? "font-mono" : ""
        }`}
      >
        {value}
      </p>
    </div>
  );
}
