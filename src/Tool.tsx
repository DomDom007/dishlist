// Dishlist: a potluck sign-up with a set number of slots per course, so the table ends up balanced instead of six salads.
import { useState } from "react";
import { waLink } from "./lib/share";
import { uid, useStored } from "./lib/store";
import { useShared } from "./lib/useShared";
import { Section, ShareBox, Stat, Stats } from "./ui/kit";

const T = "dishlist";
type Cat = { id: string; name: string; slots: number };
type Claim = { id: string; cat: string; who: string; dish: string; diet: string[] };
type Party = { title: string; when: string; where: string; host: string; phone: string; guests: number; notes: string; cats: Cat[]; claims: Claim[] };
const DIETS = ["Vegetarian", "Vegan", "Gluten-free", "Contains nuts", "Spicy"];
const SAMPLE: Party = {
  title: "End of summer potluck", when: "Saturday 4 October, 13:00", where: "Salma's garden, La Marsa", host: "Salma", phone: "", guests: 18, notes: "Two kids have nut allergies, please label nuts. We have a barbecue if you want to grill.",
  cats: [{ id: "c1", name: "Mains", slots: 4 }, { id: "c2", name: "Salads and sides", slots: 3 }, { id: "c3", name: "Bread", slots: 1 }, { id: "c4", name: "Desserts", slots: 3 }, { id: "c5", name: "Drinks", slots: 3 }, { id: "c6", name: "Plates, cups, napkins", slots: 1 }],
  claims: [{ id: "k1", cat: "c1", who: "Karim", dish: "Chicken couscous", diet: [] }, { id: "k2", cat: "c2", who: "Amel", dish: "Mechouia salad", diet: ["Vegan", "Spicy"] }, { id: "k3", cat: "c4", who: "Nour", dish: "Orange cake", diet: ["Vegetarian"] }, { id: "k4", cat: "c5", who: "Hedi", dish: "Lemonade (3 L)", diet: ["Vegan"] }],
};

