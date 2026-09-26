import { and, asc, count, desc, eq, gt, sql } from "drizzle-orm";
import { getDb } from "../../../db";
import { players, profiles, rooms, targets } from "../../../db/schema";

const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const WEAPONS = {
  PULSE_SIDEARM: { name: "Pulse Sidearm", level: 1, damage: 28, cooldown: 420 },
  VECTOR_CARBINE: { name: "Vector Carbine", level: 2, damage: 22, cooldown: 210 },
  SCATTER_CANNON: { name: "Scatter Cannon", level: 2, damage: 48, cooldown: 660 },
  ARC_MARKSMAN: { name: "Arc Marksman", level: 3, damage: 72, cooldown: 860 },
} as const;
const PERKS = ["NONE", "BOOST_THRUST", "POWER_CORE", "TRACKER_ARRAY"];
const SPAWNS = [
  [{x:-12,z:-8,hp:56,kind:"SCOUT"},{x:-6,z:-2,hp:56,kind:"SCOUT"},{x:0,z:-9,hp:70,kind:"GUARD"},{x:7,z:-3,hp:56,kind:"SCOUT"},{x:12,z:-10,hp:70,kind:"GUARD"},{x:-10,z:6,hp:56,kind:"SCOUT"},{x:2,z:4,hp:70,kind:"GUARD"},{x:11,z:7,hp:56,kind:"SCOUT"}],
  [{x:-14,z:-9,hp:90,kind:"GUARD"},{x:-8,z:1,hp:72,kind:"SCOUT"},{x:-2,z:-7,hp:110,kind:"TANK"},{x:5,z:0,hp:72,kind:"SCOUT"},{x:13,z:-8,hp:90,kind:"GUARD"},{x:-12,z:9,hp:72,kind:"SCOUT"},{x:0,z:8,hp:110,kind:"TANK"},{x:12,z:8,hp:90,kind:"GUARD"},{x:7,z:-13,hp:72,kind:"SCOUT"}],
  [{x:-15,z:-11,hp:110,kind:"GUARD"},{x:-10,z:1,hp:90,kind:"SCOUT"},{x:-5,z:-8,hp:140,kind:"TANK"},{x:0,z:3,hp:110,kind:"GUARD"},{x:6,z:-11,hp:90,kind:"SCOUT"},{x:13,z:-3,hp:140,kind:"TANK"},{x:-13,z:11,hp:90,kind:"SCOUT"},{x:-3,z:12,hp:110,kind:"GUARD"},{x:8,z:9,hp:90,kind:"SCOUT"},{x:15,z:12,hp:170,kind:"COMMANDER"}],
];

type Body = { action?: string; name?: string; roomCode?: string; playerId?: string; token?: string; profileKey?: string; x?: number; z?: number; heading?: number; targetId?: string; weapon?: string; perk?: string };
const cleanName = (value: unknown) => typeof value === "string" ? value.trim().replace(/\s+/g, " ").slice(0, 18) : "";
const cleanCode = (value: unknown) => typeof value === "string" ? value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6) : "";
const cleanKey = (value: unknown) => typeof value === "string" ? value.replace(/[^a-zA-Z0-9-]/g, "").slice(0, 64) : "";
const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, Number.isFinite(value) ? value : 0));
function makeCode() { const bytes=crypto.getRandomValues(new Uint8Array(6)); return Array.from(bytes,b=>CODE_CHARS[b%CODE_CHARS.length]).join(""); }

async function ensureProfile(deviceKey: string, name: string, now: number) {
  const db=getDb(); const [existing]=await db.select().from(profiles).where(eq(profiles.deviceKey,deviceKey)).limit(1);
  if(existing){ await db.update(profiles).set({name,updatedAt:now}).where(eq(profiles.id,existing.id)); return existing.id; }
  const id=crypto.randomUUID(); await db.insert(profiles).values({id,deviceKey,name,createdAt:now,updatedAt:now}); return id;
}

async function seedTargets(roomId: string, level: number, now: number) {
  const db=getDb(); await db.delete(targets).where(eq(targets.roomId,roomId)); const list=SPAWNS[Math.max(0,Math.min(2,level-1))];
  for(let i=0;i<list.length;i++){ const t=list[i]; await db.insert(targets).values({id:crypto.randomUUID(),roomId,level,targetIndex:i,x:t.x,z:t.z,hp:t.hp,maxHp:t.hp,kind:t.kind,updatedAt:now}); }
}

