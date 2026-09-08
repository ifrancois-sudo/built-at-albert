// Kept free of app imports: Pages Functions are bundled separately and do
// not resolve the "@/" alias.
export type Locale = "fr" | "en";

export interface EmailCopy {
  subject: string;
  heading: string;
  body: string[];
  ctaLabel?: string;
}

type Copy = Record<Locale, EmailCopy>;

const shortDate = (iso: string, locale: Locale) =>
  new Intl.DateTimeFormat(locale === "fr" ? "fr-FR" : "en-GB", {
    day: "numeric",
    month: "long",
  }).format(new Date(iso));

export function ideaApproved(title: string): Copy {
  return {
    fr: {
      subject: `Ton idée est en ligne : ${title}`,
      heading: "Ton idée est publiée",
      body: [
        `« ${title} » vient de passer la modération.`,
        "Elle est visible par toute l'école et ouverte aux votes.",
      ],
      ctaLabel: "Voir l'idée",
    },
    en: {
      subject: `Your idea is live: ${title}`,
      heading: "Your idea is published",
      body: [
        `"${title}" just cleared review.`,
        "The whole school can see it and vote for it.",
      ],
      ctaLabel: "View the idea",
    },
  };
}

export function ideaRejected(title: string, reason: string): Copy {
  return {
    fr: {
      subject: `Ton idée n'a pas été retenue : ${title}`,
      heading: "Ton idée n'a pas été retenue",
      body: [
        `« ${title} » n'a pas passé la modération.`,
        `Motif : ${reason}`,
        "Tu peux la reformuler et la reproposer.",
      ],
      ctaLabel: "Proposer une autre idée",
    },
    en: {
      subject: `Your idea was not accepted: ${title}`,
      heading: "Your idea was not accepted",
      body: [
        `"${title}" did not clear review.`,
        `Reason: ${reason}`,
        "You can rework it and post it again.",
      ],
      ctaLabel: "Post another idea",
    },
  };
}

export function claimConfirmed(title: string, expiresAt: string): Copy {
  return {
    fr: {
      subject: `Tu as réservé : ${title}`,
      heading: "Réservation confirmée",
      body: [
        `Tu as réservé « ${title} ».`,
        `Tu as jusqu'au ${shortDate(expiresAt, "fr")} pour livrer.`,
        "Si tu changes d'avis, libère l'idée pour que quelqu'un d'autre puisse la prendre.",
      ],
      ctaLabel: "Voir ma réservation",
    },
    en: {
      subject: `You claimed: ${title}`,
      heading: "Claim confirmed",
      body: [
        `You claimed "${title}".`,
        `You have until ${shortDate(expiresAt, "en")} to ship.`,
        "If you change your mind, release the idea so someone else can take it.",
      ],
      ctaLabel: "View my claim",
    },
  };
}

export function claimReminder(title: string, expiresAt: string, daysLeft: number): Copy {
  return {
    fr: {
      subject: `Il te reste ${daysLeft} jours sur : ${title}`,
      heading: "Ta réservation approche de la fin",
      body: [
        `« ${title} » expire le ${shortDate(expiresAt, "fr")}.`,
        "Si tu es toujours dessus, prolonge en un clic. Sinon, libère-la : elle repartira en libre automatiquement.",
      ],
      ctaLabel: "Prolonger ou libérer",
    },
    en: {
      subject: `${daysLeft} days left on: ${title}`,
      heading: "Your claim is running out",
      body: [
        `"${title}" expires on ${shortDate(expiresAt, "en")}.`,
        "Still on it? Extend in one click. If not, release it, otherwise it reopens automatically.",
      ],
      ctaLabel: "Extend or release",
    },
  };
}

export function claimExpiredForBuilder(title: string): Copy {
  return {
    fr: {
      subject: `Réservation expirée : ${title}`,
      heading: "Ta réservation a expiré",
      body: [
        `« ${title} » est repartie en libre.`,
        "Rien n'est perdu : si tu veux toujours la construire, tu peux la réserver à nouveau.",
      ],
      ctaLabel: "Revoir l'idée",
    },
    en: {
      subject: `Claim expired: ${title}`,
      heading: "Your claim expired",
      body: [
        `"${title}" is open again.`,
        "Nothing is lost: if you still want to build it, you can claim it again.",
      ],
      ctaLabel: "See the idea",
    },
  };
}

export function claimExpiredForAuthor(title: string): Copy {
  return {
    fr: {
      subject: `Ton idée est de nouveau disponible : ${title}`,
      heading: "Ton idée repart en libre",
      body: [
        `La personne qui avait réservé « ${title} » n'a pas livré dans le délai.`,
        "L'idée est de nouveau ouverte, quelqu'un d'autre peut la prendre.",
      ],
      ctaLabel: "Voir l'idée",
    },
    en: {
      subject: `Your idea is available again: ${title}`,
      heading: "Your idea is open again",
      body: [
        `Whoever claimed "${title}" did not ship in time.`,
        "The idea is open again and anyone can take it.",
      ],
      ctaLabel: "View the idea",
    },
  };
}

export function ideaClaimedForAuthor(title: string, builder: string): Copy {
  return {
    fr: {
      subject: `Quelqu'un construit ton idée : ${title}`,
      heading: "Ton idée a été réservée",
      body: [`${builder} vient de réserver « ${title} » et va la construire.`],
      ctaLabel: "Suivre l'idée",
    },
    en: {
      subject: `Someone is building your idea: ${title}`,
      heading: "Your idea has been claimed",
      body: [`${builder} just claimed "${title}" and is going to build it.`],
      ctaLabel: "Follow the idea",
    },
  };
}

export function ideaDeliveredForAuthor(title: string): Copy {
  return {
    fr: {
      subject: `Ton idée existe : ${title}`,
      heading: "Ton idée a été livrée",
      body: [`« ${title} » est construite et en ligne. Va l'essayer.`],
      ctaLabel: "Ouvrir l'outil",
    },
    en: {
      subject: `Your idea exists: ${title}`,
      heading: "Your idea has shipped",
      body: [`"${title}" is built and live. Go try it.`],
      ctaLabel: "Open the tool",
    },
  };
}

export function weeklyDigest(
  newIdeas: string[],
  releasedIdeas: string[],
  deliveredProjects: string[],
): Copy {
  const frBody: string[] = [];
  const enBody: string[] = [];

  if (newIdeas.length > 0) {
    frBody.push(`Nouvelles idées ouvertes : ${newIdeas.join(" · ")}`);
    enBody.push(`New open ideas: ${newIdeas.join(" · ")}`);
  }
  if (releasedIdeas.length > 0) {
    frBody.push(`Idées redevenues libres : ${releasedIdeas.join(" · ")}`);
    enBody.push(`Ideas back to open: ${releasedIdeas.join(" · ")}`);
  }
  if (deliveredProjects.length > 0) {
    frBody.push(`Outils livrés cette semaine : ${deliveredProjects.join(" · ")}`);
    enBody.push(`Tools shipped this week: ${deliveredProjects.join(" · ")}`);
  }

  return {
    fr: {
      subject: "Built at Albert — la semaine",
      heading: "Ce qui a bougé cette semaine",
      body: frBody,
      ctaLabel: "Ouvrir la plateforme",
    },
    en: {
      subject: "Built at Albert — this week",
      heading: "What moved this week",
      body: enBody,
      ctaLabel: "Open the platform",
    },
  };
}

export function pickCopy(copy: Copy, locale: Locale): EmailCopy {
  return copy[locale] ?? copy.fr;
}
