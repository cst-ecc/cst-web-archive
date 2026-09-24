import styles from "./PanelIcon.module.scss";

export type PanelIconName =
  | "unity"
  | "path"
  | "people"
  | "question"
  | "target"
  | "gear"
  | "document"
  | "chart"
  | "organization"
  | "globe"
  | "book"
  | "news"
  | "link"
  | "check";

export default function PanelIcon({ name }: { name: PanelIconName | string }) {
  const common = {
    className: styles.icon,
    viewBox: "0 0 24 24",
    "aria-hidden": true,
  } as const;

  switch (name) {
    case "unity":
    case "people":
      return (
        <svg {...common}>
          <circle cx="8" cy="8" r="3" />
          <circle cx="17" cy="9" r="2.5" />
          <path d="M2.8 20c.5-4.1 2.4-6 5.2-6s4.7 1.9 5.2 6" />
          <path d="M13.7 15.2c.7-1.3 1.9-2 3.5-2 2.3 0 3.8 1.5 4.1 4.8" />
        </svg>
      );
    case "path":
      return (
        <svg {...common}>
          <path d="M5 19c0-3.5 2-4.5 5-5.5s5-2 5-5.5" />
          <circle cx="5" cy="19" r="2" />
          <circle cx="15" cy="8" r="2" />
          <path d="m17 5 3 3-3 3" />
        </svg>
      );
    case "question":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="M9.8 9a2.5 2.5 0 0 1 4.8 1c0 2-2.6 2.1-2.6 4" />
          <path d="M12 17.5h.01" />
        </svg>
      );
    case "target":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="8" />
          <circle cx="12" cy="12" r="4" />
          <path d="m12 12 7-7" />
          <path d="M16 5h3v3" />
        </svg>
      );
    case "gear":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="3" />
          <path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9 7 7M17 17l2.1 2.1M19.1 4.9 17 7M7 17l-2.1 2.1" />
        </svg>
      );
    case "document":
      return (
        <svg {...common}>
          <path d="M6 3h8l4 4v14H6z" />
          <path d="M14 3v5h5M9 12h6M9 16h6" />
        </svg>
      );
    case "chart":
      return (
        <svg {...common}>
          <path d="M4 20V10h4v10M10 20V4h4v16M16 20v-7h4v7" />
        </svg>
      );
    case "organization":
      return (
        <svg {...common}>
          <rect x="9" y="3" width="6" height="4" rx="1" />
          <rect x="2" y="17" width="6" height="4" rx="1" />
          <rect x="9" y="17" width="6" height="4" rx="1" />
          <rect x="16" y="17" width="6" height="4" rx="1" />
          <path d="M12 7v5M5 17v-3h14v3M12 12v5" />
        </svg>
      );
    case "globe":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="M3 12h18M12 3c2.4 2.5 3.6 5.5 3.6 9S14.4 18.5 12 21M12 3c-2.4 2.5-3.6 5.5-3.6 9S9.6 18.5 12 21" />
        </svg>
      );
    case "book":
      return (
        <svg {...common}>
          <path d="M4 5.5c3-.8 5.7-.2 8 1.8v12c-2.3-2-5-2.6-8-1.8z" />
          <path d="M20 5.5c-3-.8-5.7-.2-8 1.8v12c2.3-2 5-2.6 8-1.8z" />
        </svg>
      );
    case "news":
      return (
        <svg {...common}>
          <path d="m4 13 12-5v8L4 11z" />
          <path d="M16 10h3v4h-3M6 13l1 6h4l-2-7" />
        </svg>
      );
    case "link":
      return (
        <svg {...common}>
          <path d="M10 13a5 5 0 0 0 7.5.5l2-2a5 5 0 0 0-7-7l-1.2 1.2" />
          <path d="M14 11a5 5 0 0 0-7.5-.5l-2 2a5 5 0 0 0 7 7l1.2-1.2" />
        </svg>
      );
    case "check":
    default:
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="m8 12 2.5 2.5L16.5 8" />
        </svg>
      );
  }
}
