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

  const anonymousId = crypto.randomUUID();

  const supabase = await createClient();

  const { data: session, error: sessionError } = await supabase
    .from("sessions")
    .insert({
      anonymous_id: anonymousId,
      user_id: null,
      raw_idea: parsed.data.rawIdea,
      current_step: 1,
      status: "active",
    })
    .select("id")
    .single();

  if (sessionError || !session) {
    return {
      error: "Impossible de créer la session. Veuillez réessayer.",
    };
  }

  const { error: prdError } = await supabase.from("prds").insert({
    session_id: session.id,
    user_id: null,
    title: "",
    is_public: false,
  });

  if (prdError) {
    console.error("PRD creation failed:", prdError);
  }

  const cookieStore = await cookies();
  cookieStore.set("enhanced_anon_id", anonymousId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });

  redirect(`/session/${session.id}`);
}
