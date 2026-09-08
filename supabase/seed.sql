-- Built at Albert — launch content
-- A board with nothing on it never restarts, so the platform opens with a real
-- backlog. Every idea is authored by the first admin and already published;
-- students arrive to something they can vote on immediately.
--
-- Run once, after the migrations:
--   psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1 -f supabase/seed.sql

do $$
declare
  seed_author uuid;
begin
  select id into seed_author from public.profiles where role = 'admin' order by created_at limit 1;

  if seed_author is null then
    raise exception 'No admin profile yet. Create the admin account first, then run this seed.';
  end if;

  insert into public.ideas (author_id, title, problem, description, language, tags, status, vote_count, published_at)
  values
    (seed_author, 'Un planning unifié des trois campus',
     'Les emplois du temps changent en cours de semaine et personne ne sait quelle version fait foi. On perd des cours et des salles.',
     'Un calendrier qui agrège les sources officielles et pousse une notification quand un créneau bouge.',
     'fr', array['planning','campus'], 'open', 34, now() - interval '12 days'),
    (seed_author, 'Trouver une salle libre en deux secondes',
     'Chercher une salle pour bosser en groupe se fait au hasard, étage par étage, entre deux cours.',
     'Une carte des salles avec leur occupation en temps réel, plus un bouton pour réserver 90 minutes.',
     'fr', array['campus','productivite'], 'open', 29, now() - interval '11 days'),
    (seed_author, 'Une banque d''annales par matière',
     'Les sujets des années précédentes circulent dans des conversations privées. Ceux qui ne connaissent personne n''y ont pas accès.',
     'Un dépôt commun, classé par matière et par promo, avec les corrigés quand ils existent.',
     'fr', array['revisions','equite'], 'open', 41, now() - interval '10 days'),
    (seed_author, 'Le vrai comparateur de stages',
     'Les offres de stage arrivent par mail, LinkedIn et bouche-à-oreille. Impossible de comparer salaire, missions et charge réelle.',
     'Une base alimentée par les retours d''anciens stagiaires : entreprise, missions réelles, encadrement, rémunération.',
     'fr', array['stage','carriere'], 'open', 52, now() - interval '9 days'),
    (seed_author, 'Un point unique pour les deadlines',
     'Chaque prof annonce ses rendus sur un support différent. On découvre un livrable la veille.',
     'Une page qui centralise tous les rendus à venir, triés par échéance, avec un rappel deux jours avant.',
     'fr', array['planning','revisions'], 'open', 38, now() - interval '9 days'),
    (seed_author, 'Covoiturage entre campus et gares',
     'Les horaires de cours ne collent pas aux transports en commun et beaucoup font le trajet en voiture à vide.',
     'Un tableau d''offres et de demandes de trajets, limité aux comptes de l''école.',
     'fr', array['transport','entraide'], 'open', 21, now() - interval '8 days'),
    (seed_author, 'Le menu de la cantine, la veille',
     'On découvre le menu en arrivant. Ceux qui ont des contraintes alimentaires n''ont aucun moyen d''anticiper.',
     'Le menu de la semaine, avec les allergènes et une indication des options végétariennes.',
     'fr', array['campus','quotidien'], 'open', 18, now() - interval '8 days'),
    (seed_author, 'Un annuaire des alumni par secteur',
     'Demander un café à un ancien suppose déjà de savoir qu''il existe et où il travaille.',
     'Un annuaire filtrable par secteur, entreprise et promo, avec un bouton de mise en relation.',
     'fr', array['carriere','reseau'], 'open', 33, now() - interval '7 days'),
    (seed_author, 'Générateur de plan de révision',
     'À trois semaines des partiels, on sait ce qu''il faut réviser mais pas comment répartir le temps.',
     'On entre ses matières, ses coefficients et ses dates, l''outil sort un planning réaliste et ajustable.',
     'fr', array['revisions','productivite'], 'open', 27, now() - interval '7 days'),
    (seed_author, 'Marché des manuels et du matériel',
     'Les manuels servent un semestre puis dorment. Les nouveaux les rachètent au prix fort.',
     'Petites annonces internes, avec photo et prix, réservées aux comptes de l''école.',
     'fr', array['quotidien','entraide'], 'open', 15, now() - interval '6 days'),
    (seed_author, 'Suivi de candidatures',
     'Entre les alternances et les stages, on gère trente candidatures dans un tableur qu''on ne tient plus.',
     'Un pipeline simple : postulé, entretien, réponse, avec les relances à faire cette semaine.',
     'fr', array['carriere','stage'], 'open', 30, now() - interval '6 days'),
    (seed_author, 'Un simulateur de moyenne',
     'On ne sait jamais ce qu''il faut avoir au dernier partiel pour valider le semestre.',
     'On entre ses notes et ses coefficients, l''outil dit ce qu''il reste à aller chercher.',
     'fr', array['notes','revisions'], 'open', 44, now() - interval '5 days'),
    (seed_author, 'Formation de groupes de projet',
     'Les groupes se forment par affinité et les mêmes se retrouvent toujours ensemble, avec les mêmes compétences.',
     'Un outil qui compose des groupes équilibrés à partir des compétences déclarées et des disponibilités.',
     'fr', array['projets','equite'], 'open', 19, now() - interval '5 days'),
    (seed_author, 'Le point sur les associations',
     'Les assos recrutent au forum de rentrée et ensuite plus rien. On rate les créneaux d''adhésion.',
     'Une page par association, avec ses événements à venir et ses ouvertures de recrutement.',
     'fr', array['vie-etudiante'], 'open', 12, now() - interval '4 days'),
    (seed_author, 'Réservation de créneaux avec les profs',
     'Prendre dix minutes avec un intervenant demande trois mails et finit rarement par un créneau.',
     'Chaque intervenant ouvre des créneaux, les élèves réservent, tout le monde reçoit une confirmation.',
     'fr', array['campus','productivite'], 'open', 23, now() - interval '4 days'),
    (seed_author, 'Bibliothèque de datasets pour les projets',
     'Chaque projet data commence par une chasse au dataset et se termine sur le même Kaggle que tout le monde.',
     'Une liste de jeux de données propres, décrits, avec ce qu''on peut en faire.',
     'fr', array['data','projets'], 'open', 26, now() - interval '3 days'),
    (seed_author, 'Relecture croisée entre élèves',
     'Personne ne relit son mémoire avant de le rendre, faute de relecteur disponible.',
     'On propose une relecture, on en reçoit une. Appariement automatique par matière.',
     'fr', array['entraide','revisions'], 'open', 17, now() - interval '3 days'),
    (seed_author, 'Suivi des dépenses de colocation',
     'Les comptes entre colocataires se règlent en fin de mois, mal, et ça finit en tension.',
     'Un partage de dépenses léger, sans compte bancaire, qui dit qui doit quoi à qui.',
     'fr', array['quotidien','entraide'], 'open', 14, now() - interval '2 days'),
    (seed_author, 'A shared glossary for the data courses',
     'The same concept has three names across three courses, and nobody says which is which.',
     'A short glossary maintained by students, one entry per concept, with the course it came from.',
     'en', array['data','revisions'], 'open', 20, now() - interval '2 days'),
    (seed_author, 'Anonymous course feedback',
     'End-of-term surveys land after the course is over, so nothing changes for the people who filled them in.',
     'Short mid-term feedback, anonymous, aggregated so a teacher sees a trend rather than one complaint.',
     'en', array['campus','equite'], 'open', 25, now() - interval '1 day'),
    (seed_author, 'Internship interview prep bank',
     'Everyone reinvents the same case-study prep two days before the interview.',
     'A bank of real interview questions by company, contributed by students who sat them.',
     'en', array['carriere','stage'], 'open', 31, now() - interval '1 day'),
    (seed_author, 'Un tableau des bourses et aides',
     'Les aides existent mais chacune a son site, ses dates et son vocabulaire. Beaucoup passent à côté.',
     'Un tableau des dispositifs applicables, avec les dates limites et ce qu''il faut fournir.',
     'fr', array['equite','quotidien'], 'open', 22, now() - interval '16 hours'),
    (seed_author, 'Un mur des projets en cours',
     'On apprend qu''un camarade bosse sur exactement le même sujet le jour de la soutenance.',
     'Un mur où chacun affiche ce qu''il construit en ce moment, pour croiser les efforts plus tôt.',
     'fr', array['projets','reseau'], 'open', 16, now() - interval '10 hours'),
    (seed_author, 'Rappels administratifs de rentrée',
     'Attestation, carte étudiante, convention de stage : chaque démarche a sa deadline et personne ne les connaît toutes.',
     'Une liste de démarches avec leur échéance et l''endroit exact où les faire.',
     'fr', array['quotidien','campus'], 'open', 13, now() - interval '4 hours')
  on conflict do nothing;

  raise notice 'Seeded % open ideas.', (select count(*) from public.ideas where status = 'open');
end;
$$;
