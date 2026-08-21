import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime="nodejs";
export const dynamic="force-dynamic";

export async function GET(request:Request){
  if(!env.CRON_SECRET||request.headers.get("authorization")!==`Bearer ${env.CRON_SECRET}`){
    return NextResponse.json({error:"Unauthorized"},{status:401});
  }
  try{
    const{data,error}=await createAdminClient().rpc("generate_contract_expiry_events" as never,{} as never);
    if(error)throw new Error(error.message);
    return NextResponse.json(data,{headers:{"Cache-Control":"no-store"}});
  }catch(error){
    console.error("[contract-expiry-cron]",error);
    return NextResponse.json({error:"Contract expiry scan failed"},{status:500});
  }
}
