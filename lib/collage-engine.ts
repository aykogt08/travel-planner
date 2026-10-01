// lib/collage-engine.ts
import { CollageLayout, CollageStyle, PhotoItem, CollageElement } from "@/types/collage";

/** Helper to generate a random number within a range. */
const randBetween = (min: number, max: number) => Math.random() * (max - min) + min;

/** Core layout generator. It receives the selected photos and a theme style. */
export function generateCollageLayout(
  photos: PhotoItem[],
  style: CollageStyle,
  aspect: "4:5" | "9:16" | "1:1" = "4:5"
): CollageLayout {
  const elements: CollageElement[] = [];
  const canvasWidth = 100; // percentages for simplicity
  const canvasHeight = 100;

  const add = (
    photo: PhotoItem,
    x: number,
    y: number,
    w: number,
    h: number,
    rotation: number,
    z: number,
    elStyle: CollageStyle
  ) => {
    elements.push({
      photoId: photo.id,
      x,
      y,
      width: w,
      height: h,
      rotation,
      zIndex: z,
      style: elStyle,
    });
  };

  if (photos.length === 0) {
    throw new Error("No photos provided for collage generation");
  }

  const list = photos.slice(0, 10);

  switch (style) {
    case "polaroid": {
      const main = list[0];
      add(main, 27.5, 12, 45, 55, randBetween(-8, 8), 5, "polaroid");
      if (list[1]) add(list[1], 8, 42, 30, 40, randBetween(-12, -4), 4, "polaroid");
      if (list[2]) add(list[2], 62, 42, 30, 40, randBetween(4, 12), 4, "polaroid");
      if (list[3]) add(list[3], 20, 65, 26, 32, randBetween(-6, 6), 6, "polaroid");
      if (list[4]) add(list[4], 54, 65, 26, 32, randBetween(-8, 8), 6, "polaroid");
      break;
    }
    case "vintage": {
      list.forEach((p, i) => {
        const size = randBetween(28, 42);
        const x = randBetween(5, canvasWidth - size - 5);
        const y = randBetween(5, canvasHeight - size - 5);
        const rot = randBetween(-14, 14);
        add(p, x, y, size, size * 1.1, rot, i, "vintage");
      });
      break;
    }
    case "minimal": {
      const grid = [
        { x: 6, y: 6 },
        { x: 52, y: 6 },
        { x: 6, y: 52 },
        { x: 52, y: 52 },
      ];
      const size = 42;
      list.slice(0, 4).forEach((p, i) => {
        const pos = grid[i];
        add(p, pos.x, pos.y, size, size, randBetween(-1.5, 1.5), i, "minimal");
      });
      break;
    }
    case "journal": {
      const main = list[0];
      add(main, 6, 6, 44, 88, randBetween(-3, 3), 5, "journal");
      const rightPhotos = list.slice(1, 4);
      const subHeight = 88 / Math.max(rightPhotos.length, 1);
      rightPhotos.forEach((p, i) => {
        add(p, 54, 6 + i * subHeight, 40, subHeight - 4, randBetween(-6, 6), 4 - i, "journal");
      });
      break;
    }
    case "tape": {
      list.forEach((p, i) => {
        const size = randBetween(26, 42);
        const x = randBetween(5, canvasWidth - size - 5);
        const y = randBetween(5, canvasHeight - size - 5);
        const rot = randBetween(-18, 18);
        add(p, x, y, size, size, rot, i, "tape");
      });
      break;
    }
    case "retro": {
      const count = Math.min(list.length, 5);
      const itemW = 86 / count;
      list.slice(0, count).forEach((p, i) => {
        add(p, 7 + i * itemW, 25, itemW - 2, 48, randBetween(-3, 3), i, "retro");
      });
      break;
    }
    case "watercolor": {
      list.forEach((p, i) => {
        const size = randBetween(30, 46);
        const x = randBetween(6, canvasWidth - size - 6);
        const y = randBetween(6, canvasHeight - size - 6);
        const rot = randBetween(-12, 12);
        add(p, x, y, size, size, rot, i, "watercolor");
      });
      break;
    }
    case "sketch": {
      const main = list[0];
      add(main, 8, 12, 54, 76, randBetween(-2, 2), 5, "sketch");
      const side = list.slice(1, 3);
      side.forEach((p, i) => {
        add(p, 66, 18 + i * 36, 26, 32, randBetween(-6, 6), i, "sketch");
      });
      break;
    }
    case "night": {
      const main = list[0];
      add(main, 24, 10, 52, 78, 0, 5, "night");
      if (list[1]) add(list[1], 6, 26, 24, 46, -5, 4, "night");
      if (list[2]) add(list[2], 70, 26, 24, 46, 5, 4, "night");
      break;
    }
    case "seasonal": {
      const radius = 28;
      const centerX = 50;
      const centerY = 50;
      const count = Math.min(list.length, 6);
      list.slice(0, count).forEach((p, i) => {
        const angle = (i / count) * 2 * Math.PI;
        const x = centerX + radius * Math.cos(angle) - 16;
        const y = centerY + radius * Math.sin(angle) - 16;
        const rot = (angle * 180) / Math.PI + randBetween(-8, 8);
        add(p, x, y, 32, 32, rot, i, "seasonal");
      });
      break;
    }
  }

  const bgMap: Record<CollageStyle, string> = {
    polaroid: "polaroid-bg",
    vintage: "craft-bg",
    minimal: "plain-bg",
    journal: "notebook-bg",
    tape: "craft-bg",
    retro: "film-bg",
    watercolor: "watercolor-bg",
    sketch: "sketch-bg",
    night: "night-bg",
    seasonal: "seasonal-bg",
  };

  return {
    elements,
    background: bgMap[style] || "plain-bg",
    aspect,
    theme: style,
  };
}