async function readRoom(code: string) {
  const db=getDb(); const [room]=await db.select().from(rooms).where(eq(rooms.code,code)).limit(1); if(!room)return null;
  const squad=await db.select().from(players).where(eq(players.roomId,room.id)).orderBy(asc(players.slot));
  const bots=await db.select().from(targets).where(and(eq(targets.roomId,room.id),eq(targets.level,room.level))).orderBy(asc(targets.targetIndex));
  const leaders=await db.select({name:profiles.name,totalScore:profiles.totalScore,bestLevel:profiles.bestLevel,matches:profiles.matches}).from(profiles).orderBy(desc(profiles.totalScore)).limit(8);
  return {room,squad,bots,leaders};
}

function gameState(data: NonNullable<Awaited<ReturnType<typeof readRoom>>>) {
  return { room:{code:data.room.code,status:data.room.status,hostPlayerId:data.room.hostPlayerId,level:data.room.level,startedAt:data.room.startedAt},
    players:data.squad.map(({token:_token,profileId:_profile,roomId:_room,...p})=>p), targets:data.bots, leaderboard:data.leaders };
}

function fail(error: unknown){ console.error(error); const message=error instanceof Error&&error.message.includes("no such table")?"The arena database is still preparing. Try again shortly.":"The arena link flickered. Try again."; return Response.json({error:message},{status:500}); }

export async function GET(request: Request) {
  try{ const url=new URL(request.url), code=cleanCode(url.searchParams.get("room")); const data=await readRoom(code); if(!data)return Response.json({error:"Room not found."},{status:404});
    const playerId=url.searchParams.get("player")??"", token=url.searchParams.get("token")??""; if(!data.squad.some(p=>p.id===playerId&&p.token===token))return Response.json({error:"Your squad session is invalid."},{status:401});
    return Response.json(gameState(data));
  }catch(error){return fail(error);}
}

