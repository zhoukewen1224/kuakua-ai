import { useState, useEffect, useRef, useCallback } from "react";

// ─── Constants ───────────────────────────────────────────────────────────────
const DIRECTIONS = [
  { id: "work",       label: "💼 工作成就", prompt: "工作努力、职场表现、专业能力" },
  { id: "study",      label: "📚 学习进步", prompt: "学习态度、知识积累、成长进步" },
  { id: "life",       label: "🌸 生活态度", prompt: "生活方式、个人魅力、生命热情" },
  { id: "courage",    label: "🔥 勇气力量", prompt: "面对困难的勇气、内在力量、韧性" },
  { id: "creativity", label: "✨ 创意才华", prompt: "创造力、独特视角、艺术感" },
];

const TIME_UNITS = [
  { id: "minute", label: "分钟", values: [1,3,5,10,15,30,60], multiplier: 60*1000 },
  { id: "hour",   label: "小时", values: [1,2,3,6,12],        multiplier: 3600*1000 },
  { id: "day",    label: "天",   values: [1,2,3,7],            multiplier: 86400*1000 },
  { id: "month",  label: "月",   values: [1,2,3,6],            multiplier: 2592000*1000 },
  { id: "year",   label: "年",   values: [1],                  multiplier: 31536000*1000 },
];

const STYLES = [
  { id: "gentle", label: "🤗 温柔闺蜜", desc: "像最好的闺蜜，亲切温柔，共情力满分" },
  { id: "elder",  label: "🌿 长辈慈爱", desc: "像慈祥长辈，稳重包容，充满人生智慧" },
  { id: "pro",    label: "💼 职场认可", desc: "像优秀上司，专业肯定，有高度有力量" },
  { id: "poetic", label: "🎋 文艺诗意", desc: "像诗人朋友，意境优美，每句话都像散文" },
];

const MOODS = [
  { id: "happy",   label: "😊 开心",  color: "#FFD700" },
  { id: "touched", label: "🥹 感动",  color: "#F48FB1" },
  { id: "calm",    label: "😌 平静",  color: "#A5D6A7" },
  { id: "anxious", label: "😰 焦虑",  color: "#B8A0E8" },
  { id: "angry",   label: "😤 生气",  color: "#FFAB91" },
  { id: "sad",     label: "😔 伤心",  color: "#90CAF9" },
  { id: "lonely",  label: "🫥 寂寞",  color: "#CFD8DC" },
  { id: "custom",  label: "✏️ 自定义", color: "#E0C0F0" },
];

const INTENSITY_LABELS = ["温柔鼓励","轻轻夸夸","认真称赞","热情表扬","疯狂吹捧"];

// Rich prompt variety seeds to avoid repetition
const KUA_SEEDS = [
  "请从我的【坚持和耐心】这个角度夸夸我，说一句让我感受到被看见的话。",
  "请从我的【细心和认真】这个角度夸夸我，用温暖具体的语言。",
  "请从我【面对压力时的表现】这个角度夸夸我，让我感受到力量。",
  "请夸夸我【今天愿意好好照顾自己】这件事，让我觉得这很了不起。",
  "请从我的【创造力和想象力】角度夸夸我，说一句有新鲜感的话。",
  "请夸夸我【敢于尝试新事物】的勇气，语气要像真心朋友说的那种。",
  "请从【我对他人的善意和温柔】这个角度夸夸我。",
  "请夸夸我【即使不完美也在努力前行】这件事，让我感到被接纳。",
  "请从【我的成长和进步】角度夸夸我，哪怕是很小的进步也值得被看见。",
  "请夸夸我【懂得寻求鼓励和支持】这个行为本身，说明我很有智慧。",
  "请从【我独特的个性和魅力】角度夸夸我，让我觉得自己与众不同。",
  "请夸夸我【今天还在坚持】这件事，用最真诚温暖的语言。",
  "请从【我处理情绪的方式】角度夸夸我，让我觉得自己很了不起。",
  "请夸夸我【认真生活的态度】，说一句让我心里暖洋洋的话。",
  "请从【我对未来的期待和勇气】角度夸夸我，给我一点前进的力量。",
  "请夸夸我身上【一个别人可能没注意到的优点】，让我觉得被真正看见。",
];

// 名言库：无用户信息时随机混入
const QUOTES = [
  { text: "你今天感觉怎么样不重要，重要的是你还在这里。", author: null },
  { text: "不要等到准备好了才开始，开始了才会准备好。", author: null },
  { text: "每一个你觉得撑不下去的夜晚，后来都过去了。", author: null },
  { text: "慢慢来，比较快。", author: "几米" },
  { text: "你不需要变得完美，你只需要真实。", author: null },
  { text: "生活不是等待风暴过去，而是学会在雨中起舞。", author: null },
  { text: "勇气不是没有恐惧，而是带着恐惧继续前行。", author: null },
  { text: "你已经比昨天的自己更勇敢了一点点。", author: null },
  { text: "没有人天生强大，强大都是被逼出来的。", author: null },
  { text: "做自己，因为别的角色都有人演了。", author: "王尔德" },
  { text: "走得慢没关系，只要不停下来。", author: null },
  { text: "种一棵树最好的时间是十年前，其次是现在。", author: "中国谚语" },
  { text: "你值得被温柔对待，包括被你自己。", author: null },
  { text: "今天能做到的最好，就是今天的最好。", author: null },
  { text: "不是因为看到希望才坚持，而是坚持了才会看到希望。", author: null },
];

let lastSeedIndex = -1;
const nextSeed = () => {
  let idx;
  do { idx = Math.floor(Math.random() * KUA_SEEDS.length); } while (idx === lastSeedIndex);
  lastSeedIndex = idx;
  return KUA_SEEDS[idx];
};

