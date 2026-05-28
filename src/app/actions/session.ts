"use server";

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { rawIdeaSchema } from "@/lib/schemas/session";

export async function createSession(formData: FormData) {
  const rawIdea = formData.get("rawIdea");

  const parsed = rawIdeaSchema.safeParse({ rawIdea });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  // Pre-generate IDs so we don't need .select() after insert. The SELECT
  // RLS policy can't see anon-owned rows (no JWT claim to match against),
  // so any insert().select() would 42501 on the RETURNING clause even
  // though the INSERT itself succeeds.
  const sessionId = crypto.randomUUID();
  const anonymousId = crypto.randomUUID();

  const supabase = await createClient();

  const { error: sessionError } = await supabase.from("sessions").insert({
    id: sessionId,
    anonymous_id: anonymousId,
    user_id: null,
    raw_idea: parsed.data.rawIdea,
    current_step: 1,
    status: "active",
  });

  if (sessionError) {
    console.error("[createSession] sessions.insert failed:", sessionError);
    return {
      error: "Impossible de créer la session. Veuillez réessayer.",
    };
  }

  const { error: prdError } = await supabase.from("prds").insert({
    session_id: sessionId,
    user_id: null,
    title: "",
    is_public: false,
  });

  if (prdError) {
    console.error("[createSession] prds.insert failed:", prdError);
  }

  const cookieStore = await cookies();
  cookieStore.set("enhanced_anon_id", anonymousId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });

  redirect(`/session/${sessionId}`);
}