export function shuffleLayout(
  photos: PhotoItem[],
  style: CollageStyle,
  aspect: "4:5" | "9:16" | "1:1" = "4:5"
): CollageLayout {
  return generateCollageLayout(photos, style, aspect);
}

export interface RenderOptions {
  title?: string;
  date?: string;
  subtitle?: string;
}

/** Render a CollageLayout onto an HTMLCanvasElement with styles, shadows, tapes, and labels */
export function renderCollageToCanvas(
  canvas: HTMLCanvasElement,
  layout: CollageLayout,
  photosMap: Record<string, HTMLImageElement>,
  options?: RenderOptions
) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const targetHeight = 1000;
  let targetWidth = 1000;
  if (layout.aspect === "4:5") targetWidth = (targetHeight * 4) / 5;
  else if (layout.aspect === "9:16") targetWidth = (targetHeight * 9) / 16;
  else if (layout.aspect === "1:1") targetWidth = targetHeight;

  canvas.width = targetWidth;
  canvas.height = targetHeight;

  // 1. Draw Background based on theme
  drawCanvasBackground(ctx, layout.theme, targetWidth, targetHeight);

  // 2. Sort elements by zIndex
  const sortedElements = [...layout.elements].sort((a, b) => a.zIndex - b.zIndex);

  // 3. Render Each Photo Element
  sortedElements.forEach((el) => {
    const img = photosMap[el.photoId];
    if (!img) return;

    const w = (el.width / 100) * targetWidth;
    const h = (el.height / 100) * targetHeight;
    const x = (el.x / 100) * targetWidth;
    const y = (el.y / 100) * targetHeight;

    ctx.save();
    ctx.translate(x + w / 2, y + h / 2);
    ctx.rotate((el.rotation * Math.PI) / 180);

    // If element is a cutout sticker (style === "none"), render with natural drop shadow and aspect ratio
    if ((el as any).style === "none") {
      ctx.shadowColor = "rgba(0, 0, 0, 0.28)";
      ctx.shadowBlur = 16;
      ctx.shadowOffsetY = 6;
      const imgAspect = img.width / (img.height || 1);
      const boxAspect = w / h;
      let drawW = w;
      let drawH = h;
      if (imgAspect > boxAspect) {
        drawH = w / imgAspect;
      } else {
        drawW = h * imgAspect;
      }
      ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
      ctx.restore();
      return;
    }

    // Apply Style Decoration (Polaroid frame, Shadow, Border, Tape)
    switch (layout.theme) {
      case "polaroid": {
        // Shadow
        ctx.shadowColor = "rgba(0, 0, 0, 0.22)";
        ctx.shadowBlur = 18;
        ctx.shadowOffsetY = 8;
        ctx.shadowOffsetX = 2;

        // White photo frame
        const framePad = 12;
        const bottomPad = 36;
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(
          -w / 2 - framePad,
          -h / 2 - framePad,
          w + framePad * 2,
          h + framePad + bottomPad
        );

        ctx.shadowColor = "transparent";

        // Draw image inside frame
        drawImageCover(ctx, img, -w / 2, -h / 2, w, h);

        // Subtle frame inner border
        ctx.strokeStyle = "rgba(0,0,0,0.06)";
        ctx.lineWidth = 1;
        ctx.strokeRect(-w / 2, -h / 2, w, h);
        break;
      }

      case "tape": {
        // Shadow
        ctx.shadowColor = "rgba(0, 0, 0, 0.18)";
        ctx.shadowBlur = 12;
        ctx.shadowOffsetY = 5;

        // Image
        drawImageCover(ctx, img, -w / 2, -h / 2, w, h);
        ctx.shadowColor = "transparent";

        // Draw Washi Tape at top-center or corner
        drawWashiTape(ctx, -w / 4, -h / 2 - 8, w / 2, 18, -4);
        break;
      }

      case "vintage": {
        ctx.shadowColor = "rgba(56, 30, 10, 0.25)";
        ctx.shadowBlur = 14;
        ctx.shadowOffsetY = 6;

        // Warm border
        const pad = 8;
        ctx.fillStyle = "#FDF6EC";
        ctx.fillRect(-w / 2 - pad, -h / 2 - pad, w + pad * 2, h + pad * 2);
        ctx.shadowColor = "transparent";

        drawImageCover(ctx, img, -w / 2, -h / 2, w, h);

        // Sepia tint overlay
        ctx.fillStyle = "rgba(180, 120, 60, 0.12)";
        ctx.fillRect(-w / 2, -h / 2, w, h);
        break;
      }

      case "retro": {
        // Film strip border
        ctx.shadowColor = "rgba(0,0,0,0.3)";
        ctx.shadowBlur = 10;
        ctx.shadowOffsetY = 4;

        ctx.fillStyle = "#1A1A1A";
        ctx.fillRect(-w / 2 - 6, -h / 2 - 16, w + 12, h + 32);
        ctx.shadowColor = "transparent";

        // Sprocket holes
        ctx.fillStyle = "#FFFFFF";
        for (let sx = -w / 2; sx < w / 2; sx += 20) {
          ctx.fillRect(sx, -h / 2 - 12, 10, 6);
          ctx.fillRect(sx, h / 2 + 6, 10, 6);
        }

        drawImageCover(ctx, img, -w / 2, -h / 2, w, h);
        break;
      }

      case "watercolor": {
        ctx.save();
        ctx.shadowColor = "rgba(40, 80, 120, 0.15)";
        ctx.shadowBlur = 20;

        // Rounded softly
        roundedRect(ctx, -w / 2, -h / 2, w, h, 14);
        ctx.clip();
        drawImageCover(ctx, img, -w / 2, -h / 2, w, h);

        // Watercolor glow vignette
        ctx.fillStyle = "rgba(220, 240, 255, 0.15)";
        ctx.fillRect(-w / 2, -h / 2, w, h);
        ctx.restore();
        break;
      }

      case "night": {
        ctx.shadowColor = "rgba(0, 0, 0, 0.4)";
        ctx.shadowBlur = 16;
        ctx.shadowOffsetY = 6;

        ctx.strokeStyle = "rgba(255, 215, 0, 0.4)";
        ctx.lineWidth = 2;
        ctx.strokeRect(-w / 2 - 2, -h / 2 - 2, w + 4, h + 4);

        drawImageCover(ctx, img, -w / 2, -h / 2, w, h);
        break;
      }

      default: {
        // minimal, journal, sketch, seasonal
        ctx.shadowColor = "rgba(0, 0, 0, 0.15)";
        ctx.shadowBlur = 10;
        ctx.shadowOffsetY = 4;

        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(-w / 2 - 4, -h / 2 - 4, w + 8, h + 8);
        ctx.shadowColor = "transparent";

        drawImageCover(ctx, img, -w / 2, -h / 2, w, h);
        break;
      }
    }

    ctx.restore();
  });

  // 4. Draw Stamp / Header / Dates
  drawCollageOverlays(ctx, layout.theme, targetWidth, targetHeight, options);
}

