/**
 * Contenus temporaires de la landing page.
 *
 * Les images restent dans /public/images. Le Hero consomme cette structure
 * plutôt que de coder ses images de fond dans le SCSS.
 */
export type HeroSlide = {
  eyebrow: string;
  title: string;
  lead: string;
  backgroundImage: string;
  primary: { label: string; href: string };
  secondary: { label: string; href: string };
  tone: "unity" | "cst" | "csmo";
};

export const HERO_SLIDES: HeroSlide[] = [
  {
    eyebrow: "La grande marche vers l’unité",
    title: "CST & CSMO — de la transition à la mise en œuvre",
    lead:
      "Une même dynamique au service de l’unité, de la gouvernance et de l’avenir de l’Église du Christianisme Céleste.",
    backgroundImage: "/images/home/hero-unite.jpeg",
    primary: { label: "Comprendre le processus", href: "#processus" },
    secondary: { label: "Découvrir le CST", href: "/presentation" },
    tone: "unity",
  },
  {
    eyebrow: "Conseil Supérieur de Transition",
    title: "Préparer le cadre de la réunification",
    lead:
      "Dialogue, harmonisation, consolidation des textes et préparation d’une gouvernance commune : le CST a conduit la phase de transition.",
    backgroundImage: "/images/home/hero-cst.jpg",
    primary: { label: "Découvrir le CST", href: "/presentation" },
    secondary: {
      label: "Voir le passage à la mise en œuvre",
      href: "#processus",
    },
    tone: "cst",
  },
  {
    eyebrow: "Conseil Supérieur de Mise en Œuvre",
    title: "Transformer les orientations en actions",
    lead:
      "Le CSMO accompagne désormais la mise en œuvre, l’appropriation des orientations retenues et la préparation progressive des institutions définitives.",
    backgroundImage: "/images/home/hero-csmo.jpg",
    primary: { label: "Comprendre le CSMO", href: "#processus" },
    secondary: { label: "Voir la digitalisation", href: "#digitalisation" },
    tone: "csmo",
  },
];
