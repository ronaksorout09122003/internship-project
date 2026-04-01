import type { Session, SessionDifficulty, SessionLanguage } from "@/types/session";

export const SESSION_LANGUAGE_OPTIONS: Array<{
  value: SessionLanguage;
  label: string;
  monaco: string;
}> = [
  { value: "TYPESCRIPT", label: "TypeScript", monaco: "typescript" },
  { value: "JAVASCRIPT", label: "JavaScript", monaco: "javascript" },
  { value: "PYTHON", label: "Python", monaco: "python" },
  { value: "JAVA", label: "Java", monaco: "java" },
  { value: "CPP", label: "C++", monaco: "cpp" },
  { value: "GO", label: "Go", monaco: "go" }
];

export const SESSION_DIFFICULTY_OPTIONS: Array<{
  value: SessionDifficulty;
  label: string;
  helper: string;
}> = [
  { value: "FOUNDATION", label: "Foundation", helper: "Guided basics and first-principles walkthrough." },
  { value: "INTERMEDIATE", label: "Intermediate", helper: "Applied coding, debugging, and structured practice." },
  { value: "ADVANCED", label: "Advanced", helper: "Interview pressure, architecture judgment, and edge cases." }
];

export const SESSION_TEMPLATE_OPTIONS = [
  {
    value: "PAIR_PROGRAMMING",
    label: "Pair programming",
    description: "Open-ended live coding with room for collaboration."
  },
  {
    value: "ALGORITHM_DRILL",
    label: "Algorithm drill",
    description: "Problem solving, data structures, and clean communication."
  },
  {
    value: "DEBUG_REVIEW",
    label: "Debug review",
    description: "Trace failures, isolate bugs, and explain tradeoffs."
  },
  {
    value: "API_DESIGN",
    label: "API design",
    description: "Model inputs, outputs, contracts, and backend thinking."
  }
];

export function getLanguageLabel(language: SessionLanguage) {
  return SESSION_LANGUAGE_OPTIONS.find((option) => option.value === language)?.label ?? language;
}

export function getLanguageMonacoValue(language: SessionLanguage) {
  return SESSION_LANGUAGE_OPTIONS.find((option) => option.value === language)?.monaco ?? "typescript";
}

export function getDifficultyLabel(difficulty: SessionDifficulty) {
  return SESSION_DIFFICULTY_OPTIONS.find((option) => option.value === difficulty)?.label ?? difficulty;
}

export function getTemplateLabel(templateKey: string) {
  return (
    SESSION_TEMPLATE_OPTIONS.find((option) => option.value === templateKey)?.label ??
    templateKey.replaceAll("_", " ").toLowerCase()
  );
}

export function buildStarterCode(input: {
  topic: string;
  language: SessionLanguage;
  templateKey: string;
}) {
  const topic = input.topic.trim() || "Mentoring session";
  const track = getTemplateLabel(input.templateKey);

  switch (input.language) {
    case "JAVASCRIPT":
      return `/**\n * Topic: ${topic}\n * Track: ${track}\n */\nfunction runSession(input) {\n  return input;\n}\n\nconsole.log(runSession("ready"));\n`;
    case "PYTHON":
      return `"""\nTopic: ${topic}\nTrack: ${track}\n"""\n\ndef run_session(data):\n    return data\n\nprint(run_session("ready"))\n`;
    case "JAVA":
      return `/**\n * Topic: ${topic}\n * Track: ${track}\n */\npublic class SessionStarter {\n    public static String runSession(String input) {\n        return input;\n    }\n\n    public static void main(String[] args) {\n        System.out.println(runSession("ready"));\n    }\n}\n`;
    case "CPP":
      return `#include <iostream>\n#include <string>\n\n// Topic: ${topic}\n// Track: ${track}\nstd::string runSession(const std::string& input) {\n    return input;\n}\n\nint main() {\n    std::cout << runSession("ready") << std::endl;\n    return 0;\n}\n`;
    case "GO":
      return `package main\n\nimport "fmt"\n\n// Topic: ${topic}\n// Track: ${track}\nfunc runSession(input string) string {\n\treturn input\n}\n\nfunc main() {\n\tfmt.Println(runSession("ready"))\n}\n`;
    case "TYPESCRIPT":
    default:
      return `/**\n * Topic: ${topic}\n * Track: ${track}\n */\nfunction runSession(input: string): string {\n  return input;\n}\n\nconsole.log(runSession("ready"));\n`;
  }
}

export function buildInviteClipboardText(session: Session) {
  return [
    `Session: ${session.topic}`,
    `Code: ${session.sessionCode}`,
    session.scheduledAt ? `Scheduled: ${new Date(session.scheduledAt).toLocaleString()}` : null,
    typeof window !== "undefined" ? window.location.href : null
  ]
    .filter(Boolean)
    .join("\n");
}

export function downloadSessionCalendar(session: Session) {
  if (!session.scheduledAt || typeof window === "undefined") {
    return false;
  }

  const startsAt = new Date(session.scheduledAt);
  const endsAt = new Date(startsAt.getTime() + session.durationMinutes * 60_000);
  const formatIcsDate = (value: Date) =>
    value.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");

  const body = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Mentora//Session Planner//EN",
    "BEGIN:VEVENT",
    `UID:${session.id}@mentora.local`,
    `DTSTAMP:${formatIcsDate(new Date())}`,
    `DTSTART:${formatIcsDate(startsAt)}`,
    `DTEND:${formatIcsDate(endsAt)}`,
    `SUMMARY:${session.topic}`,
    `DESCRIPTION:${(session.agenda ?? "Live mentoring session").replace(/\n/g, "\\n")}`,
    "END:VEVENT",
    "END:VCALENDAR"
  ].join("\r\n");

  const blob = new Blob([body], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${session.topic.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "mentora-session"}.ics`;
  link.click();
  URL.revokeObjectURL(url);
  return true;
}