/** Draw specific canvas backgrounds */
function drawCanvasBackground(
  ctx: CanvasRenderingContext2D,
  theme: CollageStyle,
  w: number,
  h: number
) {
  switch (theme) {
    case "tape":
    case "vintage": {
      // Craft paper warm tone
      ctx.fillStyle = "#E9DCC9";
      ctx.fillRect(0, 0, w, h);
      // Craft noise dots
      ctx.fillStyle = "rgba(120, 80, 40, 0.04)";
      for (let i = 0; i < 600; i++) {
        ctx.fillRect(Math.random() * w, Math.random() * h, 2, 2);
      }
      break;
    }
    case "night": {
      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, "#0B132B");
      grad.addColorStop(0.5, "#1C2541");
      grad.addColorStop(1, "#3A506B");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      // Star sparks
      ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
      for (let i = 0; i < 80; i++) {
        const starX = Math.random() * w;
        const starY = Math.random() * h * 0.7;
        const r = Math.random() * 1.8;
        ctx.beginPath();
        ctx.arc(starX, starY, r, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }
    case "journal": {
      ctx.fillStyle = "#FDFBF7";
      ctx.fillRect(0, 0, w, h);
      // Grid lines
      ctx.strokeStyle = "rgba(56, 102, 65, 0.08)";
      ctx.lineWidth = 1;
      for (let y = 30; y < h; y += 32) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }
      break;
    }
    case "watercolor": {
      const grad = ctx.createRadialGradient(w / 2, h / 2, 50, w / 2, h / 2, w * 0.8);
      grad.addColorStop(0, "#F0F8FF");
      grad.addColorStop(0.6, "#E8F0FE");
      grad.addColorStop(1, "#D5E6F7");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);
      break;
    }
    case "seasonal": {
      // Warm floral / spring background
      const grad = ctx.createLinearGradient(0, 0, w, h);
      grad.addColorStop(0, "#FFF5EB");
      grad.addColorStop(1, "#FCEADE");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);
      break;
    }
    default: {
      // Clean cream white (#FDF0D5 / #FBFBF9)
      ctx.fillStyle = "#F9F8F6";
      ctx.fillRect(0, 0, w, h);
      break;
    }
  }
}

