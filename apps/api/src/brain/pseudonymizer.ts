/** Opaque reference for the dossier at `index` — the same one LlmChatContext uses. */
export const dossierRef = (index: number) => `D${index + 1}`;

/**
 * Words that, on their own, do not point at a client and are never
 * registered as a single word: French function words, legal forms and
 * civilities, matter types and legal vocabulary, the chat's own vocabulary,
 * and common words that also appear in company names. Folded (see foldChar).
 * A surname that is also one of these words (Petit, Grand, Lê → "le"…) is
 * masked only when the full dossier name or client label is typed — D-015.
 */
const STOP_WORDS = new Set(
  `de du des la le les l d en et au aux un une or ou a c s y qu que qui quoi dont par pour sur sous avec sans chez contre entre vers
  vs v the and of for to in on at by mon ma mes ton ta tes son sa ses notre nos votre vos leur leurs ce cet cette ces il elle ils elles
  on nous vous je tu me te se ne pas plus moins tres bien mal encore deja rien peu beaucoup fois tout tous toute toutes autre autres
  meme avant apres depuis pendant comme mais donc car ni si est sont ai as avons avez ont suis es etes sommes etait etre avoir fait
  faire faut peut dois doit combien quel quelle quels quelles quand comment pourquoi aujourd hui hier demain dernier derniere
  derniers dernieres prochain prochaine premier premiere second seconde nouveau nouvelle nouveaux nouvelles ancien ancienne
  grand grande grands grandes petit petite petits petites gros grosse haut bas nord sud est ouest centre general generale
  sci sarl sas sasu sa eurl snc scp scm selarl selas sca gie earl gaec cabinet societe societes ste ets etablissement
  etablissements groupe holding association asso syndicat copropriete commune mairie region departement etat ville
  me maitre mme mlle madame monsieur mr dr pr consorts epoux epouse veuve succession successions indivision heritiers
  bail baux commercial commerciale commerciaux cautionnement caution divorce licenciement contentieux precontentieux conseil
  conseils recouvrement assignation appel appels cassation refere transaction protocole accord contrat contrats litige
  liquidation redressement sauvegarde rappel dossier dossiers affaire affaires procedure procedures collective non facturable
  interne cession cessions parts sociales social sociale fiscal fiscale penal penale civil civile famille travail travaux
  vente ventes achat location immobilier immobiliere immo construction assurance assurances responsabilite accident
  prejudice indemnisation dommages distribution franchise concurrence propriete intellectuelle marque brevet donnees
  personnelles rgpd conformite compliance amiable rupture conventionnelle harcelement discrimination retraite donation
  testament garde pension adoption tutelle curatelle mandat creance creances impaye impayes impayee impayees supplementaire
  supplementaires sup partiel partielle bilan bilans audit consultation negociation acquisition fusion creation
  constitution statuts expertise mediation arbitrage defense plainte recours requete saisie marche marches public publics
  droit droits redaction relecture recherche recherches audience audiences reunion reunions note notes conclusions analyse
  projet projets amenagement territoire gestion service services prestation prestations compensatoire enfants parental
  tribunal cour chambre instance premiere tj tgi ca cph tc ta caa ce rg ref reference numero no n
  heure heures temps minute minutes jour jours journee semaine semaines mois annee annees budget budgets tache taches
  facture factures facturation honoraires validation valide validee validees valides valider saisi saisies capture
  capturee capturees attente journal total reste restant client clients rapport point resume plus mail mails lien liens
  france paris europe international banque credit mutuelle garage transports batiment industrie industries`.split(/\s+/).filter(Boolean),
);

/** Letters NFKD leaves alone (ligatures, stroke and hook letters), folded by hand. Keys are lowercase. */
const SPECIAL_LETTERS: Record<string, string> = {
  æ: "ae", œ: "oe", ß: "ss", ø: "o", ł: "l", đ: "d", ð: "d", þ: "th", ı: "i", ŀ: "l", ĳ: "ij", ς: "σ",
  ħ: "h", ŧ: "t", ƀ: "b", ƶ: "z", ȥ: "z", ɓ: "b", ɗ: "d", ɖ: "d", ƙ: "k", ƴ: "y", ɨ: "i", ʉ: "u", ǥ: "g", ƒ: "f",
  ƈ: "c", ƥ: "p", ƭ: "t", ʈ: "t", ɠ: "g", ɦ: "h", ɲ: "n", ŋ: "n", ɛ: "e", ɔ: "o", ə: "e", ʒ: "z", ɣ: "g", ʋ: "v", ɩ: "i",
};

