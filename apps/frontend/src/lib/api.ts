// apps/frontend/src/lib/api.ts
export const API = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000';


export async function getNearby(lon: number, lat: number, r = 1000) {
  const url = `${API}/customers/nearby?lon=${lon}&lat=${lat}&radius=${r}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(res.statusText);
  return res.json();
}
