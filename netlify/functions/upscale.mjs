// POST /api/upscale  →  crea la predicción en Replicate y devuelve su id (no espera al resultado)
const API = "https://api.replicate.com/v1";
const MAX_CHARS = 6_000_000; // límite aproximado del cuerpo de una función de Netlify

const json = (code, obj) =>
  new Response(JSON.stringify(obj), { status: code, headers: { "content-type": "application/json" } });

export default async (req) => {
  const token = process.env.REPLICATE_API_TOKEN;
  if (!token) return json(500, { error: "Falta la variable REPLICATE_API_TOKEN en Netlify." });
  if (req.method !== "POST") return json(405, { error: "Método no permitido." });

  const { image } = await req.json().catch(() => ({}));
  if (typeof image !== "string" || !image.startsWith("data:image/"))
    return json(400, { error: "Imagen no válida." });
  if (image.length > MAX_CHARS) return json(413, { error: "La imagen es demasiado grande para enviarla." });

  // REPLICATE_VERSION es opcional: si la defines, se usa esa versión exacta del modelo.
  const version = process.env.REPLICATE_VERSION;
  const url = version
    ? `${API}/predictions`
    : `${API}/models/nightmareai/real-esrgan/predictions`;
  const payload = {
    input: { image, scale: 4, face_enhance: false },
    ...(version ? { version } : {}),
  };

  const r = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) return json(r.status, { error: data.detail || "Replicate devolvió un error." });
  return json(200, { id: data.id, status: data.status });
};

export const config = { path: "/api/upscale" };
