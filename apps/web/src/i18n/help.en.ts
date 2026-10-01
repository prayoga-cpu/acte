import type { HelpCopy } from "./help.fr";

/** English mirror of help.fr.ts — same keys, same signatures. The French copy is the source of truth. */
export const helpEn: HelpCopy = {
  button: "Help & guides",
  welcome: {
    eyebrow: "Welcome",
    title: "Welcome to ACTE.",
    intro: "Here is how your working time becomes billable time, in three steps.",
    steps: [
      { title: "Create your cases", body: "A matter, a client and, if you wish, an hours budget." },
      { title: "Enter and validate your time", body: "In the Journal, each task is linked to a case, then validated in one click." },
      { title: "Export and invoice", body: "Validated time feeds the CSV export and the invoice drafts." },
    ],
    note: "Automatic capture from Word and Outlook (the Companion) is not available yet: for now, time is entered by hand in the Journal.",
    start: "Start the guided tour",
    later: "Later",
    footnote: "The guides stay available at any time from the “?” button in the sidebar.",
  },
  center: {
    eyebrow: "Help",
    title: "Guides & first steps",
    intro: "Each guide walks you through one feature, step by step, right inside the app.",
    guidesTitle: "Step-by-step guides",
    currentView: "Current view",
    stepCount: (n: number) => `${n} step${n > 1 ? "s" : ""}`,
    replayWelcome: "Show the welcome message again",
  },
  checklist: {
    title: "First steps",
    progress: (done: number, total: number) => `${done} / ${total}`,
    go: "Go",
    optional: "optional",
    doneAria: "Done",
    todoAria: "To do",
    items: {
      rate: {
        title: "Set your hourly rate",
        hint: "Without a rate, every amount stays at €0. Admin Console → “⋯” menu on your row → Edit profile / hourly rate.",
      },
      dossier: { title: "Create a first case", hint: "Cases view → “+ New Case”." },
      task: { title: "Enter a first task", hint: "The “+” button in the Journal: title, case, start time and duration." },
      validate: { title: "Validate your time", hint: "“Validate” on a Journal row: the time becomes billable." },
      invite: { title: "Invite your team", hint: "Admin Console → “+ Invite a member”." },
    },
  },
  tour: {
    eyebrow: "Guide",
    progress: (n: number, total: number) => `${n} / ${total}`,
    next: "Next",
    back: "Back",
    done: "Finish",
    quit: "Leave the guide",
  },
  guides: {
    overview: {
      title: "Overview",
      summary: "The essentials of the interface in one minute.",
      steps: {
        tabs: {
          title: "Three tabs for the essentials",
          body: "Home sums up your day. Journal gathers the time to validate. Billing turns validated time into invoice drafts and an export.",
        },
        rail: {
          title: "The other views",
          body: "The sidebar opens the Journal, Cases, Statistics and Cloud & Sync. Settings are at the very bottom.",
        },
        journal: {
          title: "Today's journal",
          body: "The time you entered waits here for your validation. The “+” button adds a task by hand.",
        },
        brain: {
          title: "ACTE's Brain",
          body: "A summary of your day, recent activity and answers to your questions about your time. On a small screen, it opens with the “IA” button.",
        },
        bell: { title: "Your alerts", body: "The bell warns you when a case is nearing its hours budget." },
        prefs: { title: "Language and theme", body: "Switch between French and English, and between dark and light mode." },
        profile: {
          title: "Your menu",
          body: "Your profile, your activation key and sign-out.",
          bodyAdmin: "Your profile, your activation key, the firm's Admin Console and sign-out.",
        },
        help: { title: "Help & guides", body: "Every view has its step-by-step guide. Come back here at any time." },
      },
    },
    home: {
      title: "Home",
      summary: "Your figures for the day and the week.",
      steps: {
        kpis: {
          title: "Your three figures",
          body: "Today's time, validated and pending. The month's secured revenue: your validated time multiplied by your hourly rate. The third one (ROI) only counts automatically captured time, which is not available yet: manual entries are not part of it.",
        },
        journal: {
          title: "Today's journal",
          body: "The tasks awaiting validation. You can validate them here, without leaving Home.",
        },
        week: { title: "Your week", body: "Validated time, day by day, Monday to Sunday." },
        capture: {
          title: "Passive capture",
          body: "The sources the capture Companion will watch: Word, Outlook and the browser. The Companion is not available yet: no automatic capture takes place for now.",
        },
      },
    },
    journal: {
      title: "Journal",
      summary: "Enter, link and validate your time.",
      steps: {
        list: { title: "Time to validate", body: "Each row is a task: its title, its time range and its duration." },
        days: {
          title: "From one day to another",
          body: "The arrows show the journal of another day. Tasks from earlier days that are still pending also appear below today's: nothing gets lost.",
        },
        manual: {
          title: "Manual entry",
          body: "Add a task with its title, its case, its date, its start time and its duration. It shows up in the journal straight away.",
        },
        dossier: {
          title: "The right case",
          body: "Click the case on a row to link the task to another one; the row is then marked “Corrected ✓”. Archived cases are not offered.",
        },
        confidence: {
          title: "Source and confidence",
          body: "Your own entries are labelled “Manual”. Automatically captured time, coming later, will show a confidence score: below 80 %, the “to verify” label asks you to check the case.",
        },
        validate: {
          title: "Validate",
          body: "One click validates the task: its time becomes billable and is added to its case's total.",
        },
        menu: {
          title: "Edit or delete",
          body: "The “⋯” menu of a pending task lets you edit or delete it. A deleted task is not billed, and deletion cannot be undone.",
        },
        batch: {
          title: "Validate all",
          body: "As soon as two or more tasks are pending, a bar at the bottom of the journal lets you validate all the ones shown at once.",
        },
        validated: {
          title: "Undoing a validation",
          body: "The “Validated” section lists the time already validated for the day shown. “Undo” puts a task back to pending, as long as its time is not on an invoice.",
        },
      },
    },
    dossiers: {
      title: "Cases",
      summary: "Create a case, follow its budget and its status.",
      steps: {
        create: {
          title: "Create a case",
          body: "A name, a client and, if you wish, a budget. The case is offered in the Journal straight away.",
        },
        card: {
          title: "Reading a card",
          body: "The time validated on the case, the share of the budget used, its status and its last activity. If time is still awaiting validation, a link takes you back to the Journal.",
        },
        menu: {
          title: "Budget and status",
          body: "The “•••” menu renames the case, adjusts its hours budget and changes its status: In progress, Ready to bill or Archived. An archived case no longer receives time; you can restore it.",
        },
        alert: { title: "Budget alert", body: "From 80 % of the budget used, an alert appears under the bell." },
      },
    },
    billing: {
      title: "Billing",
      summary: "From validated time to an invoice draft and the export.",
      steps: {
        drafts: {
          title: "Cases to invoice",
          body: "Every billable case with validated time appears here, with what is left to invoice. If it still has pending time, validate it in the Journal first.",
        },
        generate: {
          title: "Generate a draft",
          body: "“Generate invoice” creates a numbered draft from the validated time that has not been invoiced yet: the same time is never invoiced twice. The downloaded file is a demonstration document, not an invoice to send.",
        },
        total: { title: "Pending drafts", body: "The total of the drafts already generated." },
        export: {
          title: "CSV export",
          body: "Your validated time, row by row, in an Excel-compatible file: date, case, title, duration, rate and amount.",
        },
      },
    },
    stats: {
      title: "Statistics",
      summary: "What your validated time represents.",
      steps: {
        revenue: {
          title: "Secured revenue by month",
          body: "The validated time of each of the last six months, valued at the hourly rate in force when it was validated.",
        },
        kpis: {
          title: "Rate and this month's time",
          body: "Your hourly rate, and the time entered this month with the share spent on billable cases.",
        },
        sources: {
          title: "Breakdown by source",
          body: "Where this month's validated time comes from: manual entry today; Word, Outlook and the browser once the capture Companion is available.",
        },
        invisible: {
          title: "Invisible time",
          body: "An estimate, not a measurement: what 30 forgotten minutes a day over 210 billable days would be worth at your hourly rate.",
        },
      },
    },
    brain: {
      title: "ACTE's Brain",
      summary: "Summary, recent activity and questions about your time.",
      steps: {
        insights: {
          title: "Analysis",
          body: "A few sentences about what you are looking at: the analysis changes with the view shown — journal, cases, statistics, billing.",
        },
        integrate: {
          title: "To validate",
          body: "When time is waiting on a case, the Brain offers to validate it all at once, or to show the tasks concerned.",
        },
        activity: {
          title: "Recent activity",
          body: "Your latest actions: validations, cases created or edited, invoice drafts.",
          bodyAdmin:
            "Your latest actions: validations, cases created or edited, invoice drafts. As an administrator, you also see the firm's administration actions.",
        },
        chat: {
          title: "Ask a question",
          body: "Ask for a summary of your day or a question about your time and your cases. Never paste the content of a document or an email here. The microphone is a demonstration: voice dictation is not available yet.",
        },
      },
    },
    notifications: {
      title: "Alerts",
      summary: "What triggers an alert, and how to handle it.",
      steps: {
        triggers: {
          title: "What triggers an alert",
          body: "A case whose hours budget is 80 % used or more.",
          bodyAdmin:
            "A case whose hours budget is 80 % used or more; a member's task pending for more than 48 h; an invitation left unanswered for 48 h.",
        },
        read: {
          title: "Read and mark",
          body: "Open the bell, then click an alert to mark it as read, or use “Mark all as read”. An alert closes by itself once its cause is resolved. A daily email can also tell you that alerts are waiting: it is set in Settings.",
        },
      },
    },
    profile: {
      title: "My Profile",
      summary: "Your details and the Companion's activation key.",
      steps: {
        card: {
          title: "Your details",
          body: "Your role, your hourly rate and your address. The hourly rate is changed in the Admin Console, by an administrator of the firm.",
        },
        report: {
          title: "Personal report",
          body: "The detailed monthly report will come with the automatic linking of tasks to cases, later on.",
        },
        highlights: {
          title: "Your highlights this month",
          body: "Your best day, the case that took most of your time, and the number of tasks under 10 minutes you entered this month.",
        },
        keys: {
          title: "Activation key",
          body: "It will link the capture Companion to your computer, as soon as it is available. A key is shown only once, when created: copy it straight away. You can revoke it at any time.",
        },
      },
    },
    cloud: {
      title: "Cloud & Sync",
      summary: "Linked devices and the protection of your data.",
      steps: {
        devices: {
          title: "Linked devices",
          body: "The computers linked to your account by the capture Companion. The list stays empty until the Companion is available.",
        },
        secrecy: {
          title: "Professional secrecy",
          body: "The content of your documents and emails never leaves your computer. Case names, client labels and task titles are encrypted on our servers, with a key specific to your firm.",
        },
        export: {
          title: "Export my data",
          body: "Download your own data as a JSON file at any time.",
        },
      },
    },
    settings: {
      title: "Settings",
      summary: "Capture sources, hourly rate and privacy.",
      steps: {
        sources: {
          title: "Monitored sources",
          body: "Turn Word, Outlook and the browser on or off. Your choice is saved; it will apply once the capture Companion arrives.",
        },
        rate: {
          title: "My hourly rate",
          body: "Shown here read-only: an administrator of the firm changes it from the Admin Console. A new rate applies to time validated afterwards, not to time already validated.",
        },
        alerts: {
          title: "Email alerts",
          body: "Receive, or not, one email a day at most when alerts are waiting for you. It only gives their number: the detail stays in the app.",
        },
        password: {
          title: "Password",
          body: "Change your password by entering the current one. Your other sessions are then closed.",
        },
        privacy: {
          title: "Privacy",
          body: "A reminder of what ACTE never collects: the content of your documents, your emails and the pages you visit.",
        },
      },
    },
    admin: {
      title: "Admin Console",
      summary: "Team, invitations, hourly rates and subscription.",
      steps: {
        kpis: {
          title: "The firm in three figures",
          body: "The time entered by the whole team this month, its value at each member's hourly rate, and the number of active accounts. The pencil next to the firm's name renames it.",
        },
        invite: {
          title: "Invite a member",
          body: "Enter their address and role: they receive an email link to create their account and join the firm. Until they answer, you can resend or cancel the invitation.",
        },
        team: {
          title: "The team",
          body: "For each member: their rate, their entered time and the share they validated. The “⋯” menu changes the role or the hourly rate — yours included —, grants or removes admin rights, sends a validation reminder, suspends or reactivates the account. You see totals, never the detail of another member's tasks.",
        },
        subscription: {
          title: "Subscription",
          body: "The “Firm subscription” tab counts your seats from the team. Payment, subscription invoices and the Stripe portal are simulated there: nothing is charged.",
        },
        feedback: {
          title: "Your feedback",
          body: "The “Your feedback” tab sends an idea, a bug or a remark to the ACTE team; your firm's administrators see it too. Do not include a client's name or any detail of a case.",
        },
      },
    },
  },
};
