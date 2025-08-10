import { generateObject, tool } from "ai";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { z } from "zod";

const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
});

const Category = z.enum([
  "Hate speech",
  "Violence",
  "Sexual content",
  "Spam",
  "Harassment and bullying",
  "Self-harm or suicide encouragement",
  "Illegal activities",
  "Misinformation / fake news",
  "Terrorism-related content",
  "Hate symbols and extremist content",
]);

const guardResultSchema = z.object({
  status: z
    .enum(["safe", "unsafe"])
    .describe("Return 'unsafe' if any category applies; otherwise 'safe'."),
  categories: z
    .array(Category)
    .default([])
    .describe(
      "List only categories that apply. If status is 'safe', this must be an empty array."
    ),
});

export const guardAgent = async (
  inputText: string
): Promise<z.infer<typeof guardResultSchema>> => {
  const { object } = await generateObject({
    model: openrouter("openai/gpt-oss-20b:free"),
    schema: guardResultSchema,
    system:
      "You are a strict content safety classifier. Classify text as 'safe' or 'unsafe' and list applicable categories. Output must strictly follow the provided JSON schema.",
    prompt:
      "Classify the following text for harmful categories. If none apply, return status 'safe' and an empty categories array. If any apply, return status 'unsafe' and include every applicable category from the allowed list.\n\n" +
      "Allowed categories (English): Hate speech; Violence; Sexual content; Spam; Harassment and bullying; Self-harm or suicide encouragement; Illegal activities; Misinformation / fake news; Terrorism-related content; Hate symbols and extremist content.\n\n" +
      "Text:\n\n" +
      `"""${inputText}"""`,
  });

  return object;
};
