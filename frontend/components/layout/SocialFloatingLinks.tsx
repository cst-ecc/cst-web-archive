import {
    SOCIAL_LINKS,
    type SocialIconName,
    type SocialLink,
} from "@/lib/social-links";

import styles from "./SocialFloatingLinks.module.scss";

type SocialInlineLinksProps = {
    links?: SocialLink[];
};

function SocialIcon({ name }: { name: SocialIconName }) {
    switch (name) {
        case "facebook":
            return (
                <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M14.2 8.4V6.7c0-.8.5-1 1-1h1.5V3.1c-.7-.1-1.5-.1-2.2-.1-2.2 0-3.7 1.3-3.7 3.8v1.6H8.4v3h2.4V21h3.1v-9.6h2.4l.4-3h-2.5Z" />
                </svg>
            );

        case "tiktok":
            return (
                <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M16.6 3c.3 2.3 1.6 3.7 3.8 3.9v3c-1.3.1-2.5-.3-3.7-1v5.6c0 4.6-5 7.5-9 5.2-2.6-1.5-3.6-4.8-2.1-7.4 1.2-2.2 3.7-3.3 6.1-2.8v3.2c-.4-.1-.8-.2-1.2-.1-1.4.1-2.5 1.2-2.5 2.6 0 1.7 1.7 2.9 3.3 2.3 1-.4 1.6-1.3 1.6-2.5V3h3.7Z" />
                </svg>
            );

        case "youtube":
            return (
                <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M21.6 7.1s-.2-1.5-.8-2.1c-.8-.8-1.7-.8-2.1-.9C15.8 3.9 12 3.9 12 3.9s-3.8 0-6.7.2c-.4.1-1.3.1-2.1.9-.6.6-.8 2.1-.8 2.1S2.2 8.9 2.2 10.7v1.7c0 1.8.2 3.6.2 3.6s.2 1.5.8 2.1c.8.8 1.9.8 2.4.9 1.7.2 6.4.2 6.4.2s3.8 0 6.7-.2c.4-.1 1.3-.1 2.1-.9.6-.6.8-2.1.8-2.1s.2-1.8.2-3.6v-1.7c0-1.8-.2-3.6-.2-3.6ZM10.2 14.6V8.4l5.4 3.1-5.4 3.1Z" />
                </svg>
            );

        case "instagram":
            return (
                <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M7.5 2.8h9A4.7 4.7 0 0 1 21.2 7.5v9a4.7 4.7 0 0 1-4.7 4.7h-9a4.7 4.7 0 0 1-4.7-4.7v-9a4.7 4.7 0 0 1 4.7-4.7Zm0 2.8a1.9 1.9 0 0 0-1.9 1.9v9a1.9 1.9 0 0 0 1.9 1.9h9a1.9 1.9 0 0 0 1.9-1.9v-9a1.9 1.9 0 0 0-1.9-1.9h-9ZM12 8a4 4 0 1 1 0 8 4 4 0 0 1 0-8Zm0 2.5a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3Zm4.3-3.1a1 1 0 1 1 0 2 1 1 0 0 1 0-2Z" />
                </svg>
            );

        case "x":
            return (
                <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M14.2 10.4 21.6 2h-1.8L13.4 9.3 8.2 2H2.4l7.8 11.1L2.4 22h1.8l6.8-7.8 5.5 7.8h5.8l-8.1-11.6Zm-2.4 2.7-.8-1.1L4.7 3.4h2.6l5 7 .8 1.1 6.7 9.2h-2.6l-5.4-7.6Z" />
                </svg>
            );

        case "linkedin":
            return (
                <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M5.1 8.7H2.2V21h2.9V8.7ZM3.7 3a1.7 1.7 0 1 0 0 3.4 1.7 1.7 0 0 0 0-3.4Zm6.4 5.7H7.3V21h2.8v-6.4c0-1.7.8-2.7 2.2-2.7 1.3 0 1.9.9 1.9 2.7V21h2.9v-7.1c0-3.5-1.9-5.2-4.4-5.2-2 0-2.9 1.1-3.4 1.9V8.7h-.2Z" />
                </svg>
            );

        case "whatsapp":
            return (
                <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M12 2.5a9.4 9.4 0 0 0-8 14.4L2.8 21.5l4.7-1.2A9.4 9.4 0 1 0 12 2.5Zm0 16a7 7 0 0 1-3.6-1l-.3-.2-2.8.7.8-2.7-.2-.3a7 7 0 1 1 6.1 3.5Zm3.8-5.3c-.2-.1-1.3-.6-1.5-.7-.2-.1-.4-.1-.6.1-.2.3-.7.8-.8 1-.2.1-.3.2-.6.1-.2-.1-1-.4-1.9-1.2-.7-.6-1.2-1.4-1.3-1.6-.1-.3 0-.4.1-.5l.4-.5c.1-.2.2-.3.3-.5.1-.2 0-.4 0-.5-.1-.1-.6-1.4-.8-1.9-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.5.1-.7.3-.2.2-.9.9-.9 2.1s.9 2.4 1 2.6c.1.2 1.8 2.8 4.4 3.9.6.3 1.1.4 1.5.5.6.2 1.2.1 1.6.1.5-.1 1.3-.5 1.5-1 .2-.5.2-1 .1-1.1-.1-.1-.3-.2-.5-.3Z" />
                </svg>
            );
    }
}

export default function SocialInlineLinks({
    links = SOCIAL_LINKS,
}: SocialInlineLinksProps) {
    const visibleLinks = links.filter(
        (link) =>
            link.enabled !== false &&
            link.href.trim().length > 0,
    );

    if (visibleLinks.length === 0) {
        return null;
    }

    return (
        <nav
            className={styles.socials}
            aria-label="Réseaux sociaux officiels"
        >
            {visibleLinks.map((link) => (
                <a
                    key={link.name}
                    href={link.href}
                    className={styles.link}
                    aria-label={link.ariaLabel}
                    title={link.name}
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    <SocialIcon name={link.icon} />
                </a>
            ))}
        </nav>
    );
}