/** Draw Washi Tape decoration */
function drawWashiTape(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  deg: number
) {
  ctx.save();
  ctx.translate(x + w / 2, y + h / 2);
  ctx.rotate((deg * Math.PI) / 180);
  ctx.fillStyle = "rgba(221, 161, 94, 0.75)"; // Marcaderno accent sand
  ctx.fillRect(-w / 2, -h / 2, w, h);

  // Serrated edges
  ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
  ctx.fillRect(-w / 2, -h / 2, 4, h);
  ctx.fillRect(w / 2 - 4, -h / 2, 4, h);
  ctx.restore();
}

/** Cover-fit drawing helper */
function drawImageCover(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  w: number,
  h: number
) {
  const imgAspect = img.naturalWidth / (img.naturalHeight || 1);
  const targetAspect = w / h;
  let sx = 0,
    sy = 0,
    sw = img.naturalWidth,
    sh = img.naturalHeight;

  if (imgAspect > targetAspect) {
    sw = img.naturalHeight * targetAspect;
    sx = (img.naturalWidth - sw) / 2;
  } else {
    sh = img.naturalWidth / targetAspect;
    sy = (img.naturalHeight - sh) / 2;
  }

  ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
}

/** Helper for rounded rect */
function roundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  radius: number
) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
  ctx.lineTo(x + radius, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

/** Draw watermark / stamp overlay */
function drawCollageOverlays(
  ctx: CanvasRenderingContext2D,
  theme: CollageStyle,
  w: number,
  h: number,
  options?: RenderOptions
) {
  ctx.save();

  // Branding watermark stamp (Bottom Right)
  const isNight = theme === "night";
  ctx.font = "bold 18px sans-serif";
  ctx.fillStyle = isNight ? "rgba(255, 255, 255, 0.45)" : "rgba(56, 102, 65, 0.45)";
  ctx.textAlign = "right";
  ctx.fillText("Marcaderno Travel Memories", w - 24, h - 24);

  // Title / Date badge if available
  if (options?.title) {
    ctx.font = "bold 24px sans-serif";
    ctx.fillStyle = isNight ? "#FFFFFF" : "#386641";
    ctx.textAlign = "left";
    ctx.fillText(options.title, 24, 38);

    if (options.date) {
      ctx.font = "14px sans-serif";
      ctx.fillStyle = isNight ? "rgba(255, 255, 255, 0.7)" : "rgba(56, 102, 65, 0.7)";
      ctx.fillText(options.date, 24, 62);
    }
  }

  // Stamp badge for journal or vintage
  if (theme === "vintage" || theme === "journal") {
    ctx.save();
    ctx.translate(w - 70, 70);
    ctx.rotate((12 * Math.PI) / 180);
    ctx.strokeStyle = "rgba(193, 18, 31, 0.55)"; // Crimson stamp
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(0, 0, 36, 0, Math.PI * 2);
    ctx.stroke();

    ctx.font = "bold 11px sans-serif";
    ctx.fillStyle = "rgba(193, 18, 31, 0.65)";
    ctx.textAlign = "center";
    ctx.fillText("VOYAGE", 0, -6);
    ctx.fillText("PASSPORT", 0, 10);
    ctx.restore();
  }

  ctx.restore();
}

import { CollageTemplate } from "@/types/collage-template";
import { MappedSlotAssignment } from "./template-matcher";

/**
 * Render a declarative CollageTemplate with assigned photo slots onto Canvas.
 * Incorporates controlled rotation ranges, photo framing (polaroid, tape, film),
 * and rich background textures.
 */
export function renderTemplateCollageToCanvas(
  canvas: HTMLCanvasElement,
  template: CollageTemplate,
  assignments: MappedSlotAssignment[],
  imagesMap: Record<string, HTMLImageElement>,
  options?: RenderOptions
) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const targetHeight = 1000;
  let targetWidth = 1000;
  if (template.aspect === "4:5") targetWidth = (targetHeight * 4) / 5;
  else if (template.aspect === "9:16") targetWidth = (targetHeight * 9) / 16;
  else if (template.aspect === "1:1") targetWidth = targetHeight;

  canvas.width = targetWidth;
  canvas.height = targetHeight;

  // 1. Draw Template Background
  drawTemplateBackground(ctx, template.background, targetWidth, targetHeight);

  // 2. Sort assignments by zIndex
  const sorted = [...assignments].sort((a, b) => a.slot.zIndex - b.slot.zIndex);

  // 3. Render Each Slot
  sorted.forEach(({ slot, photo, rotation }) => {
    const img = imagesMap[photo.id];
    if (!img) return;

    const w = slot.width * targetWidth;
    const h = slot.height * targetHeight;
    const x = slot.x * targetWidth;
    const y = slot.y * targetHeight;

    ctx.save();
    ctx.translate(x + w / 2, y + h / 2);
    ctx.rotate((rotation * Math.PI) / 180);

    const frameStyle = slot.frameStyle || "clean";
    const isSticker = photo.isCutoutSticker || frameStyle === "none";

    if (isSticker) {
      // Cutout Sticker: seamless background-free sticker with natural drop shadow
      ctx.shadowColor = "rgba(0, 0, 0, 0.28)";
      ctx.shadowBlur = 16;
      ctx.shadowOffsetY = 6;

      const imgAspect = img.width / (img.height || 1);
      const boxAspect = w / h;
      let drawW = w;
      let drawH = h;
      if (imgAspect > boxAspect) {
        drawH = w / imgAspect;
      } else {
        drawW = h * imgAspect;
      }
      ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
    } else if (frameStyle === "polaroid") {
      ctx.shadowColor = "rgba(0, 0, 0, 0.22)";
      ctx.shadowBlur = 18;
      ctx.shadowOffsetY = 8;
      ctx.shadowOffsetX = 2;

      const framePad = 12;
      const bottomPad = 36;
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(-w / 2 - framePad, -h / 2 - framePad, w + framePad * 2, h + framePad + bottomPad);
      ctx.shadowColor = "transparent";

      drawImageCover(ctx, img, -w / 2, -h / 2, w, h);

      ctx.strokeStyle = "rgba(0,0,0,0.06)";
      ctx.lineWidth = 1;
      ctx.strokeRect(-w / 2, -h / 2, w, h);
    } else if (frameStyle === "tape") {
      ctx.shadowColor = "rgba(0, 0, 0, 0.18)";
      ctx.shadowBlur = 14;
      ctx.shadowOffsetY = 6;

      drawImageCover(ctx, img, -w / 2, -h / 2, w, h);
      ctx.shadowColor = "transparent";

      drawWashiTape(ctx, -w / 4, -h / 2 - 8, w / 2, 18, -rotation * 0.5);
    } else if (frameStyle === "vintage") {
      ctx.shadowColor = "rgba(56, 30, 10, 0.25)";
      ctx.shadowBlur = 14;
      ctx.shadowOffsetY = 6;

      const pad = 8;
      ctx.fillStyle = "#FDF6EC";
      ctx.fillRect(-w / 2 - pad, -h / 2 - pad, w + pad * 2, h + pad * 2);
      ctx.shadowColor = "transparent";

      drawImageCover(ctx, img, -w / 2, -h / 2, w, h);

      ctx.fillStyle = "rgba(180, 120, 60, 0.12)";
      ctx.fillRect(-w / 2, -h / 2, w, h);
    } else if (frameStyle === "film") {
      ctx.shadowColor = "rgba(0,0,0,0.35)";
      ctx.shadowBlur = 12;
      ctx.shadowOffsetY = 6;

      ctx.fillStyle = "#141414";
      ctx.fillRect(-w / 2 - 6, -h / 2 - 16, w + 12, h + 32);
      ctx.shadowColor = "transparent";

      ctx.fillStyle = "#FFFFFF";
      for (let sx = -w / 2; sx < w / 2; sx += 20) {
        ctx.fillRect(sx, -h / 2 - 12, 10, 6);
        ctx.fillRect(sx, h / 2 + 6, 10, 6);
      }

      drawImageCover(ctx, img, -w / 2, -h / 2, w, h);
    } else {
      // clean
      ctx.shadowColor = "rgba(0, 0, 0, 0.12)";
      ctx.shadowBlur = 12;
      ctx.shadowOffsetY = 5;

      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(-w / 2 - 4, -h / 2 - 4, w + 8, h + 8);
      ctx.shadowColor = "transparent";

      drawImageCover(ctx, img, -w / 2, -h / 2, w, h);
    }

    ctx.restore();
  });

  // 4. Overlays & Stamps
  drawTemplateOverlays(ctx, template, targetWidth, targetHeight, options);
}

