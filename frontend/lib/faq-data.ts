export type FAQItem = {
  number: string;
  question: string;
  answer: string[];
  takeaway: string;
};

export type FAQGroup = {
  id: string;
  title: string;
  subtitle: string;
  items: FAQItem[];
};

export const FAQ_GROUPS: FAQGroup[] = [
  {
    id: "demarche",
    title: "Comprendre la démarche",
    subtitle: "Pourquoi cette marche a-t-elle commencé et comment s’est-elle structurée ?",
    items: [
      {
        number: "01",
        question: "Pourquoi un processus de réunification de l’Église du Christianisme Céleste a-t-il été engagé ?",
        answer: [
          "L’Église du Christianisme Céleste partage une même origine, une même foi et un même héritage spirituel. Au fil des années, des difficultés liées notamment à la succession du Prophète Fondateur, à la reconnaissance des autorités et à la gouvernance ont cependant conduit à l’existence de plusieurs tendances et organisations.",
          "Le processus engagé vise à rétablir le dialogue, restaurer la confiance et permettre aux différentes composantes de se retrouver progressivement au sein d’une même Église, avec des références communes et une gouvernance durable.",
          "La finalité dépasse les seules questions d’organisation : permettre à l’Église de rendre pleinement son témoignage et d’accomplir sa mission, celle d’annoncer Jésus-Christ et de servir les hommes.",
        ],
        takeaway: "Retrouver l’unité pour mieux rendre témoignage de Jésus-Christ et accomplir la mission de l’Église.",
      },
      {
        number: "02",
        question: "Comment cette démarche de réunification a-t-elle commencé ?",
        answer: [
          "À partir du 20 février 2025, des rencontres ont été engagées entre les différentes sensibilités et autorités de l’Église, sous l’impulsion du Président Patrice TALON.",
          "L’objectif était de remettre les parties autour de la table, renouer le dialogue et rechercher les conditions d’une réconciliation durable.",
          "Ces premiers échanges ont fait apparaître la nécessité d’un cadre de transition organisé et représentatif. C’est ainsi qu’a été créé le Conseil Supérieur de Transition - CST.",
        ],
        takeaway: "Le point de départ : renouer le dialogue et créer les conditions d’une réconciliation durable.",
      },
    ],
  },
  {
    id: "transition-mise-en-oeuvre",
    title: "De la transition à la mise en œuvre",
    subtitle: "Comprendre les organes de transition et le rôle de la facilitation.",
    items: [
      {
        number: "03",
        question: "Que sont le CST et le CSMO, et quelles sont leurs missions ?",
        answer: [
          "Le Conseil Supérieur de Transition - CST a été installé le 26 avril 2025 avec quinze membres issus des différentes composantes et sensibilités de l’Église.",
          "Sa mission était de restaurer l’harmonie, travailler à la restructuration de l’Église, revoir et moderniser les textes, harmoniser les pratiques lorsque cela était nécessaire, préparer une gouvernance commune et durable et préserver les fondements spirituels hérités du Prophète Fondateur, Samuel Biléou Joseph OSHOFFA.",
          "Après cette phase de préparation, le Conseil Supérieur de Mise en Œuvre - CSMO a pris le relais. Il accompagne désormais la mise en œuvre des orientations retenues, leur explication et leur appropriation, et prépare l’installation progressive des institutions définitives de l’Église réunifiée.",
          "En termes simples : le CST a préparé le cadre de la réunification ; le CSMO accompagne maintenant sa mise en œuvre.",
        ],
        takeaway: "CST : préparer le cadre. CSMO : accompagner sa mise en œuvre.",
      },
      {
        number: "04",
        question: "Quel est le rôle du Facilitateur dans le processus ?",
        answer: [
          "Le Facilitateur accompagne le rapprochement entre les différentes tendances de l’Église.",
          "Son rôle consiste notamment à favoriser le dialogue, faciliter les rencontres, aider à dépasser certains blocages et créer les conditions permettant aux différentes sensibilités d’avancer ensemble.",
          "Cette mission de facilitation est distincte de la direction spirituelle et du gouvernement permanent de l’Église.",
          "La finalité est que les différentes tendances puissent progressivement se retrouver autour d’institutions communes et qu’à terme l’Église fonctionne durablement à travers ses propres organes et ses propres responsables, afin de se consacrer pleinement à sa mission : témoigner de Jésus-Christ.",
        ],
        takeaway: "Faciliter le rapprochement pour permettre à l’Église réunifiée de fonctionner durablement par ses propres institutions.",
      },
    ],
  },
  {
    id: "identite-spirituelle",
    title: "Préserver l’identité spirituelle",
    subtitle: "Une organisation commune au service de la vie spirituelle et de la mission.",
    items: [
      {
        number: "05",
        question: "Quelle place le Saint-Esprit occupe-t-il dans cette démarche et dans la future organisation de l’Église ?",
        answer: [
          "Le processus de réunification porte principalement sur les divisions qui ont affecté au fil du temps les relations, la gouvernance et le fonctionnement de l’Église.",
          "Il ne s’agit pas de créer une nouvelle unité spirituelle ni de remplacer la vie spirituelle de l’Église par des textes, des conseils ou des procédures.",
          "L’Église demeure appelée à vivre dans la prière, la recherche de la volonté de Dieu et la direction du Saint-Esprit. Les nouvelles institutions ont vocation à donner un cadre plus clair au fonctionnement de l’Église et à mieux servir sa mission.",
          "Ainsi, l’organisation de l’Église doit être au service de sa vie spirituelle et refléter davantage l’unité qu’elle est appelée à vivre.",
        ],
        takeaway: "L’organisation visible doit servir la vie spirituelle de l’Église et sa mission.",
      },
      {
        number: "06",
        question: "La réunification va-t-elle changer la foi ou l’héritage transmis par le Prophète Fondateur ?",
        answer: [
          "Le processus n’a pas pour objectif de créer une nouvelle Église ni une nouvelle foi.",
          "La mission confiée au CST était de moderniser l’organisation et les textes tout en préservant les fondements spirituels hérités du Prophète Fondateur, Samuel Biléou Joseph OSHOFFA.",
          "Le travail d’harmonisation a consisté à examiner ce qui devait être conservé, harmonisé, modernisé ou clarifié, ainsi que ce qui devait devenir commun à toute l’Église réunifiée.",
          "La démarche vise ainsi à concilier fidélité à l’identité spirituelle de l’Église et nécessité d’une organisation commune capable de durer.",
        ],
        takeaway: "Préserver l’héritage spirituel tout en harmonisant l’organisation nécessaire à l’unité.",
      },
    ],
  },
  {
    id: "eglise-reunifiee",
    title: "Construire l’Église réunifiée",
    subtitle: "Une organisation commune et des autorités légitimes.",
    items: [
      {
        number: "07",
        question: "Quelle organisation est prévue pour l’Église réunifiée ?",
        answer: [
          "Les travaux du CST ont conduit à l’élaboration d’une architecture comprenant notamment le Conseil d’Administration Mondial (CAM), le Comité Exécutif Mondial (CEM), le Conseil Pastoral (CP), le Synode et le Conclave.",
          "Le Sacré Collège est également appelé à jouer un rôle important dans les différentes étapes de la transition et de la mise en place des institutions.",
          "Cette organisation vise à mieux répartir les responsabilités et à construire un fonctionnement suffisamment solide pour éviter que les mêmes difficultés de gouvernance ne se reproduisent.",
          "L’objectif est notamment de pouvoir répondre clairement à des questions simples : qui fait quoi ? qui décide ? qui met en œuvre ? qui contrôle ? qui rend compte ?",
        ],
        takeaway: "Une gouvernance plus lisible, avec des responsabilités mieux réparties.",
      },
      {
        number: "08",
        question: "Comment seront désignées les futures autorités de l’Église réunifiée ?",
        answer: [
          "Le processus prévoit qu’après la mise en place des organes nécessaires, un Synode soit convoqué.",
          "Un Conclave spécial doit permettre de procéder au choix des principales autorités de l’Église réunifiée, notamment de l’unique Pasteur de l’Église du Christianisme Céleste, avant leur reconnaissance par le Synode.",
          "La démarche vise ainsi à passer progressivement d’une gouvernance de transition à une gouvernance ecclésiale reconnue, légitime et durable.",
          "L’objectif recherché est que les institutions définitives de l’Église prennent progressivement le relais des organes mis en place pour conduire la transition.",
        ],
        takeaway: "Passer de la transition à une gouvernance ecclésiale reconnue, légitime et durable.",
      },
    ],
  },
  {
    id: "servir-mission",
    title: "Servir la mission",
    subtitle: "Des responsables préparés et une gestion responsable des ressources.",
    items: [
      {
        number: "09",
        question: "Comment seront préparés ceux qui sont appelés au sacerdoce et aux responsabilités dans l’Église ?",
        answer: [
          "L’organisation de l’Église ne peut pas reposer uniquement sur des textes et des structures. Elle dépend également de la qualité des personnes appelées à servir.",
          "Les responsables doivent pouvoir être préparés à leur mission dans plusieurs dimensions : vie spirituelle, connaissance de la Parole, accompagnement pastoral, évangélisation, éthique, gestion et exercice responsable de l’autorité.",
          "Cette préparation doit permettre aux personnes appelées au sacerdoce et aux responsabilités de mieux remplir leur mission : annoncer l’Évangile, prendre soin des âmes, former les fidèles et contribuer à la sanctification du monde.",
          "Une Église mieux organisée a aussi besoin de serviteurs bien préparés à la mission qui leur est confiée.",
        ],
        takeaway: "Des serviteurs préparés spirituellement, pastoralement et humainement pour mieux accomplir la mission.",
      },
      {
        number: "10",
        question: "Comment seront gérés les finances, les ressources et le patrimoine de l’Église ?",
        answer: [
          "La réforme administrative et financière constitue l’un des grands chantiers du processus de réunification.",
          "Elle vise à renforcer la clarté, la responsabilité, la transparence et le contrôle dans la gestion des ressources et des biens de l’Église.",
          "L’organisation mise en place doit notamment permettre de savoir clairement qui reçoit les ressources, qui autorise les dépenses, comment elles sont utilisées, qui contrôle et comment les responsables rendent compte.",
          "Les ressources et le patrimoine de l’Église ont vocation à être administrés au service de sa mission, de son fonctionnement et de ses œuvres.",
        ],
        takeaway: "Des ressources gérées avec clarté et responsabilité, au service de la mission de l’Église.",
      },
    ],
  },
  {
    id: "mise-en-oeuvre",
    title: "Passer à la mise en œuvre",
    subtitle: "Où en sommes-nous et quelle part chacun peut-il prendre ?",
    items: [
      {
        number: "11",
        question: "Où en est aujourd’hui le processus de réunification et quel est le rôle actuel du CSMO ?",
        answer: [
          "Les travaux du CST ont permis de franchir plusieurs étapes importantes. Les principaux textes destinés à constituer le socle commun de l’Église réunifiée ont fait l’objet de travaux de relecture, d’harmonisation et de validation de principe, notamment la Constitution de l’Église unifiée, le Règlement intérieur, les textes organisant les organes de gouvernance et les textes relatifs au Synode et au Conclave.",
          "Des démarches de restitution et d’explication ont ensuite été engagées auprès des différentes composantes de l’Église.",
          "Le processus est aujourd’hui entré dans sa phase de mise en œuvre, portée par le CSMO. Cette étape consiste notamment à poursuivre le rapprochement des différentes tendances, favoriser l’appropriation du cadre commun et préparer progressivement la mise en place des institutions définitives.",
        ],
        takeaway: "Le CSMO porte aujourd’hui la phase de mise en œuvre et prépare le passage vers les institutions définitives.",
      },
      {
        number: "12",
        question: "Quelle place chaque chrétien peut-il prendre dans cette marche vers l’unité ?",
        answer: [
          "La réunification ne repose pas uniquement sur le Facilitateur, le CSMO ou les hauts responsables de l’Église.",
          "Chaque chrétien peut contribuer à cette démarche en cherchant à comprendre, en s’informant, en posant ses questions, en participant au dialogue et en évitant ce qui entretient inutilement les divisions.",
          "Il peut également y prendre part par la prière, le pardon, la recherche de la paix, la fraternité et le témoignage chrétien.",
          "Les institutions peuvent créer les conditions de la réunification. Mais l’unité prendra véritablement corps lorsque les responsables, les différentes composantes et les fidèles accepteront progressivement de se reconnaître, de se faire confiance et de marcher ensemble au service d’une même mission.",
        ],
        takeaway: "L’unité se construit aussi par la compréhension, la prière, la paix, la fraternité et le témoignage de chacun.",
      },
    ],
  },
];
