export function resolveOpenAIApiKey(env: NodeJS.ProcessEnv = process.env) {
  return env.ALGONOTE_OPENAI_API_KEY?.trim() || env.OPENAI_API_KEY?.trim() || undefined;
}

export const REASONING_EFFORTS = ["low", "medium", "high", "xhigh", "max", "ultra"] as const;
export type ReasoningEffort = (typeof REASONING_EFFORTS)[number];

const PUBLIC_REASONING_EFFORTS: ReasoningEffort[] = ["low", "medium", "high", "xhigh", "max"];

function isReasoningEffort(value: string): value is ReasoningEffort {
  return (REASONING_EFFORTS as readonly string[]).includes(value);
}

export function resolveReasoningConfig(env: NodeJS.ProcessEnv = process.env) {
  const configured = env.OPENAI_REASONING_EFFORTS
    ?.split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(isReasoningEffort);
  const supportedEfforts = configured?.length
    ? [...new Set(configured)]
    : [...PUBLIC_REASONING_EFFORTS];
  const configuredDefault = env.OPENAI_REASONING_DEFAULT?.trim().toLowerCase() || "";
  const defaultEffort = isReasoningEffort(configuredDefault) && supportedEfforts.includes(configuredDefault)
    ? configuredDefault
    : supportedEfforts.includes("medium")
      ? "medium"
      : supportedEfforts[0] ?? "medium";

  return { supportedEfforts, defaultEffort } as const;
}