function drawTemplateBackground(
  ctx: CanvasRenderingContext2D,
  bg: CollageTemplate["background"],
  w: number,
  h: number
) {
  if (bg === "craft") {
    ctx.fillStyle = "#E9DCC9";
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = "rgba(120, 80, 40, 0.04)";
    for (let i = 0; i < 600; i++) {
      ctx.fillRect(Math.random() * w, Math.random() * h, 2, 2);
    }
  } else if (bg === "notebook") {
    ctx.fillStyle = "#FDFBF7";
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = "rgba(56, 102, 65, 0.08)";
    ctx.lineWidth = 1;
    for (let y = 30; y < h; y += 32) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }
  } else if (bg === "dark") {
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, "#0B132B");
    grad.addColorStop(0.5, "#1C2541");
    grad.addColorStop(1, "#3A506B");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
  } else if (bg === "magazine_white") {
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, w, h);
  } else {
    // clean / cream
    ctx.fillStyle = "#F9F8F6";
    ctx.fillRect(0, 0, w, h);
  }
}

function drawTemplateOverlays(
  ctx: CanvasRenderingContext2D,
  template: CollageTemplate,
  w: number,
  h: number,
  options?: RenderOptions
) {
  ctx.save();
  const isDark = template.background === "dark";

  // Brand watermark
  ctx.font = "bold 16px sans-serif";
  ctx.fillStyle = isDark ? "rgba(255, 255, 255, 0.45)" : "rgba(56, 102, 65, 0.45)";
  ctx.textAlign = "right";
  ctx.fillText("Marcaderno Travel Memories", w - 24, h - 24);

  // Title / Date
  if (options?.title) {
    ctx.font = "bold 24px sans-serif";
    ctx.fillStyle = isDark ? "#FFFFFF" : "#386641";
    ctx.textAlign = "left";
    ctx.fillText(options.title, 24, 38);

    if (options.date) {
      ctx.font = "14px sans-serif";
      ctx.fillStyle = isDark ? "rgba(255, 255, 255, 0.7)" : "rgba(56, 102, 65, 0.7)";
      ctx.fillText(options.date, 24, 62);
    }
  }

  // Stamp badge for scrapbook or photo_diary
  if (template.style === "scrapbook" || template.style === "photo_diary") {
    ctx.save();
    ctx.translate(w - 70, 70);
    ctx.rotate((12 * Math.PI) / 180);
    ctx.strokeStyle = "rgba(193, 18, 31, 0.55)";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(0, 0, 36, 0, Math.PI * 2);
    ctx.stroke();

    ctx.font = "bold 11px sans-serif";
    ctx.fillStyle = "rgba(193, 18, 31, 0.65)";
    ctx.textAlign = "center";
    ctx.fillText("VOYAGE", 0, -6);
    ctx.fillText("PASSPORT", 0, 10);
    ctx.restore();
  }

  ctx.restore();
}