let lastQuoteIndex = -1;
const getRandomQuote = () => {
  let idx;
  do { idx = Math.floor(Math.random() * QUOTES.length); } while (idx === lastQuoteIndex);
  lastQuoteIndex = idx;
  return QUOTES[idx];
};

// ─── API ─────────────────────────────────────────────────────────────────────
const ZHIPU_KEY = "70be632142834f049c1740d6beb769fa.ablnLnLa2bWKY4wU";

async function callClaude(messages, systemPrompt) {
  const res = await fetch("https://open.bigmodel.cn/api/paas/v4/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${ZHIPU_KEY}`,
    },
    body: JSON.stringify({
      model: "glm-4-flash-250414",
      messages: [
        { role: "system", content: systemPrompt },
        ...messages,
      ],
    }),
  });
  const data = await res.json();
  return data.choices?.[0]?.message?.content || "💛";
}

// ─── Style helpers ────────────────────────────────────────────────────────────
const card = {
  background: "rgba(255,255,255,0.88)",
  borderRadius: 24,
  backdropFilter: "blur(20px)",
  boxShadow: "0 8px 40px rgba(200,100,180,0.12)",
  border: "1px solid rgba(255,180,210,0.3)",
};

const baseInput = {
  border: "1px solid #f0c0d0", borderRadius: 12,
  padding: "10px 14px", fontSize: 14, fontFamily: "inherit",
  outline: "none", color: "#6d3060", background: "white",
};

const pill = (active) => ({
  border: active ? "1px solid transparent" : "1px solid #f0c0d0",
  borderRadius: 20, padding: "7px 14px", fontSize: 13,
  cursor: "pointer", fontFamily: "inherit", transition: "all 0.2s",
  background: active ? "linear-gradient(90deg,#e8537a,#c45cf5)" : "white",
  color: active ? "white" : "#a07090",
  fontWeight: active ? 700 : 400,
  boxShadow: active ? "0 4px 12px rgba(200,100,180,0.3)" : "none",
});

const gradBtn = (extra={}) => ({
  border: "none", borderRadius: 14, cursor: "pointer",
  fontFamily: "inherit", fontWeight: 700, color: "white",
  background: "linear-gradient(90deg,#e8537a,#c45cf5)",
  boxShadow: "0 4px 15px rgba(200,100,180,0.3)",
  ...extra,
});

const ShareIcon = ({size=14}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
    <polyline points="16 6 12 2 8 6"/>
    <line x1="12" y1="2" x2="12" y2="15"/>
  </svg>
);

