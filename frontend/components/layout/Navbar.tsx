"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  useEffect,
  useId,
  useRef,
  useState,
  type FocusEvent as ReactFocusEvent,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";

import HomeSearch from "@/components/home/HomeSearch";
import {
  HOME_NAV_LINKS,
  SITE,
  type NavItem,
  type NavLink,
} from "@/lib/constants";
import { cn } from "@/lib/utils";

import styles from "./Navbar.module.scss";

const INTERNAL_SECTION_PATHS: Record<string, string[]> = {
  "/#cst": [
    "/presentation",
    "/membres",
    "/sessions",
  ],
  "/#ressources": [
    "/documents",
    "/decisions",
    "/rapports",
  ],
  "/#actualites": [
    "/actualites",
    "/galerie",
    "/contact",
  ],
};

function isActiveHref(
  pathname: string,
  href: string,
  activeHash = "",
) {
  if (href.startsWith("http")) return false;

  if (href.startsWith("/#")) {
    if (pathname === "/") {
      const hash = href.slice(1);
      return (activeHash || "#accueil") === hash;
    }

    const relatedPaths = INTERNAL_SECTION_PATHS[href] ?? [];
    return relatedPaths.some(
      (path) => pathname === path || pathname.startsWith(`${path}/`),
    );
  }

  const pathOnly = href.split(/[?#]/)[0] || "/";
  return pathOnly === "/"
    ? pathname === "/"
    : pathname === pathOnly || pathname.startsWith(`${pathOnly}/`);
}

function navigateHomePanel(href: string) {
  if (typeof window === "undefined" || !href.startsWith("/#")) return false;
  if (window.location.pathname !== "/") return false;

  const nextHash = href.slice(1);

  if (window.location.hash !== nextHash) {
    window.history.pushState(null, "", nextHash);
  }

  window.dispatchEvent(new Event("homepanelchange"));

  if (window.innerWidth < 1024) {
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    window.scrollTo({
      top: 0,
      behavior: reduceMotion ? "auto" : "smooth",
    });
  }

  return true;
}

function ExternalIndicator() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden
    >
      <path d="M14 3h7v7" />
      <path d="M10 14 21 3" />
      <path d="M21 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.4-3.4" />
    </svg>
  );
}

function DirectNavLink({
  item,
  pathname,
  activeHash,
}: {
  item: NavItem;
  pathname: string;
  activeHash: string;
}) {
  const active = isActiveHref(pathname, item.href, activeHash);
  const className = cn(
    styles.navLink,
    active && styles.navLinkActive,
    item.accent && styles.navLinkAccent,
  );

  if (item.external) {
    return (
      <a
        href={item.href}
        className={className}
        target="_blank"
        rel="noopener noreferrer"
      >
        <span>{item.label}</span>
        <ExternalIndicator />
      </a>
    );
  }

  return (
    <Link
      href={item.href}
      className={className}
      aria-current={active ? "page" : undefined}
      onClick={(event) => {
        if (navigateHomePanel(item.href)) event.preventDefault();
      }}
    >
      {item.label}
    </Link>
  );
}

function NavChildLink({
  child,
  active,
  onNavigate,
}: {
  child: NavLink;
  active: boolean;
  onNavigate: () => void;
}) {
  const content = (
    <>
      <span>
        <span className={styles.dropdownItemLabel}>{child.label}</span>
        {child.description ? (
          <span className={styles.dropdownItemDesc}>{child.description}</span>
        ) : null}
      </span>
      <span className={styles.dropdownArrow} aria-hidden>
        →
      </span>
    </>
  );

  const className = cn(
    styles.dropdownItem,
    active && styles.dropdownItemActive,
  );

  if (child.external) {
    return (
      <a
        href={child.href}
        className={className}
        target="_blank"
        rel="noopener noreferrer"
        onClick={onNavigate}
      >
        {content}
      </a>
    );
  }

  return (
    <Link
      href={child.href}
      className={className}
      onClick={onNavigate}
    >
      {content}
    </Link>
  );
}