const WORD = /^[\p{L}\p{N}]$/u;
const IGNORABLE = /^[\p{M}\p{Cf}\p{Default_Ignorable_Code_Point}]$/u;
/** Letters that are really apostrophes (modifier apostrophe, ʻokina, ʿayn…): word separators, like ' and ’. */
const APOSTROPHE_LETTERS = /^[\u02B9-\u02BF\u02C8]$/u;
/** Letters that decorate rather than spell: ordinal indicators (nº, ª) and the Arabic tatweel. They vanish. */
const VANISHING = /^[\u00BA\u00AA\u0640]$/u;
/** Apostrophe-like characters inside a name: registered both joined (N'Diaye → ndiaye) and split (n diaye). */
const INNER_APOSTROPHE = /(?<![\p{L}\p{M}\p{N}])[\p{L}\p{M}\p{N}]+(?:['’‘`´ʹʺʻʼʽʾʿˈ][\p{L}\p{M}\p{N}]+)+/gu;
/** Result of folding one code point: letters/digits, SEPARATOR, or "" (invisible: stays inside the current word). */
const SEPARATOR = " ";
const foldCache = new Map<string, string>();

/**
 * Folds one code point: accents, case and ligatures removed, special letters
 * mapped to their base letter. Anything that is not a letter or digit is a
 * separator (spaces, punctuation, quotes, symbols, emoji); marks and format
 * characters (soft hyphen, zero-width space/joiner) vanish.
 */
function foldChar(ch: string): string {
  const code = ch.charCodeAt(0);
  if (code < 0x80) {
    if ((code >= 0x61 && code <= 0x7a) || (code >= 0x30 && code <= 0x39)) return ch;
    if (code >= 0x41 && code <= 0x5a) return String.fromCharCode(code + 32);
    return SEPARATOR;
  }
  const cached = foldCache.get(ch);
  if (cached !== undefined) return cached;
  let folded: string;
  if (IGNORABLE.test(ch) || VANISHING.test(ch)) folded = "";
  else if (!WORD.test(ch) || APOSTROPHE_LETTERS.test(ch)) folded = SEPARATOR;
  else {
    const base = [...ch.normalize("NFKD").replace(/\p{M}/gu, "").toLowerCase()].map((c) => SPECIAL_LETTERS[c] ?? c).join("");
    // Keep expansion bounded (U+FDFA decomposes to 18 letters) and letters-only.
    folded = base && [...base].length <= 3 && /^[\p{L}\p{N}]+$/u.test(base) ? base : ch.toLowerCase();
  }
  // Bounded, and never stuck full: one firm's rare characters can't slow everyone else down for good.
  if (foldCache.size >= 100_000) foldCache.clear();
  foldCache.set(ch, folded);
  return folded;
}

// ---------- masks ----------

const TAG = 0xe000;
const TYPE_BASE = 0xe100;
const INDEX_BASE = 0xe200;
const PLACEHOLDER = /\uE000([\uE100-\uE1FF])([\uE200-\uF8FF])\uE001/g;
const EXTENSIONS =
  "docx?|docm|dotx?|pdf|xlsx?|xlsm|pptx?|od[tsp]|rtf|txt|msg|eml|csv|xml|json|zip|rar|7z|png|jpe?g|gif|tiff?|heic|bmp|pages|numbers|key|m4a|mp3|mp4|wav|mov|avi";
const TLDS = "fr|com|net|org|eu|be|ch|lu|de|es|it|uk|io|info|pro|legal|law|avocat";

/**
 * Applied to the original text before any name matching, each match swapped
 * for a private-use placeholder so nothing later can match inside it. Every
 * pattern is anchored at the start of its run (a lookbehind) and uses bounded
 * repeats, so a long run of letters or digits is scanned once: linear time.
 * `token: null` keeps an existing token as typed ("[lien]" typed or echoed back).
 */
const MASKS: { re: RegExp; token: string | null; needs: RegExp }[] = [
  { re: /\[(?:dossier|t[âa]che|lien|e-?mail|fichier|t[ée]l[ée]phone|num[ée]ro)\]/giu, token: null, needs: /\[/ },
  { re: /\b(?:https?|s?ftp|smb|file):\/\/\S+|\bwww\.\S+/giu, token: "[lien]", needs: /:\/\/|www\./i },
  { re: /(?<![\p{L}\p{M}\p{N}._%+'’-])[\p{L}\p{M}\p{N}._%+'’-]{1,64}@[\p{L}\p{M}\p{N}-]{1,63}(?:\.[\p{L}\p{M}\p{N}-]{1,63}){1,6}/gu, token: "[e-mail]", needs: /@/ },
  {
    // A whole whitespace-free run ending in an extension: apostrophes, &, commas, dots and folder paths included.
    re: new RegExp(`(?<![^\\s"«»“”<>\\[\\](){}])[^\\s"«»“”<>\\[\\](){}]{0,254}\\.(?:${EXTENSIONS})(?![\\p{L}\\p{N}])`, "giu"),
    token: "[fichier]",
    needs: /\./,
  },
  {
    re: new RegExp(`(?<![\\p{L}\\p{M}\\p{N}@.\\-])(?:[\\p{L}\\p{M}\\p{N}\\-]{1,63}\\.){1,5}(?:${TLDS})(?![\\p{L}\\p{N}])(?::\\d{1,5})?(?:\\/\\S*)?`, "giu"),
    token: "[lien]",
    needs: /\./,
  },
  {
    // International (+CC, 00CC, (+CC), optional "(0)") or French domestic 0X XX XX XX XX.
    re: /(?<![\p{N}+])(?:(?:(?:\+|00)\d{1,3}[\s.-]?(?:\(0\)[\s.-]?)?|\(\+\d{1,3}\)[\s.-]?)\d(?:[\s.-]?\d){6,12}|0\d(?:[\s.-]?\d){8})(?!\p{N})/gu,
    token: "[téléphone]",
    needs: /\d/,
  },
  { re: /\d{6,}/g, token: "[numéro]", needs: /\d/ },
];

function maskText(text: string): { masked: string; tokens: string[] } {
  const tokens: string[] = [];
  // NFC so masks see precomposed letters; invisible characters dropped so they can't split an address or a number.
  let masked = text.normalize("NFC").replace(/[\uE000-\uF8FF\p{Cf}\p{Default_Ignorable_Code_Point}]/gu, "");
  MASKS.forEach(({ re, token, needs }, type) => {
    if (!needs.test(masked)) return;
    masked = masked.replace(re, (match) => {
      tokens.push(token ?? match);
      return String.fromCharCode(TAG, TYPE_BASE + type, INDEX_BASE + tokens.length - 1, TAG + 1);
    });
  });
  return { masked, tokens };
}

const unmask = (text: string, tokens: string[]) => text.replace(PLACEHOLDER, (_, _type: string, n: string) => tokens[n.charCodeAt(0) - INDEX_BASE] ?? "");

// ---------- words ----------

interface Words {
  words: string[];
  /** UTF-16 span of each word in the text it came from. */
  start: number[];
  end: number[];
}

/**
 * Splits text into folded words with their spans in the original. A mask
 * placeholder is one word of its own, keyed by mask type, so a stored task
 * title containing a phone number matches the same title typed with any
 * phone number.
 */
function toWords(text: string): Words {
  const words: string[] = [];
  const start: number[] = [];
  const end: number[] = [];
  let current = "";
  let currentStart = 0;
  let currentEnd = 0;
  const flush = () => {
    if (current) {
      words.push(current);
      start.push(currentStart);
      end.push(currentEnd);
      current = "";
    }
  };
  let i = 0;
  while (i < text.length) {
    if (text.charCodeAt(i) === TAG && text.charCodeAt(i + 3) === TAG + 1) {
      flush();
      words.push(text.slice(i, i + 2));
      start.push(i);
      end.push(i + 4);
      i += 4;
      continue;
    }
    const cp = text.codePointAt(i)!;
    const ch = String.fromCodePoint(cp);
    const next = i + ch.length;
    const f = foldChar(ch);
    if (f === "") {
      if (current) currentEnd = next;
    } else if (f === SEPARATOR) {
      flush();
    } else {
      if (!current) currentStart = i;
      current += f;
      currentEnd = next;
    }
    i = next;
  }
  flush();
  return { words, start, end };
}

const isPlaceholderWord = (w: string) => w.charCodeAt(0) === TAG;

/**
 * Phrases are looked up by an incremental double hash over interned word ids,
 * so extending a candidate by one word is O(1) and a scan stops at the first
 * word sequence that is not the prefix of any phrase. Word ids are compared
 * exactly on a hash hit, so a collision can't produce a wrong match.
 */
const H1 = 2_147_483_629;
const H2 = 2_097_143;
const nextH1 = (h: number, id: number) => (h * 1_000_003 + id + 1) % H1;
const nextH2 = (h: number, id: number) => (h * 65_599 + id + 7) % H2;
const hashKey = (h1: number, h2: number) => h1 * 2_097_152 + h2;

/** A phrase key is at most this many words; a longer phrase is keyed by its first words. */
const MAX_PHRASE_WORDS = 60;
/** Fail closed past this many registered words: better no LLM call than an incompletely masked one. */
const MAX_REGISTERED_WORDS = 300_000;
/** …or past this many characters of names, labels and titles, which bounds the build work itself. */
const MAX_INPUT_CHARS = 1_200_000;

function merge(a: string | undefined, b: string): string {
  if (a === undefined || a === b) return b;
  if (a === "[tâche]") return b;
  if (b === "[tâche]") return a;
  return "[dossier]";
}

/**
 * Swaps what ACTE knows to be client-identifying for opaque tokens before any
 * text reaches the LLM provider, and swaps dossier refs back in the reply
 * (D-015):
 * - each dossier's full name and client label → its ref `[Dn]` (`[dossier]`
 *   when two dossiers share it);
 * - each word of those that is not a STOP_WORD → the same ref when it looks
 *   like a proper name (capitalised, no lowercase, or a digit, or the phrase
 *   has no proper casing), otherwise `[dossier]` — masked but not attributed;
 *   plus apostrophe-joined forms (N'Diaye → Ndiaye) and reference numbers;
 * - the member's task titles typed word for word → `[tâche]`;
 * - links (http(s), (s)ftp, smb, file, www, bare domains with a common TLD),
 *   e-mail addresses, whitespace-free filenames and paths with a common
 *   extension, phone numbers (French and international formats) and 6+ digit
 *   runs → a mask.
 * Words are compared folded: diacritics (NFKD plus a table of special
 * letters), case, ligatures and invisible characters are ignored on both
 * sides; punctuation and spacing only separate words.
 *
 * Best effort on free text: see D-015's residual risk for what goes out as
 * typed. That is why the chat is off by default and production OPEN.
 */
export class Pseudonymizer {
  private readonly wordIds = new Map<string, number>();
  private readonly prefixes = new Set<number>();
  private readonly phrases = new Map<number, { ids: number[]; replacement: string }[]>();
  private maxPhraseWords = 0;
  private readonly nameByRef = new Map<string, string>();
  private registered = 0;
  /** False past MAX_INPUT_CHARS or MAX_REGISTERED_WORDS: the caller must not send anything. */
  readonly complete: boolean = true;

  constructor(dossiers: readonly { name: string; clientLabel: string }[], taskTitles: readonly string[] = []) {
    const inputChars = dossiers.reduce((n, d) => n + d.name.length + d.clientLabel.length, 0) + taskTitles.reduce((n, t) => n + t.length, 0);
    if (inputChars > MAX_INPUT_CHARS) {
      this.complete = false;
      return;
    }
    try {
      dossiers.forEach((d, i) => {
        const ref = `[${dossierRef(i)}]`;
        this.nameByRef.set(dossierRef(i), d.name);
        for (const phrase of [d.name, d.clientLabel]) this.addPhraseAndWords(phrase, ref);
      });
      for (const title of taskTitles) this.addTitle(title);
    } catch (e) {
      if (!(e instanceof TooManyNames)) throw e;
      this.complete = false;
    }
  }

  private addPhraseAndWords(phrase: string, ref: string) {
    const { masked } = maskText(phrase);
    const { words, start, end } = toWords(masked);
    if (words.length === 0) return;
    // A name made only of stop words ("Petit", "Grand Est") would garble every question.
    if (words.some((w) => !STOP_WORDS.has(w))) this.addPhrase(words, ref);
    // A word with an inner apostrophe, typed with or without it: N'Diaye → "n diaye" and "ndiaye".
    for (const token of masked.match(INNER_APOSTROPHE) ?? []) {
      const split = toWords(token).words;
      const joined = split.join("");
      if (joined.length < 3 || STOP_WORDS.has(joined) || split.every((w) => STOP_WORDS.has(w))) continue;
      this.addPhrase(split, ref);
      this.addPhrase([joined], ref);
    }
    // Reference numbers: two or more adjacent number groups (RG 21/04567, 2024-0187), or one of 5+ digits.
    const isNumber = (w: string) => /^\p{N}+$/u.test(w);
    for (let k = 0; k < words.length; k++) {
      if (!isNumber(words[k]!)) continue;
      let last = k;
      while (last + 1 < words.length && isNumber(words[last + 1]!)) last++;
      if (last > k) this.addPhrase(words.slice(k, last + 1), ref);
      for (let g = k; g <= last; g++) if (words[g]!.length >= 5) this.addPhrase([words[g]!], ref);
      k = last;
    }

    const originals = words.map((_, k) => masked.slice(start[k], end[k]));
    const candidates = words
      .map((w, k) => ({ w, original: originals[k]! }))
      .filter(({ w }) => !isPlaceholderWord(w) && w.length >= 2 && !STOP_WORDS.has(w) && !/^\p{N}+$/u.test(w));
    const hasProperCasing = candidates.some(({ original }) => /\p{Lu}/u.test(original) && /\p{Ll}/u.test(original));
    for (const { w, original } of candidates) {
      // Name-like: any capital (Delcourt, bioMérieux, BNP), no lowercase at all (caseless scripts), or a digit.
      const nameLike = !hasProperCasing || /\p{Lu}/u.test(original) || !/\p{Ll}/u.test(original) || /\p{N}/u.test(original);
      this.addPhrase([w], nameLike ? ref : "[dossier]");
    }
  }

  private addTitle(title: string) {
    const { words } = toWords(maskText(title).masked);
    // A title made only of common words ("Budget", "Réunion") would garble every question.
    if (words.some((w) => isPlaceholderWord(w) || (w.length >= 2 && !STOP_WORDS.has(w)))) this.addPhrase(words, "[tâche]");
  }

  private addPhrase(allWords: readonly string[], replacement: string) {
    const words = allWords.slice(0, MAX_PHRASE_WORDS);
    this.registered += words.length;
    if (this.registered > MAX_REGISTERED_WORDS) throw new TooManyNames();
    const ids = words.map((w) => {
      let id = this.wordIds.get(w);
      if (id === undefined) this.wordIds.set(w, (id = this.wordIds.size));
      return id;
    });
    let h1 = 0;
    let h2 = 0;
    for (const id of ids) {
      h1 = nextH1(h1, id);
      h2 = nextH2(h2, id);
      this.prefixes.add(hashKey(h1, h2));
    }
    const key = hashKey(h1, h2);
    const bucket = this.phrases.get(key) ?? [];
    const same = bucket.find((p) => p.ids.length === ids.length && p.ids.every((id, k) => id === ids[k]));
    if (same) same.replacement = merge(same.replacement, replacement);
    else bucket.push({ ids, replacement });
    this.phrases.set(key, bucket);
    this.maxPhraseWords = Math.max(this.maxPhraseWords, ids.length);
  }

  /** Longest registered phrase starting at word `i` (ids: -1 for a word no phrase contains). */
  private longestAt(ids: readonly number[], i: number): { length: number; replacement: string } | null {
    let best: { length: number; replacement: string } | null = null;
    let h1 = 0;
    let h2 = 0;
    const limit = Math.min(this.maxPhraseWords, ids.length - i);
    for (let length = 1; length <= limit; length++) {
      const id = ids[i + length - 1]!;
      if (id < 0) break;
      h1 = nextH1(h1, id);
      h2 = nextH2(h2, id);
      const key = hashKey(h1, h2);
      if (!this.prefixes.has(key)) break;
      for (const p of this.phrases.get(key) ?? []) {
        if (p.ids.length === length && p.ids.every((pid, k) => pid === ids[i + k])) best = { length, replacement: p.replacement };
      }
    }
    return best;
  }

  redact(text: string): string {
    if (!this.complete) throw new TooManyNames();
    // A "[D12]" in typed text (a cote, a road, or a ref restore() left alone)
    // must not reach the model looking like a dossier ref.
    const { masked, tokens } = maskText(text.replace(/\[(D\d{1,5})\]/g, "$1"));
    const { words, start, end } = toWords(masked);
    const ids = words.map((w) => this.wordIds.get(w) ?? -1);
    let out = "";
    let copied = 0;
    let i = 0;
    while (i < words.length) {
      const match = this.longestAt(ids, i);
      if (!match) {
        i++;
        continue;
      }
      // A phrase that starts inside this match can reach further (a task title
      // beginning with a dossier name's last word): cover the union.
      let last = i + match.length;
      const replacements = [match.replacement];
      for (let k = i + 1; k < last; k++) {
        const inner = this.longestAt(ids, k);
        if (inner && k + inner.length > last) {
          last = k + inner.length;
          if (!replacements.includes(inner.replacement)) replacements.push(inner.replacement);
        }
      }
      out += masked.slice(copied, start[i]) + replacements.join(" ");
      copied = end[last - 1]!;
      i = last;
    }
    out += masked.slice(copied);
    return unmask(out, tokens);
  }

  /**
   * Only the bracketed form the prompt asks for: a bare "D12" in a reply is a
   * cote or a road, not a ref. With `allowedRefs`, only refs the model was
   * actually shown are restored, so a cote it bracketed by mistake stays as is. A restored name is padded with a space wherever
   * toWords would otherwise glue it to its neighbour (a letter, digit, mark or
   * invisible character), so it is masked again when the reply comes back as
   * history.
   */
  restore(text: string, allowedRefs?: ReadonlySet<string>): string {
    const glues = (ch: string | undefined) => ch !== undefined && foldChar(ch) !== SEPARATOR;
    return text
      .replace(/\](?=\[D\d+\])/g, "] ")
      .replace(/\[(D\d+)\]/g, (match, ref: string, offset: number, whole: string) => {
        const name = allowedRefs && !allowedRefs.has(ref) ? undefined : this.nameByRef.get(ref);
        if (name === undefined) return match;
        const before = offset > 0 ? String.fromCodePoint(codePointBefore(whole, offset)) : undefined;
        const afterCp = whole.codePointAt(offset + match.length);
        const after = afterCp === undefined ? undefined : String.fromCodePoint(afterCp);
        return `${glues(before) ? " " : ""}${name}${glues(after) ? " " : ""}`;
      });
  }
}

/** The code point ending just before `index` (a surrogate pair counts as one). */
function codePointBefore(s: string, index: number): number {
  const low = s.charCodeAt(index - 1);
  if (low >= 0xdc00 && low <= 0xdfff && index >= 2) {
    const high = s.charCodeAt(index - 2);
    if (high >= 0xd800 && high <= 0xdbff) return s.codePointAt(index - 2)!;
  }
  return low;
}

export class TooManyNames extends Error {
  constructor() {
    super("Too many names to mask");
  }
}
