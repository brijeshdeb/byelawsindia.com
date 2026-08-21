"use client";
import {useState} from "react";
import {useRouter} from "next/navigation";

export function StatutoryImport(){
  const router=useRouter();const[message,setMessage]=useState("");const[pending,setPending]=useState(false);
  async function submit(event:React.FormEvent<HTMLFormElement>){
    event.preventDefault();setPending(true);setMessage("");const form=new FormData(event.currentTarget);const type=String(form.get("formType")??"i");
    try{const response=await fetch(`/api/members/statutory-registers/${type}`,{method:"POST",body:form});const result=await response.json();if(!response.ok){const detail=Array.isArray(result.errors)?` ${result.errors.slice(0,3).map((item:{row:number;reason:string})=>`Row ${item.row}: ${item.reason}`).join(" ")}`:"";throw new Error(`${result.error??"Import failed."}${detail}`);}setMessage(`${result.updated} member record${result.updated===1?"":"s"} updated atomically.`);router.refresh();event.currentTarget.reset();}
    catch(error){setMessage(error instanceof Error?error.message:"Import failed.");}finally{setPending(false);}
  }
  return <form onSubmit={submit} className="queue-section mb-7 grid gap-4 p-5 md:grid-cols-[180px_1fr_auto]"><div className="md:col-span-3"><h2 className="font-semibold text-text-primary">Import statutory register</h2><p className="mt-1 text-xs text-[#9CA3AF]">Upload an exported Form I or Form J workbook. Rows are matched by exact member name and flat; any unmatched or ambiguous row cancels the entire import.</p></div><select name="formType" className="rounded border border-[#333] bg-[#171717] px-3 py-2 text-sm text-text-primary"><option value="i">Form I</option><option value="j">Form J</option></select><input name="file" type="file" accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" required className="rounded border border-[#333] bg-[#171717] px-3 py-2 text-sm text-[#9CA3AF]"/><button disabled={pending} className="rounded bg-[#10B981] px-4 py-2 text-sm font-medium text-white disabled:opacity-50">{pending?"Validating…":"Validate & import"}</button>{message?<p role="status" className="md:col-span-3 text-sm text-[#D1D5DB]">{message}</p>:null}</form>;
}
