import { useState, useEffect, useRef } from "react";

// ─── STORAGE ─────────────────────────────────────────────────────────────────
const S = {
  get: (k, def) => { try { const v = sessionStorage.getItem(k); return v ? JSON.parse(v) : def; } catch { return def; } },
  set: (k, v) => { try { sessionStorage.setItem(k, JSON.stringify(v)); } catch {} },
};

// ─── DEFAULT CATEGORIES (fully dynamic now) ──────────────────────────────────
const DEFAULT_CATEGORIES = [
  { id:"cat_1", name:"Grocery",      emoji:"🛒", accent:"#2e7d32", dark:"#134e1b", light:"#e8f5e9", tag:"#81c784" },
  { id:"cat_2", name:"Electronics",  emoji:"⚡", accent:"#1565c0", dark:"#0d2a6b", light:"#e3f2fd", tag:"#64b5f6" },
  { id:"cat_3", name:"Mechanical",   emoji:"⚙️", accent:"#e65100", dark:"#7a2800", light:"#fff3e0", tag:"#ffb74d" },
  { id:"cat_4", name:"Bike & Cycle", emoji:"🚲", accent:"#880e4f", dark:"#4a0030", light:"#fce4ec", tag:"#f48fb1" },
];

const ACCENT_PRESETS = [
  { accent:"#2e7d32", dark:"#134e1b", light:"#e8f5e9", tag:"#81c784" },
  { accent:"#1565c0", dark:"#0d2a6b", light:"#e3f2fd", tag:"#64b5f6" },
  { accent:"#e65100", dark:"#7a2800", light:"#fff3e0", tag:"#ffb74d" },
  { accent:"#880e4f", dark:"#4a0030", light:"#fce4ec", tag:"#f48fb1" },
  { accent:"#6a1b9a", dark:"#38006b", light:"#f3e5f5", tag:"#ce93d8" },
  { accent:"#00695c", dark:"#003d33", light:"#e0f2f1", tag:"#80cbc4" },
  { accent:"#c62828", dark:"#7f0000", light:"#ffebee", tag:"#ef9a9a" },
  { accent:"#f57f17", dark:"#7c4700", light:"#fff8e1", tag:"#ffe082" },
  { accent:"#37474f", dark:"#102027", light:"#eceff1", tag:"#b0bec5" },
  { accent:"#1b5e20", dark:"#003300", light:"#f1f8e9", tag:"#aed581" },
];

const EMOJI_PRESETS = ["🛒","⚡","⚙️","🚲","👕","👟","📱","💊","🍕","🧴","🔑","🏠","🎮","📚","🌿","🧹","🔧","🛠️","🧲","💡","🎁","🐾","🏋️","🚗","✏️","🍎","🧃","🥦","🐟","🧺"];

const DEFAULT_PRODUCTS = [
  { id:1, name:"Basmati Rice (5kg)",     price:12.5, stock:40, unit:"bag",    categoryId:"cat_1", image:null, originalPrice:null, reviews:[] },
  { id:2, name:"Sunflower Oil (1L)",      price:3.2,  stock:60, unit:"bottle", categoryId:"cat_1", image:null, originalPrice:null, reviews:[] },
  { id:3, name:"Sugar (1kg)",             price:1.8,  stock:80, unit:"pack",   categoryId:"cat_1", image:null, originalPrice:null, reviews:[] },
  { id:4, name:"USB-C Cable 2m",          price:8.99, stock:25, unit:"pcs",    categoryId:"cat_2", image:null, originalPrice:null, reviews:[] },
  { id:5, name:"LED Bulb 12W",            price:4.5,  stock:50, unit:"pcs",    categoryId:"cat_2", image:null, originalPrice:null, reviews:[] },
  { id:6, name:"Extension Socket 4-way", price:14.0, stock:15, unit:"pcs",    categoryId:"cat_2", image:null, originalPrice:null, reviews:[] },
  { id:7, name:"WD-40 Spray 400ml",       price:7.5,  stock:20, unit:"can",    categoryId:"cat_3", image:null, originalPrice:null, reviews:[] },
  { id:8, name:"Wrench Set (10pc)",        price:22.0, stock:8,  unit:"set",    categoryId:"cat_3", image:null, originalPrice:null, reviews:[] },
  { id:9, name:'Inner Tube 26"',           price:5.5,  stock:18, unit:"pcs",    categoryId:"cat_4", image:null, originalPrice:null, reviews:[] },
  { id:10,name:"Bike Chain",              price:11.0, stock:12, unit:"pcs",    categoryId:"cat_4", image:null, originalPrice:null, reviews:[] },
];

const DEFAULT_BIZ   = { name:"My Shop", tagline:"Quality products at great prices", whatsapp:"", logo:null, pin:"1234" };
const DEFAULT_SALES = [];
const UNITS = ["pcs","kg","g","L","ml","pack","box","bag","set","pair","can","bottle","roll"];
let nextId    = 50;
let nextCatId = 10;

// ─── THEME ────────────────────────────────────────────────────────────────────
const THEME = {
  dark:  { bg:"#0f0f14", card:"#1a1a2e", card2:"#16213e", border:"#ffffff12", text:"#f0f0f0", sub:"#888", input:"#ffffff0d", inputBorder:"#ffffff20", navBg:"#0f0f14ee" },
  light: { bg:"#f4f6fb", card:"#ffffff",  card2:"#f0f4ff", border:"#e0e0e0",   text:"#1a1a2e", sub:"#666", input:"#ffffff",   inputBorder:"#ddd",       navBg:"#ffffffee" },
};

