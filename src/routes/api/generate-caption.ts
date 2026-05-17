import { createFileRoute } from "@tanstack/react-router";
import "@tanstack/react-start";

const SYSTEM_PROMPT = `You write cute, funny captions for cat photos, spoken by the cat in proper English.

Rules:
- Look at the cat photo and react to what you actually see (pose, expression, surroundings).
- First person, FROM THE CAT.
- 5 to 20 words. One or two sentences.
- Use correct spelling and grammar. NO LOLCatz speak (no "iz", "ur", "haz", "cheezburger", "kthxbai", etc.).
- Voice: charming, witty, slightly dramatic or aloof — like a cat with a rich inner life.
- PG-rated. No slurs, no NSFW, no politics.
- Output ONLY the caption text. No quotes, no preface, no explanation, no emojis.`;

export const Route = createFileRoute("/api/generate-caption")({
  server: {
    handlers: {
      POST: async ({ request }: { request: Request }) => {
        let imageUrl: string;
        try {
          const body = (await request.json()) as { imageUrl?: unknown };
          if (typeof body.imageUrl !== "string" || !/^https?:\/\//.test(body.imageUrl)) {
            return new Response("imageUrl required", { status: 400 });
          }
          imageUrl = body.imageUrl;
        } catch {
          return new Response("Invalid JSON", { status: 400 });
        }

        const key = process.env.LOVABLE_API_KEY;
        if (!key) return new Response("Missing LOVABLE_API_KEY", { status: 500 });

        const upstream = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${key}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-3-flash-preview",
            messages: [
              { role: "system", content: SYSTEM_PROMPT },
              {
                role: "user",
                content: [
                  { type: "text", text: "Write a LOLCatz caption for this cat:" },
                  { type: "image_url", image_url: { url: imageUrl } },
                ],
              },
            ],
          }),
        });

        if (upstream.status === 429)
          return Response.json({ error: "Rate limit, try again soon." }, { status: 429 });
        if (upstream.status === 402)
          return Response.json({ error: "AI credits exhausted." }, { status: 402 });
        if (!upstream.ok) {
          const text = await upstream.text();
          console.error("AI gateway error", upstream.status, text);
          return Response.json({ error: "Caption generation failed." }, { status: 500 });
        }

        const data = (await upstream.json()) as {
          choices?: Array<{ message?: { content?: string } }>;
        };
        const caption = data.choices?.[0]?.message?.content?.trim().replace(/^["']|["']$/g, "");
        if (!caption) return Response.json({ error: "Empty caption." }, { status: 500 });

        return Response.json({ caption });
      },
    },
  },
});
