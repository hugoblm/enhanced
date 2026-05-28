import { z } from "zod";

export const rawIdeaSchema = z.object({
  rawIdea: z
    .string()
    .trim()
    .min(20, {
      message:
        "Votre idée doit contenir au moins 20 caractères pour que l'IA puisse travailler dessus.",
    })
    .max(5000, {
      message: "L'idée ne doit pas dépasser 5 000 caractères.",
    }),
});

export type RawIdeaInput = z.infer<typeof rawIdeaSchema>;
