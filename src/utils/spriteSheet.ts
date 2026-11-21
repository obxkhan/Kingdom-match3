export interface NormalizedRegion {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

export interface SliceRegionOptions {
  stripWhiteBackground?: boolean;
  pad?: number;
}

function isNeutralLight(
  r: number,
  g: number,
  b: number,
  threshold: number
): boolean {
  const min = Math.min(r, g, b);
  const max = Math.max(r, g, b);
  return min >= threshold && max - min <= 22;
}

function sliceRegionToDataUrl(
  sourceCanvas: HTMLCanvasElement,
  region: NormalizedRegion,
  options: SliceRegionOptions = {}
): string | null {
  const { stripWhiteBackground = false, pad = 3 } = options;
  const sw = sourceCanvas.width;
  const sh = sourceCanvas.height;
  const rx0 = Math.max(0, Math.floor(region.x0 * sw));
  const ry0 = Math.max(0, Math.floor(region.y0 * sh));
  const rx1 = Math.min(sw, Math.ceil(region.x1 * sw));
  const ry1 = Math.min(sh, Math.ceil(region.y1 * sh));
  const rw = rx1 - rx0;
  const rh = ry1 - ry0;
  if (rw <= 0 || rh <= 0) return null;

  const sctx = sourceCanvas.getContext("2d", { willReadFrequently: true });
  if (!sctx) return null;

  const regionData = sctx.getImageData(rx0, ry0, rw, rh).data;
  let minX = rw;
  let minY = rh;
  let maxX = -1;
  let maxY = -1;

  for (let y = 0; y < rh; y += 1) {
    for (let x = 0; x < rw; x += 1) {
      const idx = (y * rw + x) * 4;
      const r = regionData[idx];
      const g = regionData[idx + 1];
      const b = regionData[idx + 2];
      const a = regionData[idx + 3];
      const hasInk = stripWhiteBackground
        ? a > 20 && !isNeutralLight(r, g, b, 236)
        : a > 12;

      if (hasInk) {
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
      }
    }
  }

  if (maxX < minX || maxY < minY) return null;

  const bw = maxX - minX + 1;
  const bh = maxY - minY + 1;
  const side = Math.max(bw, bh) + pad * 2;

  const outCanvas = document.createElement("canvas");
  outCanvas.width = side;
  outCanvas.height = side;
  const octx = outCanvas.getContext("2d", { willReadFrequently: true });
  if (!octx) return null;

  const dx = Math.floor((side - bw) / 2);
  const dy = Math.floor((side - bh) / 2);
  octx.drawImage(
    sourceCanvas,
    rx0 + minX,
    ry0 + minY,
    bw,
    bh,
    dx,
    dy,
    bw,
    bh
  );

  if (stripWhiteBackground) {
    // Flood-fill outer neutral white background to transparent while preserving interior whites
    const imgData = octx.getImageData(0, 0, side, side);
    const px = imgData.data;
    const total = side * side;
    const visited = new Uint8Array(total);
    const queue = new Int32Array(total);
    let head = 0;
    let tail = 0;

    const tryEnqueue = (x: number, y: number) => {
      if (x < 0 || x >= side || y < 0 || y >= side) return;
      const p = y * side + x;
      if (visited[p]) return;
      const i = p * 4;
      if (px[i + 3] === 0 || isNeutralLight(px[i], px[i + 1], px[i + 2], 230)) {
        visited[p] = 1;
        queue[tail] = p;
        tail += 1;
      }
    };

    for (let x = 0; x < side; x += 1) {
      tryEnqueue(x, 0);
      tryEnqueue(x, side - 1);
    }
    for (let y = 0; y < side; y += 1) {
      tryEnqueue(0, y);
      tryEnqueue(side - 1, y);
    }

    while (head < tail) {
      const p = queue[head];
      head += 1;
      px[p * 4 + 3] = 0;
      const cx = p % side;
      const cy = (p - cx) / side;
      tryEnqueue(cx - 1, cy);
      tryEnqueue(cx + 1, cy);
      tryEnqueue(cx, cy - 1);
      tryEnqueue(cx, cy + 1);
    }

    // Soften immediate anti-aliased light fringe adjacent to transparent pixels
    for (let y = 1; y < side - 1; y += 1) {
      for (let x = 1; x < side - 1; x += 1) {
        const p = y * side + x;
        if (visited[p]) continue;
        const i = p * 4;
        const r = px[i];
        const g = px[i + 1];
        const b = px[i + 2];
        if (!isNeutralLight(r, g, b, 195)) continue;

        const touchesTransparent =
          visited[p - 1] ||
          visited[p + 1] ||
          visited[p - side] ||
          visited[p + side];

        if (touchesTransparent) {
          const avg = (r + g + b) / 3;
          const factor = Math.max(0, Math.min(1, (232 - avg) / 37));
          px[i + 3] = Math.round(px[i + 3] * factor);
        }
      }
    }

    octx.putImageData(imgData, 0, 0);
  }

  return outCanvas.toDataURL("image/png");
}

export function loadSpriteSheetRegions<K extends string>(
  src: string,
  regions: Partial<Record<K, NormalizedRegion>>,
  options: SliceRegionOptions = {}
): Promise<Partial<Record<K, string>>> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (!ctx) {
          resolve({});
          return;
        }
        ctx.drawImage(img, 0, 0);

        const out: Partial<Record<K, string>> = {};
        (Object.keys(regions) as K[]).forEach((key) => {
          const region = regions[key];
          if (!region) return;
          const url = sliceRegionToDataUrl(canvas, region, options);
          if (url) out[key] = url;
        });
        resolve(out);
      } catch {
        resolve({});
      }
    };
    img.onerror = () => resolve({});
    img.src = src;
  });
}
