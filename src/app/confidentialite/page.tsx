"use client";

import { LegalShell, type LegalDocument } from "@/components/legal/legal-shell";

const DOCUMENT: LegalDocument = {
  fr: {
    title: "Politique de confidentialité",
    updated: "Dernière mise à jour : 9 septembre 2026",
    blocks: [
      {
        heading: "Ce que la plateforme collecte",
        paragraphs: [
          "Un compte contient une adresse email de l'école, un nom, et facultativement une promo et un campus. Les deux derniers champs servent uniquement à filtrer les idées par campus et peuvent rester vides.",
          "Aux données de compte s'ajoute ce que vous publiez : vos idées, vos votes, vos réservations et vos fiches projet, avec leurs dates.",
        ],
      },
      {
        heading: "Ce qu'elle ne collecte pas",
        paragraphs: [
          "Aucun traceur publicitaire, aucun outil d'analyse d'audience, aucun cookie tiers. La plateforme ne dépose qu'un jeton de session dans le stockage local de votre navigateur, nécessaire pour vous garder connecté, et votre choix de langue.",
        ],
      },
      {
        heading: "Pourquoi, et sur quelle base",
        paragraphs: [
          "Les données servent à faire fonctionner la plateforme : vous identifier, empêcher qu'une idée soit réservée deux fois, et vous prévenir quand votre idée avance. La base légale est l'intérêt légitime de l'école à outiller sa communauté étudiante.",
          "Votre adresse email n'est jamais visible par les autres membres. Elle est masquée au niveau de la base de données, pas seulement dans l'interface.",
        ],
      },
      {
        heading: "Qui y a accès",
        paragraphs: [
          "Les autres membres voient votre nom, votre promo et votre campus à côté de ce que vous publiez. Les administrateurs de la plateforme voient en plus la file de modération et la liste des membres.",
          "Trois sous-traitants interviennent : Supabase pour la base et les comptes, à Francfort, Cloudflare pour la distribution des pages, et Resend pour l'envoi des emails, en Irlande. Aucune donnée n'est vendue ni transmise à un tiers à des fins commerciales.",
        ],
      },
      {
        heading: "Combien de temps",
        paragraphs: [
          "Les données de compte sont conservées tant que le compte existe. Les idées et les fiches projet restent après la suppression d'un compte, mais détachées de toute identité : elles s'affichent alors sans nom d'auteur.",
          "Ce choix évite qu'un départ efface les votes déposés par d'autres et fasse disparaître un outil qui fonctionne.",
        ],
      },
      {
        heading: "Vos droits",
        paragraphs: [
          "Vous disposez d'un droit d'accès, de rectification, d'effacement, de limitation et d'opposition sur vos données.",
          "La rectification se fait directement : votre nom, votre promo et votre campus sont modifiables depuis votre espace. L'effacement se fait depuis la même page, bouton Supprimer mon compte. Il retire immédiatement votre compte, vos votes et vos informations personnelles, et libère les idées que vous aviez réservées.",
          "Pour toute autre demande, écrire à ifrancois@albertschool.com. Vous pouvez également introduire une réclamation auprès de la CNIL.",
        ],
      },
    ],
  },
  en: {
    title: "Privacy policy",
    updated: "Last updated: 9 September 2026",
    blocks: [
      {
        heading: "What the platform collects",
        paragraphs: [
          "An account holds a school email address, a name, and optionally a class year and a campus. The last two are only used to filter ideas by campus and may be left empty.",
          "On top of the account, it stores what you publish: your ideas, your votes, your claims and your project cards, with their dates.",
        ],
      },
      {
        heading: "What it does not collect",
        paragraphs: [
          "No advertising trackers, no analytics, no third-party cookies. The platform only keeps a session token in your browser's local storage, needed to keep you signed in, and your language choice.",
        ],
      },
      {
        heading: "Why, and on what basis",
        paragraphs: [
          "The data exists to run the platform: to identify you, to stop one idea being claimed twice, and to tell you when your idea moves. The legal basis is the school's legitimate interest in equipping its student community.",
          "Your email address is never visible to other members. It is hidden at the database level, not only in the interface.",
        ],
      },
      {
        heading: "Who can see it",
        paragraphs: [
          "Other members see your name, class year and campus next to what you publish. Platform administrators additionally see the moderation queue and the member list.",
          "Three processors are involved: Supabase for the database and accounts, in Frankfurt, Cloudflare for serving pages, and Resend for sending email, in Ireland. No data is sold or passed to any third party for commercial purposes.",
        ],
      },
      {
        heading: "For how long",
        paragraphs: [
          "Account data is kept for as long as the account exists. Ideas and project cards remain after an account is deleted, but detached from any identity: they then show with no author name.",
          "This avoids one person leaving erasing votes other people cast and taking a working tool off the board.",
        ],
      },
      {
        heading: "Your rights",
        paragraphs: [
          "You have the right to access, correct, erase, restrict and object to the processing of your data.",
          "Correction is immediate: your name, class year and campus can be edited from your own space. Erasure is on the same page, under Delete my account. It removes your account, your votes and your personal details at once, and releases any idea you had claimed.",
          "For anything else, write to ifrancois@albertschool.com. You may also lodge a complaint with the CNIL.",
        ],
      },
    ],
  },
};

export default function PrivacyPage() {
  return <LegalShell document={DOCUMENT} />;
}
