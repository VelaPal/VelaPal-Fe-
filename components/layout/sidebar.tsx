"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, type SVGProps } from "react";
import {
  ArrowLeftRight,
  BookOpen,
  LayoutDashboard,
  Menu,
  Repeat2,
  Scale,
  X,
} from "lucide-react";

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
  {
    label: "Overview",
    href: "/workspace",
    icon: LayoutDashboard,
  },
  {
    label: "Vela Assistant",
    href: "/workspace/assistant",
    icon: VelaAgentIcon,
  },
  {
    label: "Transactions",
    href: "/workspace/transactions",
    icon: ArrowLeftRight,
  },
  {
    label: "Subscriptions",
    href: "/workspace/subscriptions",
    icon: Repeat2,
  },
  {
    label: "Digital Library",
    href: "/workspace/library",
    icon: BookOpen,
  },
  {
    label: "Resolution Center",
    href: "/workspace/cases",
    icon: Scale,
  },
];

type NavigationProps = {
  onNavigate?: () => void;
};

function Brand({ onNavigate }: NavigationProps) {
  return (
    <Link
      href="/workspace"
      onClick={onNavigate}
      className="flex w-fit items-center gap-3 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-600"
    >
      <Image
        src="/velapal-logo.png"
        alt=""
        width={36}
        height={36}
        className="size-9 object-contain"
      />

      <span className="text-xl font-semibold tracking-tight text-slate-900">
        VelaPal
      </span>
    </Link>
  );
}

function Navigation({ onNavigate }: NavigationProps) {
  const pathname = usePathname();

  return (
    <nav aria-label="Workspace" className="mt-8 space-y-1">
      {navigation.map((item) => {
        const Icon = item.icon;

        const isActive =
          pathname === item.href ||
          (item.href !== "/workspace" &&
            pathname.startsWith(`${item.href}/`));

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={isActive ? "page" : undefined}
            className={`flex min-h-11 items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 ${
              isActive
                ? "bg-blue-50 text-blue-700"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            }`}
          >
            <Icon aria-hidden="true" className="size-5 shrink-0" />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export default function Sidebar() {
  const drawerRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 64rem)");

    function handleViewportChange() {
      if (desktop.matches) {
        drawerRef.current?.close();
      }
    }

    desktop.addEventListener("change", handleViewportChange);

    return () => {
      desktop.removeEventListener("change", handleViewportChange);
    };
  }, []);

  function closeDrawer() {
    drawerRef.current?.close();
  }

  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col overflow-y-auto border-r border-slate-200 bg-white p-5 lg:flex">
        <Brand />
        <Navigation />

        <p className="mt-auto pt-8 text-xs leading-5 text-slate-500">
          Your money, in your hands.
        </p>
      </aside>

      <header className="fixed inset-x-0 top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-5 lg:hidden">
        <Brand />

        <button
          type="button"
          aria-label="Open navigation"
          aria-haspopup="dialog"
          aria-controls="mobile-navigation"
          onClick={() => drawerRef.current?.showModal()}
          className="grid size-11 place-items-center rounded-lg text-slate-700 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-blue-600"
        >
          <Menu aria-hidden="true" className="size-5" />
        </button>
      </header>

      <dialog
        ref={drawerRef}
        id="mobile-navigation"
        aria-label="Workspace navigation"
        className="fixed inset-y-0 left-0 m-0 h-dvh max-h-none w-72 max-w-[85vw] overflow-y-auto overscroll-contain border-r border-slate-200 bg-white p-5 text-slate-900 backdrop:bg-slate-950/40 lg:hidden"
      >
        <div className="flex items-center justify-between gap-3">
          <Brand onNavigate={closeDrawer} />

          <button
            type="button"
            aria-label="Close navigation"
            onClick={closeDrawer}
            className="grid size-11 shrink-0 place-items-center rounded-lg hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-blue-600"
          >
            <X aria-hidden="true" className="size-5" />
          </button>
        </div>

        <Navigation onNavigate={closeDrawer} />
      </dialog>
    </>
  );
}