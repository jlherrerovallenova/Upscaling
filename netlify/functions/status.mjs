// GET /api/status?id=...  →  estado de la predicción y URL del resultado cuando termina
const API = "https://api.replicate.com/v1";

const json = (code, obj) =>
  new Response(JSON.stringify(obj), { status: code, headers: { "content-type": "application/json" } });

export default async (req) => {
  const token = process.env.REPLICATE_API_TOKEN;
  if (!token) return json(500, { error: "Falta la variable REPLICATE_API_TOKEN en Netlify." });

  const id = new URL(req.url).searchParams.get("id");
  if (!id || !/^[a-z0-9]+$/i.test(id)) return json(400, { error: "Id no válido." });

  const r = await fetch(`${API}/predictions/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) return json(r.status, { error: d.detail || "Replicate devolvió un error." });

  const output = Array.isArray(d.output) ? d.output[0] : d.output;
  return json(200, {
    status: d.status,
    output: d.status === "succeeded" ? output : null,
    error: d.error || null,
  });
};

export const config = { path: "/api/status" };
