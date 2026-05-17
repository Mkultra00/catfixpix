/**
 * Render cat image + caption into a square PNG and return a Blob.
 * Uses crossOrigin so TheCatAPI CDN images don't taint the canvas.
 */
export async function renderMemePng(imageUrl: string, caption: string): Promise<Blob> {
  const size = 1080;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");

  const proxied = `/api/cat-image?url=${encodeURIComponent(imageUrl)}`;
  const img = await loadImage(proxied);

  // cover-fit
  const scale = Math.max(size / img.width, size / img.height);
  const w = img.width * scale;
  const h = img.height * scale;
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, size, size);
  ctx.drawImage(img, (size - w) / 2, (size - h) / 2, w, h);

  // caption
  drawCaption(ctx, caption.toUpperCase(), size);

  return await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("toBlob failed"))), "image/png");
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Image load failed"));
    img.src = src;
  });
}

function drawCaption(ctx: CanvasRenderingContext2D, text: string, size: number) {
  const maxWidth = size * 0.9;
  let fontSize = 88;
  ctx.textAlign = "center";
  ctx.textBaseline = "bottom";

  const wrap = (fs: number) => {
    ctx.font = `900 ${fs}px Impact, "Anton", "Arial Black", sans-serif`;
    const words = text.split(/\s+/);
    const lines: string[] = [];
    let line = "";
    for (const word of words) {
      const test = line ? line + " " + word : word;
      if (ctx.measureText(test).width > maxWidth && line) {
        lines.push(line);
        line = word;
      } else {
        line = test;
      }
    }
    if (line) lines.push(line);
    return lines;
  };

  let lines = wrap(fontSize);
  while ((lines.length > 4 || lines.some((l) => ctx.measureText(l).width > maxWidth)) && fontSize > 36) {
    fontSize -= 6;
    lines = wrap(fontSize);
  }

  const lineHeight = fontSize * 1.05;
  const bottomPad = size * 0.04;
  let y = size - bottomPad;

  ctx.lineJoin = "round";
  ctx.miterLimit = 2;
  ctx.strokeStyle = "#000";
  ctx.fillStyle = "#fff";
  ctx.lineWidth = Math.max(6, fontSize * 0.12);

  for (let i = lines.length - 1; i >= 0; i--) {
    ctx.strokeText(lines[i], size / 2, y);
    ctx.fillText(lines[i], size / 2, y);
    y -= lineHeight;
  }
}
