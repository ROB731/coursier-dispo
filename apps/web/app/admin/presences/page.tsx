"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/apiClient";
import { Entreprise, RegistreJourLigne, Site, TypeAbsence } from "@/lib/types";
import { useToast } from "@/components/ToastProvider";
import { SearchableSelect } from "@/components/SearchableSelect";
import { IconCheck, IconX } from "@/components/icons";

const LIBELLE_ABSENCE: Record<TypeAbsence, string> = {
  CONGE_PAYE: "Congé payé",
  MALADIE: "Maladie",
  CONGE_SANS_SOLDE: "Congé sans solde",
  AUTRE: "Autre",
};

const OPTIONS_ABSENCE = (Object.keys(LIBELLE_ABSENCE) as TypeAbsence[]).map((v) => ({ value: v, label: LIBELLE_ABSENCE[v] }));

function dateDuJour(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function PresencesPage() {
  const { showToast } = useToast();
  const [entreprises, setEntreprises] = useState<Entreprise[]>([]);
  const [entrepriseId, setEntrepriseId] = useState("");
  const [sites, setSites] = useState<Site[]>([]);
  const [siteId, setSiteId] = useState("");
  const [date, setDate] = useState(dateDuJour());
  const [registre, setRegistre] = useState<RegistreJourLigne[]>([]);
  const [chargement, setChargement] = useState(true);
  const [enSaisieAbsence, setEnSaisieAbsence] = useState<string | null>(null);
  const [typeAbsence, setTypeAbsence] = useState<TypeAbsence>("CONGE_PAYE");
  const [commentaire, setCommentaire] = useState("");

  useEffect(() => {
    api.get<Entreprise[]>("/api/entreprises").then((liste) => {
      setEntreprises(liste);
      setEntrepriseId(liste[0]?.id ?? "");
    });
  }, []);

  useEffect(() => {
    if (!entrepriseId) return;
    api.get<Site[]>(`/api/sites?entrepriseId=${entrepriseId}`).then((liste) => {
      setSites(liste);
      setSiteId("");
    });
  }, [entrepriseId]);

  async function chargerRegistre() {
    if (!entrepriseId) return;
    setChargement(true);
    const params = new URLSearchParams({ date });
    params.set("entrepriseId", entrepriseId);
    if (siteId) params.set("siteId", siteId);
    try {
      setRegistre(await api.get<RegistreJourLigne[]>(`/api/presences-employes/jour?${params.toString()}`));
    } finally {
      setChargement(false);
    }
  }

  useEffect(() => {
    chargerRegistre();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entrepriseId, siteId, date]);

  async function marquer(employeId: string, statut: "PRESENT" | "ABSENT", type?: TypeAbsence, note?: string) {
    await api.post("/api/presences-employes", {
      employeId,
      date,
      statut,
      typeAbsence: type,
      commentaire: note || undefined,
    });
    setEnSaisieAbsence(null);
    setCommentaire("");
    showToast(statut === "PRESENT" ? "Marqué présent" : "Marqué absent");
    chargerRegistre();
  }

  const presents = registre.filter((l) => l.presence?.statut === "PRESENT").length;
  const absents = registre.filter((l) => l.presence?.statut === "ABSENT").length;
  const nonRenseignes = registre.length - presents - absents;
  const estAujourdhui = date === dateDuJour();

  return (
    <div className="container">
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "0.75rem" }}>
        <h1 style={{ margin: 0 }}>
          Présences {!chargement && <span style={{ color: "var(--color-text-muted)", fontWeight: 400 }}>({registre.length})</span>}
        </h1>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "center" }}>
          {entreprises.length > 1 && (
            <div style={{ minWidth: "12rem" }}>
              <SearchableSelect options={entreprises.map((e) => ({ value: e.id, label: e.nom }))} value={entrepriseId} onChange={setEntrepriseId} />
            </div>
          )}
          {sites.length > 1 && (
            <div style={{ minWidth: "12rem" }}>
              <SearchableSelect
                options={[{ value: "", label: "Tous les sites" }, ...sites.map((s) => ({ value: s.id, label: s.nom }))]}
                value={siteId}
                onChange={setSiteId}
                placeholder="Tous les sites"
              />
            </div>
          )}
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={{ width: "auto", minHeight: "var(--touch-target)" }} />
        </div>
      </div>

      <p style={{ color: "var(--color-text-muted)", fontSize: "0.85rem" }}>
        {estAujourdhui ? "Registre du jour" : "Registre du " + new Date(date).toLocaleDateString("fr-FR", { dateStyle: "long" })} — présence des
        employés (indépendant du suivi des coursiers).
      </p>

      {!chargement && registre.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.6rem", margin: "1rem 0" }}>
          <span className="badge badge-disponible">{presents} présent{presents > 1 ? "s" : ""}</span>
          <span className="badge badge-non-disponible">{absents} absent{absents > 1 ? "s" : ""}</span>
          {nonRenseignes > 0 && <span className="badge badge-cloture">{nonRenseignes} non renseigné{nonRenseignes > 1 ? "s" : ""}</span>}
        </div>
      )}

      {chargement && <p style={{ color: "var(--color-text-muted)" }}>Chargement…</p>}

      {!chargement && registre.length === 0 && (
        <p style={{ color: "var(--color-text-muted)", marginTop: "1rem" }}>
          Aucun employé actif pour ce périmètre. Ajoutez-en depuis{" "}
          <a href="/admin/employes" className="link">
            Employés
          </a>
          .
        </p>
      )}

      {!chargement && registre.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
          {registre.map(({ employe, presence }) => (
            <div key={employe.id} className="card" style={{ padding: "0.75rem 1rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
                {employe.photoUrl ? (
                  <img src={employe.photoUrl} alt="" className="list-avatar" />
                ) : (
                  <div className="list-avatar" style={{ background: "var(--color-border)" }} />
                )}
                <div style={{ flex: "1 1 10rem", minWidth: 0 }}>
                  <strong>
                    {employe.prenom} {employe.nom}
                  </strong>
                  <div style={{ fontSize: "0.85rem", color: "var(--color-text-muted)" }}>
                    {[employe.poste, employe.site?.nom].filter(Boolean).join(" · ")}
                  </div>
                </div>

                <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                  {presence?.statut === "PRESENT" && <span className="badge badge-disponible">Présent</span>}
                  {presence?.statut === "ABSENT" && (
                    <span className="badge badge-non-disponible">
                      Absent{presence.typeAbsence ? ` · ${LIBELLE_ABSENCE[presence.typeAbsence]}` : ""}
                    </span>
                  )}
                  <button
                    type="button"
                    className={presence?.statut === "PRESENT" ? "btn btn-primary" : "btn btn-secondary"}
                    onClick={() => marquer(employe.id, "PRESENT")}
                    style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem" }}
                  >
                    <IconCheck size={14} /> Présent
                  </button>
                  <button
                    type="button"
                    className={presence?.statut === "ABSENT" ? "btn btn-primary" : "btn btn-secondary"}
                    onClick={() => setEnSaisieAbsence(enSaisieAbsence === employe.id ? null : employe.id)}
                    style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem" }}
                  >
                    <IconX size={14} /> Absent
                  </button>
                </div>
              </div>

              {enSaisieAbsence === employe.id && (
                <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "center", marginTop: "0.75rem", paddingTop: "0.75rem", borderTop: "1px solid var(--color-border)" }}>
                  <div style={{ minWidth: "11rem" }}>
                    <SearchableSelect options={OPTIONS_ABSENCE} value={typeAbsence} onChange={(v) => setTypeAbsence(v as TypeAbsence)} />
                  </div>
                  <input
                    placeholder="Commentaire (optionnel)"
                    value={commentaire}
                    onChange={(ev) => setCommentaire(ev.target.value)}
                    style={{ flex: "1 1 12rem", minHeight: "var(--touch-target)" }}
                  />
                  <button type="button" className="btn btn-primary" onClick={() => marquer(employe.id, "ABSENT", typeAbsence, commentaire)}>
                    Confirmer
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