// ─── Share card ───────────────────────────────────────────────────────────────
function renderShareCard(text, nickname) {
  const canvas = document.createElement("canvas");
  canvas.width = 750; canvas.height = 480;
  const ctx = canvas.getContext("2d");
  const grd = ctx.createLinearGradient(0,0,750,480);
  grd.addColorStop(0,"#fff0f5"); grd.addColorStop(1,"#f0e8ff");
  ctx.fillStyle = grd; ctx.fillRect(0,0,750,480);
  ctx.beginPath(); ctx.arc(680,60,100,0,Math.PI*2);
  ctx.fillStyle="rgba(200,100,180,0.07)"; ctx.fill();
  ctx.beginPath(); ctx.arc(80,420,80,0,Math.PI*2);
  ctx.fillStyle="rgba(140,80,220,0.06)"; ctx.fill();
  ctx.strokeStyle="rgba(200,100,180,0.2)"; ctx.lineWidth=2;
  ctx.roundRect(20,20,710,440,20); ctx.stroke();
  ctx.font="52px serif"; ctx.textAlign="center"; ctx.fillText("🌸",375,90);
  ctx.fillStyle="#6d3060"; ctx.font="bold 26px 'PingFang SC','Hiragino Sans GB',serif";
  ctx.textAlign="center";
  const maxW=640, lineH=44, startY=150;
  const words=[...text]; let line="", lines=[];
  for(const ch of words){ const t=line+ch; if(ctx.measureText(t).width>maxW&&line){lines.push(line);line=ch;}else line=t; }
  if(line) lines.push(line);
  lines.slice(0,6).forEach((l,i)=>ctx.fillText(l,375,startY+i*lineH));
  ctx.fillStyle="#c0a0c0"; ctx.font="20px serif"; ctx.textAlign="center";
  ctx.fillText(`— 写给${nickname||"你"}的夸夸小站 🌸`,375,440);
  return canvas.toDataURL("image/png");
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function KuaKuaApp() {
  const TABS = [["widget","🌷 夸夸"],["bag","🎁 锦囊"],["settings","⚙️ 设置"]];
  const [tab, setTab] = useState("widget");

  // Responsive
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 900);
  useEffect(()=>{
    const fn=()=>setIsDesktop(window.innerWidth>=900);
    window.addEventListener("resize",fn);
    return ()=>window.removeEventListener("resize",fn);
  },[]);

  // Saved settings
  const [saved, setSaved] = useState({
    userInfo:"", directions:["work","life"], customDir:"",
    nickname:"", style:"gentle", intensity:2, blacklist:[],
  });
  // Draft settings
  const [draftInfo,      setDraftInfo]      = useState("");
  const [draftDirs,      setDraftDirs]      = useState(["work","life"]);
  const [draftCustom,    setDraftCustom]    = useState("");
  const [customOn,       setCustomOn]       = useState(false);
  const [draftNick,      setDraftNick]      = useState("");
  const [draftStyle,     setDraftStyle]     = useState("gentle");
  const [draftIntensity, setDraftIntensity] = useState(2);
  const [draftBlacklist, setDraftBlacklist] = useState([]);
  const [blackInput,     setBlackInput]     = useState("");
  const [toast,          setToast]          = useState("");

  // Interval
  const [ivVal,  setIvVal]  = useState(5);
  const [ivUnit, setIvUnit] = useState("minute");

  // Widget
  const [autoText,    setAutoText]    = useState("");
  const [autoLoading, setAutoLoading] = useState(false);
  const [hasStarted,  setHasStarted]  = useState(false);
  const [isRunning,   setIsRunning]   = useState(false);
  const [shareImg,    setShareImg]    = useState(null);

  // Mood
  const [todayMood,       setTodayMood]       = useState(null);
  const [customMoodText,  setCustomMoodText]  = useState("");
  const [moodEditMode,    setMoodEditMode]    = useState(false);

  // Chat
  const [chatMsgs, setChatMsgs] = useState([]);
  const [input,    setInput]    = useState("");
  const [chatLoad, setChatLoad] = useState(false);

  // Bag
  const [favourites, setFavourites] = useState([]);
  const [history,    setHistory]    = useState([]);
  const [bagFilter,  setBagFilter]  = useState("all");

  const ivRef      = useRef(null);
  const chatEndRef = useRef(null);

  // ── Build prompt
  const buildPrompt = useCallback((extra="") => {
    const styleMap = {
      gentle: "像亲密闺蜜，语气温柔亲切，充满共情，常用温暖的称呼",
      elder:  "像慈祥长辈，语气稳重包容，充满人生智慧，语言质朴有温度",
      pro:    "像优秀上级，语气专业肯定，聚焦成就与价值，有高度有力量",
      poetic: "像文艺诗人，语言优美意境深远，每句话都像散文诗，充满美感",
    };
    const intMap = [
      "语气温和轻柔，像春风拂面，点到为止",
      "语气轻松温暖，真诚自然，让人心里暖暖的",
      "语气真诚热情，充分肯定，让人感受到被认可的力量",
      "语气热烈澎湃，夸赞具体而饱满，像在颁奖典礼上发言",
      "语气极度热情，毫无保留地吹捧，夸张但真诚，像最狂热的粉丝",
    ];
    const dirPrompts = DIRECTIONS.filter(d=>saved.directions.includes(d.id)).map(d=>d.prompt);
    if(saved.customDir) dirPrompts.push(saved.customDir);
    const dirs = dirPrompts.join("、") || "综合方向";
    const nick = saved.nickname ? `请用"${saved.nickname}"称呼用户。` : "";
    const moodLabel = todayMood ? (todayMood==="custom" ? customMoodText : MOODS.find(m=>m.id===todayMood)?.label) : "";
    const mood = moodLabel ? `用户今日心情：${moodLabel}，请根据此心情调整夸赞侧重。` : "";
    const blacklistLine = saved.blacklist.length>0
      ? `\n【严格禁止】绝对不能提及：${saved.blacklist.join("、")}。` : "";
    const hasInfo = saved.userInfo.trim().length > 0;
    const userContext = hasInfo
      ? `用户提供的信息：${saved.userInfo}`
      : `【当前状态：策略A强制执行】用户没有填写任何信息。你必须且只能夸赞"用户愿意来寻求鼓励"这个行为本身。严禁提及任何具体品质（如温柔、细心、坚持等），严禁编造任何细节，只说来寻求鼓励这件事很值得被肯定。`;
    return `你是一位温暖、真诚且洞察力极强的朋友。你的任务是根据用户提供的信息，给出恰到好处的夸赞。

核心原则：宁缺毋滥，绝不编造事实，语气要像老友聊天一样自然、接地气，避免使用过于华丽或浮夸的辞藻。

【输入分析与响应逻辑】请严格按照以下优先级判断用户输入的内容，并选择对应的夸赞策略：

1. 策略 A：空白/泛化状态（最高优先级）
触发条件：用户没有填写具体信息，或者只填写了"随便"、"不知道写啥"、"想求夸"等泛化内容。
夸赞重点：行为本身。聚焦于用户"愿意来寻找鼓励"这一举动背后的积极意义。
核心话术方向：肯定用户的勇气、自我关怀的意识、以及主动寻求能量的行为。
语气：像拥抱一样温暖，简短治愈。
示例方向："能在这个时刻想到给自己充充电，你真的很懂得爱护自己呀。"

2. 策略 B：具体信息状态
触发条件：用户填写了具体的姓名、事件、状态或细节。
夸赞重点：具体细节与品质。必须结合用户提供的具体关键词进行回应。
执行步骤：提取关键词（名词、动词、情绪词）→ 挖掘品质（细心、坚韧、有规划等）→ 真诚回应。
语气：真诚、精准、像老友一样"看见"了你。
示例方向："你连这个细节都注意到了，你的观察力真的太棒了。"

【输出规范】
长度：简短有力，控制在 1-2 句话以内。
禁令：严禁在用户没有提供信息时虚构背景或细节；严禁使用"天才"、"完美"、"震惊"等过度夸张词汇；严禁说教或鸡汤式口吻；严禁句尾用"呢"、"哦"、"哟"等语气词，听起来像阴阳怪气；语气要直接真诚，不要装可爱。

${nick?`称呼用户时用：${saved.nickname}。`:""}
${userContext}
${mood?`用户今日心情：${moodDisplay}，请据此调整语气。`:""}${blacklistLine}
${extra}`;
  }, [saved, todayMood, customMoodText]);

  // ── Gen kua
  const genKua = useCallback(async () => {
    setAutoLoading(true);
    setHasStarted(true);

    // 没有用户信息时，50% 概率直接展示名言
    if (!saved.userInfo.trim() && Math.random() < 0.5) {
      const q = getRandomQuote();
      const display = q.author ? `「${q.text}」\n—— ${q.author}` : q.text;
      setAutoText(display);
      setAutoLoading(false);
      return;
    }

    try {
      const seed = nextSeed();
      let text = null;
      let retries = 0;
      while (!text && retries < 3) {
        const res = await fetch("https://open.bigmodel.cn/api/paas/v4/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${ZHIPU_KEY}`,
          },
          body: JSON.stringify({
            model: "glm-4-flash-250414",
            messages: [
              { role: "system", content: buildPrompt() },
              { role: "user", content: seed },
            ],
          }),
        });
        const data = await res.json();
        if (res.status === 429) {
          retries++;
          await new Promise(r => setTimeout(r, 2000 * retries));
          continue;
        }
        text = data.choices?.[0]?.message?.content || null;
      }
      if (!text) { setAutoLoading(false); return; }
      setAutoText(text);
      const today = new Date().toLocaleDateString("zh-CN");
      const time  = new Date().toLocaleTimeString("zh-CN",{hour:"2-digit",minute:"2-digit"});
      const moodLabel = todayMood ? (todayMood==="custom"?customMoodText:MOODS.find(m=>m.id===todayMood)?.label) : null;
      const newItem = { id:Date.now(), text, time, date:today, mood:moodLabel };
      setHistory(h => (h.length>0&&h[0].text===text) ? h : [newItem,...h].slice(0,100));
    } catch { /* 静默失败，保留上一条内容 */ }
    setAutoLoading(false);
  }, [buildPrompt, todayMood, customMoodText]);

  // ── Interval
  const getMs = useCallback(()=>{
    const u=TIME_UNITS.find(u=>u.id===ivUnit);
    return ivVal*(u?.multiplier||60000);
  },[ivVal,ivUnit]);

  useEffect(()=>{
    clearInterval(ivRef.current);
    if(isRunning) ivRef.current=setInterval(genKua,getMs());
    return ()=>clearInterval(ivRef.current);
  },[isRunning,genKua,getMs]);

  const toggleRunning=()=>{
    if(!isRunning){genKua();setIsRunning(true);}
    else{setIsRunning(false);clearInterval(ivRef.current);}
  };

  // ── Chat
  const sendChat=async()=>{
    if(!input.trim()||chatLoad) return;
    const uMsg={role:"user",content:input};
    const msgs=[...chatMsgs,uMsg];
    setChatMsgs(msgs); setInput(""); setChatLoad(true);
    try{
      const reply=await callClaude(msgs, buildPrompt("\n当用户倾诉时，先共情理解，再给予温暖的夸赞和鼓励。"));
      setChatMsgs([...msgs,{role:"assistant",content:reply}]);
    }catch{
      setChatMsgs([...msgs,{role:"assistant",content:"我在这里陪着你，你已经很了不起了 💛"}]);
    }
    setChatLoad(false);
    setTimeout(()=>chatEndRef.current?.scrollIntoView({behavior:"smooth"}),100);
  };

  // ── Favourites
  const isFavText=(text)=>favourites.some(f=>f.text===text);
  const toggleFavByText=(item)=>{
    if(isFavText(item.text)) setFavourites(f=>f.filter(x=>x.text!==item.text));
    else setFavourites(f=>[{...item,favTime:Date.now()},...f]);
  };
  const isFavById=(id)=>favourites.some(f=>f.id===id);
  const toggleFavById=(item)=>{
    if(isFavById(item.id)) setFavourites(f=>f.filter(x=>x.id!==item.id));
    else setFavourites(f=>[{...item,favTime:Date.now()},...f]);
  };

  // ── Save settings
  const handleSave=()=>{
    setSaved({ userInfo:draftInfo, directions:draftDirs, customDir:customOn?draftCustom.trim():"",
      nickname:draftNick.trim(), style:draftStyle, intensity:draftIntensity, blacklist:draftBlacklist });
    showToast("✅ 设置已保存！");
  };

  const showToast=(msg)=>{setToast(msg);setTimeout(()=>setToast(""),2200);};
  const toggleDraftDir=(id)=>setDraftDirs(p=>p.includes(id)?p.filter(d=>d!==id):[...p,id]);
  const curUnit=TIME_UNITS.find(u=>u.id===ivUnit);
  const bagList = bagFilter==="fav" ? favourites : [...history].sort((a,b)=>b.id-a.id);

  // ── Mood label display
  const moodObj = MOODS.find(m=>m.id===todayMood);
  const moodDisplay = todayMood==="custom" ? (customMoodText||"自定义") : moodObj?.label;

  // ─────────────────────────────────────────────────────────────────────────
  const actionBtns = (
    <div style={{display:"flex",gap:8,marginBottom:10}}>
      <button onClick={genKua} disabled={autoLoading} style={{
        flex:1,border:"1px solid #f0c0d0",borderRadius:12,
        padding:"9px 0",background:"white",color:"#e8537a",
        fontSize:13,cursor:"pointer",fontFamily:"inherit",
      }}>🔄 再夸</button>
      <button onClick={()=>{
        if(!window.speechSynthesis) return showToast("当前环境不支持语音 😅");
        window.speechSynthesis.cancel();
        const u=new SpeechSynthesisUtterance(autoText);
        u.lang="zh-CN";u.rate=0.9;u.pitch=1.1;
        window.speechSynthesis.speak(u);
      }} style={{
        flex:1,border:"1px solid #f0c0d0",borderRadius:12,
        padding:"9px 0",background:"white",color:"#c45cf5",
        fontSize:13,cursor:"pointer",fontFamily:"inherit",
      }}>🔊 朗读</button>
      <button onClick={()=>setShareImg(renderShareCard(autoText,saved.nickname))} style={{
        flex:1,border:"1px solid #f0c0d0",borderRadius:12,
        padding:"9px 0",background:"white",color:"#9060e0",
        fontSize:13,cursor:"pointer",fontFamily:"inherit",
        display:"flex",alignItems:"center",justifyContent:"center",gap:5,
      }}><ShareIcon/> 分享</button>
    </div>
  );

  // ─── Render ──────────────────────────────────────────────────────────────
  return (
    <div style={{
      minHeight:"100vh",
      background:"linear-gradient(135deg,#fff5f7 0%,#fdf0ff 50%,#f0f5ff 100%)",
      fontFamily:"'PingFang SC','Noto Serif SC','Songti SC',Georgia,serif",
      padding: isDesktop?"24px 40px 40px":"20px 14px 40px",
      boxSizing:"border-box",
    }}>

      {/* Toast */}
      {toast&&<div style={{
        position:"fixed",top:20,left:"50%",transform:"translateX(-50%)",
        background:"linear-gradient(90deg,#e8537a,#c45cf5)",
        color:"white",borderRadius:50,padding:"10px 26px",
        fontSize:14,fontWeight:700,zIndex:9999,
        boxShadow:"0 4px 20px rgba(200,100,180,0.35)",whiteSpace:"nowrap",
      }}>{toast}</div>}

      {/* Share modal */}
      {shareImg&&(
        <div onClick={()=>setShareImg(null)} style={{
          position:"fixed",inset:0,background:"rgba(0,0,0,0.55)",
          zIndex:9998,display:"flex",alignItems:"center",justifyContent:"center",
          flexDirection:"column",gap:16,padding:20,
        }}>
          <img src={shareImg} style={{maxWidth:"100%",maxHeight:"70vh",borderRadius:16,boxShadow:"0 8px 40px rgba(0,0,0,0.3)"}} alt="share" onClick={e=>e.stopPropagation()}/>
          <div style={{display:"flex",gap:12}} onClick={e=>e.stopPropagation()}>
            <a href={shareImg} download="kuakua.png" style={{
              ...gradBtn({padding:"10px 22px",fontSize:14,textDecoration:"none",borderRadius:12}),
            }}>⬇ 保存图片</a>
            <button onClick={()=>setShareImg(null)} style={{
              border:"1px solid rgba(255,255,255,0.4)",borderRadius:12,
              padding:"10px 22px",background:"rgba(255,255,255,0.15)",
              color:"white",fontSize:14,cursor:"pointer",fontFamily:"inherit",
            }}>关闭</button>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{textAlign:"center",marginBottom:20,width:"100%"}}>
        <div style={{fontSize:44,marginBottom:4}}>🌸</div>
        <h1 style={{
          margin:0,fontSize:26,fontWeight:900,letterSpacing:4,
          background:"linear-gradient(90deg,#e8537a,#c45cf5)",
          WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",
        }}>夸夸小站</h1>
        <p style={{margin:"4px 0 0",color:"#a07090",fontSize:12}}>
          {saved.nickname?`${saved.nickname}，你值得被爱 ✨`:"你值得被看见，值得被爱 ✨"}
        </p>
      </div>

      {/* Tabs */}
      <div style={{
        display:"flex",background:"rgba(255,255,255,0.7)",borderRadius:50,
        padding:4,marginBottom:20,backdropFilter:"blur(10px)",
        boxShadow:"0 2px 20px rgba(200,100,180,0.1)",
        width:"fit-content", margin:"0 auto 20px",
      }}>
        {TABS.map(([key,label])=>(
          <button key={key} onClick={()=>setTab(key)} style={{
            border:"none",borderRadius:50,padding:"8px 20px",fontSize:13,
            cursor:"pointer",fontFamily:"inherit",transition:"all 0.3s",
            background:tab===key?"linear-gradient(90deg,#e8537a,#c45cf5)":"transparent",
            color:tab===key?"white":"#a07090",
            fontWeight:tab===key?700:400,
          }}>{label}</button>
        ))}
      </div>

      {/* ── Content ── */}
      <div style={{
        width:"100%",
        display:"grid",
        gridTemplateColumns: isDesktop&&tab==="widget" ? "1fr 1fr" : "1fr",
        alignItems:"stretch",
        gap:24,
      }}>

        {/* ══ WIDGET TAB ══ */}
        {tab==="widget"&&<>

          {/* LEFT: mood + auto kua */}
          <div style={{display:"flex",flexDirection:"column",gap:14,height:"100%"}}>

            {/* Mood */}
            <div style={{...card,padding:"16px 20px"}}>
              <p style={{margin:"0 0 10px",color:"#c45cf5",fontSize:14,fontWeight:700}}>🌤 今日心情打卡</p>
              <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
                {MOODS.map(m=>(
                  <button key={m.id} onClick={()=>{
                    if(m.id==="custom"){setMoodEditMode(true);setTodayMood("custom");}
                    else{setTodayMood(p=>p===m.id?null:m.id);setMoodEditMode(false);}
                  }} style={{
                    border:`1.5px solid ${todayMood===m.id?m.color:"#f0d0e0"}`,
                    borderRadius:20,padding:"5px 12px",fontSize:12,
                    cursor:"pointer",fontFamily:"inherit",
                    background:todayMood===m.id?m.color+"33":"white",
                    color:todayMood===m.id?"#5a2060":"#a07090",
                    fontWeight:todayMood===m.id?700:400,
                  }}>{m.label}</button>
                ))}
              </div>
              {moodEditMode&&todayMood==="custom"&&(
                <input
                  value={customMoodText}
                  onChange={e=>setCustomMoodText(e.target.value)}
                  onBlur={()=>setMoodEditMode(false)}
                  autoFocus
                  placeholder="描述你的心情…"
                  style={{...baseInput,width:"100%",boxSizing:"border-box",marginTop:10}}
                />
              )}
              {todayMood&&!moodEditMode&&(
                <p style={{margin:"8px 0 0",fontSize:12,color:"#a07090"}}>
                  今天的心情：<span style={{color:"#c45cf5",fontWeight:700}}>{moodDisplay}</span>
                  &nbsp;·&nbsp;<span style={{cursor:"pointer",color:"#e8537a"}} onClick={()=>setTodayMood(null)}>清除</span>
                </p>
              )}
            </div>

            {/* Auto kua */}
            <div style={{...card,padding:24,flex:1,display:"flex",flexDirection:"column"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14,flexWrap:"wrap",gap:8}}>
                <h3 style={{margin:0,color:"#c45cf5",fontSize:15,fontWeight:700}}>✨ 自动夸夸</h3>
                <div style={{display:"flex",alignItems:"center",gap:5,color:"#a07090",fontSize:12}}>
                  <span>每</span>
                  <select value={ivVal} onChange={e=>setIvVal(Number(e.target.value))} style={{
                    border:"1px solid #f0c0d0",borderRadius:8,padding:"2px 5px",
                    fontSize:12,color:"#c45cf5",background:"white",fontFamily:"inherit",cursor:"pointer",
                  }}>
                    {curUnit.values.map(v=><option key={v} value={v}>{v}</option>)}
                  </select>
                  <select value={ivUnit} onChange={e=>{
                    const nu=TIME_UNITS.find(u=>u.id===e.target.value);
                    setIvUnit(e.target.value);setIvVal(nu.values[0]);
                  }} style={{
                    border:"1px solid #f0c0d0",borderRadius:8,padding:"2px 5px",
                    fontSize:12,color:"#c45cf5",background:"white",fontFamily:"inherit",cursor:"pointer",
                  }}>
                    {TIME_UNITS.map(u=><option key={u.id} value={u.id}>{u.label}</option>)}
                  </select>
                  <span>一次</span>
                </div>
              </div>

              {/* Kua text box */}
              <div style={{
                background:"linear-gradient(135deg,#fff0f5,#f8f0ff)",borderRadius:16,
                padding:"18px 20px",marginBottom:12,minHeight:90,flex:1,
                display:"flex",alignItems:"center",position:"relative",
                border:"1px solid rgba(200,100,180,0.15)",
              }}>
                <p style={{
                  margin:0,color:"#6d3060",lineHeight:1.9,fontSize:15,flex:1,
                  fontStyle:autoLoading?"italic":"normal",
                  opacity:autoLoading?0.5:1,
                }}>
                  {autoLoading?"正在为你寻找最温暖的话语…":autoText||"点击「开始夸我」获取第一句夸赞 ✨"}
                </p>
                {hasStarted&&!autoLoading&&autoText&&(
                  <button onClick={()=>toggleFavByText({id:Date.now(),text:autoText,time:new Date().toLocaleTimeString("zh-CN",{hour:"2-digit",minute:"2-digit"}),date:new Date().toLocaleDateString("zh-CN"),mood:moodDisplay||null})}
                    style={{position:"absolute",top:10,right:10,border:"none",background:"transparent",fontSize:20,cursor:"pointer",padding:4}}>
                    {isFavText(autoText)?"❤️":"🤍"}
                  </button>
                )}
              </div>

              {!hasStarted ? (
                <button onClick={genKua} style={{
                  ...gradBtn({width:"100%",padding:"14px 0",fontSize:16,borderRadius:14,letterSpacing:2}),
                  marginTop:"auto",
                }}>🌸 开始夸我</button>
              ) : (
                <div style={{marginTop:"auto"}}>
                  {actionBtns}
                  <button onClick={toggleRunning} style={{
                    ...gradBtn({width:"100%",padding:"11px 0",fontSize:14,borderRadius:12}),
                    background:isRunning?"linear-gradient(90deg,#f0a0b0,#d0a0f0)":"linear-gradient(90deg,#e8537a,#c45cf5)",
                    boxShadow:isRunning?"none":"0 4px 15px rgba(200,100,180,0.3)",
                  }}>
                    {isRunning?"⏸ 暂停自动夸夸":"▶ 开始自动夸夸"}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT: chat */}
          <div style={{...card,padding:22,display:"flex",flexDirection:"column",minHeight:400}}>
            <h3 style={{margin:"0 0 14px",color:"#c45cf5",fontSize:15,fontWeight:700}}>💬 倾诉一下</h3>
            <div style={{flex:1,minHeight:200,overflowY:"auto",marginBottom:12,padding:"2px 0"}}>
              {chatMsgs.length===0&&(
                <p style={{color:"#c0a0b8",fontSize:13,textAlign:"center",marginTop:60}}>
                  说说今天发生了什么，我在这里 🌸
                </p>
              )}
              {chatMsgs.map((m,i)=>(
                <div key={i} style={{
                  display:"flex",
                  justifyContent:m.role==="user"?"flex-end":"flex-start",
                  marginBottom:9,
                }}>
                  <div style={{
                    maxWidth:"80%",
                    borderRadius:m.role==="user"?"18px 18px 4px 18px":"18px 18px 18px 4px",
                    padding:"9px 13px",fontSize:14,lineHeight:1.7,
                    background:m.role==="user"?"linear-gradient(90deg,#e8537a,#c45cf5)":"linear-gradient(135deg,#fff0f5,#f8f0ff)",
                    color:m.role==="user"?"white":"#6d3060",
                    boxShadow:"0 2px 8px rgba(200,100,180,0.1)",
                  }}>{m.content}</div>
                </div>
              ))}
              {chatLoad&&(
                <div style={{display:"flex",justifyContent:"flex-start",marginBottom:9}}>
                  <div style={{borderRadius:"18px 18px 18px 4px",padding:"9px 14px",background:"linear-gradient(135deg,#fff0f5,#f8f0ff)",color:"#c0a0b8",fontSize:14}}>
                    正在想夸你什么…✨
                  </div>
                </div>
              )}
              <div ref={chatEndRef}/>
            </div>
            <div style={{display:"flex",gap:8}}>
              <input
                value={input}
                onChange={e=>setInput(e.target.value)}
                onKeyDown={e=>e.key==="Enter"&&sendChat()}
                placeholder="说说你的心情…"
                style={{...baseInput,flex:1}}
              />
              <button onClick={sendChat} disabled={chatLoad||!input.trim()} style={{
                border:"none",borderRadius:12,padding:"10px 14px",
                background:"linear-gradient(90deg,#e8537a,#c45cf5)",
                color:"white",fontSize:16,cursor:"pointer",
                opacity:chatLoad||!input.trim()?0.5:1,
              }}>➤</button>
            </div>
          </div>
        </>}

        {/* ══ BAG TAB ══ */}
        {tab==="bag"&&(
          <div style={{...card,padding:24,width:"100%",boxSizing:"border-box"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
              <h3 style={{margin:0,color:"#c45cf5",fontSize:16,fontWeight:700}}>🎁 夸赞锦囊</h3>
              <div style={{display:"flex",gap:8}}>
                {[["all","📋 全部"],["fav","❤️ 收藏"]].map(([id,label])=>(
                  <button key={id} onClick={()=>setBagFilter(id)} style={{...pill(bagFilter===id),padding:"5px 14px",fontSize:12}}>{label}</button>
                ))}
              </div>
            </div>

            {bagList.length===0?(
              <div style={{textAlign:"center",padding:"40px 20px",color:"#c0a0b8"}}>
                <div style={{fontSize:40,marginBottom:10}}>{bagFilter==="fav"?"💔":"📭"}</div>
                <p style={{margin:0,fontSize:13}}>
                  {bagFilter==="fav"?"还没有收藏，点击夸夸上的 🤍 来收藏":"还没有历史记录，去生成第一句夸赞吧~"}
                </p>
              </div>
            ):(
              <div style={{display:"flex",flexDirection:"column",gap:10,maxHeight:520,overflowY:"auto"}}>
                {bagList.map(item=>(
                  <div key={item.id} style={{
                    background:"linear-gradient(135deg,#fff8fb,#f8f0ff)",
                    borderRadius:16,padding:"14px 16px",
                    border:"1px solid rgba(200,100,180,0.12)",
                  }}>
                    <p style={{margin:"0 0 8px",color:"#6d3060",fontSize:14,lineHeight:1.8}}>
                      {item.text}
                    </p>
                    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:6}}>
                      <div style={{display:"flex",alignItems:"center",gap:8}}>
                        <span style={{color:"#c0a0b8",fontSize:11}}>{item.date} {item.time}</span>
                        {item.mood&&<span style={{
                          fontSize:11,background:"rgba(200,100,180,0.1)",
                          color:"#c45cf5",borderRadius:10,padding:"1px 8px",
                        }}>{item.mood}</span>}
                      </div>
                      <div style={{display:"flex",gap:6}}>
                        <button onClick={()=>{
                          if(!window.speechSynthesis) return;
                          window.speechSynthesis.cancel();
                          const u=new SpeechSynthesisUtterance(item.text);
                          u.lang="zh-CN";u.rate=0.9;u.pitch=1.1;
                          window.speechSynthesis.speak(u);
                        }} style={{border:"none",background:"transparent",color:"#c45cf5",cursor:"pointer",padding:2}}>🔊</button>
                        <button onClick={()=>setShareImg(renderShareCard(item.text,saved.nickname))} style={{
                          border:"none",background:"transparent",color:"#9060e0",
                          cursor:"pointer",padding:"2px 4px",display:"flex",alignItems:"center",
                        }}><ShareIcon size={15}/></button>
                        <button onClick={()=>toggleFavById(item)} style={{
                          border:"none",background:"transparent",fontSize:18,cursor:"pointer",padding:2,
                        }}>{isFavById(item.id)?"❤️":"🤍"}</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {history.length>0&&bagFilter==="all"&&(
              <button onClick={()=>{if(window.confirm("确定清空所有历史记录？"))setHistory([]);}} style={{
                width:"100%",marginTop:14,border:"1px solid #f0c0d0",borderRadius:12,
                padding:"9px 0",background:"white",color:"#c0a0b8",
                fontSize:13,cursor:"pointer",fontFamily:"inherit",
              }}>🗑 清空历史</button>
            )}
          </div>
        )}

        {/* ══ SETTINGS TAB ══ */}
        {tab==="settings"&&(
          <div style={{...card,padding:26,width:"100%",boxSizing:"border-box"}}>

            {/* Nickname */}
            <h3 style={{margin:"0 0 10px",color:"#c45cf5",fontSize:15,fontWeight:700}}>🪪 专属昵称</h3>
            <input
              value={draftNick}
              onChange={e=>setDraftNick(e.target.value)}
              placeholder="让 AI 怎么叫你？（宝贝、亲爱的、小张同学…）"
              style={{...baseInput,width:"100%",boxSizing:"border-box",marginBottom:20}}
            />

            {/* Style */}
            <h3 style={{margin:"0 0 12px",color:"#c45cf5",fontSize:15,fontWeight:700}}>🎭 夸赞语气风格</h3>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:20}}>
              {STYLES.map(s=>(
                <button key={s.id} onClick={()=>setDraftStyle(s.id)} style={{
                  ...pill(draftStyle===s.id),
                  borderRadius:14,padding:"10px 12px",textAlign:"left",
                  display:"flex",flexDirection:"column",gap:3,
                }}>
                  <span style={{fontSize:13}}>{s.label}</span>
                  <span style={{fontSize:11,opacity:0.75,fontWeight:400,lineHeight:1.3}}>{s.desc}</span>
                </button>
              ))}
            </div>

            {/* Intensity */}
            <h3 style={{margin:"0 0 10px",color:"#c45cf5",fontSize:15,fontWeight:700}}>🌡 夸赞强度</h3>
            <div style={{background:"linear-gradient(135deg,#fff0f5,#f8f0ff)",borderRadius:14,padding:"14px 18px",marginBottom:20}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
                <span style={{fontSize:12,color:"#a07090"}}>温柔鼓励</span>
                <span style={{fontSize:13,fontWeight:700,color:"#c45cf5",background:"white",padding:"2px 12px",borderRadius:20,border:"1px solid #f0c0d0"}}>
                  {INTENSITY_LABELS[draftIntensity]}
                </span>
                <span style={{fontSize:12,color:"#a07090"}}>疯狂吹捧</span>
              </div>
              <input type="range" min={0} max={4} step={1} value={draftIntensity}
                onChange={e=>setDraftIntensity(Number(e.target.value))}
                style={{width:"100%",accentColor:"#c45cf5",cursor:"pointer"}}
              />
            </div>

            {/* Directions */}
            <h3 style={{margin:"0 0 12px",color:"#c45cf5",fontSize:15,fontWeight:700}}>🎀 夸赞方向</h3>
            <div style={{display:"flex",flexWrap:"wrap",gap:8,marginBottom:12}}>
              {DIRECTIONS.map(d=>(
                <button key={d.id} onClick={()=>toggleDraftDir(d.id)} style={pill(draftDirs.includes(d.id))}>{d.label}</button>
              ))}
              <button onClick={()=>setCustomOn(v=>!v)} style={pill(customOn)}>✏️ 自定义</button>
            </div>
            {customOn&&(
              <div style={{marginBottom:16}}>
                <input value={draftCustom} onChange={e=>setDraftCustom(e.target.value)}
                  placeholder="例如：运动健身、亲子关系、厨艺美食…"
                  style={{...baseInput,width:"100%",boxSizing:"border-box"}}
                />
              </div>
            )}

            {/* User info */}
            <h3 style={{margin:"0 0 8px",color:"#c45cf5",fontSize:15,fontWeight:700}}>🌷 关于你自己</h3>
            <textarea value={draftInfo} onChange={e=>setDraftInfo(e.target.value)}
              placeholder="比如：我是一名设计师，正在准备换工作，最近压力很大…"
              rows={3}
              style={{...baseInput,width:"100%",boxSizing:"border-box",resize:"vertical",lineHeight:1.7,marginBottom:20}}
            />

            {/* Blacklist */}
            <h3 style={{margin:"0 0 8px",color:"#c45cf5",fontSize:15,fontWeight:700}}>🚫 夸赞黑名单</h3>
            <p style={{margin:"0 0 10px",color:"#a07090",fontSize:12}}>不想被夸的词语或话题，AI 会主动回避</p>
            <div style={{display:"flex",gap:8,marginBottom:10}}>
              <input value={blackInput} onChange={e=>setBlackInput(e.target.value)}
                onKeyDown={e=>{ if(e.key==="Enter"){const v=blackInput.trim();if(v&&!draftBlacklist.includes(v))setDraftBlacklist(p=>[...p,v]);setBlackInput("");}}}
                placeholder="输入词语后按 Enter 添加…"
                style={{...baseInput,flex:1}}
              />
              <button onClick={()=>{const v=blackInput.trim();if(v&&!draftBlacklist.includes(v))setDraftBlacklist(p=>[...p,v]);setBlackInput("");}} style={{
                border:"none",borderRadius:12,padding:"10px 16px",
                background:"linear-gradient(90deg,#e8537a,#c45cf5)",
                color:"white",fontSize:14,cursor:"pointer",fontFamily:"inherit",
              }}>＋</button>
            </div>
            {draftBlacklist.length>0&&(
              <div style={{display:"flex",flexWrap:"wrap",gap:8,marginBottom:16,padding:"12px 14px",background:"linear-gradient(135deg,#fff5f5,#fef0ff)",borderRadius:12,border:"1px solid rgba(240,160,160,0.25)"}}>
                {draftBlacklist.map(word=>(
                  <span key={word} style={{display:"inline-flex",alignItems:"center",gap:5,background:"white",border:"1px solid #f0b0b0",borderRadius:20,padding:"4px 10px 4px 12px",fontSize:13,color:"#c05060"}}>
                    {word}
                    <button onClick={()=>setDraftBlacklist(p=>p.filter(w=>w!==word))} style={{border:"none",background:"transparent",cursor:"pointer",color:"#d07080",fontSize:14,padding:0,lineHeight:1}}>×</button>
                  </span>
                ))}
              </div>
            )}

            {/* Save */}
            <button onClick={handleSave} style={{...gradBtn({width:"100%",padding:"13px 0",fontSize:15,letterSpacing:2})}}>
              💾 保存设置
            </button>

            <div style={{marginTop:12,padding:"10px 14px",background:"linear-gradient(135deg,#fff0f5,#f8f0ff)",borderRadius:10,fontSize:12,color:"#a07090",lineHeight:1.9}}>
              <span style={{fontWeight:700,color:"#c45cf5"}}>当前生效：</span>
              &nbsp;{STYLES.find(s=>s.id===saved.style)?.label}
              &nbsp;·&nbsp;{INTENSITY_LABELS[saved.intensity]}
              {saved.nickname&&<>&nbsp;·&nbsp;叫我「{saved.nickname}」</>}
              {saved.blacklist.length>0&&<>&nbsp;·&nbsp;🚫 屏蔽 {saved.blacklist.join("、")}</>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
