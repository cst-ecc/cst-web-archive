"use client";

// import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import {
  NAVBAR_SCROLL_THRESHOLD,
  NAV_LINKS,
  SITE,
  type NavItem,
  type NavLink,
} from "@/lib/constants";
import { cn } from "@/lib/utils";
import styles from "./Navbar.module.scss";

function isActiveHref(pathname: string, href: string) {
  if (href.startsWith("http") || href.includes("#")) return false;
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
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

function DirectNavLink({ item, pathname }: { item: NavItem; pathname: string }) {
  const active = isActiveHref(pathname, item.href);
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
    <Link href={item.href} className={className} aria-current={active ? "page" : undefined}>
      {item.label}
    </Link>
  );
}

function DropdownMenu({ item, pathname }: { item: NavItem; pathname: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const menuId = useId();

  const isGroupActive = item.children?.some((child) =>
    isActiveHref(pathname, child.href),
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

  return (
    <div
      ref={ref}
      className={cn(styles.dropdown, open && styles.dropdownOpen)}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          setOpen(false);
        }
      }}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          setOpen(false);
          ref.current?.querySelector<HTMLButtonElement>("button")?.focus();
        }
      }}
    >
      <button
        type="button"
        className={cn(
          styles.dropdownTrigger,
          isGroupActive && styles.dropdownTriggerActive,
        )}
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-controls={menuId}
        aria-haspopup="true"
      >
        <span>{item.label}</span>
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

      <div id={menuId} className={styles.dropdownMenu}>
        <div className={styles.dropdownHeading}>
          <span className={styles.dropdownEyebrow}>{item.label}</span>
          <span className={styles.dropdownHint}>Accès rapide</span>
        </div>

        <div className={styles.dropdownItems}>
          {item.children?.map((child) => {
            const active = isActiveHref(pathname, child.href);
            return (
              <NavChildLink
                key={`${child.label}-${child.href}`}
                child={child}
                active={active}
                onNavigate={() => setOpen(false)}
              />
            );
          })}
        </div>
      </div>
    </div>
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
        {child.description && (
          <span className={styles.dropdownItemDesc}>{child.description}</span>
        )}
      </span>
      <span className={styles.dropdownArrow} aria-hidden>
        →
      </span>
    </>
  );

  const className = cn(styles.dropdownItem, active && styles.dropdownItemActive);

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
    <Link href={child.href} className={className} onClick={onNavigate}>
      {content}
    </Link>
  );
}

function MobileDirectLink({
  item,
  pathname,
  onNavigate,
}: {
  item: NavItem;
  pathname: string;
  onNavigate: () => void;
}) {
  const active = isActiveHref(pathname, item.href);
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
    <Link href={item.href} className={className} onClick={onNavigate}>
      {item.label}
    </Link>
  );
}

export default function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeMobileGroup, setActiveMobileGroup] = useState<string | null>(null);

  const isHomePage = pathname === "/";
  const useSolidHeader = !isHomePage || scrolled || open;

  useEffect(() => {
    function handleScroll() {
      setScrolled(window.scrollY > NAVBAR_SCROLL_THRESHOLD);
    }

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
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

  return (
    <header
      className={cn(
        styles.header,
        !useSolidHeader && styles.headerHero,
        useSolidHeader && styles.headerSolid,
      )}
    >
      <div className={styles.bar}>
        <Link href="/" className={styles.logoLink} aria-label={`${SITE.name} — ${SITE.fullName}`}>
          {/* <Image
            src="/logo/logo-cst-transparent.png"
            alt=""
            width={160}
            height={160}
            priority
            className={styles.logo}
          /> */}
          <div className={styles.logoText}>
            <span className={styles.logoTitle}>{SITE.name}</span>
            <span className={styles.logoSubtitle}>{SITE.fullName}</span>
          </div>
        </Link>

        <nav className={styles.nav} aria-label="Navigation principale">
          {NAV_LINKS.map((item) =>
            item.children?.length ? (
              <DropdownMenu key={item.label} item={item} pathname={pathname} />
            ) : (
              <DirectNavLink key={item.label} item={item} pathname={pathname} />
            ),
          )}
        </nav>

        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className={styles.burger}
          aria-expanded={open}
          aria-controls="menu-mobile"
          aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
        >
          <span className={styles.burgerBox} aria-hidden>
            <span className={cn(styles.burgerLine, open && styles.burgerLineTop)} />
            <span className={cn(styles.burgerLine, open && styles.burgerLineMiddle)} />
            <span className={cn(styles.burgerLine, open && styles.burgerLineBottom)} />
          </span>
        </button>
      </div>

      {open && (
        <nav id="menu-mobile" className={styles.mobileNav} aria-label="Navigation mobile">
          <div className={styles.mobileNavInner}>
            {NAV_LINKS.map((item) => {
              if (!item.children?.length) {
                return (
                  <MobileDirectLink
                    key={item.label}
                    item={item}
                    pathname={pathname}
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
                  className={cn(styles.mobileGroup, groupIsOpen && styles.mobileGroupOpen)}
                >
                  <button
                    type="button"
                    className={styles.mobileParentButton}
                    onClick={() =>
                      setActiveMobileGroup((current) =>
                        current === item.label ? null : item.label,
                      )
                    }
                    aria-expanded={groupIsOpen}
                    aria-controls={submenuId}
                  >
                    <span>{item.label}</span>
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

                  {groupIsOpen && (
                    <div id={submenuId} className={styles.mobileSubmenu}>
                      {item.children.map((child) => {
                        const active = isActiveHref(pathname, child.href);
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
                            onClick={() => setOpen(false)}
                            className={className}
                          >
                            {child.label}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </nav>
      )}
    </header>
  );
}
