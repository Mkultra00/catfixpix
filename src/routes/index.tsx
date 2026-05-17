import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { Download, Heart, RefreshCw, Share2, Sparkles, Trash2 } from "lucide-react";
import { CatCard } from "@/components/CatCard";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { getFavorites, removeFavorite, saveFavorite, type Favorite } from "@/lib/favorites";
import { renderMemePng } from "@/lib/export-png";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  component: Index,
});

type CatPair = { imageUrl: string; caption: string };

async function fetchCatImage(): Promise<string> {
  const res = await fetch("https://api.thecatapi.com/v1/images/search?size=med");
  if (!res.ok) throw new Error("Cat API failed");
  const data = (await res.json()) as Array<{ url: string }>;
  if (!data[0]?.url) throw new Error("No cat returned");
  return data[0].url;
}

async function fetchCaption(imageUrl: string): Promise<string> {
  const res = await fetch("/api/generate-caption", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ imageUrl }),
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error ?? "Caption failed");
  }
  const data = (await res.json()) as { caption: string };
  return data.caption;
}

function Index() {
  const [pair, setPair] = useState<CatPair | null>(null);
  const [loading, setLoading] = useState(true);
  const [favs, setFavs] = useState<Favorite[]>([]);

  useEffect(() => {
    setFavs(getFavorites());
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const imageUrl = await fetchCatImage();
      // show image immediately; caption resolves shortly after
      setPair({ imageUrl, caption: "" });
      const caption = await fetchCaption(imageUrl);
      setPair({ imageUrl, caption });
    } catch (e) {
      console.error(e);
      toast.error(e instanceof Error ? e.message : "Could not fetch a cat");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const onSave = () => {
    if (!pair?.caption) return;
    saveFavorite({ imageUrl: pair.imageUrl, caption: pair.caption });
    setFavs(getFavorites());
    toast.success("Saved to ur stash");
  };

  const onShare = async () => {
    if (!pair?.caption) return;
    const text = `${pair.caption} — LOLCatz.ai`;
    try {
      if (navigator.share) {
        await navigator.share({ title: "LOLCatz", text, url: pair.imageUrl });
      } else {
        await navigator.clipboard.writeText(`${text}\n${pair.imageUrl}`);
        toast.success("Link copied");
      }
    } catch {
      /* user cancelled */
    }
  };

  const onDownload = async () => {
    if (!pair?.caption) return;
    try {
      const blob = await renderMemePng(pair.imageUrl, pair.caption);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `lolcatz-${Date.now()}.png`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
      toast.error("Download failed");
    }
  };

  const replayFav = (f: Favorite) => {
    setPair({ imageUrl: f.imageUrl, caption: f.caption });
  };

  const removeFav = (id: string) => {
    removeFavorite(id);
    setFavs(getFavorites());
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <BackgroundDecor />

      <header className="relative z-10 flex items-center justify-between px-5 py-5 sm:px-8">
        <div className="flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-black tracking-tight">CatFixPix</h1>
        </div>
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-2">
              <Heart className="h-4 w-4 fill-current" />
              <span className="tabular-nums">{favs.length}</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-full sm:max-w-md">
            <SheetHeader>
              <SheetTitle>Ur Saved Catz</SheetTitle>
            </SheetHeader>
            <div className="mt-4 grid grid-cols-2 gap-3 overflow-y-auto pb-8">
              {favs.length === 0 && (
                <p className="col-span-2 mt-10 text-center text-sm text-muted-foreground">
                  No catz yet. Tap the heart to save one.
                </p>
              )}
              {favs.map((f) => (
                <div key={f.id} className="group relative overflow-hidden rounded-xl ring-1 ring-border">
                  <button
                    onClick={() => replayFav(f)}
                    className="block aspect-square w-full"
                    aria-label="Replay this cat"
                  >
                    <img
                      src={f.imageUrl}
                      alt={f.caption}
                      className="h-full w-full object-cover transition-transform group-hover:scale-105"
                    />
                    <span className="absolute inset-x-0 bottom-0 line-clamp-2 bg-gradient-to-t from-black/80 to-transparent p-2 text-left text-xs font-bold uppercase leading-tight text-white">
                      {f.caption}
                    </span>
                  </button>
                  <button
                    onClick={() => removeFav(f.id)}
                    className="absolute right-1.5 top-1.5 rounded-full bg-black/60 p-1.5 text-white opacity-0 transition-opacity group-hover:opacity-100"
                    aria-label="Remove"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </SheetContent>
        </Sheet>
      </header>

      <main className="relative z-10 mx-auto flex w-full max-w-lg flex-col items-center px-5 pb-32 sm:pb-10">
        <CatCard
          imageUrl={pair?.imageUrl ?? ""}
          caption={pair?.caption ?? ""}
          loading={loading || !pair?.caption}
        />

        <p className="mt-4 h-5 text-center text-sm text-muted-foreground">
          {loading
            ? pair?.imageUrl
              ? "teh cat iz thinkin…"
              : "findin a cat…"
            : "tap refresh for moar"}
        </p>

        <ActionBar
          disabled={loading || !pair?.caption}
          onRefresh={refresh}
          onSave={onSave}
          onShare={onShare}
          onDownload={onDownload}
          spinning={loading}
        />
      </main>

      <Toaster position="top-center" />
    </div>
  );
}

function ActionBar({
  onRefresh,
  onSave,
  onShare,
  onDownload,
  disabled,
  spinning,
}: {
  onRefresh: () => void;
  onSave: () => void;
  onShare: () => void;
  onDownload: () => void;
  disabled: boolean;
  spinning: boolean;
}) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-background/85 px-4 py-3 backdrop-blur-md sm:static sm:mt-6 sm:border-0 sm:bg-transparent sm:p-0 sm:backdrop-blur-none">
      <div className="mx-auto flex max-w-lg items-center justify-between gap-2 sm:justify-center sm:gap-3">
        <IconBtn label="Save" onClick={onSave} disabled={disabled}>
          <Heart className="h-5 w-5" />
        </IconBtn>
        <IconBtn label="Share" onClick={onShare} disabled={disabled}>
          <Share2 className="h-5 w-5" />
        </IconBtn>
        <Button
          onClick={onRefresh}
          disabled={disabled}
          size="lg"
          className="h-14 flex-1 gap-2 rounded-full bg-primary text-base font-black uppercase tracking-wide text-primary-foreground shadow-lg hover:bg-primary/90 sm:flex-initial sm:px-10"
        >
          <RefreshCw className={cn("h-5 w-5", spinning && "animate-spin")} />
          Moar Catz
        </Button>
        <IconBtn label="Download" onClick={onDownload} disabled={disabled}>
          <Download className="h-5 w-5" />
        </IconBtn>
      </div>
    </div>
  );
}

function IconBtn({
  children,
  onClick,
  disabled,
  label,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled: boolean;
  label: string;
}) {
  return (
    <Button
      variant="secondary"
      size="icon"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="h-12 w-12 rounded-full"
    >
      {children}
    </Button>
  );
}

function BackgroundDecor() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-primary/30 blur-3xl" />
      <div className="absolute -bottom-32 -right-24 h-96 w-96 rounded-full bg-accent/40 blur-3xl" />
    </div>
  );
}