function DropdownMenu({
  item,
  pathname,
  activeHash,
}: {
  item: NavItem;
  pathname: string;
  activeHash: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const menuId = useId();

  const isGroupActive =
    isActiveHref(pathname, item.href, activeHash) ||
    item.children?.some((child) =>
      isActiveHref(pathname, child.href, activeHash),
    );

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const triggerClassName = cn(
    styles.dropdownTrigger,
    isGroupActive && styles.dropdownTriggerActive,
  );

  return (
    <div
      ref={ref}
      className={cn(styles.dropdown, open && styles.dropdownOpen)}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={(event: ReactFocusEvent<HTMLDivElement>) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          setOpen(false);
        }
      }}
      onKeyDown={(event: ReactKeyboardEvent<HTMLDivElement>) => {
        if (event.key === "Escape") {
          setOpen(false);
          ref.current?.querySelector<HTMLElement>("a, button")?.focus();
        }
      }}
    >
      <div className={styles.dropdownSplitTrigger}>
        <Link
          href={item.href}
          className={cn(triggerClassName, styles.dropdownParentLink)}
          onClick={(event) => {
            if (navigateHomePanel(item.href)) event.preventDefault();
            setOpen(false);
          }}
        >
          {item.label}
        </Link>

        <button
          type="button"
          className={styles.dropdownToggle}
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          aria-controls={menuId}
          aria-haspopup="true"
          aria-label={`Ouvrir le menu ${item.label}`}
        >
          <svg
            className={styles.chevron}
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </button>
      </div>

      <div id={menuId} className={styles.dropdownMenu}>
        <div className={styles.dropdownHeading}>
          <span className={styles.dropdownEyebrow}>{item.label}</span>
          <span className={styles.dropdownHint}>Accès rapide</span>
        </div>

        <div className={styles.dropdownItems}>
          {item.children?.map((child) => (
            <NavChildLink
              key={`${child.label}-${child.href}`}
              child={child}
              active={isActiveHref(pathname, child.href, activeHash)}
              onNavigate={() => setOpen(false)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function DesktopNavigation({
  items,
  pathname,
  activeHash,
  className,
}: {
  items: NavItem[];
  pathname: string;
  activeHash: string;
  className?: string;
}) {
  return (
    <nav
      className={cn(styles.nav, className)}
      aria-label="Navigation principale"
    >
      {items.map((item) =>
        item.children?.length ? (
          <DropdownMenu
            key={item.label}
            item={item}
            pathname={pathname}
            activeHash={activeHash}
          />
        ) : (
          <DirectNavLink
            key={item.label}
            item={item}
            pathname={pathname}
            activeHash={activeHash}
          />
        ),
      )}
    </nav>
  );
}

function MobileDirectLink({
  item,
  pathname,
  activeHash,
  onNavigate,
}: {
  item: NavItem;
  pathname: string;
  activeHash: string;
  onNavigate: () => void;
}) {
  const active = isActiveHref(pathname, item.href, activeHash);
  const className = cn(
    styles.mobileDirectLink,
    active && styles.mobileLinkActive,
    item.accent && styles.mobileDirectAccent,
  );

  if (item.external) {
    return (
      <a
        href={item.href}
        className={className}
        target="_blank"
        rel="noopener noreferrer"
        onClick={onNavigate}
      >
        <span>{item.label}</span>
        <ExternalIndicator />
      </a>
    );
  }

  return (
    <Link
      href={item.href}
      className={className}
      onClick={(event) => {
        if (navigateHomePanel(item.href)) event.preventDefault();
        onNavigate();
      }}
    >
      {item.label}
    </Link>
  );
}

function LanguageSwitch() {
  return (
    <div className={styles.languageSwitch} aria-label="Choix de langue">
      <span className={styles.languageActive} aria-current="true">
        FR
      </span>
      <button
        type="button"
        className={styles.languagePending}
        aria-disabled="true"
        disabled
        title="Version anglaise en préparation"
      >
        EN
      </button>
    </div>
  );
}

export default function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [activeMobileGroup, setActiveMobileGroup] = useState<string | null>(null);
  const [activeHash, setActiveHash] = useState("#accueil");

  const navItems = HOME_NAV_LINKS;
  const leftItems = navItems.slice(0, 4);
  const rightItems = navItems.slice(4);

  useEffect(() => {
    const syncHash = () => setActiveHash(window.location.hash || "#accueil");

    syncHash();
    window.addEventListener("hashchange", syncHash);
    window.addEventListener("popstate", syncHash);
    window.addEventListener("homepanelchange", syncHash);

    return () => {
      window.removeEventListener("hashchange", syncHash);
      window.removeEventListener("popstate", syncHash);
      window.removeEventListener("homepanelchange", syncHash);
    };
  }, [pathname]);

  useEffect(() => {
    setOpen(false);
    setSearchOpen(false);
    setActiveMobileGroup(null);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setSearchOpen(false);
        setOpen(false);
      }
    };

    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, []);

  return (
    <header className={cn(styles.header, styles.headerHome, styles.headerSolid)}>
      <div className={cn(styles.bar, styles.homeBar)}>
        <div className={styles.homeLeftTools}>
          <LanguageSwitch />
        </div>

        <DesktopNavigation
          items={leftItems}
          pathname={pathname}
          activeHash={activeHash}
          className={styles.homeNavLeft}
        />

        <Link
          href="/#accueil"
          className={cn(styles.logoLink, styles.homeLogoLink)}
          aria-label={`${SITE.name} — ${SITE.fullName}`}
          onClick={(event) => {
            if (navigateHomePanel("/#accueil")) event.preventDefault();
          }}
        >
          <Image
            src="/logo/logo-original.png"
            width={100}
            height={100}
            alt="Logo de l'Église du Christianisme Céleste"
            priority
            className={styles.logo}
          />
        </Link>

        <div className={styles.homeRightSide}>
          <DesktopNavigation
            items={rightItems}
            pathname={pathname}
            activeHash={activeHash}
            className={styles.homeNavRight}
          />

          <div className={styles.desktopTools}>
            <button
              type="button"
              className={styles.searchButton}
              onClick={() => setSearchOpen((value) => !value)}
              aria-expanded={searchOpen}
              aria-controls="site-search-panel"
              aria-label={
                searchOpen ? "Fermer la recherche" : "Ouvrir la recherche"
              }
            >
              <SearchIcon />
            </button>

            <a
              href={SITE.digitalisationUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.digeccButton}
            >
              DIGECC <ExternalIndicator />
            </a>
          </div>

          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            className={styles.burger}
            aria-expanded={open}
            aria-controls="menu-mobile"
            aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
          >
            <span className={styles.burgerBox} aria-hidden>
              <span
                className={cn(
                  styles.burgerLine,
                  open && styles.burgerLineTop,
                )}
              />
              <span
                className={cn(
                  styles.burgerLine,
                  open && styles.burgerLineMiddle,
                )}
              />
              <span
                className={cn(
                  styles.burgerLine,
                  open && styles.burgerLineBottom,
                )}
              />
            </span>
          </button>
        </div>
      </div>

      {searchOpen ? (
        <div id="site-search-panel" className={styles.searchPanel}>
          <div className={styles.searchPanelInner}>
            <HomeSearch />
            <button
              type="button"
              className={styles.searchClose}
              onClick={() => setSearchOpen(false)}
              aria-label="Fermer la recherche"
            >
              ×
            </button>
          </div>
        </div>
      ) : null}

      {open ? (
        <nav
          id="menu-mobile"
          className={styles.mobileNav}
          aria-label="Navigation mobile"
        >
          <div className={styles.mobileNavInner}>
            {navItems.map((item) => {
              if (!item.children?.length) {
                return (
                  <MobileDirectLink
                    key={item.label}
                    item={item}
                    pathname={pathname}
                    activeHash={activeHash}
                    onNavigate={() => setOpen(false)}
                  />
                );
              }

              const groupIsOpen = activeMobileGroup === item.label;
              const submenuId = `mobile-submenu-${item.label
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "")
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, "-")}`;

              return (
                <div
                  key={item.label}
                  className={cn(
                    styles.mobileGroup,
                    groupIsOpen && styles.mobileGroupOpen,
                  )}
                >
                  <div className={styles.mobileParentSplit}>
                    <Link
                      href={item.href}
                      className={styles.mobileParentLink}
                      onClick={(event) => {
                        if (navigateHomePanel(item.href)) {
                          event.preventDefault();
                        }
                        setOpen(false);
                      }}
                    >
                      {item.label}
                    </Link>

                    <button
                      type="button"
                      className={styles.mobileParentToggle}
                      onClick={() =>
                        setActiveMobileGroup((current) =>
                          current === item.label ? null : item.label,
                        )
                      }
                      aria-expanded={groupIsOpen}
                      aria-controls={submenuId}
                      aria-label={`Ouvrir le menu ${item.label}`}
                    >
                      <svg
                        className={styles.mobileChevron}
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        aria-hidden
                      >
                        <path d="m6 9 6 6 6-6" />
                      </svg>
                    </button>
                  </div>

                  {groupIsOpen ? (
                    <div id={submenuId} className={styles.mobileSubmenu}>
                      {item.children.map((child) => {
                        const active = isActiveHref(
                          pathname,
                          child.href,
                          activeHash,
                        );
                        const className = cn(
                          styles.mobileLink,
                          active && styles.mobileLinkActive,
                        );

                        if (child.external) {
                          return (
                            <a
                              key={`${child.label}-${child.href}`}
                              href={child.href}
                              className={className}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={() => setOpen(false)}
                            >
                              {child.label}
                            </a>
                          );
                        }

                        return (
                          <Link
                            key={`${child.label}-${child.href}`}
                            href={child.href}
                            className={className}
                            onClick={() => setOpen(false)}
                          >
                            {child.label}
                          </Link>
                        );
                      })}
                    </div>
                  ) : null}
                </div>
              );
            })}

            <div className={styles.mobileTools}>
              <div className={styles.mobileToolsTop}>
                <LanguageSwitch />
                <a
                  href={SITE.digitalisationUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.mobileDigecc}
                >
                  DIGECC <ExternalIndicator />
                </a>
              </div>

              <HomeSearch />
            </div>
          </div>
        </nav>
      ) : null}
    </header>
  );
}
