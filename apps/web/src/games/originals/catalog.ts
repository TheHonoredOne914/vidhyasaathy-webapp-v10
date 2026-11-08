export const originalGames = [
  { id: 'tinker', file: 'Tinker.html', title: 'Tinker: The Knowledge Quest', subject: 'Across subjects', description: 'The original canvas adventure, with dragons, puzzles and chapter quests.' },
  { id: 'maths-war', file: 'maths-war.html', title: 'Maths War', subject: 'Mathematics', description: 'Explore the original worlds, interactive labs and concept battles.' },
  { id: 'optics-lab', file: 'VidhyaSaathy-Optics-Lab.html', title: 'Optics Lab', subject: 'Physics', description: 'Move mirrors and lenses and follow the light in the original sandbox.' },
  { id: 'quill-blade', file: 'final.html', title: 'Quill & Blade', subject: 'English', description: 'The original pixel art literature duel and figures of speech challenges.' },
] as const;

export function gameSaveKey(owner: string, game: string) {
  return `vs:original-game:v1:${encodeURIComponent(owner)}:${game}`;
}

export function readGameSave(storage: Pick<Storage, 'getItem'>, key: string): Record<string, string> {
  try {
    const raw: unknown = JSON.parse(storage.getItem(key) ?? '{}');
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
    return Object.fromEntries(Object.entries(raw).filter(([name, value]) => name.length <= 200 && typeof value === 'string' && value.length <= 200_000));
  } catch { return {}; }
}

// Opaque-origin frames get only their own save, never app cookies or storage.
export function embedGame(html: string, gameId: string, saved: Record<string, string>) {
  const payload = JSON.stringify({ gameId, saved }).replace(/</g, '\\u003c');
  const bridge = `<script>(()=>{
    const {gameId,saved}=${payload};
    const values=new Map(Object.entries(saved));
    const notify=()=>parent.postMessage({type:'vs-game-save',gameId,values:Object.fromEntries(values)},'*');
    const storage={getItem:k=>values.get(String(k))??null,setItem:(k,v)=>{k=String(k);v=String(v);if(k.length>200||v.length>200000)return;values.set(k,v);notify()},removeItem:k=>{values.delete(String(k));notify()},clear:()=>{values.clear();notify()},key:i=>Array.from(values.keys())[i]??null,get length(){return values.size}};
    Object.defineProperty(window,'localStorage',{value:storage});
    Object.defineProperty(window,'sessionStorage',{value:storage});
    window.AudioContext=window.webkitAudioContext=undefined;
    window.speechSynthesis=undefined;
    const play=HTMLMediaElement.prototype.play;HTMLMediaElement.prototype.play=function(){this.muted=true;return play.call(this)};
    addEventListener('DOMContentLoaded',()=>{
      document.querySelectorAll('audio,video').forEach(m=>m.muted=true);
      if(gameId==='quill-blade') {
        const canvas=document.querySelector('canvas');
        if(canvas){canvas.style.touchAction='none';['touchstart','touchmove','touchend'].forEach(type=>canvas.addEventListener(type,event=>{
          event.preventDefault();const p=event.changedTouches[0];if(!p)return;
          const target=type==='touchstart'?canvas:window;
          target.dispatchEvent(new MouseEvent(type==='touchstart'?'mousedown':type==='touchmove'?'mousemove':'mouseup',{clientX:p.clientX,clientY:p.clientY,bubbles:true}));
        },{passive:false}));}
        const bar=document.createElement('div');bar.style.cssText='position:fixed;bottom:4px;left:5%;width:90%;display:flex;gap:8px;z-index:100';
        const input=document.createElement('input');input.placeholder='Type the figure of speech';input.setAttribute('aria-label','Figure of speech');input.maxLength=22;input.style.cssText='flex:1;min-width:0;padding:10px;font-size:16px';
        const button=document.createElement('button');button.type='button';button.textContent='Submit';bar.append(input,button);document.body.append(bar);
        const send=()=>{window.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape'}));for(const key of input.value)window.dispatchEvent(new KeyboardEvent('keydown',{key}));window.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter'}));input.value='';input.blur()};
        input.addEventListener('keydown',event=>{event.stopPropagation();if(event.key==='Enter'){event.preventDefault();send()}});button.addEventListener('click',send);
      }
      parent.postMessage({type:'vs-game-ready',gameId},'*');
    });
  })();</script><style>#btn-sound,[data-action="sound"],button[title="sound"],.sound-toggle{display:none!important}</style>`;
  // Restrict the embedded source to its packaged assets and inline game code.
  const policy = `<meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline' https://fonts.googleapis.com; img-src data: blob:; font-src data: https://fonts.gstatic.com; media-src 'none'; connect-src 'none'; base-uri 'none'; form-action 'none'">`;
  return html.replace(/<head[^>]*>/i, (head) => `${head}${policy}${bridge}`);
}
