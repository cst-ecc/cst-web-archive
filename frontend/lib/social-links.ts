export type SocialIconName =
    | "facebook"
    | "tiktok"
    | "youtube"
    | "instagram"
    | "x"
    | "linkedin"
    | "whatsapp";

export type SocialLink = {
    name: string;
    href: string;
    icon: SocialIconName;
    ariaLabel: string;
    enabled?: boolean;
};

/**
 * Liens officiels des réseaux sociaux CST/CSM/ECC.
 *
 * Remplacer les URLs ci-dessous par les liens officiels définitifs.
 * Pour masquer temporairement un réseau, mettre enabled: false.
 */
export const SOCIAL_LINKS: SocialLink[] = [
    {
        name: "Facebook",
        href: "https://www.facebook.com/p/Conseil-Sup%C3%A9rieur-de-Transition-de-lECC-61576670195180/",
        icon: "facebook",
        ariaLabel: "Voir notre page Facebook",
        enabled: true,
    },
    {
        name: "TikTok",
        href: "https://www.tiktok.com/@csm_ecc",
        icon: "tiktok",
        ariaLabel: "Voir notre compte TikTok",
        enabled: true,
    },
    // {
    //     name: "YouTube",
    //     href: "https://www.youtube.com/",
    //     icon: "youtube",
    //     ariaLabel: "Voir notre chaîne YouTube",
    //     enabled: true,
    // },
    // {
    //     name: "Instagram",
    //     href: "https://www.instagram.com/",
    //     icon: "instagram",
    //     ariaLabel: "Voir notre compte Instagram",
    //     enabled: false,
    // },
    // {
    //     name: "X",
    //     href: "https://x.com/",
    //     icon: "x",
    //     ariaLabel: "Voir notre compte X",
    //     enabled: false,
    // },
    // {
    //     name: "LinkedIn",
    //     href: "https://www.linkedin.com/",
    //     icon: "linkedin",
    //     ariaLabel: "Voir notre page LinkedIn",
    //     enabled: false,
    // },
    {
        name: "WhatsApp",
        href: "https://wa.me/c/2290148899999",
        icon: "whatsapp",
        ariaLabel: "Nous contacter sur WhatsApp",
        enabled: true,
    },
];
