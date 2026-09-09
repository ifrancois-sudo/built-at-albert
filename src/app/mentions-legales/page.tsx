"use client";

import { LegalShell, type LegalDocument } from "@/components/legal/legal-shell";

const DOCUMENT: LegalDocument = {
  fr: {
    title: "Mentions légales",
    updated: "Dernière mise à jour : 9 septembre 2026",
    blocks: [
      {
        heading: "Éditeur",
        paragraphs: [
          "Built at Albert est une plateforme interne éditée pour Albert School et réservée aux membres de l'école.",
          "Responsable de la publication : Indy François. Contact : ifrancois@albertschool.com",
        ],
      },
      {
        heading: "Hébergement",
        paragraphs: [
          "Les pages du site sont servies par Cloudflare, Inc., 101 Townsend Street, San Francisco, CA 94107, États-Unis. Cloudflare ne distribue que des fichiers statiques et n'héberge aucune donnée personnelle au repos.",
          "Les comptes et les contenus sont hébergés par Supabase dans la région eu-central-1, à Francfort, en Allemagne. Les emails transactionnels sont envoyés par Resend depuis la région eu-west-1, en Irlande.",
        ],
      },
      {
        heading: "Propriété intellectuelle",
        paragraphs: [
          "Les idées, descriptions et fiches projet publiées sur la plateforme restent la propriété de leurs auteurs. En publiant, un membre autorise l'école à afficher son contenu sur la plateforme et à le citer dans une communication interne.",
          "Les outils construits par les élèves sont hébergés ailleurs et ne sont pas la propriété de l'école. La plateforme ne stocke qu'une fiche descriptive et un lien.",
        ],
      },
      {
        heading: "Responsabilité",
        paragraphs: [
          "Les liens vers les outils livrés pointent vers des services tiers que l'école ne contrôle pas. Elle ne peut être tenue responsable de leur contenu, de leur disponibilité ni des données qu'ils collectent.",
          "Pour signaler un contenu inapproprié, écrire à ifrancois@albertschool.com. Un administrateur peut retirer une idée ou dépublier une fiche projet à tout moment.",
        ],
      },
      {
        heading: "Droit applicable",
        paragraphs: [
          "Les présentes mentions sont soumises au droit français. Tout litige relève de la compétence des tribunaux français.",
        ],
      },
    ],
  },
  en: {
    title: "Legal notice",
    updated: "Last updated: 9 September 2026",
    blocks: [
      {
        heading: "Publisher",
        paragraphs: [
          "Built at Albert is an internal platform published for Albert School and restricted to members of the school.",
          "Responsible for publication: Indy François. Contact: ifrancois@albertschool.com",
        ],
      },
      {
        heading: "Hosting",
        paragraphs: [
          "The site's pages are served by Cloudflare, Inc., 101 Townsend Street, San Francisco, CA 94107, United States. Cloudflare only distributes static files and holds no personal data at rest.",
          "Accounts and content are hosted by Supabase in region eu-central-1, Frankfurt, Germany. Transactional email is sent by Resend from region eu-west-1, Ireland.",
        ],
      },
      {
        heading: "Intellectual property",
        paragraphs: [
          "Ideas, descriptions and project cards published on the platform remain the property of their authors. By publishing, a member allows the school to display that content on the platform and to quote it in internal communication.",
          "Tools built by students are hosted elsewhere and are not the property of the school. The platform stores only a description and a link.",
        ],
      },
      {
        heading: "Liability",
        paragraphs: [
          "Links to delivered tools point at third-party services the school does not control. It cannot be held responsible for their content, their availability, or the data they collect.",
          "To report inappropriate content, write to ifrancois@albertschool.com. An administrator can remove an idea or unpublish a project card at any time.",
        ],
      },
      {
        heading: "Applicable law",
        paragraphs: [
          "This notice is governed by French law. Any dispute falls under the jurisdiction of the French courts.",
        ],
      },
    ],
  },
};

export default function LegalNoticePage() {
  return <LegalShell document={DOCUMENT} />;
}
