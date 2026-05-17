import { cn } from "@/lib/utils";

type Props = {
  imageUrl: string;
  caption: string;
  loading?: boolean;
};

export function CatCard({ imageUrl, caption, loading }: Props) {
  return (
    <div className={cn("w-full transition-opacity", loading && "opacity-60")}>
      <div
        className="relative aspect-square w-full overflow-hidden rounded-3xl bg-card shadow-[0_20px_60px_-15px_var(--shadow-color)] ring-1 ring-border"
        style={{ ["--shadow-color" as string]: "oklch(0.7 0.18 320 / 0.45)" }}
      >
        {imageUrl ? (
          <img
            src={imageUrl}
            alt="A funny cat"
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 animate-pulse bg-muted" />
        )}
      </div>

      {caption && (
        <p className="meme-caption mt-4 text-center text-3xl uppercase leading-tight sm:text-4xl md:text-5xl">
          {caption}
        </p>
      )}
    </div>
  );
}