function Board({ p, onPick, picked }: { p: Party; onPick?: (c: string) => void; picked?: string }) {
  return (
    <div className="dl-cats">{p.cats.map(c => { const cl = p.claims.filter(x => x.cat === c.id), open = c.slots - cl.length; return (
      <div key={c.id} className={"dl-cat" + (picked === c.id ? " on" : "")}>
        <div className="row" style={{ justifyContent: "space-between", alignItems: "baseline" }}><strong>{c.name}</strong><span className={"pill " + (open > 0 ? "warn" : "good")}>{open > 0 ? `${open} open` : "Covered"}</span></div>
        <ul>{cl.map(x => <li key={x.id}>{x.dish} <span className="note">· {x.who}</span>{x.diet.map(d => <span key={d} className="pill" style={{ marginLeft: 4 }}>{d}</span>)}</li>)}{Array.from({ length: Math.max(0, open) }, (_, i) => <li key={"o" + i} className="note">Open slot</li>)}</ul>
        {onPick && open > 0 && <button className="btn small" onClick={() => onPick(c.id)}>I'll bring {c.name.toLowerCase().split(",")[0]}</button>}
      </div>); })}</div>
  );
}

export default function Dishlist() {
  const shared = useShared<Party>();
  const [p, setP] = useStored<Party>(T, "party", SAMPLE);
  const [pick, setPick] = useState("");
  const [me, setMe] = useState({ who: "", dish: "", diet: [] as string[] });
  const css = <style>{`.dl-cats{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:12px}.dl-cat{border:2px solid var(--line);border-radius:12px;padding:12px;display:grid;gap:8px;align-content:start}.dl-cat.on{border-color:var(--accent)}.dl-cat ul{margin:0;padding-left:18px;display:grid;gap:4px}`}</style>;
  const form = (party: Party, onDone: () => void, send: boolean) => pick && (
    <Section title={`Bringing: ${party.cats.find(c => c.id === pick)?.name}`}>
      <div className="stack" style={{ gap: 10 }}>
        <div className="row"><label className="field"><span>Your name</span><input className="input" value={me.who} onChange={e => setMe({ ...me, who: e.target.value })} /></label><label className="field" style={{ flexGrow: 2 }}><span>What exactly</span><input className="input" value={me.dish} onChange={e => setMe({ ...me, dish: e.target.value })} placeholder="Tabbouleh for 10" /></label></div>
        <div className="row" style={{ gap: 6 }}>{DIETS.map(d => <label key={d} className="check note"><input type="checkbox" checked={me.diet.includes(d)} onChange={e => setMe({ ...me, diet: e.target.checked ? [...me.diet, d] : me.diet.filter(x => x !== d) })} />{d}</label>)}</div>
        {send ? <a className="btn primary" style={{ alignSelf: "flex-start" }} aria-disabled={!me.who.trim() || !me.dish.trim()} href={me.who.trim() && me.dish.trim() ? waLink(`Hi ${party.host}! For ${party.title} I'll bring ${me.dish} (${party.cats.find(c => c.id === pick)?.name}).${me.diet.length ? " " + me.diet.join(", ") + "." : ""} ${me.who}`, party.phone) : undefined} target="_blank" rel="noreferrer">Tell {party.host} on WhatsApp</a>
          : <button className="btn primary" style={{ alignSelf: "flex-start" }} onClick={() => { if (!me.who.trim() || !me.dish.trim()) return; setP({ ...p, claims: [...p.claims, { id: uid(), cat: pick, ...me }] }); onDone(); }}>Add to the list</button>}
      </div>
    </Section>
  );

  if (shared.loading) return <p className="empty-note">Opening…</p>;
  if (shared.data) {
    const x = shared.data;
    return <div className="stack">{css}<section className="panel"><p className="eyebrow">Potluck</p><h2 style={{ fontSize: 34 }}>{x.title}</h2><p>{x.when} · {x.where}</p><p className="note" style={{ marginTop: 6 }}>{x.notes}</p></section>
      <Section title="What's covered"><Board p={x} onPick={setPick} picked={pick} /><p className="note" style={{ marginTop: 8 }}>As of when this link was sent.</p></Section>{form(x, () => setPick(""), true)}</div>;
  }
  const slots = p.cats.reduce((a, c) => a + c.slots, 0);
  const set = (patch: Partial<Party>) => setP({ ...p, ...patch });
  return (
    <div className="stack">{css}
      <Section title={p.title}><Stats><Stat value={p.guests} label="Guests" /><Stat value={`${p.claims.length}/${slots}`} label="Slots filled" /><Stat value={p.cats.filter(c => p.claims.filter(x => x.cat === c.id).length < c.slots).map(c => c.name).join(", ") || "Nothing"} label="Still missing" tone="warn" /></Stats></Section>
      <div className="grid2">
        <Section title="The party">
          <div className="stack" style={{ gap: 10 }}>
            <label className="field"><span>Name</span><input className="input" value={p.title} onChange={e => set({ title: e.target.value })} /></label>
            <div className="row"><label className="field"><span>When</span><input className="input" value={p.when} onChange={e => set({ when: e.target.value })} /></label><label className="field"><span>Where</span><input className="input" value={p.where} onChange={e => set({ where: e.target.value })} /></label></div>
            <div className="row"><label className="field"><span>Host</span><input className="input" value={p.host} onChange={e => set({ host: e.target.value })} /></label><label className="field"><span>Host WhatsApp</span><input className="input" value={p.phone} onChange={e => set({ phone: e.target.value })} /></label><label className="field" style={{ flex: "0 0 90px" }}><span>Guests</span><input className="input num" value={p.guests} onChange={e => { const g = parseInt(e.target.value) || 0; set({ guests: g }); }} /></label></div>
            <label className="field"><span>Notes for guests</span><textarea className="input" rows={2} value={p.notes} onChange={e => set({ notes: e.target.value })} /></label>
            <button className="btn small" style={{ alignSelf: "flex-start" }} onClick={() => { const g = p.guests; set({ cats: p.cats.map(c => ({ ...c, slots: Math.max(1, Math.round(g * ({ Mains: 0.22, "Salads and sides": 0.17, Desserts: 0.15, Drinks: 0.15 } as Record<string, number>)[c.name] || c.slots)) })) }); }}>Suggest slots for {p.guests} guests</button>
          </div>
        </Section>
        <Section title="Courses and slots">
          {p.cats.map(c => <div key={c.id} className="row" style={{ marginBottom: 6, alignItems: "center" }}><input className="input" style={{ flex: 1 }} aria-label="Course" value={c.name} onChange={e => set({ cats: p.cats.map(x => x.id === c.id ? { ...x, name: e.target.value } : x) })} /><input className="input num" style={{ width: 70 }} aria-label="Slots" value={c.slots} onChange={e => set({ cats: p.cats.map(x => x.id === c.id ? { ...x, slots: parseInt(e.target.value) || 0 } : x) })} /><button className="btn ghost small danger" onClick={() => set({ cats: p.cats.filter(x => x.id !== c.id) })}>×</button></div>)}
          <button className="btn small" onClick={() => set({ cats: [...p.cats, { id: uid(), name: "New course", slots: 2 }] })}>Add a course</button>
        </Section>
      </div>
      <Section title="Invite"><ShareBox slug={T} data={p} label="Copy sign-up link" message={`${p.title}, ${p.when}. Pick what you'll bring:`} /></Section>
      <Section title="The table"><Board p={p} onPick={setPick} picked={pick} />
        <div className="row" style={{ gap: 6, marginTop: 12 }}>{p.claims.map(c => <span key={c.id} className="pill">{c.who}: {c.dish} <button className="btn ghost small" style={{ padding: "0 4px" }} aria-label="Remove" onClick={() => set({ claims: p.claims.filter(x => x.id !== c.id) })}>×</button></span>)}</div></Section>
      {form(p, () => { setPick(""); setMe({ who: "", dish: "", diet: [] }); }, false)}
    </div>
  );
}
