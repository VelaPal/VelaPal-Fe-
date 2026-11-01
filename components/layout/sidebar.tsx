
"use client" ; 

import Image from "next/image" ; 
import Link from "next/link" ;
import{ usePathname } from "next/navigation" ;
import { useEffect, useRef, useState, type SVGProps } from "react" ;
import {ArrowLeftRight, BookOpen, LayoutDashboard, Menu, Repeat2, Scale, X} from "lucide-react" ;


function VelaAgentIcon(props: SVGProps<SVGSVGElement>) {
    return ( 
        <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M11.7 3.5C12.5 8.2 10.2 12.3 6.4 16.5L18.3 12.3C16.8 8.8 14.6 5.9 11.7 3.5Z" />
      <path d="M4.3 18.2C8.8 21.3 15 21.9 19.7 15.1" />
      <circle
        cx="20.1"
        cy="5.1"
        r="1.25"
        fill="currentColor"
        stroke="none"
      />
    </svg>
  );
}

const navigation = [
  { label: "Overview", href: "/", icon: LayoutDashboard },
  { label: "Vela Assistant", href: "/assistant", icon: VelaAgentIcon },
  { label: "Transactions", href: "/transactions", icon: ArrowLeftRight },
  { label: "Subscriptions", href: "/subscriptions", icon: Repeat2 },
  { label: "Digital Library", href: "/library", icon: BookOpen },
  { label: "Resolution Center", href: "/cases", icon: Scale },
];

function Brand() {
  return (
    <Link href="/" className="flex items-center gap-2.5">
      <Image
        src="/velapal-logo.png"
        alt=""
        width={36}
        height={36}
        className="object-contain"
      />

      <span className="text-2xl font-semibold tracking-tight text-[#0B326C]">
        VelaPal
      </span>
    </Link>
  );
}

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col p-5">
      <Brand />

      <div className="mt-8 rounded-xl border border-slate-200 p-3">
        <p className="text-[10px] font-medium tracking-widest text-slate-500">
          WORKSPACE
        </p>

        <p className="mt-1 text-sm font-medium text-slate-800">
          Personal workspace
        </p>
      </div>

      <p className="mt-8 px-3 text-[10px] font-medium tracking-widest text-slate-400">
        MAIN MENU
      </p>

      <nav aria-label="Main navigation" className="mt-3 space-y-1.5">
        {navigation.map(({ label, href, icon: Icon }) => {
          const isActive =
            pathname === href ||
            (href !== "/" && pathname.startsWith(`${href}/`));

          return (
            <Link
              key={href}
              href={href}
              onClick={onNavigate}
              aria-current={isActive ? "page" : undefined}
              className={`flex min-h-11 items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                isActive
                  ? "bg-blue-50 font-medium text-blue-700"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <Icon aria-hidden="true" className="h-5 w-5 shrink-0" />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto border-t border-slate-100 pt-5">
        <p className="text-xs font-medium text-slate-700">
          Your money, in your hands.
        </p>

        <p className="mt-1 text-xs leading-relaxed text-slate-500">
          Thoughtful help. Always your decision.
        </p>
      </div>
    </div>
  );
}

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const drawerRef = useRef<HTMLElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    drawerRef.current?.querySelector<HTMLButtonElement>("button")?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }

      if (event.key !== "Tab") return;

      const elements = drawerRef.current?.querySelectorAll<HTMLElement>(
        "button, a[href]",
      );

      if (!elements?.length) return;

      const first = elements[0];
      const last = elements[elements.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
      triggerRef.current?.focus();
    };
  }, [isOpen]);

  return (
    <>
      {/* Desktop */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-slate-200 bg-white lg:block">
        <SidebarContent />
      </aside>

      {/* Header mobile */}
      <header className="fixed inset-x-0 top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-5 lg:hidden">
        <Brand />

        <button
          ref={triggerRef}
          type="button"
          aria-label="Open navigation"
          aria-expanded={isOpen}
          aria-controls="mobile-sidebar"
          onClick={() => setIsOpen(true)}
          className="flex h-11 w-11 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100"
        >
          <Menu aria-hidden="true" className="h-5 w-5" />
        </button>
      </header>

      {/* Drawer mobile */}
      {isOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close navigation overlay"
            tabIndex={-1}
            onClick={() => setIsOpen(false)}
            className="absolute inset-0 bg-slate-950/35"
          />

          <aside
            ref={drawerRef}
            id="mobile-sidebar"
            role="dialog"
            aria-modal="true"
            aria-label="Navigation menu"
            className="absolute inset-y-0 left-0 w-72 max-w-[85vw] overflow-y-auto bg-white shadow-xl"
          >
            <button
              type="button"
              aria-label="Close navigation"
              onClick={() => setIsOpen(false)}
              className="absolute right-3 top-4 flex h-10 w-10 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"
            >
              <X aria-hidden="true" className="h-5 w-5" />
            </button>

            <SidebarContent onNavigate={() => setIsOpen(false)} />
          </aside>
        </div>
      )}
    </>
    )
}