"use client";

import { useState, useTransition } from "react";
import { saveMasterDataItemAction } from "@/app/actions/release-foundations";

type Item = { id: string; society_id: string | null; category: string; code: string; label: string; description: string | null; sort_order: number; is_active: boolean };

export function MasterDataClient({ items }: { items: Item[] }) {
  const [message, setMessage] = useState(""); const [pending, startTransition] = useTransition();
  const input = "rounded border border-[#333] bg-[#171717] px-3 py-2 text-sm text-text-primary";
  function submit(formData: FormData) { startTransition(async () => {
    const result = await saveMasterDataItemAction({ category: String(formData.get("category") ?? ""), code: String(formData.get("code") ?? ""), label: String(formData.get("label") ?? ""), description: String(formData.get("description") ?? ""), sortOrder: Number(formData.get("sortOrder") ?? 0) });
    setMessage(result.success ? "Master-data item saved." : result.error);
  }); }
  return <div className="page-container"><div className="page-header"><div><h1 className="font-headline-lg-mobile text-headline-lg-mobile md:font-headline-lg md:text-headline-lg text-text-primary">Master Data</h1><p className="mt-1 text-sm text-[#9CA3AF]">Configurable lists used by forms and workflows</p></div></div>
    {message && <p className="mb-4 rounded border border-[#333] bg-[#1c1b1b] px-4 py-3 text-sm text-[#D1D5DB]">{message}</p>}
    <form action={submit} className="queue-section mb-5 grid grid-cols-1 gap-3 p-5 md:grid-cols-5"><input name="category" placeholder="CATEGORY" required className={input}/><input name="code" placeholder="CODE" required className={input}/><input name="label" placeholder="Display label" required className={input}/><input name="description" placeholder="Description" className={input}/><div className="flex gap-2"><input name="sortOrder" type="number" defaultValue={0} aria-label="Sort order" className={`${input} min-w-0 w-24`}/><button disabled={pending} className="rounded bg-[#10B981] px-4 py-2 text-sm font-medium text-white disabled:opacity-50">Add</button></div></form>
    <div className="queue-section overflow-x-auto"><table className="w-full border-collapse"><thead><tr className="border-b border-[#333] bg-[#1c1b1b]">{["Category","Code","Label","Scope","Status"].map((h)=><th key={h} className="px-4 py-3 text-left text-xs font-medium text-[#6B7280]">{h}</th>)}</tr></thead><tbody>{items.map((item)=><tr key={item.id} className="border-b border-[#292929]"><td className="px-4 py-3 text-sm text-[#9CA3AF]">{item.category}</td><td className="px-4 py-3 font-mono text-xs text-[#10B981]">{item.code}</td><td className="px-4 py-3 text-sm text-text-primary">{item.label}</td><td className="px-4 py-3 text-sm text-[#9CA3AF]">{item.society_id ? "Society" : "Platform default"}</td><td className="px-4 py-3 text-sm" style={{color:item.is_active?"#10B981":"#6B7280"}}>{item.is_active?"Active":"Inactive"}</td></tr>)}</tbody></table></div>
  </div>;
}
