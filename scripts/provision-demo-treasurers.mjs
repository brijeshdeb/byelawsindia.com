import { createClient } from "@supabase/supabase-js";

const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
const key=process.env.SUPABASE_SERVICE_ROLE_KEY;
const password=process.env.DEMO_TREASURER_PASSWORD;
if(!url||!key||!password) throw new Error("Supabase URL, service key and DEMO_TREASURER_PASSWORD are required.");

const client=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
const targets=[
  {society:"Sunrise Cooperative Housing Society",email:"sunrise-treasurer@test.byelawsindia.com",name:"Sunrise Treasurer"},
  {society:"Moonrise Cooperative Housing Society",email:"moonrise-treasurer@test.byelawsindia.com",name:"Moonrise Treasurer"},
  {society:"Galaxy CHS",email:"galaxy-treasurer@test.byelawsindia.com",name:"Galaxy Treasurer"},
  {society:"Shivaji Nagar Cooperative Housing Society",email:"shivaji-treasurer@test.byelawsindia.com",name:"Shivaji Nagar Treasurer"},
];
const [{data:societies,error:societyError},{data:role,error:roleError}]=await Promise.all([
  client.from("societies").select("id,name").in("name",targets.map(t=>t.society)),
  client.from("roles").select("id").eq("name","Society Treasurer").single(),
]);
if(societyError||roleError||!role) throw new Error(societyError?.message||roleError?.message||"Treasurer role is missing.");
const societyByName=new Map((societies??[]).map(s=>[s.name,s.id]));
if(societyByName.size!==targets.length) throw new Error("One or more demo societies could not be found.");

for(const target of targets){
  const societyId=societyByName.get(target.society);
  const {data:profile,error:profileError}=await client.from("profiles").select("id,is_active").ilike("email",target.email).maybeSingle();
  if(profileError) throw new Error(profileError.message);
  let userId=profile?.id; let created=false;
  if(!userId){
    const {data,error}=await client.auth.admin.createUser({email:target.email,password,email_confirm:true,user_metadata:{full_name:target.name}});
    if(error||!data.user) throw new Error(error?.message||`Could not create ${target.email}`);
    userId=data.user.id; created=true;
  } else if(!profile?.is_active){
    const {error}=await client.from("profiles").update({is_active:true}).eq("id",userId);
    if(error) throw new Error(error.message);
  }
  const {data:existing,error:lookupError}=await client.from("user_access_assignments").select("id,is_active")
    .eq("user_id",userId).eq("society_id",societyId).eq("role_id",role.id).is("wing_id",null).maybeSingle();
  if(lookupError) throw new Error(lookupError.message);
  if(existing){
    const {error}=await client.from("user_access_assignments").update({is_active:true,valid_from:null,valid_until:null,updated_by:userId}).eq("id",existing.id);
    if(error) throw new Error(error.message);
  } else {
    const {error}=await client.from("user_access_assignments").insert({user_id:userId,society_id:societyId,wing_id:null,role_id:role.id,is_active:true,created_by:userId});
    if(error) throw new Error(error.message);
  }
  console.log(`${target.society}: ${target.email} (${created?"created":"verified"})`);
}
