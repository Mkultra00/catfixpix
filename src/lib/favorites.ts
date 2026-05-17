export type Favorite = {
  id: string;
  imageUrl: string;
  caption: string;
  savedAt: number;
};

const KEY = "lolcatz:favorites";

export function getFavorites(): Favorite[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "[]") as Favorite[];
  } catch {
    return [];
  }
}

export function saveFavorite(fav: Omit<Favorite, "id" | "savedAt">): Favorite {
  const item: Favorite = {
    ...fav,
    id: crypto.randomUUID(),
    savedAt: Date.now(),
  };
  const list = [item, ...getFavorites()].slice(0, 200);
  localStorage.setItem(KEY, JSON.stringify(list));
  return item;
}

export function removeFavorite(id: string) {
  const list = getFavorites().filter((f) => f.id !== id);
  localStorage.setItem(KEY, JSON.stringify(list));
}
