/**
 * French copy for the first-run welcome, the help centre and the guided
 * tours (D-021). Kept out of fr.ts on purpose: fr.ts is the prototype's
 * copy, verbatim, and none of this exists in the prototype.
 *
 * Rule for every sentence here: describe what the product does today, and
 * say plainly what is not available yet (the capture Companion, automatic
 * dossier matching, Stripe, voice dictation). When a feature changes state
 * in STATUS.md, its guide changes in the same commit.
 */
export const helpFr = {
  button: "Aide & guides",
  welcome: {
    eyebrow: "Bienvenue",
    title: "Bienvenue dans ACTE.",
    intro: "Voici comment votre temps de travail devient du temps facturable, en trois gestes.",
    steps: [
      { title: "Créez vos dossiers", body: "Une affaire, un client et, si vous le souhaitez, un budget d'heures." },
      { title: "Saisissez et validez votre temps", body: "Dans le Journal, chaque tâche est rattachée à un dossier, puis validée d'un clic." },
      { title: "Exportez et facturez", body: "Le temps validé alimente l'export CSV et les brouillons de facture." },
    ],
    note: "La capture automatique depuis Word et Outlook (le Compagnon) n'est pas encore disponible : pour l'instant, le temps se saisit à la main dans le Journal.",
    start: "Démarrer la visite guidée",
    later: "Plus tard",
    footnote: "Les guides restent accessibles à tout moment depuis le bouton « ? » de la barre latérale.",
  },
  center: {
    eyebrow: "Aide",
    title: "Guides & premiers pas",
    intro: "Chaque guide vous montre une fonctionnalité pas à pas, directement dans l'application.",
    guidesTitle: "Guides pas à pas",
    currentView: "Vue actuelle",
    stepCount: (n: number) => `${n} étape${n > 1 ? "s" : ""}`,
    replayWelcome: "Revoir le message de bienvenue",
  },
  checklist: {
    title: "Premiers pas",
    progress: (done: number, total: number) => `${done} / ${total}`,
    go: "Y aller",
    optional: "facultatif",
    doneAria: "Fait",
    todoAria: "À faire",
    items: {
      rate: {
        title: "Définir votre taux horaire",
        hint: "Sans taux, tous les montants restent à 0 €. Console Admin → menu « ⋯ » de votre ligne → Modifier le profil / Taux horaire.",
      },
      dossier: { title: "Créer un premier dossier", hint: "Vue Dossiers → « + Nouveau Dossier »." },
      task: { title: "Saisir une première tâche", hint: "Bouton « + » du Journal : intitulé, dossier, heure de début et durée." },
      validate: { title: "Valider votre temps", hint: "« Valider » sur une ligne du Journal : le temps devient facturable." },
      invite: { title: "Inviter votre équipe", hint: "Console Admin → « + Inviter un membre »." },
    },
  },
  tour: {
    eyebrow: "Guide",
    progress: (n: number, total: number) => `${n} / ${total}`,
    next: "Suivant",
    back: "Précédent",
    done: "Terminer",
    quit: "Quitter le guide",
  },
  guides: {
    overview: {
      title: "Tour d'horizon",
      summary: "L'essentiel de l'interface en une minute.",
      steps: {
        tabs: {
          title: "Trois onglets pour l'essentiel",
          body: "Accueil résume votre journée. Journal réunit le temps à valider. Facturation transforme le temps validé en brouillons de facture et en export.",
        },
        rail: {
          title: "Les autres vues",
          body: "La barre latérale ouvre le Journal, les Dossiers, les Statistiques et Cloud & Synchronisation. Les Paramètres sont tout en bas.",
        },
        journal: {
          title: "Votre journal du jour",
          body: "Le temps saisi attend ici votre validation. Le bouton « + » ajoute une tâche à la main.",
        },
        brain: {
          title: "Le Cerveau d'ACTE",
          body: "Une synthèse de votre journée, l'activité récente et des réponses à vos questions sur votre temps. Sur petit écran, il s'ouvre avec le bouton « IA ».",
        },
        bell: { title: "Vos alertes", body: "La cloche vous prévient quand un dossier approche de son budget d'heures." },
        prefs: { title: "Langue et thème", body: "Passez du français à l'anglais, et du mode sombre au mode clair." },
        profile: {
          title: "Votre menu",
          body: "Votre profil, votre clé d'activation et la déconnexion.",
          bodyAdmin: "Votre profil, votre clé d'activation, la Console Admin du cabinet et la déconnexion.",
        },
        help: { title: "Aide & guides", body: "Chaque vue a son guide pas à pas. Revenez ici à tout moment." },
      },
    },
    home: {
      title: "Accueil",
      summary: "Vos indicateurs du jour et de la semaine.",
      steps: {
        kpis: {
          title: "Vos trois indicateurs",
          body: "Le temps du jour, validé et en attente. Le chiffre d'affaires sécurisé du mois : votre temps validé multiplié par votre taux horaire. Le troisième (ROI) ne compte que le temps capturé automatiquement, pas encore disponible : la saisie manuelle n'y entre pas.",
        },
        journal: {
          title: "Le journal du jour",
          body: "Les tâches en attente de validation. Vous pouvez les valider ici, sans quitter l'Accueil.",
        },
        week: { title: "Votre semaine", body: "Le temps validé, jour par jour, du lundi au dimanche." },
        capture: {
          title: "Capture passive",
          body: "Les sources que surveillera le Compagnon de capture : Word, Outlook et le navigateur. Le Compagnon n'est pas encore disponible : aucune capture automatique n'a lieu pour l'instant.",
        },
      },
    },
    journal: {
      title: "Journal",
      summary: "Saisir, rattacher et valider votre temps.",
      steps: {
        list: { title: "Le temps à valider", body: "Chaque ligne est une tâche : son intitulé, son horaire et sa durée." },
        days: {
          title: "D'un jour à l'autre",
          body: "Les flèches affichent le journal d'un autre jour. Les tâches des jours précédents restées en attente apparaissent aussi sous celles d'aujourd'hui : rien ne se perd.",
        },
        manual: {
          title: "Saisie manuelle",
          body: "Ajoutez une tâche avec son intitulé, son dossier, sa date, son heure de début et sa durée. Elle apparaît aussitôt dans le journal.",
        },
        dossier: {
          title: "Le bon dossier",
          body: "Cliquez sur le dossier d'une ligne pour la rattacher à un autre ; elle porte alors la mention « Corrigé ✓ ». Les dossiers archivés ne sont pas proposés.",
        },
        confidence: {
          title: "Source et confiance",
          body: "Vos saisies portent la mention « Manuel ». Le temps capturé automatiquement, à venir, affichera un score de confiance : sous 80 %, la mention « à vérifier » vous invite à contrôler le dossier.",
        },
        validate: {
          title: "Valider",
          body: "Un clic valide la tâche : son temps devient facturable et s'ajoute au total de son dossier.",
        },
        menu: {
          title: "Modifier ou supprimer",
          body: "Le menu « ⋯ » d'une tâche en attente permet de la modifier ou de la supprimer. Une tâche supprimée n'est pas facturée, et la suppression est définitive.",
        },
        batch: {
          title: "Tout intégrer",
          body: "Dès que deux tâches ou plus sont en attente, une barre en bas du journal permet de valider d'un geste toutes celles qui sont affichées.",
        },
        validated: {
          title: "Revenir sur une validation",
          body: "La section « Validées » liste le temps déjà validé du jour affiché. « Annuler » remet une tâche en attente, tant que son temps ne figure pas sur une facture.",
        },
      },
    },
    dossiers: {
      title: "Dossiers",
      summary: "Créer un dossier, suivre son budget et son statut.",
      steps: {
        create: {
          title: "Créer un dossier",
          body: "Un nom, un client et, si vous le souhaitez, un budget. Le dossier est aussitôt proposé dans le Journal.",
        },
        card: {
          title: "Lire une carte",
          body: "Le temps validé sur le dossier, la part du budget consommée, son statut et sa dernière activité. S'il reste du temps à valider, un lien vous ramène au Journal.",
        },
        menu: {
          title: "Budget et statut",
          body: "Le menu « ••• » renomme le dossier, ajuste son budget d'heures et change son statut : En cours, Prêt à facturer ou Archivé. Un dossier archivé ne reçoit plus de temps ; vous pouvez le restaurer.",
        },
        alert: { title: "Alerte de budget", body: "À partir de 80 % du budget consommé, une alerte apparaît sous la cloche." },
      },
    },
    billing: {
      title: "Facturation",
      summary: "Du temps validé au brouillon de facture et à l'export.",
      steps: {
        drafts: {
          title: "Les dossiers à facturer",
          body: "Chaque dossier facturable ayant du temps validé apparaît ici, avec ce qu'il reste à facturer. S'il lui reste du temps en attente, validez-le d'abord dans le Journal.",
        },
        generate: {
          title: "Générer un brouillon",
          body: "« Générer la facture » crée un brouillon numéroté à partir du temps validé qui n'a pas encore été facturé : un même temps n'est jamais facturé deux fois. Le fichier téléchargé est un document de démonstration, pas une facture à envoyer.",
        },
        total: { title: "Brouillons en attente", body: "Le total des brouillons déjà générés." },
        export: {
          title: "Export CSV",
          body: "Votre temps validé, ligne par ligne, dans un fichier compatible Excel : date, dossier, intitulé, durée, taux et montant.",
        },
      },
    },
    stats: {
      title: "Statistiques",
      summary: "Ce que représente votre temps validé.",
      steps: {
        revenue: {
          title: "CA sécurisé par mois",
          body: "Le temps validé de chacun des six derniers mois, valorisé au taux horaire en vigueur au moment de sa validation.",
        },
        kpis: {
          title: "Taux et temps du mois",
          body: "Votre taux horaire, et le temps saisi ce mois-ci avec la part passée sur des dossiers facturables.",
        },
        sources: {
          title: "Répartition par source",
          body: "D'où vient votre temps validé du mois : la saisie manuelle aujourd'hui ; Word, Outlook et le navigateur quand le Compagnon de capture sera disponible.",
        },
        invisible: {
          title: "Le temps invisible",
          body: "Une estimation, pas une mesure : ce que représenteraient 30 minutes oubliées par jour sur 210 jours facturables, à votre taux horaire.",
        },
      },
    },
    brain: {
      title: "Le Cerveau d'ACTE",
      summary: "Synthèse, activité récente et questions sur votre temps.",
      steps: {
        insights: {
          title: "Analyse",
          body: "Quelques phrases sur ce que vous regardez : l'analyse change avec la vue affichée — journal, dossiers, statistiques, facturation.",
        },
        integrate: {
          title: "À intégrer",
          body: "Quand du temps attend sur un dossier, le Cerveau propose de l'intégrer d'un geste, ou d'afficher les tâches concernées.",
        },
        activity: {
          title: "Activité récente",
          body: "Vos dernières actions : validations, dossiers créés ou modifiés, brouillons de facture.",
          bodyAdmin:
            "Vos dernières actions : validations, dossiers créés ou modifiés, brouillons de facture. En tant qu'administrateur, vous voyez aussi les actions d'administration du cabinet.",
        },
        chat: {
          title: "Posez une question",
          body: "Demandez un résumé de votre journée ou posez une question sur votre temps et vos dossiers. N'y collez jamais le contenu d'un document ou d'un courriel. Le micro est une démonstration : la dictée vocale n'est pas encore disponible.",
        },
      },
    },
    notifications: {
      title: "Alertes",
      summary: "Ce qui déclenche une alerte, et comment la traiter.",
      steps: {
        triggers: {
          title: "Ce qui déclenche une alerte",
          body: "Un dossier dont le budget d'heures est consommé à 80 % ou plus.",
          bodyAdmin:
            "Un dossier dont le budget d'heures est consommé à 80 % ou plus ; une tâche d'un membre en attente depuis plus de 48 h ; une invitation restée sans réponse depuis 48 h.",
        },
        read: {
          title: "Lire et marquer",
          body: "Ouvrez la cloche, puis cliquez sur une alerte pour la marquer comme lue, ou utilisez « Tout marquer comme lu ». Une alerte se referme d'elle-même quand sa cause est réglée. Un e-mail quotidien peut aussi vous signaler les alertes en attente : il se règle dans les Paramètres.",
        },
      },
    },
    profile: {
      title: "Mon Profil",
      summary: "Votre fiche et la clé d'activation du Compagnon.",
      steps: {
        card: {
          title: "Votre fiche",
          body: "Votre rôle, votre taux horaire et votre adresse. Le taux horaire se modifie dans la Console Admin, par un administrateur du cabinet.",
        },
        report: {
          title: "Bilan personnel",
          body: "Le bilan mensuel détaillé arrivera avec l'association automatique des tâches aux dossiers, à venir.",
        },
        highlights: {
          title: "Vos temps forts du mois",
          body: "Votre meilleure journée, le dossier qui a pris le plus de votre temps, et le nombre de tâches de moins de 10 minutes que vous avez saisies ce mois-ci.",
        },
        keys: {
          title: "Clé d'activation",
          body: "Elle servira à lier le Compagnon de capture à votre poste, dès qu'il sera disponible. Une clé ne s'affiche qu'une fois, à sa création : copiez-la aussitôt. Vous pouvez la révoquer à tout moment.",
        },
      },
    },
    cloud: {
      title: "Cloud & Synchronisation",
      summary: "Les appareils liés et la protection de vos données.",
      steps: {
        devices: {
          title: "Appareils liés",
          body: "Les postes reliés à votre compte par le Compagnon de capture. La liste reste vide tant que le Compagnon n'est pas disponible.",
        },
        secrecy: {
          title: "Secret professionnel",
          body: "Le contenu de vos documents et de vos courriels ne quitte jamais votre poste. Les noms de dossier, les libellés client et les intitulés de tâche sont chiffrés sur nos serveurs, avec une clé propre à votre cabinet.",
        },
        export: {
          title: "Exporter mes données",
          body: "Téléchargez à tout moment vos propres données dans un fichier JSON.",
        },
      },
    },
    settings: {
      title: "Paramètres",
      summary: "Sources de capture, taux horaire et confidentialité.",
      steps: {
        sources: {
          title: "Sources surveillées",
          body: "Activez ou suspendez Word, Outlook et le navigateur. Votre choix est enregistré ; il s'appliquera à l'arrivée du Compagnon de capture.",
        },
        rate: {
          title: "Mon taux horaire",
          body: "Affiché ici en lecture seule : un administrateur du cabinet le modifie depuis la Console Admin. Un nouveau taux s'applique au temps validé ensuite, pas à celui déjà validé.",
        },
        alerts: {
          title: "Alertes par e-mail",
          body: "Recevez, ou non, un e-mail par jour au plus lorsque des alertes vous attendent. Il n'en donne que le nombre : le détail reste dans l'application.",
        },
        password: {
          title: "Mot de passe",
          body: "Changez votre mot de passe en indiquant l'actuel. Vos autres sessions sont alors fermées.",
        },
        privacy: {
          title: "Confidentialité",
          body: "Le rappel de ce qu'ACTE ne collecte jamais : le contenu de vos documents, de vos courriels et des pages que vous consultez.",
        },
      },
    },
    admin: {
      title: "Console Admin",
      summary: "Équipe, invitations, taux horaires et abonnement.",
      steps: {
        kpis: {
          title: "Le cabinet en trois chiffres",
          body: "Le temps saisi par toute l'équipe ce mois-ci, sa valeur aux taux horaires de chacun, et le nombre de comptes actifs. Le crayon, à côté du nom du cabinet, permet de le renommer.",
        },
        invite: {
          title: "Inviter un membre",
          body: "Indiquez son adresse et son rôle : il reçoit par e-mail un lien pour créer son compte et rejoindre le cabinet. Tant qu'il n'a pas répondu, vous pouvez renvoyer ou annuler l'invitation.",
        },
        team: {
          title: "L'équipe",
          body: "Pour chaque membre : son taux, son temps saisi et la part qu'il a validée. Le menu « ⋯ » modifie le rôle ou le taux horaire — y compris le vôtre —, donne ou retire les droits d'administrateur, rappelle la validation, suspend ou réactive le compte. Vous voyez des totaux, jamais le détail des tâches d'un autre membre.",
        },
        subscription: {
          title: "Abonnement",
          body: "L'onglet « Abonnement Cabinet » compte vos licences d'après l'équipe. Le paiement, les factures d'abonnement et le portail Stripe y sont simulés : rien n'est prélevé.",
        },
        feedback: {
          title: "Vos retours",
          body: "L'onglet « Vos retours » transmet une idée, un bug ou une remarque à l'équipe ACTE ; les administrateurs de votre cabinet les voient aussi. N'y indiquez ni nom de client ni détail de dossier.",
        },
      },
    },
  },
};

export type HelpCopy = typeof helpFr;
