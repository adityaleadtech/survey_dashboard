"use client";
import {useEffect,useMemo,useState} from "react";
import {BarChart,Bar,CartesianGrid,XAxis,YAxis,Tooltip,ResponsiveContainer} from "recharts";
import Link from "next/link";
import {ArrowUpRight,CheckCircle2,ClipboardList,FolderKanban,MessageSquareText,RefreshCw,} from "lucide-react";
import {api,endpoints} from "@/api";
import {
  BarChart3,
  LayoutDashboard,
  MessageSquare,
} from "lucide-react";
type Project={id:string;name:string;code?:string|null;status:string;total_surveys:number;total_submissions:number;is_active:boolean;color?:string|null};
const unwrap=(x:any)=>Array.isArray(x)?x:x?.data||[];

export default function Dashboard(){
 const [projects,setProjects]=useState<Project[]>([]);const [loading,setLoading]=useState(true);const [error,setError]=useState("");
 async function load(){setLoading(true);setError("");try{const r=await api<any>(`${endpoints.projects}?client_id=${encodeURIComponent(process.env.NEXT_PUBLIC_CLIENT_ID||"")}&is_active=true`);setProjects(unwrap(r));}catch(e){setError(e instanceof Error?e.message:"Unable to load projects")}finally{setLoading(false)}}
 useEffect(()=>{load()},[]);
 const stats=useMemo(()=>({projects:projects.length,active:projects.filter(p=>p.is_active).length,surveys:projects.reduce((n,p)=>n+(p.total_surveys||0),0),responses:projects.reduce((n,p)=>n+(p.total_submissions||0),0)}),[projects]);
 const chart=projects.slice(0,8).map(p=>({name:p.code||p.name.slice(0,10),responses:p.total_submissions||0,surveys:p.total_surveys||0}));
 return <div><header className="flex h-[76px] items-center justify-between border-b border-[#eceef2] bg-white px-6 lg:px-9"><div><p className="text-xs font-bold uppercase tracking-[.16em] text-red-600">Overview</p><h1 className="mt-1 text-xl font-extrabold">Dashboard</h1></div><button onClick={load} className="flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-600"><RefreshCw size={16} className={loading?"animate-spin":""}/>Refresh</button></header>
 <div className="space-y-7 p-6 lg:p-9">
  {error&&<div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}
  <section className="relative overflow-hidden rounded-3xl bg-[#111827] p-7 text-white"><div className="relative z-10 max-w-2xl"><p className="text-xs font-bold uppercase tracking-[.2em] text-red-400">Jansetu workspace</p><h2 className="mt-3 text-3xl font-black lg:text-4xl">Turn field responses into useful insight.</h2><p className="mt-3 text-sm leading-6 text-gray-300">Manage projects, attach surveys, collect responses and monitor performance from one place.</p><Link href="/dashboard/surveys" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-red-600 px-5 py-3 text-sm font-bold">Open workspace <ArrowUpRight size={17}/></Link></div><div className="absolute -right-16 -top-20 h-64 w-64 rounded-full bg-red-600/20 blur-3xl"/></section>
  <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">{[["Projects",stats.projects,FolderKanban],["Active projects",stats.active,CheckCircle2],["Surveys",stats.surveys,ClipboardList],["Responses",stats.responses,MessageSquareText]].map(([label,value,Icon]:any)=><div key={label} className="rounded-2xl border border-[#eceef2] bg-white p-5 shadow-sm"><div className="flex justify-between"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-red-600"><Icon size={19}/></div><span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Live</span></div><div className="mt-5 text-3xl font-black">{loading?"—":value}</div><div className="mt-1 text-sm text-gray-500">{label}</div></div>)}</section>
  <section className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
   <div className="rounded-2xl border border-[#eceef2] bg-white p-6 shadow-sm"><div className="flex justify-between"><div><h3 className="font-extrabold">Project activity</h3><p className="mt-1 text-xs text-gray-400">Surveys and responses</p></div><BarChart3Icon/></div><div className="mt-6 h-64">{chart.length?<ResponsiveContainer width="100%" height="100%"><BarChart data={chart}><CartesianGrid strokeDasharray="3 3" vertical={false}/><XAxis dataKey="name" tick={{fontSize:10}}/><YAxis tick={{fontSize:10}}/><Tooltip/><Bar dataKey="responses" fill="#e11d2e" radius={[6,6,0,0]}/><Bar dataKey="surveys" fill="#fecdd3" radius={[6,6,0,0]}/></BarChart></ResponsiveContainer>:<div className="flex h-full items-center justify-center text-sm text-gray-400">Create projects to see analytics.</div>}</div></div>
   <div className="rounded-2xl border border-[#eceef2] bg-white p-6 shadow-sm"><h3 className="font-extrabold">Latest projects</h3><div className="mt-5 space-y-3">{projects.slice(0,5).map(p=><Link key={p.id} href={`/dashboard/surveys/${p.id}`} className="flex items-center gap-3 rounded-xl p-3 hover:bg-gray-50"><div className="h-9 w-9 rounded-xl" style={{background:p.color||"#fee2e2"}}/><div className="min-w-0 flex-1"><p className="truncate text-sm font-bold">{p.name}</p><p className="text-xs text-gray-400">{p.total_surveys||0} surveys · {p.total_submissions||0} responses</p></div><ArrowUpRight size={15} className="text-gray-400"/></Link>)}{!projects.length&&!loading&&<p className="py-10 text-center text-sm text-gray-400">No projects yet.</p>}</div></div>
  </section>
 </div></div>
}
function BarChart3Icon(){return <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-50 text-red-600"><BarChart3 size={18}/></div>}