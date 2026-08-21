export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

// Chemin relatif (même origine que la page) : next.config.js proxifie /api,
// /uploads et /health vers la vraie API côté serveur — le navigateur ne voit
// qu'un seul domaine, donc le cookie de session est posé sur ce domaine et
// reste visible du middleware Next.js qui protège /app et /admin.
async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(path, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!res.ok) {
    let message = `Erreur ${res.status}`;
    try {
      const body = await res.json();
      if (body?.error) message = body.error;
    } catch {
      // réponse sans corps JSON exploitable
    }
    throw new ApiError(res.status, message);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "POST", body: body ? JSON.stringify(body) : undefined }),
  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "PATCH", body: body ? JSON.stringify(body) : undefined }),
  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
};

export async function uploaderPhoto(fichier: File): Promise<{ url: string }> {
  const formulaire = new FormData();
  formulaire.append("photo", fichier);

  const res = await fetch("/api/uploads/photo", {
    method: "POST",
    credentials: "include",
    body: formulaire,
  });

  if (!res.ok) {
    let message = `Erreur ${res.status}`;
    try {
      const body = await res.json();
      if (body?.error) message = body.error;
    } catch {
      // réponse sans corps JSON exploitable
    }
    throw new ApiError(res.status, message);
  }

  return res.json();
}
