"use client";
import Link from "next/link";
import {usePathname} from "next/navigation";
import {BarChart3,ClipboardList,LayoutDashboard,MessageSquareText,Plus} from "lucide-react";

const items=[
 {label:"Dashboard",href:"/dashboard",icon:LayoutDashboard},
 {label:"Surveys",href:"/dashboard/surveys",icon:ClipboardList},
 {label:"Responses",href:"/dashboard/responses",icon:MessageSquareText},
];

export default function Sidebar(){
 const pathname=usePathname();
 return <aside className="fixed inset-y-0 left-0 z-30 hidden w-[250px] border-r border-[#eceef2] bg-white lg:flex lg:flex-col">
  <div className="flex h-[76px] items-center border-b border-[#eceef2] px-6">
   <Link href="/dashboard" className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-600 font-black text-white">J</div><div><div className="text-[19px] font-extrabold">Jansetu</div><div className="text-[10px] font-semibold uppercase tracking-[.18em] text-gray-400">Survey platform</div></div></Link>
  </div>
  <div className="px-4 pt-7">
   <Link href="/dashboard/surveys" className="mb-6 flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-3 text-sm font-bold text-white shadow-[0_8px_20px_rgba(225,29,46,.18)]"><Plus size={17}/>New survey</Link>
   <div className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[.16em] text-gray-400">Workspace</div>
   <nav className="space-y-1">{items.map(item=>{const Icon=item.icon;const active=pathname===item.href||(item.href!=="/dashboard"&&pathname.startsWith(item.href));return <Link key={item.href} href={item.href} className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold ${active?"bg-red-50 text-red-700":"text-gray-500 hover:bg-gray-50 hover:text-gray-900"}`}><Icon size={19}/>{item.label}</Link>})}</nav>
  </div>
 </aside>
}