"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { NAV_LINKS, SITE } from "@/lib/constants";
import { cn } from "@/lib/utils";
import styles from "./Navbar.module.scss";

function ChevronDown() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 4.5L6 7.5L9 4.5" />
    </svg>
  );
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

  const isGroupActive = item.children?.some(
    (c) => c.href === "/" ? pathname === "/" : pathname.startsWith(c.href)
  );

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={ref} className={cn(styles.dropdown, open && styles.dropdownOpen)}>
      <button
        type="button"
        className={cn(styles.dropdownTrigger, isGroupActive && styles.dropdownTriggerActive)}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        {item.label}
        <ChevronDown />
      </button>

      <div className={styles.dropdownMenu}>
        {item.children?.map((child) => {
          const active = child.href === "/" ? pathname === "/" : pathname.startsWith(child.href);
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

  return (
    <header className={styles.header}>
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
          onClick={() => setOpen((v) => !v)}
          className={styles.burger}
          aria-expanded={open}
          aria-controls="menu-mobile"
          aria-label="Ouvrir le menu"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
          </svg>
        </button>
      </div>

      {open && (
        <nav id="menu-mobile" className={styles.mobileNav} aria-label="Navigation mobile">
          {NAV_LINKS.map((group) => (
            <div key={group.label} className={styles.mobileGroup}>
              <span className={styles.mobileGroupLabel}>{group.label}</span>
              {group.children?.map((child) => {
                const active = child.href === "/" ? pathname === "/" : pathname.startsWith(child.href);
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
          ))}
        </nav>
      )}
    </header>
  );
}
