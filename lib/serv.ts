import OpenAI from "openai";

export const SERV_MODEL = process.env.SERV_MODEL || "gpt-5.4-mini";

let client: OpenAI | null = null;
function serv(): OpenAI {
  if (!process.env.SERV_API_KEY) throw new Error("SERV_API_KEY is not configured");
  client ??= new OpenAI({
    baseURL: "https://inference-api.openserv.ai/v1",
    apiKey: process.env.SERV_API_KEY,
  });
  return client;
}

/** Call SERV Reasoning with a strict JSON schema and return the parsed object. */
export async function servJSON<T>(name: string, schema: Record<string, unknown>, system: string, user: string): Promise<T> {
  const res = await serv().chat.completions.create({
    model: SERV_MODEL,
    response_format: { type: "json_schema", json_schema: { name, strict: true, schema } },
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
  });
  const text = res.choices[0]?.message?.content ?? "";
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error("SERV Reasoning returned invalid JSON");
  }
}

const str = { type: "string" };
const obj = (properties: Record<string, unknown>) => ({
  type: "object",
  additionalProperties: false,
  required: Object.keys(properties),
  properties,
});

export const FIX_SCHEMA = obj({
  errors: { type: "array", items: obj({ machine: str, problem: str, fix: str }) },
  fixed: obj({ title: str, description: str, tags: { type: "array", items: str } }),
});

export const RULES_SCHEMA = obj({
  rules: { type: "array", items: obj({ text: str, sourceEvalId: str }) },
});
