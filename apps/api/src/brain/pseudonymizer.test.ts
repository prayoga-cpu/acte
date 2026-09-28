import { describe, expect, it } from "vitest";
import { demoDossiers } from "@acte/contracts";
import { Pseudonymizer } from "./pseudonymizer.js";

// Same order as the seeded firm: D1 Bône, D2 Delcourt, D3 Toison d'Or, D4 Marest, D5 Vasseur, D6 Non facturable.
const pseudo = new Pseudonymizer(demoDossiers.map((d) => ({ name: d.name, clientLabel: d.client })));

const one = (name: string, clientLabel = "") => new Pseudonymizer([{ name, clientLabel }]);
const timed = <T>(fn: () => T): { value: T; ms: number } => {
  const started = performance.now();
  const value = fn();
  return { value, ms: performance.now() - started };
};

describe("Pseudonymizer (D-015)", () => {
  describe("dossier names and client labels", () => {
    it("replaces a full dossier name with its ref", () => {
      expect(pseudo.redact("Où en est Delcourt c/ Mutuelle Azur ?")).toBe("Où en est [D2] ?");
    });

    it("replaces a distinctive word, ignoring accents and case", () => {
      expect(pseudo.redact("combien sur BONE ce mois-ci")).toBe("combien sur [D1] ce mois-ci");
      expect(pseudo.redact("le dossier alma")).toBe("le dossier [D1]");
    });

    it("ignores punctuation, quotes and spacing inside a name", () => {
      expect(pseudo.redact("SARL Toison d'Or — Bail")).toBe("[D3]");
      expect(pseudo.redact("« SARL Toison d’Or-Bail »")).toBe("« [D3] »");
      expect(pseudo.redact("Delcourt\u00A0c/  Mutuelle\u202FAzur")).toBe("[D2]");
    });

    it("replaces a client label", () => {
      expect(pseudo.redact("les consorts Marest ont appelé")).toBe("les [D4] ont appelé");
    });

    it("masks a word two dossiers share without attributing it", () => {
      const shared = new Pseudonymizer([
        { name: "Martin c/ Banque Nord", clientLabel: "" },
        { name: "Martin — Divorce", clientLabel: "" },
      ]);
      expect(shared.redact("et Martin ?")).toBe("et [dossier] ?");
    });
  });

  describe("any diacritic, script or normalization form", () => {
    it.each(["Dvořák", "Kovačević", "Nguyễn", "Simões", "Wałęsa", "Şahin", "Țurcanu", "Mańko", "Wiśniewski", "Doğan", "Ștefănescu", "Šimić"])(
      "masks %s typed exactly as stored, and typed without accents",
      (surname) => {
        const p = one(`${surname} c/ Banque Nord`, `M. ${surname}`);
        expect(p.redact(`Où en est ${surname} ?`)).toBe("Où en est [D1] ?");
        const ascii = surname.normalize("NFKD").replace(/\p{M}/gu, "").replace("ł", "l");
        expect(p.redact(`Où en est ${ascii} ?`)).toBe("Où en est [D1] ?");
      },
    );

    it("folds ligatures, stroke and hook letters both ways", () => {
      expect(one("Lætitia Roux c/ Cœur Immobilier").redact("et Laetitia, et Coeur ?")).toBe("et [D1], et [D1] ?");
      expect(one("Laetitia Roux").redact("et Lætitia ?")).toBe("et [D1] ?");
      for (const [stored, typed] of [["Ħabib", "Habib"], ["Ƶelazny", "Zelazny"], ["Ɓello", "Bello"], ["Ɗangote", "Dangote"]]) {
        expect(one(`${stored} c/ Banque Nord`).redact(`et ${typed} ?`)).toBe("et [D1] ?");
      }
    });

    it("folds Greek final sigma", () => {
      expect(one("Οδυσσέας c/ Durand").redact("Et ΟΔΥΣΣΕΑΣ ?")).toBe("Et [D1] ?");
      expect(one("Παπαδόπουλος c/ Durand").redact("Et ΠΑΠΑΔΟΠΟΥΛΟΣ ?")).toBe("Et [D1] ?");
    });

    it("masks words of a name stored in NFD, typed in NFC or NFD", () => {
      const p = one("Bône c/ SCI Alma".normalize("NFD"), "Mme Hélène Lefèvre".normalize("NFD"));
      for (const word of ["Bône", "Hélène", "Lefèvre"]) {
        expect(p.redact(`et ${word} ?`)).toBe("et [D1] ?");
        expect(p.redact(`et ${word.normalize("NFD")} ?`)).toBe("et [D1] ?");
      }
    });

    it("keeps words with marks NFC cannot compose whole (Yoruba, Devanagari, Thai)", () => {
      const p = one("Olúwaṣẹ́un c/ Banque Nord", "M. Ọ̀ṣọ́dìpẹ̀");
      for (const typed of ["Olúwaṣẹ́un", "Oluwaseun", "Ọ̀ṣọ́dìpẹ̀", "Osodipe"]) expect(p.redact(`et ${typed} ?`)).toBe("et [D1] ?");
      expect(one("शर्मा c/ Banque Nord").redact("Et शर्मा ?")).toBe("Et [D1] ?");
      expect(one("สมศักดิ์ c/ Banque Nord").redact("Et สมศักดิ์ ?")).toBe("Et [D1] ?");
    });

    it("ignores soft hyphens and zero-width characters inside a name, typed or stored", () => {
      expect(pseudo.redact("Où en est Del\u00ADcourt ?")).toBe("Où en est [D2] ?");
      expect(pseudo.redact("Où en est Del\u200Bcourt ?")).toBe("Où en est [D2] ?");
      expect(one("Del\u00ADcourt c/ Mutuelle Azur").redact("Où en est Delcourt ?")).toBe("Où en est [D1] ?");
    });

    it("treats symbols as separators on both sides", () => {
      expect(one("Zorglub France").redact("Et Zorglub™ ?")).toBe("Et [D1]™ ?");
    });
  });

  describe("emoji and astral characters", () => {
    it("keeps every replacement aligned after emoji", () => {
      expect(pseudo.redact("😀 Où en est Delcourt ?")).toBe("😀 Où en est [D2] ?");
      expect(pseudo.redact("📊📊📊📊 Delcourt c/ Mutuelle Azur : 20 h 33 validées.")).toBe("📊📊📊📊 [D2] : 20 h 33 validées.");
      expect(pseudo.redact("Merci 🙏 et Delcourt")).toBe("Merci 🙏 et [D2]");
      // Invisible joiners and variation selectors are dropped from what is sent.
      expect(pseudo.redact("👨\u200D⚖\uFE0F audience Vasseur demain, et Marest ?")).toBe("👨⚖ audience [D5] demain, et [D4] ?");
      expect(pseudo.redact(`${"🙏".repeat(8)} Delcourt et Marest ?`)).toBe(`${"🙏".repeat(8)} [D2] et [D4] ?`);
    });

    it("matches a stored name containing an astral letter", () => {
      expect(one("𠮷野家 c/ Durand").redact("Et 𠮷野家 ?")).toBe("Et [D1] ?");
    });

    it("masks a restored reply with emoji when it comes back in history", () => {
      const p = new Pseudonymizer([{ name: "Quetzalcoatl c/ Zéphyrine Holding", clientLabel: "" }]);
      const restored = p.restore("Le dossier le plus proche de son budget 📊 : [D1]");
      expect(p.redact(restored)).toBe("Le dossier le plus proche de son budget 📊 : [D1]");
    });
  });

  describe("short, digit-bearing and lowercase names", () => {
    it("masks short surnames, short labels and tokens with digits", () => {
      expect(one("Li c/ Crédit Ouest", "M. Li").redact("Et le dossier archivé de Li ?")).toBe("Et le dossier archivé de [D1] ?");
      expect(one("EY c/ Durand", "EY").redact("Combien d'heures pour EY ce mois-ci ?")).toBe("Combien d'heures pour [D1] ce mois-ci ?");
      expect(one("SCI 2B Immo").redact("et 2B ?")).toBe("et [D1] ?");
      expect(one("3M France").redact("et 3M ?")).toBe("et [D1] ?");
    });

    it("masks lowercase surnames next to a legal form or acronym", () => {
      expect(one("SCI lemaire", "M. lemaire").redact("et lemaire ?")).toBe("et [D1] ?");
      expect(one("dupont c/ BNP").redact("et dupont ?")).toBe("et [D1] ?");
      expect(one("dupont c/ lemaire").redact("et lemaire ?")).toBe("et [D1] ?");
    });

    it("masks brands styled with a lowercase initial", () => {
      expect(one("bioMérieux c/ URSSAF", "bioMérieux SA").redact("Où en est bioMérieux ?")).toBe("Où en est [D1] ?");
      expect(one("Durand c/ eBay").redact("Et eBay ?")).toBe("Et [D1] ?");
      // Lowercase in a properly cased name: masked, but not attributed to a dossier.
      expect(one("leboncoin c/ Zorglub").redact("Et leboncoin ?")).toBe("Et [dossier] ?");
    });
  });

  describe("ordinary words", () => {
    it("leaves ordinary and domain words alone", () => {
      const p = new Pseudonymizer([
        { name: "Durand — Rappel d'heures supplémentaires", clientLabel: "M. Durand" },
        { name: "Factures impayées — Garage Morel", clientLabel: "Garage Morel" },
        { name: "Aménagement du territoire", clientLabel: "Région Grand Est" },
        { name: "Petit c/ Banque Nord", clientLabel: "Petit" },
        { name: "Budget Plus c/ Etat", clientLabel: "Mail Services" },
      ]);
      for (const q of [
        "Combien d'heures ai-je validées aujourd'hui ?",
        "Quelles factures puis-je émettre ?",
        "Où en est le dossier ?",
        "Quel est mon plus petit dossier ?",
        "Quel dossier est le plus proche de son budget ?",
        "Envoie-moi un mail, par e-mail si possible.",
      ]) {
        expect(p.redact(q)).toBe(q);
      }
      expect(p.redact("et Morel ?")).toBe("et [D2] ?");
      expect(p.redact("combien sur les baux et successions ?")).toBe("combien sur les baux et successions ?");
    });

    it("keeps small numbers from ordinary questions", () => {
      expect(pseudo.redact("mes 3 dernières heures de 2026")).toBe("mes 3 dernières heures de 2026");
    });
  });

  describe("masks", () => {
    it("masks e-mail addresses whole, before any dossier word inside them", () => {
      expect(pseudo.redact("écrire à contact@sci-alma.fr")).toBe("écrire à [e-mail]");
    });

    it("masks NFD text next to a filename or e-mail without cutting the name", () => {
      const p = one("Dvořák c/ Banque Nord", "M. Tomáš Dvořák");
      expect(p.redact("relire Dvořák_conclusions.pdf".normalize("NFD"))).toBe("relire [fichier]");
      // Text is sent in NFC.
      expect(p.redact("écrire à tomáš.dvořák@firm.cz".normalize("NFD"))).toBe("écrire à [e-mail]");
    });

    it("masks links, with or without a scheme", () => {
      expect(pseudo.redact("voir https://example.fr/affaire/123")).toBe("voir [lien]");
      expect(pseudo.redact("voir intranet.cabinet-roux.fr/marchetti")).toBe("voir [lien]");
    });

    it("masks filenames with common extensions", () => {
      expect(pseudo.redact("relire Assignation_Moreau_TGI.pdf et note.v2.docx")).toBe("relire [fichier] et [fichier]");
      for (const f of ["Conclusions_Martin.docm", "Pieces_Martin.heic", "Jugement_Martin.tif", "note_Martin.pages", "Bordereau_Martin.xlsm"]) {
        expect(pseudo.redact(`voir ${f}`)).toBe("voir [fichier]");
      }
    });

    it("masks French and international phone numbers, not dates", () => {
      for (const phone of ["06 12 34 56 78", "06.12.34.56.78", "0612345678", "+33 6 12 34 56 78", "+33 (0)6 12 34 56 78", "(+33) 6 12 34 56 78", "0033 6 12 34 56 78", "+32 2 555 12 34", "+44 20 7946 0958"]) {
        expect(pseudo.redact(`appeler le ${phone} demain`)).toBe("appeler le [téléphone] demain");
      }
      expect(pseudo.redact("le 05/06/2024 à 10:00 et le 05.06.2024")).toBe("le 05/06/2024 à 10:00 et le 05.06.2024");
    });

    it("masks long numbers", () => {
      expect(pseudo.redact("RG n° 2400123")).toBe("RG n° [numéro]");
    });

    it("keeps tokens already in the text as they are", () => {
      const p = new Pseudonymizer([
        { name: "Lien c/ Martin", clientLabel: "Mme Lien" },
        { name: "Mail Services SAS", clientLabel: "Mail Services" },
      ]);
      expect(p.redact("voir https://x.fr et écrire à a@b.fr")).toBe("voir [lien] et écrire à [e-mail]");
      // A typed "[D2]" loses its brackets, so the model can't take it for a dossier ref.
      expect(p.redact("tu as écrit [lien] et [e-mail], puis [D2]")).toBe("tu as écrit [lien] et [e-mail], puis D2");
    });
  });

  describe("task titles", () => {
    it("masks a task title typed in full, without attributing it", () => {
      const p = new Pseudonymizer([{ name: "Succession Marest", clientLabel: "Consorts Marest" }], [
        "Échanges confrère (Me Rivoal) — Succession Marest",
      ]);
      expect(p.redact("Temps sur « Échanges confrère (Me Rivoal) — Succession Marest » ?")).toBe("Temps sur « [tâche] » ?");
      expect(p.redact("Temps sur Échanges confrère(Me Rivoal)—Succession Marest ?")).toBe("Temps sur [tâche] ?");
    });

    it("masks a title that contains a phone, number, e-mail, link or filename", () => {
      const p = new Pseudonymizer([], [
        "Conclusions Zorglub RG 2400123",
        "Appel Me Zorglub au 06 12 34 56 78",
        "Relire note_Zorglub.docx pour Me Quaresma",
        "Écrire à zorglub@example.fr pour Me Wyvern",
      ]);
      expect(p.redact("Temps sur Conclusions Zorglub RG 2400123 ?")).toBe("Temps sur [tâche] ?");
      expect(p.redact("Temps sur Appel Me Zorglub au 06 12 34 56 78 ?")).toBe("Temps sur [tâche] ?");
      expect(p.redact("Temps sur Relire note_Zorglub.docx pour Me Quaresma ?")).toBe("Temps sur [tâche] ?");
      expect(p.redact("Temps sur Écrire à zorglub@example.fr pour Me Wyvern ?")).toBe("Temps sur [tâche] ?");
    });

    it("covers a title that starts inside a dossier name", () => {
      const p = new Pseudonymizer([{ name: "Succession Marest", clientLabel: "" }], ["Marest — appel Me Zorglub"]);
      expect(p.redact("Temps sur Succession Marest — appel Me Zorglub ?")).toBe("Temps sur [D1] [tâche] ?");
    });

    it("does not register a title made only of common words", () => {
      const p = new Pseudonymizer([], ["Budget", "Réunion", "Recherches"]);
      expect(p.redact("Quel dossier est le plus proche de son budget ?")).toBe("Quel dossier est le plus proche de son budget ?");
    });
  });

  describe("restore", () => {
    it("restores bracketed refs only, and leaves unknown ones", () => {
      expect(pseudo.restore("[D2] : 20 h 33 validées, [D9] inconnu.")).toBe("Delcourt c/ Mutuelle Azur : 20 h 33 validées, [D9] inconnu.");
    });

    it("leaves bare D<n> alone (cotes, roads)", () => {
      expect(pseudo.restore("La cote D12, la pièce D4 et la D906.")).toBe("La cote D12, la pièce D4 et la D906.");
    });

    it("separates refs written back to back, so the round trip stays masked", () => {
      const p = new Pseudonymizer([
        { name: "Dvořák c/ Banque Nord", clientLabel: "" },
        { name: "Nguyễn — Succession", clientLabel: "" },
      ]);
      const restored = p.restore("Les plus proches : [D1][D2].");
      expect(restored).toBe("Les plus proches : Dvořák c/ Banque Nord Nguyễn — Succession.");
      expect(p.redact(restored)).toBe("Les plus proches : [D1] [D2].");
    });

    it("masks a name the reply restored when it comes back in history (round trip)", () => {
      const p = new Pseudonymizer([
        { name: "Dvořák c/ Banque Nord", clientLabel: "M. Tomáš Dvořák" },
        { name: "Nguyễn — Succession", clientLabel: "Consorts Nguyễn" },
      ]);
      const restored = p.restore("[D1] est à 59 %, [D2] à 12 %.");
      expect(p.redact(restored)).toBe("[D1] est à 59 %, [D2] à 12 %.");
    });
  });

  describe("cost stays bounded", () => {
    it("is linear on a crafted name and a long run of spaces", () => {
      const p = one(`Ab${" ".repeat(40)}Cd`);
      const { ms } = timed(() => {
        expect(p.redact(`Ab${" ".repeat(3000)}Zz`)).toBe(`[D1]${" ".repeat(3000)}Zz`); // "Ab" alone is a name word
        expect(p.redact(`Ab${" ".repeat(3000)}Cd`)).toBe("[D1]");
      });
      expect(ms).toBeLessThan(200);
    });

    it("scans long runs of letters or digits once (masks are anchored)", () => {
      const { ms } = timed(() => {
        for (let i = 0; i < 9; i++) {
          pseudo.redact("a".repeat(4000));
          pseudo.redact("1".repeat(4000));
          pseudo.redact("a.".repeat(2000));
          pseudo.redact("Я".repeat(4000));
        }
      });
      expect(ms).toBeLessThan(500);
    });

    it("bounds NFKD expansion (U+FDFA) in names and text", () => {
      const crafted = Array.from({ length: 300 }, (_, i) => ({ name: `tag${i} ${"ﷺ".repeat(155)}`, clientLabel: `x${i} ${"ﷺ".repeat(155)}` }));
      const { value: p, ms: buildMs } = timed(() => new Pseudonymizer(crafted, Array.from({ length: 500 }, () => "ﷺ".repeat(200))));
      const { ms: redactMs } = timed(() => {
        for (let i = 0; i < 9; i++) p.redact("ﷺ".repeat(4000));
      });
      expect(buildMs).toBeLessThan(1000);
      expect(redactMs).toBeLessThan(500);
    });

    it("builds and runs fast enough for a large firm at maximum field sizes", () => {
      const many = Array.from({ length: 3000 }, (_, i) => ({
        name: `Client${i} ${"Partie ".repeat(20)}Nom${i}`.slice(0, 160),
        clientLabel: `Société Nom${i} ${"Filiale ".repeat(18)}`.slice(0, 160),
      }));
      const titles = Array.from({ length: 500 }, (_, i) => `Rédaction des conclusions numéro ${i} pour Client${i} ${"et suite ".repeat(20)}`.slice(0, 200));
      const { value: p, ms: buildMs } = timed(() => new Pseudonymizer(many, titles));
      const { ms: redactMs } = timed(() => {
        for (let i = 0; i < 9; i++) p.redact("Où en est Client42 ? ".repeat(190));
      });
      expect(p.complete).toBe(true);
      expect(buildMs).toBeLessThan(1500);
      expect(redactMs).toBeLessThan(500);
    });

    it("fails closed past the registration budget instead of masking some names only", () => {
      const huge = Array.from({ length: 6000 }, (_, i) => ({ name: `N${i} ${"mot ".repeat(39)}`, clientLabel: `L${i} ${"mot ".repeat(39)}` }));
      const p = new Pseudonymizer(huge);
      expect(p.complete).toBe(false);
      expect(() => p.redact("bonjour")).toThrow();
    });
  });

  // Review round 3.
  describe("edges found in round 3", () => {
    const kovacevic = new Pseudonymizer([
      { name: "Kovačević c/ Banque Nord", clientLabel: "" },
      { name: "Nguyễn — Succession", clientLabel: "" },
    ]);

    it.each([
      ["a keycap before a ref", "1️⃣[D1]"],
      ["a zero-width space before a ref", "Voir\u200B[D1]"],
      ["a soft hyphen before a ref", "Voir\u00AD[D1]"],
      ["an NFD letter before a ref", "Voiré".normalize("NFD") + "[D1]"],
      ["an astral letter before a ref", "𝐕𝐨𝐢𝐫[D1]"],
      ["a zero-width space after a ref", "[D1]\u200Bsuivant"],
      ["two refs joined by a zero-width space", "[D1]\u200B[D2]"],
      ["a letter right before a ref", "à[D1]"],
      ["an astral CJK letter before a ref", "𠮷[D2]"],
      ["an astral math letter after a ref", "[D1]𝐱"],
      ["a letter and a zero-width joiner before a ref", "a\u200D[D2]"],
    ])("keeps a restored name masked on the way back with %s", (_, reply) => {
      const back = kovacevic.redact(kovacevic.restore(reply));
      expect(back).not.toMatch(/Kova|Nguy|Banque|Succession/u);
    });

    it("restores only refs the model was shown, and never a typed cote", () => {
      expect(kovacevic.restore("[D1] et [D2]", new Set(["D1"]))).toBe("Kovačević c/ Banque Nord et [D2]");
      expect(kovacevic.redact("la cote [D12] et la D906")).toBe("la cote D12 et la D906");
    });

    it("treats modifier-letter apostrophes and the ʻokina as apostrophes", () => {
      const p = one("Teʻiva c/ Banque Nord");
      for (const typed of ["Teʻiva", "Teiva", "Te'iva", "Te’iva"]) expect(p.redact(`et ${typed} ?`)).toBe("et [D1] ?");
      expect(one("Dvořák c/ Banque Nord").redact("Relancer dʼDvořák ?")).toBe("Relancer dʼ[D1] ?");
    });

    it("masks a name with an inner apostrophe typed without it", () => {
      expect(one("N'Diaye c/ Banque Nord").redact("et Ndiaye ?")).toBe("et [D1] ?");
      expect(one("O’Brien c/ Durand").redact("et OBrien ?")).toBe("et [D1] ?");
      expect(one("N'Diaye c/ Banque Nord").redact("et N'Diaye ?")).toBe("et [D1] ?");
    });

    it("folds Latin iota, the tatweel and ordinal indicators", () => {
      expect(one("Kɩbɩ c/ Durand").redact("et Kibi ?")).toBe("et [D1] ?");
      expect(one("محمد c/ Durand").redact("et مـحـمـد ?")).toBe("et [D1] ?");
      const p = new Pseudonymizer([], ["Audience n° 3 Me Kerbrat"]);
      expect(p.redact("Audience nº 3 Me Kerbrat ?")).toBe("[tâche] ?");
    });

    it("masks an e-mail, phone or filename with an invisible character inside", () => {
      expect(pseudo.redact("jean.kerbrat\u00AD@gmail.com")).toBe("[e-mail]");
      expect(pseudo.redact("jean\u200B.kerbrat@gmail.com")).toBe("[e-mail]");
      expect(pseudo.redact("06\u00AD12 34 56 78")).toBe("[téléphone]");
      expect(pseudo.redact("Conclu\u200Bsions_Kerbrat.pdf")).toBe("[fichier]");
    });

    it("masks whole filenames and paths, whatever their punctuation", () => {
      for (const f of [
        "Bail_Kerbrat&Fils.pdf",
        "Kerbrat,Conclusions.docx",
        "Kerbrat–Conclusions.pdf",
        "Conclusions.Kerbrat.2024.03.15.v2.pdf",
        "Conclusions_Marchetti_d'appel.pdf",
        "S:\\Clients\\Marchetti\\Conclusions.docx",
        "/home/cabinet/Marchetti/pieces.pdf",
      ]) {
        expect(pseudo.redact(`voir ${f} demain`)).toBe("voir [fichier] demain");
      }
      expect(pseudo.redact("(voir Protocole_Wyvern.pdf)")).toBe("(voir [fichier])");
    });

    it("masks other link schemes, ports and apostrophes in e-mails", () => {
      expect(pseudo.redact("voir smb://srv/Marchetti et file:///C:/Marchetti")).toBe("voir [lien] et [lien]");
      expect(pseudo.redact("voir intranet.fr:8080/Marchetti")).toBe("voir [lien]");
      expect(pseudo.redact("écrire à marchetti.o'neil@roux.fr")).toBe("écrire à [e-mail]");
    });

    it("masks reference numbers from a dossier name, not ordinary numbers", () => {
      const p = one("Delcourt RG 21/04567", "Dossier 2024-0187");
      expect(p.redact("et RG 21/04567 ?")).toBe("et RG [D1] ?");
      expect(p.redact("et le 2024-0187 ?")).toBe("et le [D1] ?");
      expect(p.redact("et le 04567 ?")).toBe("et le [D1] ?");
      expect(p.redact("en 2024, 21 heures")).toBe("en 2024, 21 heures");
    });

    it("does not register a name made only of stop words", () => {
      const p = one("Aménagement du territoire", "Grand Est");
      expect(p.redact("Le plus grand est lequel ?")).toBe("Le plus grand est lequel ?");
    });

    it("keeps existing tokens in any case or accent form", () => {
      const p = new Pseudonymizer([
        { name: "Numéro Un c/ Durand", clientLabel: "" },
        { name: "SOS Téléphone", clientLabel: "" },
      ]);
      expect(p.redact("[Numéro] [numero] [Téléphone] [telephone]")).toBe("[Numéro] [numero] [Téléphone] [telephone]");
    });

    it("masks a title typed with a filename glued to a parenthesis", () => {
      const p = new Pseudonymizer([], ["Relecture (Protocole_Wyvern.pdf) avec Me Ybarra"]);
      expect(p.redact("Relecture(Protocole_Wyvern.pdf) avec Me Ybarra ?")).toBe("[tâche] ?");
    });

    it("stays fast at the input budget with one long non-Latin word per name (anchored apostrophe scan)", () => {
      const word = (i: number) => `Ж${i}${"жщю".repeat(51)}`.slice(0, 155);
      const dossiers = Array.from({ length: 3450 }, (_, i) => ({ name: word(i), clientLabel: word(i + 5000) }));
      const { value: p, ms } = timed(() => new Pseudonymizer(dossiers, Array.from({ length: 500 }, (_, i) => word(i + 9000))));
      expect(p.complete).toBe(true);
      expect(ms).toBeLessThan(1500);
    });

    it("fails closed on an oversized input before doing the work", () => {
      const huge = Array.from({ length: 74_000 }, (_, i) => ({ name: `Д${i}${"ж".repeat(150)}`, clientLabel: `Л${i}${"ж".repeat(150)}` }));
      const { value: p, ms } = timed(() => new Pseudonymizer(huge));
      expect(p.complete).toBe(false);
      expect(ms).toBeLessThan(100);
    });
  });
});