export async function POST(request: Request) {
  try{
    const body=await request.json() as Body, db=getDb(), now=Date.now();
    if(body.action==="create"){
      const name=cleanName(body.name), profileKey=cleanKey(body.profileKey); if(name.length<2)return Response.json({error:"Enter at least 2 characters."},{status:400}); if(profileKey.length<8)return Response.json({error:"Could not create your pilot profile."},{status:400});
      let code=makeCode(); for(let i=0;i<5;i++){const [hit]=await db.select({id:rooms.id}).from(rooms).where(eq(rooms.code,code)).limit(1);if(!hit)break;code=makeCode();}
      const roomId=crypto.randomUUID(), playerId=crypto.randomUUID(), token=crypto.randomUUID(), profileId=await ensureProfile(profileKey,name,now);
      await db.batch([db.insert(rooms).values({id:roomId,code,hostPlayerId:playerId,createdAt:now,updatedAt:now}),db.insert(players).values({id:playerId,roomId,profileId,token,name,slot:0,joinedAt:now,lastSeenAt:now})]);
      const data=await readRoom(code); return Response.json({...gameState(data!),playerId,token},{status:201});
    }
    if(body.action==="join"){
      const name=cleanName(body.name), code=cleanCode(body.roomCode), profileKey=cleanKey(body.profileKey); if(name.length<2)return Response.json({error:"Enter at least 2 characters."},{status:400}); if(profileKey.length<8)return Response.json({error:"Could not load your pilot profile."},{status:400});
      const data=await readRoom(code); if(!data)return Response.json({error:"Room not found."},{status:404}); if(data.room.status!=="waiting")return Response.json({error:"This squad has already deployed."},{status:409}); if(data.squad.length>=4)return Response.json({error:"This squad already has 4 pilots."},{status:409}); if(data.squad.some(p=>p.name.toLowerCase()===name.toLowerCase()))return Response.json({error:"That callsign is already in this squad."},{status:409});
      const playerId=crypto.randomUUID(),token=crypto.randomUUID(),profileId=await ensureProfile(profileKey,name,now); const spawn=(data.squad.length-1.5)*2.3;
      await db.insert(players).values({id:playerId,roomId:data.room.id,profileId,token,name,slot:data.squad.length,x:spawn,z:9,joinedAt:now,lastSeenAt:now}); const next=await readRoom(code); return Response.json({...gameState(next!),playerId,token},{status:201});
    }
    const code=cleanCode(body.roomCode), data=await readRoom(code); if(!data)return Response.json({error:"Room not found."},{status:404}); const actor=data.squad.find(p=>p.id===body.playerId&&p.token===body.token); if(!actor)return Response.json({error:"Session expired."},{status:401});
    if(body.action==="start"){
      if(actor.id!==data.room.hostPlayerId)return Response.json({error:"Only the squad leader can deploy."},{status:403}); if(data.squad.length<2)return Response.json({error:"At least 2 pilots are required."},{status:409}); await seedTargets(data.room.id,1,now); await db.update(rooms).set({status:"playing",level:1,startedAt:now,updatedAt:now}).where(eq(rooms.id,data.room.id));
    }else if(body.action==="move"){
      if(data.room.status!=="playing")return Response.json({error:"Movement is locked between rounds."},{status:409}); await db.update(players).set({x:clamp(Number(body.x),-18,18),z:clamp(Number(body.z),-16,16),heading:clamp(Number(body.heading),-Math.PI*4,Math.PI*4),lastSeenAt:now}).where(eq(players.id,actor.id));
    }else if(body.action==="shoot"){
      if(data.room.status!=="playing")return Response.json({error:"The arena is not active."},{status:409}); const weapon=WEAPONS[actor.weapon as keyof typeof WEAPONS]??WEAPONS.PULSE_SIDEARM; if(now-actor.lastShotAt<weapon.cooldown)return Response.json({error:"Blaster is recharging."},{status:429});
      const target=data.bots.find(t=>t.id===body.targetId&&t.hp>0); if(!target)return Response.json({error:"That drone is already disabled."},{status:409}); const distance=Math.hypot(target.x-actor.x,target.z-actor.z); if(distance>32)return Response.json({error:"Target is out of range."},{status:409});
      const damage=Math.round(weapon.damage*(actor.perk==="POWER_CORE"?1.25:1)); const result=await db.update(targets).set({hp:sql<number>`max(0, ${targets.hp} - ${damage})`,updatedAt:now}).where(and(eq(targets.id,target.id),eq(targets.roomId,data.room.id),gt(targets.hp,0))).returning({hp:targets.hp}); if(!result.length)return Response.json({error:"Another pilot reached it first."},{status:409});
      const destroyed=result[0].hp<=0, points=destroyed?150:30; await db.update(players).set({score:sql`${players.score}+${points}`,hits:sql`${players.hits}+1`,shots:sql`${players.shots}+1`,lastShotAt:now,lastSeenAt:now}).where(eq(players.id,actor.id));
      const [left]=await db.select({value:count()}).from(targets).where(and(eq(targets.roomId,data.room.id),eq(targets.level,data.room.level),gt(targets.hp,0)));
      if(Number(left.value)===0){ if(data.room.level>=3){ await db.update(rooms).set({status:"victory",updatedAt:now}).where(eq(rooms.id,data.room.id)); const fresh=await readRoom(code); for(const p of fresh!.squad)await db.update(profiles).set({totalScore:sql`${profiles.totalScore}+${p.score}`,bestLevel:sql`max(${profiles.bestLevel},3)`,matches:sql`${profiles.matches}+1`,updatedAt:now}).where(eq(profiles.id,p.profileId)); } else await db.update(rooms).set({status:"upgrade",level:data.room.level+1,updatedAt:now}).where(eq(rooms.id,data.room.id)); }
    }else if(body.action==="choose"){
      if(data.room.status!=="upgrade")return Response.json({error:"Loadout changes unlock between levels."},{status:409}); const selected=body.weapon as keyof typeof WEAPONS; if(!WEAPONS[selected]||WEAPONS[selected].level>data.room.level)return Response.json({error:"That blaster is not unlocked yet."},{status:400}); const perk=String(body.perk??"NONE"); if(!PERKS.includes(perk))return Response.json({error:"Unknown advantage."},{status:400}); await db.update(players).set({weapon:selected,perk,lastSeenAt:now}).where(eq(players.id,actor.id));
    }else if(body.action==="next"){
      if(actor.id!==data.room.hostPlayerId)return Response.json({error:"Only the squad leader can launch the next level."},{status:403}); if(data.room.status!=="upgrade")return Response.json({error:"Clear the current level first."},{status:409}); await seedTargets(data.room.id,data.room.level,now); await db.update(rooms).set({status:"playing",updatedAt:now}).where(eq(rooms.id,data.room.id));
    }else if(body.action==="reset"){
      if(actor.id!==data.room.hostPlayerId)return Response.json({error:"Only the squad leader can restart."},{status:403}); await db.delete(targets).where(eq(targets.roomId,data.room.id)); await db.update(players).set({x:0,z:8,heading:0,score:0,hits:0,shots:0,weapon:"PULSE_SIDEARM",perk:"NONE",lastShotAt:0}).where(eq(players.roomId,data.room.id)); await db.update(rooms).set({status:"waiting",level:1,startedAt:null,updatedAt:now}).where(eq(rooms.id,data.room.id));
    }else return Response.json({error:"Unknown action."},{status:400});
    const next=await readRoom(code); return Response.json(gameState(next!));
  }catch(error){return fail(error);}
}
