import Anthropic from "@anthropic-ai/sdk";
import { MARLOW_SYSTEM, demoAnswer } from "@/lib/marlow-prompt";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MODEL = "claude-opus-5";

type Incoming = {
  messages: { role: "user" | "assistant"; text: string }[];
  context: string;
};

const configured = () =>
  Boolean(process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN);

/** the Ask screen calls this once, so it can say when replies are scripted */
export function GET() {
  return Response.json({ live: configured() });
}

export async function POST(req: Request) {
  let body: Incoming;
  try {
    body = (await req.json()) as Incoming;
  } catch {
    return new Response("Could not read that request.", { status: 400 });
  }

  const messages = (body.messages ?? []).filter((m) => m.text?.trim());
  if (!messages.length) {
    return new Response("Nothing to answer.", { status: 400 });
  }

  if (!configured()) {
    return demoStream(demoAnswer(messages[messages.length - 1].text));
  }

  const client = new Anthropic();

  try {
    const stream = client.beta.messages.stream({
      model: MODEL,
      max_tokens: 2000,
      // Conversational Q&A: adaptive thinking keeps the answers careful,
      // low effort keeps the first token quick enough to feel like chat.
      thinking: { type: "adaptive" },
      output_config: { effort: "low" },
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      system: [
        { type: "text", text: MARLOW_SYSTEM, cache_control: { type: "ephemeral" } },
        { type: "text", text: `What she has logged:\n\n${body.context ?? "Nothing yet."}` },
      ],
      messages: messages.map((m) => ({ role: m.role, content: m.text })),
    });

    const encoder = new TextEncoder();
    const out = new ReadableStream<Uint8Array>({
      async start(controller) {
        let emitted = false;
        const say = (text: string) => {
          controller.enqueue(encoder.encode(emitted ? `\n\n${text}` : text));
          emitted = true;
        };

        try {
          for await (const event of stream) {
            if (
              event.type === "content_block_delta" &&
              event.delta.type === "text_delta"
            ) {
              controller.enqueue(encoder.encode(event.delta.text));
              emitted = true;
            }
          }
          const final = await stream.finalMessage();
          if (final.stop_reason === "refusal") {
            say(
              "I can’t help with that one. If it’s urgent, or it’s about your safety, please contact your doctor or emergency services now."
            );
          }
        } catch (error) {
          // The SDK surfaces failures while the stream is consumed, not when
          // it is created — so the typed handling has to live in here.
          if (error instanceof Anthropic.AuthenticationError) {
            say(
              "That API key isn’t being accepted, so I can’t answer properly. Check ANTHROPIC_API_KEY and restart the app."
            );
          } else if (error instanceof Anthropic.RateLimitError) {
            say("I’m rate limited just now. Give it a minute and ask me again.");
          } else if (error instanceof Anthropic.APIConnectionError) {
            say("I couldn’t reach my end just then. Check the connection and try again.");
          } else {
            say("Something went wrong reaching me just then. Try again in a moment.");
          }
        } finally {
          controller.close();
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
  } catch (error) {
    if (error instanceof Anthropic.AuthenticationError) {
      return demoStream(
        "That API key isn’t being accepted, so I’m answering from the scripted set. Check ANTHROPIC_API_KEY and restart."
      );
    }
    if (error instanceof Anthropic.RateLimitError) {
      return demoStream("I’m rate limited just now. Give it a minute and ask me again.");
    }
    return demoStream("Something went wrong reaching me just then. Try again in a moment.");
  }
}

/** streams a fixed string in small pieces, so the UI behaves identically */
function demoStream(text: string) {
  const encoder = new TextEncoder();
  const words = text.split(" ");
  const out = new ReadableStream<Uint8Array>({
    async start(controller) {
      for (let i = 0; i < words.length; i++) {
        controller.enqueue(encoder.encode(i === 0 ? words[i] : ` ${words[i]}`));
        await new Promise((r) => setTimeout(r, 26));
      }
      controller.close();
    },
  });
  return new Response(out, {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "no-store",
      "x-marlow-mode": "demo",
    },
  });
}
