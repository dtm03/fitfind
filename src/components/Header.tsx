import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link, NavLink } from "react-router-dom";
import { MeasurementsPanel } from "./panels/MeasurementsPanel";
import { ShoppingListPanel } from "./panels/ShoppingListPanel";
import { WishlistPanel } from "./panels/WishlistPanel";
import { cls } from "../lib/format";
import { useStore } from "../store/store";
import type { Category } from "../types";

type HeaderPanel = "wishlist" | "list" | "brands" | "measurements";

export function Header() {
  const { state } = useStore();
  const [open, setOpen] = useState<HeaderPanel | null>(null);

  const openNeeds = state.needs.filter((n) => !n.done).length;
  const measuredCount = (Object.keys(state.profile.fit) as Category[]).filter(
    (c) => Object.keys(state.profile.fit[c] ?? {}).length > 0,
  ).length;

  return (
    <header className="header">
      <Link to="/" className="logo" aria-label="fitfind home">
        <span className="logo-mark">[ff]</span> fitfind
        <span className="cursor">_</span>
      </Link>
      <nav className="nav">
        <NavLink to="/" end>
          shop
        </NavLink>
        <HeaderDropdown
          label="wishlist"
          panel="wishlist"
          active={open}
          onToggle={setOpen}
          badge={state.wishlist.length > 0 ? state.wishlist.length : undefined}
          size="sm"
        >
          <WishlistPanel />
        </HeaderDropdown>
        <HeaderDropdown
          label="shoppinglist"
          panel="list"
          active={open}
          onToggle={setOpen}
          badge={openNeeds > 0 ? openNeeds : undefined}
          size="sm"
        >
          <ShoppingListPanel />
        </HeaderDropdown>
        <HeaderDropdown
          label="measurements"
          panel="measurements"
          active={open}
          onToggle={setOpen}
          badge={measuredCount > 0 ? measuredCount : undefined}
          size="lg"
        >
          <MeasurementsPanel />
        </HeaderDropdown>
      </nav>
    </header>
  );
}

function HeaderDropdown({
  label,
  panel,
  active,
  onToggle,
  badge,
  size = "md",
  children,
}: {
  label: string;
  panel: HeaderPanel;
  active: HeaderPanel | null;
  onToggle: (next: HeaderPanel | null) => void;
  badge?: number;
  size?: "sm" | "md" | "lg";
  children: ReactNode;
}) {
  const open = active === panel;
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node))
        onToggle(null);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onToggle(null);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onToggle]);

  return (
    <div className="header-dropdown" ref={ref}>
      <button
        type="button"
        className={cls("nav-panel-btn", open && "on")}
        aria-expanded={open}
        onClick={() => onToggle(open ? null : panel)}
      >
        {label}
        {badge != null && <sup>{badge}</sup>}
      </button>
      {open && (
        <div
          className={cls(
            "popover",
            "header-popover",
            size === "sm" && "header-popover-sm",
            size === "lg" && "header-popover-lg",
            panel === "measurements" && "header-popover-measurements",
            panel === "list" && "header-popover-list",
            panel === "brands" && "header-popover-brands",
          )}
        >
          {children}
        </div>
      )}
    </div>
  );
}
