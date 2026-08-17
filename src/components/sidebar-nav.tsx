"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavItem = { label: string; href: string; icon: React.ReactNode };
const iconClass = "h-[18px] w-[18px] shrink-0";
const icons = {
  grid: <><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></>,
  users: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></>,
  building: <><rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 7h2M14 7h2M8 11h2M14 11h2M8 15h2M14 15h2M10 21v-3h4v3"/></>,
  target: <><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/></>,
  briefcase: <><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 12h18"/></>,
  check: <><path d="M20 6 9 17l-5-5"/></>,
  activity: <><path d="M3 12h4l3-8 4 16 3-8h4"/></>,
  calendar: <><rect x="3" y="4" width="18" height="17" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></>,
  note: <><path d="M4 4h16v16H4z"/><path d="M8 8h8M8 12h8M8 16h5"/></>,
  tag: <><path d="M20 13 13 20 4 11V4h7l9 9z"/><circle cx="8" cy="8" r="1"/></>,
  chart: <><path d="M3 3v18h18"/><path d="m7 16 4-5 3 2 5-7"/></>,
  upload: <><path d="M12 16V4M7 9l5-5 5 5"/><path d="M4 20h16"/></>,
  plug: <><path d="M9 7V3M15 7V3M7 7h10v4a5 5 0 0 1-10 0V7zM12 16v5"/></>,
  compass: <><circle cx="12" cy="12" r="9"/><path d="m15 9-2 4-4 2 2-4 4-2z"/></>,
  gear: <><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-1.4 1.4-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5v.2h-2v-.2a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.9.3l-.1.1L9 17l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H7v-2h.2a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.9L8.3 9 9.7 7.6l.1.1a1.7 1.7 0 0 0 1.9.3 1.7 1.7 0 0 0 1-1.5v-.2h2v.2a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 9l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.5 1h.2v2h-.2a1.7 1.7 0 0 0-1.5 1z"/></>
};
function Icon({kind}:{kind:keyof typeof icons}) {
  return <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">{icons[kind]}</svg>;
}
const NAV: NavItem[] = [
  ["Dashboard","/dashboard","grid"], ["Prospects","/prospects","compass"], ["Prospecting","/prospecting","compass"],
  ["Leads","/leads","target"], ["Companies","/companies","building"], ["Contacts","/contacts","users"],
  ["Opportunities","/opportunities","briefcase"], ["Tasks","/tasks","check"],
  ["Activities","/activities","activity"], ["Meetings","/meetings","calendar"], ["Notes","/notes","note"],
  ["Tags","/tags","tag"], ["Reports","/reports","chart"], ["Imports","/imports","upload"],
  ["Integrations","/integrations","plug"], ["Settings","/settings","gear"],
].map(([label,href,kind]) => ({label,href,icon:<Icon kind={kind as keyof typeof icons}/>}));
export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return <nav className="flex flex-col gap-0.5 overflow-y-auto pr-1">
    {NAV.map(item => {
      const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
      return <Link key={item.href} href={item.href} onClick={onNavigate} aria-current={active ? "page":undefined}
        className={`group flex items-center gap-3 rounded-[var(--radius)] px-3 py-2 text-sm font-medium transition-colors ${active ? "bg-accent/8 text-accent" : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"}`}>
        <span className={active ? "text-accent" : "text-zinc-400 group-hover:text-zinc-600"}>{item.icon}</span><span>{item.label}</span>
      </Link>
    })}
  </nav>;
}
