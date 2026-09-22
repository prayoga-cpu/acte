/**
 * Demo data transcribed from prototype/acte-dashboard-v16.html (INITIAL_TEAM, INITIAL_DOSSIER_CARDS,
 * INITIAL_TASKS). Fictional. Used by the seed script so the seeded firm reproduces the prototype.
 * The prototype's "why" strings are deliberately omitted pending decision D-003.
 */
export const demoTeam = [
  { initials: "VC", displayName: "Me V. Charpentier", role: "associee",          minutes: 1455, validationRate: 96, status: "active",   isPartner: true,  rateEur: 280 },
  { initials: "PB", displayName: "Me P. Bône",        role: "associe",           minutes: 1900, validationRate: 92, status: "in_court", isPartner: true,  rateEur: 300 },
  { initials: "SO", displayName: "Me S. Okafor",      role: "collaboratrice",    minutes: 1685, validationRate: 89, status: "active",   isPartner: false, rateEur: 200 },
  { initials: "HD", displayName: "Me H. Djebbari",    role: "collaborateur",     minutes: 1590, validationRate: 94, status: "active",   isPartner: false, rateEur: 210 },
  { initials: "CL", displayName: "C. Lemoine",        role: "juriste_stagiaire", minutes: 1890, validationRate: 91, status: "active",   isPartner: false, rateEur: 120 },
] as const;

export const demoDossiers = [
  { key: "Bone",     name: "Bône c/ SCI Alma",              client: "Me P. Bône",            usedMin: 360,  budgetMin: 600,  status: "ready" },
  { key: "Delcourt", name: "Delcourt c/ Mutuelle Azur",     client: "M. J. Delcourt",        usedMin: 1233, budgetMin: 2100, status: "progress" },
  { key: "Toison",   name: "SARL Toison d\u2019Or — Bail",  client: "SARL Toison d\u2019Or", usedMin: 438,  budgetMin: 600,  status: "progress" },
  { key: "Marest",   name: "Succession Marest",             client: "Consorts Marest",       usedMin: 322,  budgetMin: 900,  status: "progress" },
  { key: "Vasseur",  name: "Vasseur — Cautionnement",       client: "Vasseur",               usedMin: 0,    budgetMin: null, status: "progress" },
  { key: "NF",       name: "Non facturable",                client: "",                      usedMin: 0,    budgetMin: null, status: "progress", billable: false },
] as const;

export const demoTasks = [
  { id: "t1", source: "word",    title: "Rédaction de conclusions — Delcourt c/ Mutuelle Azur",      start: "09:15", end: "10:32", min: 77, conf: 97, dossier: "Delcourt" },
  { id: "t2", source: "web",     title: "Recherche jurisprudence — cautionnement disproportionné",   start: "11:05", end: "11:28", min: 23, conf: 84, dossier: "Vasseur" },
  { id: "t3", source: "word",    title: "Projet de protocole transactionnel — Bône c/ SCI Alma",     start: "11:42", end: "12:12", min: 30, conf: 95, dossier: "Bone" },
  { id: "t4", source: "outlook", title: "Courriel de règlement amiable — Me Bône",                   start: "14:02", end: "14:17", min: 15, conf: 92, dossier: "Bone" },
  { id: "t5", source: "outlook", title: "Échanges confrère (Me Rivoal) — Succession Marest",         start: "15:40", end: "15:58", min: 18, conf: 89, dossier: "Marest" },
  { id: "t6", source: "word",    title: "Relecture bail commercial — SARL Toison d\u2019Or",         start: "16:20", end: "16:47", min: 27, conf: 76, dossier: "Toison" },
] as const;
