"use client";
export default function ErrorPage({error,reset}:{error:Error&{digest?:string};reset:()=>void}){
 return <div className="flex min-h-screen items-center justify-center bg-[#f7f8fa] p-6"><div className="w-full max-w-md rounded-3xl border border-gray-200 bg-white p-8 text-center shadow-sm">
 <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-xl font-bold text-red-600">!</div>
 <h1 className="text-xl font-bold">Something went wrong</h1><p className="mt-2 text-sm text-gray-500">{error.message}</p>
 <button onClick={reset} className="mt-6 rounded-xl bg-red-600 px-5 py-3 text-sm font-semibold text-white hover:bg-red-700">Try again</button>
 </div></div>;
}