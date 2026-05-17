import { createFileRoute } from "@tanstack/react-router";
import "@tanstack/react-start";

export const Route = createFileRoute("/api/cat-image")({
  server: {
    handlers: {
      GET: async ({ request }: { request: Request }) => {
        const url = new URL(request.url).searchParams.get("url");
        if (!url || !/^https?:\/\/[^/]*thecatapi\.com\//.test(url)) {
          return new Response("invalid url", { status: 400 });
        }
        const upstream = await fetch(url);
        if (!upstream.ok) return new Response("upstream failed", { status: 502 });
        const buf = await upstream.arrayBuffer();
        return new Response(buf, {
          status: 200,
          headers: {
            "Content-Type": upstream.headers.get("content-type") ?? "image/jpeg",
            "Cache-Control": "public, max-age=86400",
            "Access-Control-Allow-Origin": "*",
          },
        });
      },
    },
  },
});
