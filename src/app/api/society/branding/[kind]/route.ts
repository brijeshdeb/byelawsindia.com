import { NextResponse } from "next/server";

import { getServerContext } from "@/lib/context";

export const dynamic="force-dynamic";

export async function GET(_request:Request,{params}:{params:Promise<{kind:string}>}){
  const{kind}=await params;
  if(kind!=="logo"&&kind!=="letterhead")return NextResponse.json({error:"Unknown branding asset."},{status:404});
  const{supabase,societyId}=await getServerContext();
  const column=kind==="logo"?"logo_url":"letterhead_url";
  const{data,error}=await supabase.from("societies").select(`${column}`).eq("id",societyId).single();
  if(error||!data)return NextResponse.json({error:"Branding asset not found."},{status:404});
  const path=(data as unknown as Record<string,string|null>)[column];
  if(!path||!path.startsWith(`${societyId}/branding/${kind}/`))return NextResponse.json({error:"Branding asset not configured."},{status:404});
  const{data:signed,error:signedError}=await supabase.storage.from("society-documents").createSignedUrl(path,60);
  if(signedError||!signed)return NextResponse.json({error:"Branding asset is unavailable."},{status:404});
  return NextResponse.redirect(signed.signedUrl);
}
