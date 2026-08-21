const clean=(value:unknown)=>String(value??"")
  .normalize("NFKD").replace(/[^\x20-\x7E]/g," ")
  .replace(/\\/g,"\\\\").replace(/\(/g,"\\(").replace(/\)/g,"\\)");

export function buildSimplePdf(title:string,headers:string[],rows:unknown[][]):Uint8Array{
  const lines=[headers,...rows].map(row=>row.map(value=>String(value??"").replace(/\s+/g," ").slice(0,32)).join(" | ").slice(0,150));
  const chunks:Array<string[]>=[];
  for(let i=0;i<lines.length;i+=46)chunks.push(lines.slice(i,i+46));
  if(!chunks.length)chunks.push(["No records"]);
  const objects:string[]=[];const pageIds:number[]=[];
  objects[1]="<< /Type /Catalog /Pages 2 0 R >>";
  objects[3]="<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>";
  for(let page=0;page<chunks.length;page++){
    const pageId=4+page*2,contentId=pageId+1;pageIds.push(pageId);
    const commands=["BT","/F1 13 Tf","36 806 Td",`(${clean(title)} - Page ${page+1}/${chunks.length}) Tj`,"0 -22 Td","/F1 7 Tf"];
    for(const line of chunks[page]??[])commands.push(`(${clean(line)}) Tj`,"0 -15 Td");
    commands.push("ET");const stream=commands.join("\n");
    objects[pageId]=`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 3 0 R >> >> /Contents ${contentId} 0 R >>`;
    objects[contentId]=`<< /Length ${Buffer.byteLength(stream)} >>\nstream\n${stream}\nendstream`;
  }
  objects[2]=`<< /Type /Pages /Kids [${pageIds.map(id=>`${id} 0 R`).join(" ")}] /Count ${pageIds.length} >>`;
  let pdf="%PDF-1.4\n";const offsets=[0];
  for(let i=1;i<objects.length;i++){offsets[i]=Buffer.byteLength(pdf);pdf+=`${i} 0 obj\n${objects[i]}\nendobj\n`;}
  const xref=Buffer.byteLength(pdf);pdf+=`xref\n0 ${objects.length}\n0000000000 65535 f \n`;
  for(let i=1;i<objects.length;i++)pdf+=`${String(offsets[i]).padStart(10,"0")} 00000 n \n`;
  pdf+=`trailer\n<< /Size ${objects.length} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return new Uint8Array(Buffer.from(pdf,"ascii"));
}
