/**
 * Prepara las fotos en el móvil antes de subirlas.
 *
 * Dos motivos: Claude reescala todo a ~1568 px de lado largo (mandar más solo
 * gasta datos), y el servidor tiene un límite de tamaño de petición (4,5 MB en
 * Vercel), así que cada foto se comprime hasta caber en su parte del total.
 */
const MAX_EDGE = 1568;
const QUALITIES = [0.85, 0.72, 0.6, 0.45];
/** Presupuesto por foto en base64, contando hasta 4 fotos por escaneo */
const MAX_BYTES_PER_PHOTO = 850_000;

export interface PreparedImage {
  media_type: "image/jpeg";
  data: string; // base64 sin el prefijo data:
  previewUrl: string;
}

interface Loaded {
  source: CanvasImageSource;
  width: number;
  height: number;
  release: () => void;
}

/** createImageBitmap no está en Safari antiguo (ni admite opciones en todos) */
async function loadImage(file: File): Promise<Loaded> {
  if (typeof createImageBitmap === "function") {
    try {
      let bitmap: ImageBitmap;
      try {
        bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
      } catch {
        bitmap = await createImageBitmap(file);
      }
      return { source: bitmap, width: bitmap.width, height: bitmap.height, release: () => bitmap.close() };
    } catch {
      // Sigue con el <img> de toda la vida
    }
  }

  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.src = url;
    if (typeof img.decode === "function") {
      await img.decode();
    } else {
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error("No se ha podido abrir la foto"));
      });
    }
    return {
      source: img,
      width: img.naturalWidth,
      height: img.naturalHeight,
      release: () => URL.revokeObjectURL(url),
    };
  } catch {
    URL.revokeObjectURL(url);
    throw new Error("No se ha podido abrir la foto");
  }
}

export async function prepareImage(file: File): Promise<PreparedImage> {
  const loaded = await loadImage(file);
  try {
    let dataUrl = "";
    for (const edge of [MAX_EDGE, 1280, 1024]) {
      const scale = Math.min(1, edge / Math.max(loaded.width, loaded.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(loaded.width * scale));
      canvas.height = Math.max(1, Math.round(loaded.height * scale));
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("No se ha podido procesar la foto");
      ctx.drawImage(loaded.source, 0, 0, canvas.width, canvas.height);

      for (const quality of QUALITIES) {
        dataUrl = canvas.toDataURL("image/jpeg", quality);
        if (dataUrl.length <= MAX_BYTES_PER_PHOTO) {
          return { media_type: "image/jpeg", data: dataUrl.slice(dataUrl.indexOf(",") + 1), previewUrl: dataUrl };
        }
      }
    }
    // Ni con la calidad más baja cabe: se manda igual, el servidor avisará si se pasa
    return { media_type: "image/jpeg", data: dataUrl.slice(dataUrl.indexOf(",") + 1), previewUrl: dataUrl };
  } finally {
    loaded.release();
  }
}
