"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { NAV_LINKS, SITE } from "@/lib/constants";
import { cn } from "@/lib/utils";
import styles from "./Navbar.module.scss";

function isActiveHref(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

function DropdownMenu({
  item,
  pathname,
}: {
  item: (typeof NAV_LINKS)[0];
  pathname: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const menuId = useId();

  const isGroupActive = item.children?.some((child) =>
    isActiveHref(pathname, child.href)
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
          isGroupActive && styles.dropdownTriggerActive
        )}
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-controls={menuId}
        aria-haspopup="true"
      >
        {item.label}
      </button>

      <div id={menuId} className={styles.dropdownMenu}>
        {item.children?.map((child) => {
          const active = isActiveHref(pathname, child.href);

          return (
            <Link
              key={child.href}
              href={child.href}
              className={cn(styles.dropdownItem, active && styles.dropdownItemActive)}
              onClick={() => setOpen(false)}
            >
              <span className={styles.dropdownItemLabel}>{child.label}</span>
              {child.description && (
                <p className={styles.dropdownItemDesc}>{child.description}</p>
              )}
            </Link>
          );
        })}
      </div>
    </div>
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
      setScrolled(window.scrollY > 12);
    }

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
    setActiveMobileGroup(null);
  }, [pathname]);

  return (
    <header
      className={cn(
        styles.header,
        !useSolidHeader && styles.headerHero,
        useSolidHeader && styles.headerSolid
      )}
    >
      <div className={styles.bar}>
        <Link href="/" className={styles.logoLink} aria-label={SITE.fullName}>
          <Image
            src="/logo/logo-cst-transparent.png"
            alt=""
            width={160}
            height={160}
            priority
            className={styles.logo}
          />
          <div className={styles.logoText}>
            <span className={styles.logoTitle}>{SITE.name}</span>
            <span className={styles.logoSubtitle}>{SITE.fullName}</span>
          </div>
        </Link>

        <nav className={styles.nav} aria-label="Navigation principale">
          {NAV_LINKS.map((item) => (
            <DropdownMenu key={item.label} item={item} pathname={pathname} />
          ))}
        </nav>

        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className={styles.burger}
          aria-expanded={open}
          aria-controls="menu-mobile"
          aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            {open ? (
              <path d="M6 6l12 12M18 6L6 18" />
            ) : (
              <path d="M4 7h16M4 12h16M4 17h16" />
            )}
          </svg>
        </button>
      </div>

      {open && (
        <nav id="menu-mobile" className={styles.mobileNav} aria-label="Navigation mobile">
          {NAV_LINKS.map((group) => {
            const groupIsOpen = activeMobileGroup === group.label;
            const submenuId = `mobile-submenu-${group.label
              .normalize("NFD")
              .replace(/[\u0300-\u036f]/g, "")
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, "-")}`;

            return (
              <div
                key={group.label}
                className={cn(styles.mobileGroup, groupIsOpen && styles.mobileGroupOpen)}
              >
                <button
                  type="button"
                  className={styles.mobileParentButton}
                  onClick={() =>
                    setActiveMobileGroup((current) =>
                      current === group.label ? null : group.label
                    )
                  }
                  aria-expanded={groupIsOpen}
                  aria-controls={submenuId}
                  aria-haspopup="true"
                >
                  <span>{group.label}</span>
                  <span className={styles.mobileParentIndicator} aria-hidden />
                </button>

                {groupIsOpen && (
                  <div id={submenuId} className={styles.mobileSubmenu}>
                    {group.children?.map((child) => {
                      const active = isActiveHref(pathname, child.href);

                      return (
                        <Link
                          key={child.href}
                          href={child.href}
                          onClick={() => setOpen(false)}
                          className={cn(styles.mobileLink, active && styles.mobileLinkActive)}
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
        </nav>
      )}
    </header>
  );
}
