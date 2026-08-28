import Anthropic from "@anthropic-ai/sdk";
import { anthropicConfigured } from "@/lib/env";
import { supabaseServer } from "@/lib/supabase/server";
import { getDays, getInterventions, getProfile } from "@/lib/data/history";
import { getInsights } from "@/lib/data/insights";
import { buildSummary } from "@/lib/summary";
import { MARLOW_SYSTEM } from "@/lib/marlow-prompt";
import { CRISIS_REPLY, isCrisis } from "@/lib/safety";
import { todayIn } from "@/lib/day";
import { logEvent } from "@/lib/events";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MODEL = "claude-opus-5";
/** generous, but finite — per user per local day */
const DAILY_LIMIT = 40;

export async function POST(req: Request) {
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new Response("Not signed in.", { status: 401 });

  const profile = await getProfile();
  if (!profile?.onboarded_at) return new Response("Finish setting up first.", { status: 400 });

  let question = "";
  try {
    const body = (await req.json()) as { message?: string };
    question = (body.message ?? "").trim().slice(0, 2000);
  } catch {
    return new Response("Could not read that request.", { status: 400 });
  }
  if (!question) return new Response("Nothing to answer.", { status: 400 });

  const today = todayIn(profile.timezone);

  // ── rate limit ────────────────────────────────────────────────────────────
  const since = new Date(`${today}T00:00:00Z`);
  since.setUTCDate(since.getUTCDate() - 1); // generous edge, timezone-agnostic
  const { count } = await supabase
    .from("chat_messages")
    .select("id", { count: "exact", head: true })
    .eq("role", "user")
    .gte("created_at", since.toISOString());

  if ((count ?? 0) >= DAILY_LIMIT) {
    return stream(
      "That’s a lot of questions in one day, and I’d rather not keep going on autopilot. I’ll be here tomorrow — and anything urgent belongs with your doctor, not with me.",
      "limited"
    );
  }

  await supabase.from("chat_messages").insert({ user_id: user.id, role: "user", content: question });
  await logEvent("chat_message_sent", { length: question.length });

  // ── the one thing we never leave to a generation ──────────────────────────
  if (isCrisis(question)) {
    await supabase
      .from("chat_messages")
      .insert({ user_id: user.id, role: "assistant", content: CRISIS_REPLY });
    return stream(CRISIS_REPLY, "safeguard");
  }

  if (!anthropicConfigured()) {
    const text =
      "I can’t answer properly right now — Marlow isn’t connected to its language model. Your check-ins are still saving normally.";
    await supabase.from("chat_messages").insert({ user_id: user.id, role: "assistant", content: text });
    return stream(text, "unconfigured");
  }

  // ── the grounded summary, built here, never sent from the browser ─────────
  const [days, interventions, insights] = await Promise.all([
    getDays(profile),
    getInterventions(),
    getInsights(8),
  ]);
  const summary = buildSummary({ profile, days, interventions }, insights, today);

  const { data: priorRows } = await supabase
    .from("chat_messages")
    .select("role, content")
    .order("created_at", { ascending: false })
    .limit(21);

  const prior = ((priorRows as { role: "user" | "assistant"; content: string }[] | null) ?? [])
    .reverse()
    .filter((m) => m.content.trim());

  const client = new Anthropic();

  const anthropicStream = client.beta.messages.stream({
    model: MODEL,
    max_tokens: 1500,
    // Conversational Q&A: adaptive thinking keeps the answers careful, low
    // effort keeps the first token quick enough to feel like chat.
    thinking: { type: "adaptive" },
    output_config: { effort: "low" },
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    system: [
      { type: "text", text: MARLOW_SYSTEM, cache_control: { type: "ephemeral" } },
      { type: "text", text: `What she has logged:\n\n${summary}` },
    ],
    messages: prior.map((m) => ({ role: m.role, content: m.content })),
  });

  const encoder = new TextEncoder();
  let answer = "";

  const out = new ReadableStream<Uint8Array>({
    async start(controller) {
      let emitted = false;
      const say = (text: string) => {
        answer += emitted ? `\n\n${text}` : text;
        controller.enqueue(encoder.encode(emitted ? `\n\n${text}` : text));
        emitted = true;
      };

      try {
        for await (const event of anthropicStream) {
          if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
            answer += event.delta.text;
            controller.enqueue(encoder.encode(event.delta.text));
            emitted = true;
          }
        }
        const final = await anthropicStream.finalMessage();
        if (final.stop_reason === "refusal") {
          say(
            "I can’t help with that one. If it’s urgent, or it’s about your safety, please contact your doctor or emergency services now."
          );
        }
      } catch (error) {
        // The SDK surfaces failures while the stream is consumed, not when it
        // is created, so the typed handling has to live in here.
        if (error instanceof Anthropic.RateLimitError) {
          say("I’m rate limited just now. Give it a minute and ask me again.");
        } else if (error instanceof Anthropic.AuthenticationError) {
          say("I can’t reach my language model — the API key isn’t being accepted.");
        } else if (error instanceof Anthropic.APIConnectionError) {
          say("I couldn’t reach my end just then. Check your connection and try again.");
        } else {
          say("Something went wrong reaching me just then. Try again in a moment.");
        }
      } finally {
        controller.close();
        if (answer.trim()) {
          await supabase
            .from("chat_messages")
            .insert({ user_id: user.id, role: "assistant", content: answer.trim() });
        }
      }
    },
  });

  return new Response(out, {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "no-store",
      "x-marlow-mode": "live",
    },
  });
}

/** streams a fixed string in small pieces, so the UI behaves identically */
function stream(text: string, mode: string) {
  const encoder = new TextEncoder();
  const words = text.split(" ");
  return new Response(
    new ReadableStream<Uint8Array>({
      async start(controller) {
        for (let i = 0; i < words.length; i++) {
          controller.enqueue(encoder.encode(i === 0 ? words[i] : ` ${words[i]}`));
          await new Promise((r) => setTimeout(r, 22));
        }
        controller.close();
      },
    }),
    {
      headers: {
        "content-type": "text/plain; charset=utf-8",
        "cache-control": "no-store",
        "x-marlow-mode": mode,
      },
    }
  );
}