// ─── SMALL HELPERS ────────────────────────────────────────────────────────────
function Toast({ toast }) {
  if (!toast) return null;
  const bg = toast.type==="error"?"#c62828":toast.type==="remove"?"#333":"#2e7d32";
  return (
    <div style={{ position:"fixed",top:16,left:"50%",transform:"translateX(-50%)",zIndex:9999,
      background:bg,color:"#fff",padding:"10px 22px",borderRadius:30,fontWeight:700,fontSize:13,
      boxShadow:"0 4px 24px rgba(0,0,0,.4)",whiteSpace:"nowrap",animation:"popIn .22s ease",fontFamily:"sans-serif" }}>
      {toast.msg}
    </div>
  );
}
function useToast() {
  const [t,setT] = useState(null);
  const show = (msg,type="success") => { setT({msg,type}); setTimeout(()=>setT(null),2400); };
  return [t,show];
}
function StarRating({ value, onChange, size=20 }) {
  return (
    <div style={{display:"flex",gap:4}}>
      {[1,2,3,4,5].map(s=>(
        <span key={s} onClick={()=>onChange&&onChange(s)}
          style={{fontSize:size,cursor:onChange?"pointer":"default",color:s<=value?"#f4c430":"#ccc"}}>★</span>
      ))}
    </div>
  );
}
function Img({ image, emoji, size=56, radius=12 }) {
  if (image) return <img src={image} alt="" style={{width:size,height:size,borderRadius:radius,objectFit:"cover",display:"block",flexShrink:0}} />;
  return <div style={{width:size,height:size,borderRadius:radius,flexShrink:0,background:"#ffffff15",display:"flex",alignItems:"center",justifyContent:"center",fontSize:size*.45}}>{emoji}</div>;
}
function ImgUpload({ image, onChange, T }) {
  const ref = useRef();
  const pick = e => { const f=e.target.files[0]; if(!f) return; const r=new FileReader(); r.onload=ev=>onChange(ev.target.result); r.readAsDataURL(f); };
  return (
    <div>
      <label style={{display:"block",fontWeight:700,fontSize:13,color:T.sub,marginBottom:8,fontFamily:"sans-serif"}}>Product Photo (optional)</label>
      <div style={{display:"flex",alignItems:"center",gap:12}}>
        {image ? <img src={image} alt="" style={{width:72,height:72,borderRadius:12,objectFit:"cover",border:"2px solid #ddd"}} />
               : <div style={{width:72,height:72,borderRadius:12,background:T.input,border:"2px dashed #ccc",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",fontSize:11,color:"#aaa"}}><span style={{fontSize:24}}>📷</span><span>No photo</span></div>}
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          <button type="button" onClick={()=>ref.current.click()} style={{background:"#1a1a2e",color:"#fff",border:"none",borderRadius:8,padding:"9px 16px",cursor:"pointer",fontWeight:700,fontSize:13,fontFamily:"sans-serif"}}>📷 {image?"Change":"Upload"}</button>
          {image && <button type="button" onClick={()=>onChange(null)} style={{background:"#ffebee",color:"#c62828",border:"none",borderRadius:8,padding:"7px 16px",cursor:"pointer",fontWeight:700,fontSize:12,fontFamily:"sans-serif"}}>🗑 Remove</button>}
        </div>
      </div>
      <input ref={ref} type="file" accept="image/*" onChange={pick} style={{display:"none"}} />
    </div>
  );
}

// ─── PIN LOCK ─────────────────────────────────────────────────────────────────
function PinLock({ biz, onUnlock, onGuest, T }) {
  const [pin,setPin] = useState(""); const [err,setErr] = useState(false);
  const tap = d => {
    if (pin.length>=4) return;
    const next = pin+d; setPin(next);
    if (next.length===4) {
      if (next===biz.pin) { setTimeout(()=>onUnlock(),200); }
      else { setErr(true); setTimeout(()=>{ setPin(""); setErr(false); },700); }
    }
  };
  return (
    <div style={{minHeight:"100vh",background:T.bg,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",fontFamily:"sans-serif"}}>
      <div style={{fontSize:48,marginBottom:12}}>🔐</div>
      <div style={{fontSize:20,fontWeight:900,color:T.text,marginBottom:4}}>Owner Panel</div>
      <div style={{fontSize:13,color:T.sub,marginBottom:30}}>Enter your 4-digit PIN</div>
      <div style={{display:"flex",gap:12,marginBottom:28}}>
        {[0,1,2,3].map(i=><div key={i} style={{width:16,height:16,borderRadius:"50%",background:i<pin.length?(err?"#c62828":"#f4c430"):T.border,transition:"background .2s"}} />)}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12,width:220,marginBottom:24}}>
        {[1,2,3,4,5,6,7,8,9,"",0,"⌫"].map((d,i)=>(
          <button key={i} onClick={()=>{ if(d==="⌫") setPin(p=>p.slice(0,-1)); else if(d!=="") tap(String(d)); }}
            style={{height:60,borderRadius:14,border:"none",fontSize:20,fontWeight:700,cursor:d===""?"default":"pointer",
              background:d===""?"transparent":T.card,color:T.text,boxShadow:d===""?"none":"0 2px 8px rgba(0,0,0,.1)"}}>
            {d}
          </button>
        ))}
      </div>
      <button onClick={onGuest} style={{background:"transparent",border:"none",color:T.sub,cursor:"pointer",fontSize:13,textDecoration:"underline"}}>Browse as Customer →</button>
      <div style={{marginTop:10,fontSize:11,color:T.sub}}>Default PIN: 1234</div>
    </div>
  );
}

// ─── CATEGORY MANAGER (inside Settings) ──────────────────────────────────────
function CategoryManager({ categories, setCategories, products, T }) {
  const [adding,setAdding]   = useState(false);
  const [editing,setEditing] = useState(null);
  const [form,setForm]       = useState({ name:"", emoji:"🛍️", ...ACCENT_PRESETS[0] });
  const [toast,show]         = useToast();

  const openAdd  = () => { setForm({ name:"", emoji:"🛍️", ...ACCENT_PRESETS[0] }); setEditing(null); setAdding(true); };
  const openEdit = cat => { setForm({ name:cat.name, emoji:cat.emoji, accent:cat.accent, dark:cat.dark, light:cat.light, tag:cat.tag }); setEditing(cat); setAdding(true); };

  const save = () => {
    if (!form.name.trim()) return show("⚠️ Enter a category name","error");
    if (editing) {
      const updated = categories.map(c=>c.id===editing.id ? { ...c, ...form } : c);
      setCategories(updated); S.set("shop_cats",updated); show("✅ Category updated!");
    } else {
      const newCat = { id:"cat_"+nextCatId++, ...form };
      const updated = [...categories, newCat];
      setCategories(updated); S.set("shop_cats",updated); show("✅ Category added!");
    }
    setAdding(false);
  };

  const del = cat => {
    const inUse = products.some(p=>p.categoryId===cat.id);
    if (inUse) return show(`⚠️ Move products out of "${cat.name}" first`,"error");
    const updated = categories.filter(c=>c.id!==cat.id);
    setCategories(updated); S.set("shop_cats",updated); show("🗑 Category deleted","remove");
  };

  return (
    <div>
      <Toast toast={toast} />
      {adding ? (
        <div style={{background:T.card2,borderRadius:16,padding:16,marginBottom:14,border:`1px solid ${T.border}`}}>
          <div style={{fontWeight:800,fontSize:15,color:T.text,marginBottom:14}}>{editing?"Edit Category":"New Category"}</div>
          <div style={{marginBottom:12}}>
            <label style={{display:"block",fontWeight:700,fontSize:13,color:T.sub,marginBottom:6}}>Category Name *</label>
            <input value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} placeholder="e.g. Clothing"
              style={{width:"100%",padding:"11px 14px",borderRadius:10,border:`1.5px solid ${T.inputBorder}`,fontSize:14,outline:"none",background:T.input,color:T.text,boxSizing:"border-box"}} />
          </div>
          <div style={{marginBottom:12}}>
            <label style={{display:"block",fontWeight:700,fontSize:13,color:T.sub,marginBottom:8}}>Icon Emoji</label>
            <div style={{display:"flex",flexWrap:"wrap",gap:8,marginBottom:8}}>
              {EMOJI_PRESETS.map(e=>(
                <button key={e} onClick={()=>setForm(f=>({...f,emoji:e}))}
                  style={{fontSize:22,background:form.emoji===e?"#f4c43033":"transparent",border:`2px solid ${form.emoji===e?"#f4c430":"transparent"}`,borderRadius:8,padding:4,cursor:"pointer"}}>
                  {e}
                </button>
              ))}
            </div>
            <input value={form.emoji} onChange={e=>setForm(f=>({...f,emoji:e.target.value}))} placeholder="Or type any emoji"
              style={{width:80,padding:"8px 10px",borderRadius:8,border:`1.5px solid ${T.inputBorder}`,fontSize:18,outline:"none",background:T.input,color:T.text,textAlign:"center"}} />
          </div>
          <div style={{marginBottom:14}}>
            <label style={{display:"block",fontWeight:700,fontSize:13,color:T.sub,marginBottom:8}}>Colour Theme</label>
            <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
              {ACCENT_PRESETS.map((p,i)=>(
                <button key={i} onClick={()=>setForm(f=>({...f,...p}))}
                  style={{width:32,height:32,borderRadius:"50%",background:p.accent,border:`3px solid ${form.accent===p.accent?"#f4c430":"transparent"}`,cursor:"pointer"}} />
              ))}
            </div>
          </div>
          {/* Preview */}
          <div style={{background:`linear-gradient(135deg,${form.dark}cc,${form.accent}88)`,borderRadius:12,padding:"12px 16px",marginBottom:14,display:"flex",alignItems:"center",gap:10}}>
            <span style={{fontSize:28}}>{form.emoji}</span>
            <div style={{fontWeight:700,color:"#fff"}}>{form.name||"Category Name"}</div>
          </div>
          <div style={{display:"flex",gap:8}}>
            <button onClick={()=>setAdding(false)} style={{flex:1,background:T.card,color:T.text,border:`1px solid ${T.border}`,borderRadius:10,padding:12,cursor:"pointer",fontWeight:700}}>Cancel</button>
            <button onClick={save} style={{flex:2,background:"#f4c430",color:"#1a1a1a",border:"none",borderRadius:10,padding:12,cursor:"pointer",fontWeight:800,fontSize:15}}>
              {editing?"💾 Save Changes":"✅ Add Category"}
            </button>
          </div>
        </div>
      ) : (
        <button onClick={openAdd} style={{width:"100%",background:"#f4c430",color:"#1a1a1a",border:"none",borderRadius:12,padding:13,fontWeight:800,fontSize:15,cursor:"pointer",marginBottom:14}}>
          + Add New Category
        </button>
      )}

      {categories.map(cat=>(
        <div key={cat.id} style={{background:T.card,borderRadius:12,padding:"13px 14px",marginBottom:8,display:"flex",alignItems:"center",gap:12,boxShadow:"0 2px 8px rgba(0,0,0,.06)"}}>
          <div style={{width:42,height:42,borderRadius:10,background:`linear-gradient(135deg,${cat.dark},${cat.accent})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0}}>{cat.emoji}</div>
          <div style={{flex:1}}>
            <div style={{fontWeight:700,fontSize:14,color:T.text}}>{cat.name}</div>
            <div style={{fontSize:11,color:T.sub}}>{products.filter(p=>p.categoryId===cat.id).length} products</div>
          </div>
          <button onClick={()=>openEdit(cat)} style={{background:cat.light,color:cat.accent,border:"none",borderRadius:8,padding:"7px 11px",cursor:"pointer",fontWeight:700,fontSize:13}}>✏️</button>
          <button onClick={()=>del(cat)} style={{background:"#ffebee",color:"#c62828",border:"none",borderRadius:8,padding:"7px 11px",cursor:"pointer",fontWeight:700,fontSize:13}}>🗑️</button>
        </div>
      ))}
    </div>
  );
}

// ─── SETTINGS PAGE ────────────────────────────────────────────────────────────
function Settings({ biz,setBiz, categories,setCategories, products, onBack, T }) {
  const [tab,setTab]   = useState("biz"); // biz | cats
  const [form,setForm] = useState({...biz});
  const [toast,show]   = useToast();
  const logoRef        = useRef();
  const pickLogo = e => { const f=e.target.files[0]; if(!f) return; const r=new FileReader(); r.onload=ev=>setForm(fr=>({...fr,logo:ev.target.result})); r.readAsDataURL(f); };
  const save = () => { setBiz(form); S.set("shop_biz",form); show("✅ Settings saved!"); };

  return (
    <div style={{minHeight:"100vh",background:T.bg,fontFamily:"sans-serif",paddingBottom:30}}>
      <Toast toast={toast} />
      <div style={{background:"#1a1a2e",padding:"16px 18px",display:"flex",alignItems:"center",gap:12}}>
        <button onClick={onBack} style={{background:"#ffffff15",border:"none",borderRadius:8,padding:"8px 14px",cursor:"pointer",fontWeight:700,color:"#fff"}}>← Back</button>
        <div style={{fontWeight:900,fontSize:17,color:"#fff"}}>⚙️ Settings</div>
      </div>
      {/* Tabs */}
      <div style={{display:"flex",background:T.card,borderBottom:`1px solid ${T.border}`}}>
        {[{id:"biz",label:"🏪 Shop Info"},{id:"cats",label:"🗂 Categories"}].map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)}
            style={{flex:1,padding:"13px 0",border:"none",background:"transparent",cursor:"pointer",fontWeight:700,fontSize:14,
              color:tab===t.id?"#f4c430":T.sub,borderBottom:`3px solid ${tab===t.id?"#f4c430":"transparent"}`}}>
            {t.label}
          </button>
        ))}
      </div>

      <div style={{padding:16}}>
        {tab==="biz" && (
          <>
            <div style={{background:T.card,borderRadius:16,padding:16,marginBottom:14,boxShadow:"0 2px 10px rgba(0,0,0,.07)"}}>
              <div style={{fontWeight:700,fontSize:12,color:T.sub,marginBottom:12,letterSpacing:1}}>LOGO</div>
              <div style={{display:"flex",alignItems:"center",gap:14}}>
                {form.logo ? <img src={form.logo} alt="" style={{width:72,height:72,borderRadius:16,objectFit:"cover"}} />
                           : <div style={{width:72,height:72,borderRadius:16,background:"#f4c43022",border:"2px dashed #f4c430",display:"flex",alignItems:"center",justifyContent:"center",fontSize:30}}>🏪</div>}
                <div style={{display:"flex",flexDirection:"column",gap:8}}>
                  <button onClick={()=>logoRef.current.click()} style={{background:"#1a1a2e",color:"#fff",border:"none",borderRadius:8,padding:"9px 16px",cursor:"pointer",fontWeight:700,fontSize:13}}>📷 {form.logo?"Change":"Upload"} Logo</button>
                  {form.logo && <button onClick={()=>setForm(f=>({...f,logo:null}))} style={{background:"#ffebee",color:"#c62828",border:"none",borderRadius:8,padding:"7px 16px",cursor:"pointer",fontWeight:700,fontSize:12}}>🗑 Remove</button>}
                </div>
              </div>
              <input ref={logoRef} type="file" accept="image/*" onChange={pickLogo} style={{display:"none"}} />
            </div>
            <div style={{background:T.card,borderRadius:16,padding:16,marginBottom:14,boxShadow:"0 2px 10px rgba(0,0,0,.07)"}}>
              <div style={{fontWeight:700,fontSize:12,color:T.sub,marginBottom:12,letterSpacing:1}}>SHOP DETAILS</div>
              {[{k:"name",l:"Shop Name",ph:"e.g. Ahmed's Stores"},{k:"tagline",l:"Tagline",ph:"e.g. Quality at great prices"},{k:"whatsapp",l:"WhatsApp (with country code)",ph:"+1234567890"}].map(({k,l,ph})=>(
                <div key={k} style={{marginBottom:14}}>
                  <label style={{display:"block",fontWeight:700,fontSize:13,color:T.sub,marginBottom:6}}>{l}</label>
                  <input value={form[k]} onChange={e=>setForm(f=>({...f,[k]:e.target.value}))} placeholder={ph}
                    style={{width:"100%",padding:"11px 14px",borderRadius:10,border:`1.5px solid ${T.inputBorder}`,fontSize:14,outline:"none",background:T.input,color:T.text,boxSizing:"border-box"}} />
                </div>
              ))}
            </div>
            <div style={{background:T.card,borderRadius:16,padding:16,marginBottom:14,boxShadow:"0 2px 10px rgba(0,0,0,.07)"}}>
              <div style={{fontWeight:700,fontSize:12,color:T.sub,marginBottom:12,letterSpacing:1}}>🔐 OWNER PIN</div>
              <input type="password" maxLength={4} value={form.pin} onChange={e=>setForm(f=>({...f,pin:e.target.value.replace(/\D/g,"").slice(0,4)}))} placeholder="4-digit PIN"
                style={{width:"100%",padding:"11px 14px",borderRadius:10,border:`1.5px solid ${T.inputBorder}`,fontSize:22,letterSpacing:10,outline:"none",background:T.input,color:T.text,boxSizing:"border-box"}} />
              <div style={{fontSize:11,color:T.sub,marginTop:6}}>Customers must enter this PIN to access the owner panel</div>
            </div>
            <button onClick={save} style={{width:"100%",background:"#f4c430",color:"#1a1a1a",border:"none",borderRadius:12,padding:15,fontWeight:800,fontSize:16,cursor:"pointer"}}>
              💾 Save Settings
            </button>
          </>
        )}
        {tab==="cats" && (
          <CategoryManager categories={categories} setCategories={setCategories} products={products} T={T} />
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// OWNER APP
// ═══════════════════════════════════════════════════════════════════════════════
function OwnerApp({ products,setProducts, sales,setSales, biz,setBiz, categories,setCategories, onSwitch, theme,setTheme }) {
  const T = THEME[theme];
  const [activeCatId,setActiveCatId] = useState(()=>categories[0]?.id||"");
  const [view,setView]               = useState("products");
  const [editProduct,setEditProduct] = useState(null);
  const [search,setSearch]           = useState("");
  const [toast,show]                 = useToast();
  const [form,setForm]               = useState({ name:"",price:"",stock:"",unit:"pcs",image:null,originalPrice:"" });
  const [saleForm,setSaleForm]       = useState({ productId:"",qty:1 });

  const activeCat = categories.find(c=>c.id===activeCatId)||categories[0];
  const catProducts = products.filter(p=>p.categoryId===activeCatId);
  const filtered    = catProducts.filter(p=>p.name.toLowerCase().includes(search.toLowerCase()));
  const totalValue  = products.reduce((s,p)=>s+p.price*p.stock,0);
  const lowStock    = products.filter(p=>p.stock<=8);
  const totalRev    = sales.reduce((s,sa)=>s+sa.total,0);

  const saveP = u => { setProducts(u); S.set("shop_products",u); };

  const handleAdd = () => {
    if (!form.name||!form.price||!form.stock) return show("⚠️ Fill required fields","error");
    const p = { id:nextId++, name:form.name, price:parseFloat(form.price), stock:parseInt(form.stock), unit:form.unit, image:form.image, categoryId:activeCatId, originalPrice:form.originalPrice?parseFloat(form.originalPrice):null, reviews:[] };
    saveP([...products,p]); setForm({name:"",price:"",stock:"",unit:"pcs",image:null,originalPrice:""}); setView("products"); show(`✅ "${p.name}" added!`);
  };
  const handleEdit = () => {
    if (!form.name||!form.price||!form.stock) return show("⚠️ Fill required fields","error");
    saveP(products.map(p=>p.id===editProduct.id?{...p,name:form.name,price:parseFloat(form.price),stock:parseInt(form.stock),unit:form.unit,image:form.image,originalPrice:form.originalPrice?parseFloat(form.originalPrice):null}:p));
    setView("products"); show("✅ Updated!");
  };
  const handleDelete = (id,name) => { saveP(products.filter(p=>p.id!==id)); show(`🗑 "${name}" removed`,"error"); };
  const openEdit = p => { setEditProduct(p); setForm({name:p.name,price:p.price,stock:p.stock,unit:p.unit,image:p.image,originalPrice:p.originalPrice||""}); setView("edit"); };
  const openAdd  = () => { setForm({name:"",price:"",stock:"",unit:"pcs",image:null,originalPrice:""}); setView("add"); };

  const recordSale = () => {
    const prod = products.find(p=>p.id===parseInt(saleForm.productId));
    if (!prod) return show("⚠️ Select a product","error");
    if (saleForm.qty<1||saleForm.qty>prod.stock) return show(`⚠️ Max: ${prod.stock}`,"error");
    const sale = { id:Date.now(), productId:prod.id, productName:prod.name, qty:parseInt(saleForm.qty), price:prod.price, total:prod.price*parseInt(saleForm.qty), date:new Date().toLocaleDateString() };
    const updSales = [sale,...sales]; setSales(updSales); S.set("shop_sales",updSales);
    saveP(products.map(p=>p.id===prod.id?{...p,stock:p.stock-parseInt(saleForm.qty)}:p));
    setSaleForm({productId:"",qty:1}); show(`✅ Sale recorded — ${sale.qty} unit${sale.qty>1?"s":""} sold`);
  };

  if (view==="settings") return <Settings biz={biz} setBiz={setBiz} categories={categories} setCategories={setCategories} products={products} onBack={()=>setView("products")} T={T} />;

  return (
    <div style={{minHeight:"100vh",background:T.bg,fontFamily:"sans-serif",paddingBottom:20}}>
      <Toast toast={toast} />
      {/* Header */}
      <div style={{background:"#1a1a2e",color:"#fff",padding:"13px 16px"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            {biz.logo?<img src={biz.logo} alt="" style={{width:34,height:34,borderRadius:8,objectFit:"cover"}}/>:<span style={{fontSize:26}}>🏪</span>}
            <div><div style={{fontWeight:900,fontSize:16}}>{biz.name}</div><div style={{fontSize:10,color:"#aaa"}}>Owner Panel</div></div>
          </div>
          <div style={{display:"flex",gap:6}}>
            <button onClick={()=>setTheme(t=>t==="dark"?"light":"dark")} style={{background:"#ffffff15",border:"none",borderRadius:8,padding:"7px 11px",cursor:"pointer",fontSize:15}}>{theme==="dark"?"☀️":"🌙"}</button>
            <button onClick={()=>setView("settings")} style={{background:"#ffffff15",border:"none",borderRadius:8,padding:"7px 11px",cursor:"pointer",fontSize:15}}>⚙️</button>
            <button onClick={onSwitch} style={{background:"#f4c430",color:"#1a1a1a",border:"none",borderRadius:8,padding:"7px 12px",cursor:"pointer",fontWeight:700,fontSize:12}}>👁 Customer</button>
          </div>
        </div>
        <div style={{display:"flex",gap:6}}>
          {[{id:"products",icon:"📦"},{id:"dashboard",icon:"📊"},{id:"sales",icon:"💰"}].map(tab=>(
            <button key={tab.id} onClick={()=>setView(tab.id)}
              style={{background:view===tab.id?"#f4c430":"#ffffff15",color:view===tab.id?"#1a1a1a":"#fff",border:"none",borderRadius:8,padding:"6px 14px",cursor:"pointer",fontWeight:700,fontSize:12}}>
              {tab.icon} {tab.id.charAt(0).toUpperCase()+tab.id.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Dashboard */}
      {view==="dashboard" && (
        <div style={{padding:16}}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:16}}>
            {[{l:"Total Products",v:products.length,i:"📦",c:"#1565c0"},{l:"Inventory Value",v:`$${totalValue.toFixed(2)}`,i:"💰",c:"#2e7d32"},{l:"Total Sales",v:`$${totalRev.toFixed(2)}`,i:"🧾",c:"#880e4f"},{l:"Low Stock",v:lowStock.length,i:"⚠️",c:"#e65100"}].map(s=>(
              <div key={s.l} style={{background:T.card,borderRadius:14,padding:14,boxShadow:"0 2px 10px rgba(0,0,0,.07)",borderLeft:`4px solid ${s.c}`}}>
                <div style={{fontSize:22}}>{s.i}</div>
                <div style={{fontSize:20,fontWeight:800,color:s.c,marginTop:4}}>{s.v}</div>
                <div style={{fontSize:11,color:T.sub,marginTop:2}}>{s.l}</div>
              </div>
            ))}
          </div>
          {categories.map(cat=>{
            const items=products.filter(p=>p.categoryId===cat.id);
            const val=items.reduce((s,p)=>s+p.price*p.stock,0);
            return (
              <div key={cat.id} style={{background:T.card,borderRadius:12,padding:"13px 15px",marginBottom:8,display:"flex",alignItems:"center",justifyContent:"space-between",boxShadow:"0 2px 8px rgba(0,0,0,.05)"}}>
                <div style={{display:"flex",alignItems:"center",gap:10}}>
                  <div style={{width:36,height:36,borderRadius:8,background:`linear-gradient(135deg,${cat.dark},${cat.accent})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>{cat.emoji}</div>
                  <div><div style={{fontWeight:700,fontSize:13,color:T.text}}>{cat.name}</div><div style={{fontSize:11,color:T.sub}}>{items.length} products</div></div>
                </div>
                <div style={{fontWeight:800,color:cat.accent}}>${val.toFixed(2)}</div>
              </div>
            );
          })}
          {lowStock.length>0 && (
            <><div style={{fontWeight:700,fontSize:14,marginTop:16,marginBottom:10,color:"#c62828"}}>⚠️ Low Stock</div>
            {lowStock.map(p=>{ const cat=categories.find(c=>c.id===p.categoryId)||{emoji:"📦"}; return (
              <div key={p.id} style={{background:"#fff3e0",borderRadius:10,padding:"11px 13px",marginBottom:8,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div style={{display:"flex",alignItems:"center",gap:10}}><Img image={p.image} emoji={cat.emoji} size={36} radius={8}/><div><div style={{fontWeight:600,fontSize:13,color:"#1a1a1a"}}>{p.name}</div><div style={{fontSize:11,color:"#888"}}>{cat.name}</div></div></div>
                <div style={{background:"#e65100",color:"#fff",borderRadius:8,padding:"4px 10px",fontSize:12,fontWeight:700}}>{p.stock} left</div>
              </div>
            );})}
            </>
          )}
        </div>
      )}

      {/* Sales */}
      {view==="sales" && (
        <div style={{padding:16}}>
          <div style={{background:T.card,borderRadius:16,padding:16,marginBottom:14,boxShadow:"0 2px 10px rgba(0,0,0,.07)"}}>
            <div style={{fontWeight:800,fontSize:15,color:T.text,marginBottom:14}}>📝 Record a Sale</div>
            <div style={{marginBottom:12}}>
              <label style={{display:"block",fontWeight:700,fontSize:13,color:T.sub,marginBottom:6}}>Product</label>
              <select value={saleForm.productId} onChange={e=>setSaleForm(f=>({...f,productId:e.target.value}))}
                style={{width:"100%",padding:"11px 14px",borderRadius:10,border:`1.5px solid ${T.inputBorder}`,fontSize:14,background:T.input,color:T.text,outline:"none"}}>
                <option value="">-- Choose product --</option>
                {categories.map(cat=>(
                  <optgroup key={cat.id} label={`${cat.emoji} ${cat.name}`}>
                    {products.filter(p=>p.categoryId===cat.id&&p.stock>0).map(p=>(
                      <option key={p.id} value={p.id}>{p.name} (${p.price} · {p.stock} {p.unit})</option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>
            <div style={{marginBottom:14}}>
              <label style={{display:"block",fontWeight:700,fontSize:13,color:T.sub,marginBottom:6}}>Quantity</label>
              <input type="number" min="1" value={saleForm.qty} onChange={e=>setSaleForm(f=>({...f,qty:e.target.value}))}
                style={{width:"100%",padding:"11px 14px",borderRadius:10,border:`1.5px solid ${T.inputBorder}`,fontSize:14,background:T.input,color:T.text,outline:"none",boxSizing:"border-box"}} />
            </div>
            {saleForm.productId && <div style={{background:"#f4c43018",borderRadius:10,padding:"10px 14px",marginBottom:12,fontSize:13,color:T.text}}>💰 Total: <strong>${(parseFloat(products.find(p=>p.id===parseInt(saleForm.productId))?.price||0)*parseInt(saleForm.qty||0)).toFixed(2)}</strong></div>}
            <button onClick={recordSale} style={{width:"100%",background:"#2e7d32",color:"#fff",border:"none",borderRadius:12,padding:14,fontWeight:800,fontSize:15,cursor:"pointer"}}>✅ Record Sale</button>
          </div>
          <div style={{background:"#f4c43018",border:"1px solid #f4c43033",borderRadius:12,padding:"12px 16px",marginBottom:14,display:"flex",justifyContent:"space-between"}}>
            <span style={{color:T.sub,fontSize:13}}>Total Revenue</span>
            <span style={{fontWeight:900,color:"#f4c430",fontSize:18}}>${totalRev.toFixed(2)}</span>
          </div>
          {sales.length===0
            ? <div style={{textAlign:"center",padding:"40px 20px",color:T.sub}}><div style={{fontSize:40}}>📭</div><div style={{marginTop:10}}>No sales yet</div></div>
            : sales.map(sale=>(
              <div key={sale.id} style={{background:T.card,borderRadius:12,padding:"13px 15px",marginBottom:8,display:"flex",justifyContent:"space-between",alignItems:"center",boxShadow:"0 2px 8px rgba(0,0,0,.05)"}}>
                <div><div style={{fontWeight:700,fontSize:13,color:T.text}}>{sale.productName}</div><div style={{fontSize:11,color:T.sub,marginTop:2}}>{sale.date} · {sale.qty} unit{sale.qty>1?"s":""} × ${sale.price}</div></div>
                <div style={{fontWeight:800,color:"#2e7d32",fontSize:16}}>${sale.total.toFixed(2)}</div>
              </div>
            ))
          }
        </div>
      )}

      {/* Category tabs + products */}
      {(view==="products"||view==="add"||view==="edit") && (
        <>
          <div style={{display:"flex",overflowX:"auto",padding:"10px 12px 0",gap:6,background:T.card,borderBottom:`1px solid ${T.border}`,scrollbarWidth:"none"}}>
            {categories.map(cat=>{
              const active=activeCatId===cat.id;
              const lc=products.filter(p=>p.categoryId===cat.id&&p.stock<=8).length;
              return (
                <button key={cat.id} onClick={()=>{ setActiveCatId(cat.id); if(view!=="add"&&view!=="edit") setView("products"); setSearch(""); }}
                  style={{whiteSpace:"nowrap",border:"none",borderRadius:"10px 10px 0 0",padding:"9px 13px",cursor:"pointer",fontWeight:700,fontSize:12,
                    background:active?cat.accent:"transparent",color:active?"#fff":T.sub,
                    borderBottom:`3px solid ${active?cat.accent:"transparent"}`,position:"relative"}}>
                  {cat.emoji} {cat.name}
                  {lc>0&&<span style={{position:"absolute",top:4,right:4,background:"#e65100",color:"#fff",borderRadius:"50%",width:14,height:14,fontSize:9,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:900}}>{lc}</span>}
                </button>
              );
            })}
          </div>
          {view==="products" && activeCat && (
            <div style={{padding:16}}>
              <div style={{display:"flex",gap:10,marginBottom:14}}>
                <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍 Search..."
                  style={{flex:1,padding:"10px 14px",borderRadius:10,border:`1.5px solid ${T.inputBorder}`,fontSize:14,outline:"none",background:T.input,color:T.text}} />
                <button onClick={openAdd} style={{background:activeCat.accent,color:"#fff",border:"none",borderRadius:10,padding:"10px 18px",fontWeight:700,fontSize:14,cursor:"pointer"}}>+ Add</button>
              </div>
              {filtered.length===0
                ? <div style={{textAlign:"center",padding:"50px 20px",color:T.sub}}><div style={{fontSize:40}}>📭</div><div style={{marginTop:10}}>No products yet — tap + Add</div></div>
                : filtered.map(product=>{
                    const avgR = product.reviews?.length?(product.reviews.reduce((s,r)=>s+r.rating,0)/product.reviews.length):0;
                    return (
                      <div key={product.id} style={{background:T.card,borderRadius:14,padding:14,marginBottom:10,boxShadow:"0 2px 10px rgba(0,0,0,.07)",borderLeft:`4px solid ${activeCat.accent}`,display:"flex",alignItems:"center",gap:12}}>
                        <Img image={product.image} emoji={activeCat.emoji} size={54} radius={10}/>
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{fontWeight:700,fontSize:14,color:T.text,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{product.name}</div>
                          {product.originalPrice&&<div style={{fontSize:11,color:T.sub,textDecoration:"line-through"}}>${product.originalPrice.toFixed(2)}</div>}
                          <div style={{display:"flex",gap:6,marginTop:5,flexWrap:"wrap"}}>
                            <span style={{background:"#e8f5e9",color:"#2e7d32",borderRadius:6,padding:"3px 9px",fontSize:12,fontWeight:700}}>💲{product.price.toFixed(2)}</span>
                            <span style={{background:product.stock<=8?"#ffebee":"#e3f2fd",color:product.stock<=8?"#c62828":"#1565c0",borderRadius:6,padding:"3px 9px",fontSize:12,fontWeight:700}}>📦 {product.stock} {product.unit}{product.stock<=8?" ⚠️":""}</span>
                          </div>
                          {avgR>0&&<div style={{marginTop:4,fontSize:11,color:"#f4c430"}}>{"★".repeat(Math.round(avgR))}{"☆".repeat(5-Math.round(avgR))} ({product.reviews.length})</div>}
                        </div>
                        <div style={{display:"flex",flexDirection:"column",gap:6}}>
                          <button onClick={()=>openEdit(product)} style={{background:activeCat.light,color:activeCat.accent,border:"none",borderRadius:8,padding:"8px 12px",cursor:"pointer",fontWeight:700}}>✏️</button>
                          <button onClick={()=>handleDelete(product.id,product.name)} style={{background:"#ffebee",color:"#c62828",border:"none",borderRadius:8,padding:"8px 12px",cursor:"pointer",fontWeight:700}}>🗑️</button>
                        </div>
                      </div>
                    );
                  })
              }
            </div>
          )}
          {(view==="add"||view==="edit") && activeCat && (
            <div style={{padding:16}}>
              <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:18}}>
                <button onClick={()=>setView("products")} style={{background:T.card2,border:"none",borderRadius:8,padding:"8px 14px",cursor:"pointer",fontWeight:700,color:T.text}}>← Back</button>
                <div style={{fontWeight:800,fontSize:17,color:T.text}}>{view==="add"?`Add to ${activeCat.name}`:"Edit Product"}</div>
              </div>
              <div style={{background:T.card,borderRadius:14,padding:16,marginBottom:14,boxShadow:"0 2px 8px rgba(0,0,0,.06)"}}>
                <ImgUpload image={form.image} onChange={img=>setForm(f=>({...f,image:img}))} T={T}/>
              </div>
              <div style={{background:T.card,borderRadius:14,padding:16,boxShadow:"0 2px 8px rgba(0,0,0,.06)"}}>
                {[{f:"name",l:"Product Name *",t:"text",ph:"e.g. Basmati Rice 5kg"},{f:"originalPrice",l:"Original Price (for discount display)",t:"number",ph:"0.00"},{f:"price",l:"Selling Price ($) *",t:"number",ph:"0.00"},{f:"stock",l:"Stock Quantity *",t:"number",ph:"0"}].map(({f,l,t,ph})=>(
                  <div key={f} style={{marginBottom:14}}>
                    <label style={{display:"block",fontWeight:700,fontSize:13,color:T.sub,marginBottom:6}}>{l}</label>
                    <input type={t} min="0" step={f==="stock"?"1":"0.01"} value={form[f]} onChange={e=>setForm(fr=>({...fr,[f]:e.target.value}))} placeholder={ph}
                      style={{width:"100%",padding:"11px 14px",borderRadius:10,border:`1.5px solid ${activeCat.accent}`,fontSize:14,outline:"none",background:T.input,color:T.text,boxSizing:"border-box"}} />
                  </div>
                ))}
                <div><label style={{display:"block",fontWeight:700,fontSize:13,color:T.sub,marginBottom:6}}>Unit</label>
                  <select value={form.unit} onChange={e=>setForm(f=>({...f,unit:e.target.value}))} style={{width:"100%",padding:"11px 14px",borderRadius:10,border:`1.5px solid ${T.inputBorder}`,fontSize:14,background:T.input,color:T.text,outline:"none"}}>
                    {UNITS.map(u=><option key={u}>{u}</option>)}
                  </select>
                </div>
              </div>
              <button onClick={view==="add"?handleAdd:handleEdit} style={{width:"100%",background:activeCat.accent,color:"#fff",border:"none",borderRadius:12,padding:15,fontWeight:800,fontSize:16,cursor:"pointer",marginTop:14}}>
                {view==="add"?"✅ Add Product":"💾 Save Changes"}
              </button>
            </div>
          )}
        </>
      )}
      <style>{`@keyframes popIn{from{opacity:0;transform:translateX(-50%) scale(0.85)}to{opacity:1;transform:translateX(-50%) scale(1)}}`}</style>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// CUSTOMER APP
// ═══════════════════════════════════════════════════════════════════════════════
function CustomerApp({ products,setProducts, categories, biz, onSwitch, theme,setTheme }) {
  const T = THEME[theme];
  const [activeCatId,setActiveCatId] = useState("all");
  const [search,setSearch]           = useState("");
  const [saved,setSaved]             = useState([]);
  const [view,setView]               = useState("shop");
  const [toast,show]                 = useToast();
  const [selected,setSelected]       = useState(null);
  const [reviewForm,setReviewForm]   = useState({rating:0,text:"",name:""});
  const [shareMsg,setShareMsg]       = useState(null);

  const toggleSave = p => {
    const already=saved.some(s=>s.id===p.id);
    if(already){setSaved(prev=>prev.filter(s=>s.id!==p.id));show("🗑 Removed","remove");}
    else{setSaved(prev=>[...prev,p]);show(`❤️ "${p.name}" saved!`);}
  };
  const isSaved = id => saved.some(s=>s.id===id);

  const filtered = products.filter(p=>{
    const matchCat = activeCatId==="all"||p.categoryId===activeCatId;
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
    return matchCat&&matchSearch;
  });

  const totalSaved = saved.reduce((s,p)=>s+p.price,0);
  const avgRating  = p => p.reviews?.length?(p.reviews.reduce((s,r)=>s+r.rating,0)/p.reviews.length).toFixed(1):null;

  const sendWhatsApp = () => {
    if(!biz.whatsapp) return show("⚠️ WhatsApp not set up yet","error");
    const lines=saved.map(p=>`• ${p.name} — $${p.price.toFixed(2)}`).join("\n");
    const msg=encodeURIComponent(`Hi! I'm interested in these items from ${biz.name}:\n\n${lines}\n\nEstimated Total: $${totalSaved.toFixed(2)}`);
    window.open(`https://wa.me/${biz.whatsapp.replace(/\D/g,"")}?text=${msg}`,"_blank");
  };

  const shareProduct = p => {
    const cat=categories.find(c=>c.id===p.categoryId);
    const text=`${p.name} — $${p.price.toFixed(2)}\nCategory: ${cat?.name||""}\nIn stock: ${p.stock} ${p.unit}\nFrom: ${biz.name}`;
    if(navigator.share){navigator.share({title:p.name,text});}
    else{navigator.clipboard.writeText(text).then(()=>{setShareMsg("📋 Copied!");setTimeout(()=>setShareMsg(null),2000);});}
  };

  const submitReview = () => {
    if(!reviewForm.rating) return show("⚠️ Pick a star rating","error");
    if(!reviewForm.name.trim()) return show("⚠️ Enter your name","error");
    const review={id:Date.now(),rating:reviewForm.rating,text:reviewForm.text,name:reviewForm.name,date:new Date().toLocaleDateString()};
    const updated=products.map(p=>p.id===selected.id?{...p,reviews:[review,...(p.reviews||[])]}:p);
    setProducts(updated); S.set("shop_products",updated);
    setSelected(updated.find(p=>p.id===selected.id));
    setReviewForm({rating:0,text:"",name:""}); show("⭐ Review submitted!");
  };

  return (
    <div style={{minHeight:"100vh",background:T.bg,fontFamily:"sans-serif",paddingBottom:72}}>
      <Toast toast={toast}/>
      {shareMsg&&<div style={{position:"fixed",top:16,left:"50%",transform:"translateX(-50%)",zIndex:9999,background:"#1a1a2e",color:"#f4c430",padding:"10px 22px",borderRadius:30,fontWeight:700,fontSize:13}}>{shareMsg}</div>}

      {/* Product detail modal */}
      {selected && (
        <div style={{position:"fixed",inset:0,zIndex:500,background:"#000000cc",display:"flex",alignItems:"flex-end"}} onClick={()=>setSelected(null)}>
          <div onClick={e=>e.stopPropagation()} style={{background:T.card,borderRadius:"24px 24px 0 0",width:"100%",maxHeight:"88vh",overflowY:"auto",boxSizing:"border-box",borderTop:`3px solid ${categories.find(c=>c.id===selected.categoryId)?.accent||"#f4c430"}`}}>
            <div style={{padding:"20px 20px 0"}}>
              <div style={{width:40,height:4,background:T.border,borderRadius:2,margin:"0 auto 18px"}}/>
              {(() => {
                const cat=categories.find(c=>c.id===selected.categoryId)||{emoji:"📦",accent:"#888",name:"?"};
                return (
                  <>
                    <div style={{display:"flex",gap:14,marginBottom:16}}>
                      {selected.image?<img src={selected.image} alt="" style={{width:88,height:88,borderRadius:16,objectFit:"cover",flexShrink:0}}/>
                        :<div style={{width:88,height:88,borderRadius:16,background:cat.accent+"22",display:"flex",alignItems:"center",justifyContent:"center",fontSize:40,flexShrink:0}}>{cat.emoji}</div>}
                      <div style={{flex:1}}>
                        <div style={{fontSize:16,fontWeight:800,color:T.text,marginBottom:4}}>{selected.name}</div>
                        <div style={{display:"inline-block",background:cat.accent+"22",color:cat.accent,borderRadius:6,padding:"2px 9px",fontSize:11,fontWeight:700,marginBottom:6}}>{cat.name}</div>
                        {selected.originalPrice&&<div style={{fontSize:12,color:T.sub,textDecoration:"line-through"}}>${selected.originalPrice.toFixed(2)}</div>}
                        <div style={{fontSize:24,fontWeight:900,color:"#f4c430"}}>${selected.price.toFixed(2)}</div>
                        {avgRating(selected)&&<StarRating value={Math.round(parseFloat(avgRating(selected)))} size={16}/>}
                      </div>
                    </div>
                    <div style={{background:T.card2,borderRadius:12,padding:"12px 16px",marginBottom:14}}>
                      <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
                        <span style={{color:T.sub,fontSize:13}}>Status</span>
                        <span style={{fontWeight:700,fontSize:13,color:selected.stock===0?"#ef5350":selected.stock<=8?"#ffb74d":"#81c784"}}>
                          {selected.stock===0?"❌ Out of Stock":selected.stock<=8?`⚠️ Only ${selected.stock} left`:"✅ In Stock"}
                        </span>
                      </div>
                      <div style={{display:"flex",justifyContent:"space-between"}}>
                        <span style={{color:T.sub,fontSize:13}}>Available</span>
                        <span style={{fontWeight:700,fontSize:13,color:T.text}}>{selected.stock} {selected.unit}</span>
                      </div>
                    </div>
                    <div style={{display:"flex",gap:8,marginBottom:16}}>
                      <button onClick={()=>toggleSave(selected)} style={{flex:1,background:isSaved(selected.id)?"#333":"#f4c430",color:isSaved(selected.id)?"#fff":"#1a1a1a",border:"none",borderRadius:12,padding:13,fontWeight:800,fontSize:14,cursor:"pointer"}}>
                        {isSaved(selected.id)?"🗑 Unsave":"❤️ Save"}
                      </button>
                      <button onClick={()=>shareProduct(selected)} style={{background:T.card2,color:T.text,border:`1px solid ${T.border}`,borderRadius:12,padding:"13px 16px",cursor:"pointer",fontWeight:700,fontSize:14}}>🔗 Share</button>
                    </div>
                  </>
                );
              })()}
            </div>
            <div style={{padding:"0 20px 30px"}}>
              <div style={{fontWeight:800,fontSize:15,color:T.text,marginBottom:12}}>⭐ Reviews {selected.reviews?.length>0&&`(${selected.reviews.length})`}</div>
              <div style={{background:T.card2,borderRadius:14,padding:14,marginBottom:14}}>
                <div style={{fontWeight:700,fontSize:13,color:T.sub,marginBottom:10}}>Leave a Review</div>
                <StarRating value={reviewForm.rating} onChange={r=>setReviewForm(f=>({...f,rating:r}))} size={28}/>
                <input value={reviewForm.name} onChange={e=>setReviewForm(f=>({...f,name:e.target.value}))} placeholder="Your name *"
                  style={{width:"100%",padding:"10px 12px",borderRadius:9,border:`1.5px solid ${T.inputBorder}`,fontSize:13,background:T.input,color:T.text,outline:"none",marginTop:10,boxSizing:"border-box"}}/>
                <textarea value={reviewForm.text} onChange={e=>setReviewForm(f=>({...f,text:e.target.value}))} placeholder="Comment (optional)" rows={2}
                  style={{width:"100%",padding:"10px 12px",borderRadius:9,border:`1.5px solid ${T.inputBorder}`,fontSize:13,background:T.input,color:T.text,outline:"none",marginTop:8,resize:"none",boxSizing:"border-box"}}/>
                <button onClick={submitReview} style={{width:"100%",background:categories.find(c=>c.id===selected.categoryId)?.accent||"#f4c430",color:"#fff",border:"none",borderRadius:10,padding:11,fontWeight:700,fontSize:14,cursor:"pointer",marginTop:8}}>Submit Review</button>
              </div>
              {selected.reviews?.length===0&&<div style={{textAlign:"center",color:T.sub,fontSize:13,padding:"10px 0"}}>No reviews yet — be the first!</div>}
              {selected.reviews?.map(r=>(
                <div key={r.id} style={{background:T.card2,borderRadius:12,padding:"12px 14px",marginBottom:8}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}><span style={{fontWeight:700,fontSize:13,color:T.text}}>{r.name}</span><span style={{fontSize:11,color:T.sub}}>{r.date}</span></div>
                  <StarRating value={r.rating} size={14}/>
                  {r.text&&<div style={{fontSize:13,color:T.sub,marginTop:6}}>{r.text}</div>}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{background:"linear-gradient(135deg,#1a1a2e,#16213e,#0f3460)",padding:"18px 16px 12px",position:"sticky",top:0,zIndex:100,borderBottom:`1px solid ${T.border}`}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            {biz.logo?<img src={biz.logo} alt="" style={{width:34,height:34,borderRadius:8,objectFit:"cover"}}/>:<span style={{fontSize:26}}>🏪</span>}
            <div><div style={{fontSize:18,fontWeight:900,color:"#fff"}}>{biz.name}</div><div style={{fontSize:10,color:"#aaa"}}>{biz.tagline}</div></div>
          </div>
          <div style={{display:"flex",gap:6}}>
            <button onClick={()=>setTheme(t=>t==="dark"?"light":"dark")} style={{background:"#ffffff15",border:"none",borderRadius:8,padding:"7px 11px",cursor:"pointer",fontSize:15}}>{theme==="dark"?"☀️":"🌙"}</button>
            <button onClick={onSwitch} style={{background:"#ffffff15",border:"1px solid #ffffff22",color:"#fff",borderRadius:8,padding:"7px 12px",cursor:"pointer",fontWeight:700,fontSize:12}}>🔧</button>
          </div>
        </div>
        <div style={{position:"relative"}}>
          <span style={{position:"absolute",left:13,top:"50%",transform:"translateY(-50%)"}}>🔍</span>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search products..."
            style={{width:"100%",padding:"10px 14px 10px 38px",borderRadius:12,border:"1.5px solid #ffffff18",background:"#ffffff0d",color:"#fff",fontSize:14,outline:"none",boxSizing:"border-box"}}/>
          {search&&<button onClick={()=>setSearch("")} style={{position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",color:"#aaa",cursor:"pointer",fontSize:18}}>×</button>}
        </div>
      </div>

      {view==="shop" && (
        <>
          <div style={{display:"flex",overflowX:"auto",gap:8,padding:"12px 14px",scrollbarWidth:"none"}}>
            {[{id:"all",name:"All",emoji:"🏪",accent:"#f4c430"},...categories].map(cat=>(
              <button key={cat.id} onClick={()=>setActiveCatId(cat.id)}
                style={{whiteSpace:"nowrap",border:activeCatId===cat.id?"none":"1px solid #ffffff18",borderRadius:30,padding:"7px 15px",cursor:"pointer",
                  background:activeCatId===cat.id?"#f4c430":"#ffffff08",color:activeCatId===cat.id?"#1a1a1a":"#ccc",fontWeight:activeCatId===cat.id?800:500,fontSize:13}}>
                {cat.emoji} {cat.name}
              </button>
            ))}
          </div>
          <div style={{padding:"0 14px 8px",fontSize:12,color:T.sub}}>{filtered.length} product{filtered.length!==1?"s":""}</div>
          <div style={{padding:"0 12px",display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            {filtered.length===0&&<div style={{gridColumn:"span 2",textAlign:"center",padding:"60px 20px",color:T.sub}}><div style={{fontSize:40}}>🔎</div><div style={{marginTop:10}}>No products found</div></div>}
            {filtered.map(product=>{
              const cat=categories.find(c=>c.id===product.categoryId)||{emoji:"📦",dark:"#333",accent:"#666",tag:"#aaa"};
              const outOfStock=product.stock===0;
              const lowStockFlag=product.stock>0&&product.stock<=8;
              const productSaved=isSaved(product.id);
              const rating=avgRating(product);
              return (
                <div key={product.id} onClick={()=>{setSelected(product);setReviewForm({rating:0,text:"",name:""}); }}
                  style={{background:`linear-gradient(145deg,${cat.dark}cc,${cat.accent}88)`,borderRadius:18,overflow:"hidden",
                    border:`1.5px solid ${productSaved?"#f4c430":cat.tag+"22"}`,opacity:outOfStock?0.55:1,cursor:"pointer"}}>
                  <div style={{width:"100%",height:100,background:"#ffffff08",display:"flex",alignItems:"center",justifyContent:"center",position:"relative",overflow:"hidden"}}>
                    {product.image?<img src={product.image} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>:<span style={{fontSize:46,opacity:0.35}}>{cat.emoji}</span>}
                    <button onClick={e=>{e.stopPropagation();!outOfStock&&toggleSave(product);}}
                      style={{position:"absolute",top:7,right:7,background:productSaved?"#f4c430":"#00000055",border:"none",borderRadius:"50%",width:28,height:28,cursor:outOfStock?"not-allowed":"pointer",fontSize:13,display:"flex",alignItems:"center",justifyContent:"center"}}>
                      {productSaved?"❤️":"🤍"}
                    </button>
                    {product.originalPrice&&<div style={{position:"absolute",top:7,left:7,background:"#c62828",color:"#fff",borderRadius:6,padding:"2px 7px",fontSize:10,fontWeight:800}}>SALE</div>}
                    {outOfStock&&<div style={{position:"absolute",inset:0,background:"#00000077",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,color:"#ef5350"}}>OUT OF STOCK</div>}
                  </div>
                  <div style={{padding:"10px 11px 12px"}}>
                    <div style={{fontSize:12,fontWeight:700,color:"#fff",marginBottom:4,lineHeight:1.3}}>{product.name}</div>
                    {product.originalPrice&&<div style={{fontSize:10,color:"#ffaaaa",textDecoration:"line-through"}}>${product.originalPrice.toFixed(2)}</div>}
                    <div style={{fontSize:18,fontWeight:900,color:"#f4c430",marginBottom:3}}>${product.price.toFixed(2)}</div>
                    {rating&&<div style={{fontSize:10,color:"#f4c430",marginBottom:2}}>{"★".repeat(Math.round(parseFloat(rating)))} {rating}</div>}
                    <div style={{fontSize:10,fontWeight:600,color:outOfStock?"#ef5350":lowStockFlag?"#ffb74d":"#81c784"}}>
                      {outOfStock?"❌ Out of stock":lowStockFlag?`⚠️ ${product.stock} left`:`✅ ${product.stock} ${product.unit}`}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {view==="saved" && (
        <div style={{padding:16}}>
          <div style={{fontWeight:800,fontSize:18,color:T.text,marginBottom:4}}>❤️ Your Saved List</div>
          <div style={{fontSize:13,color:T.sub,marginBottom:16}}>{saved.length===0?"Nothing saved yet":`${saved.length} item${saved.length>1?"s":""} · Est. $${totalSaved.toFixed(2)}`}</div>
          {saved.length===0
            ?<div style={{textAlign:"center",padding:"50px 20px",color:T.sub}}><div style={{fontSize:48}}>🤍</div><div style={{marginTop:12,fontSize:15}}>Nothing saved yet</div><button onClick={()=>setView("shop")} style={{marginTop:16,background:"#f4c430",color:"#1a1a1a",border:"none",borderRadius:30,padding:"12px 28px",fontWeight:800,fontSize:14,cursor:"pointer"}}>Browse →</button></div>
            :<>
              {saved.map(p=>{
                const cat=categories.find(c=>c.id===p.categoryId)||{emoji:"📦",dark:"#333",accent:"#666",tag:"#aaa",light:"#eee"};
                return (
                  <div key={p.id} style={{background:T.theme==="dark"?`linear-gradient(135deg,${cat.dark}99,${cat.accent}66)`:T.card,borderRadius:16,padding:14,marginBottom:10,display:"flex",alignItems:"center",gap:12,boxShadow:"0 2px 8px rgba(0,0,0,.06)"}}>
                    <Img image={p.image} emoji={cat.emoji} size={52} radius={10}/>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontWeight:700,fontSize:13,color:T.text,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{p.name}</div>
                      <div style={{fontSize:11,color:T.sub,marginTop:2}}>{cat.name}</div>
                      <div style={{fontSize:18,fontWeight:900,color:"#f4c430",marginTop:4}}>${p.price.toFixed(2)}</div>
                    </div>
                    <div style={{display:"flex",flexDirection:"column",gap:6}}>
                      <button onClick={()=>shareProduct(p)} style={{background:T.card2,border:`1px solid ${T.border}`,color:T.text,borderRadius:8,padding:"6px 10px",cursor:"pointer",fontSize:12,fontWeight:700}}>🔗</button>
                      <button onClick={()=>toggleSave(p)} style={{background:"#ff525222",color:"#ff5252",border:"none",borderRadius:8,padding:"6px 10px",cursor:"pointer",fontSize:12,fontWeight:700}}>✕</button>
                    </div>
                  </div>
                );
              })}
              <div style={{background:T.card,border:"1px solid #f4c43033",borderRadius:16,padding:18,marginTop:8}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}><span style={{color:T.sub,fontSize:14}}>Estimated Total</span><span style={{fontSize:26,fontWeight:900,color:"#f4c430"}}>${totalSaved.toFixed(2)}</span></div>
                {biz.whatsapp
                  ?<button onClick={sendWhatsApp} style={{width:"100%",background:"#25D366",color:"#fff",border:"none",borderRadius:12,padding:14,fontWeight:800,fontSize:15,cursor:"pointer",marginBottom:10,display:"flex",alignItems:"center",justifyContent:"center",gap:8}}><span style={{fontSize:20}}>💬</span> Order via WhatsApp</button>
                  :<div style={{background:T.card2,borderRadius:10,padding:"10px 14px",marginBottom:10,fontSize:12,color:T.sub,textAlign:"center"}}>WhatsApp ordering not set up yet</div>
                }
                <button onClick={()=>{setSaved([]);show("🗑 List cleared","remove");}} style={{width:"100%",background:"transparent",border:`1px solid ${T.border}`,borderRadius:10,padding:10,color:T.sub,cursor:"pointer",fontSize:13,fontWeight:600}}>🗑 Clear All</button>
              </div>
            </>
          }
        </div>
      )}

      <div style={{position:"fixed",bottom:0,left:0,right:0,background:T.navBg,borderTop:`1px solid ${T.border}`,display:"flex",backdropFilter:"blur(12px)"}}>
        {[{id:"shop",icon:"🏪",label:"Shop"},{id:"saved",icon:"❤️",label:saved.length>0?`Saved (${saved.length})`:"Saved"}].map(tab=>(
          <button key={tab.id} onClick={()=>setView(tab.id)}
            style={{flex:1,background:"none",border:"none",color:view===tab.id?"#f4c430":T.sub,padding:"13px 0",cursor:"pointer",fontSize:12,fontWeight:700,borderTop:`2px solid ${view===tab.id?"#f4c430":"transparent"}`}}>
            <div style={{fontSize:20}}>{tab.icon}</div><div>{tab.label}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ROOT
// ═══════════════════════════════════════════════════════════════════════════════
export default function App() {
  const [mode,setMode]           = useState("pin");
  const [categories,setCategories] = useState(()=>S.get("shop_cats", DEFAULT_CATEGORIES));
  const [products,setProducts]   = useState(()=>S.get("shop_products", DEFAULT_PRODUCTS));
  const [sales,setSales]         = useState(()=>S.get("shop_sales", DEFAULT_SALES));
  const [biz,setBiz]             = useState(()=>S.get("shop_biz", DEFAULT_BIZ));
  const [theme,setTheme]         = useState(()=>S.get("shop_theme","dark"));
  const [intro,setIntro]         = useState(true);

  useEffect(()=>{ S.set("shop_theme",theme); },[theme]);
  useEffect(()=>{ const t=setTimeout(()=>setIntro(false),1600); return ()=>clearTimeout(t); },[]);

  const T = THEME[theme];

  if (intro) return (
    <div style={{minHeight:"100vh",background:T.bg,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",fontFamily:"sans-serif"}}>
      {biz.logo?<img src={biz.logo} alt="" style={{width:80,height:80,borderRadius:20,objectFit:"cover",marginBottom:16}}/>:<div style={{fontSize:64,marginBottom:8}}>🏪</div>}
      <div style={{color:"#f4c430",fontSize:24,fontWeight:900}}>{biz.name}</div>
      <div style={{color:T.sub,fontSize:13,marginTop:6}}>{biz.tagline}</div>
      <div style={{marginTop:24,display:"flex",gap:6}}>
        {[0,1,2].map(i=><div key={i} style={{width:8,height:8,borderRadius:"50%",background:"#f4c430",opacity:0.3+i*0.3,animation:`dot 1s ${i*0.2}s ease-in-out infinite alternate`}}/>)}
      </div>
      <style>{`@keyframes dot{from{transform:scale(1)}to{transform:scale(1.5)}}`}</style>
    </div>
  );

  if (mode==="pin") return <PinLock biz={biz} onUnlock={()=>setMode("owner")} onGuest={()=>setMode("customer")} T={T}/>;
  if (mode==="owner") return <OwnerApp products={products} setProducts={setProducts} sales={sales} setSales={setSales} biz={biz} setBiz={setBiz} categories={categories} setCategories={setCategories} theme={theme} setTheme={setTheme} onSwitch={()=>setMode("customer")}/>;
  return <CustomerApp products={products} setProducts={setProducts} categories={categories} biz={biz} theme={theme} setTheme={setTheme} onSwitch={()=>setMode("pin")}/>;
}
