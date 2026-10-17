import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.100.0';
const url = 'https://hrdgfmcxrkhdfutozhei.supabase.co';
const key = 'sb_publishable_KKLZAF2NXZQncTmNW6NH_g_-SJwxtNf';
const db = createClient(url, key, { auth: { storageKey: 'classroom-toolbox-auth', persistSession: true, autoRefreshToken: true } });
const $ = id => document.getElementById(id);
let user = null, busy = false, generation = 0;
const say = text => { $('account-status').textContent = text; };
const email = username => `${username.trim().toLowerCase()}@students.classroom.invalid`;
function lock(value) { busy = value; document.querySelectorAll('#account-panel button').forEach(button => { button.disabled = value; }); }
function today() { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; }
async function loadRecords() {
  const token = ++generation;
  $('records').replaceChildren();
  if (!user) return;
  const { data, error } = await db.from('learning_records').select('id,studied_on,subject,content,minutes,created_at').order('studied_on', { ascending:false }).order('created_at', { ascending:false }).limit(200);
  if (token !== generation || !user) return;
  if (error) { say('기록을 불러오지 못했습니다. 다시 불러오기를 눌러 주세요.'); return; }
  $('record-summary').textContent = `최근 기록 ${data.length}개 · ${data.reduce((sum,r)=>sum+r.minutes,0)}분`;
  if (!data.length) $('records').textContent = '첫 학습 기록을 남겨 보세요.';
  for (const record of data) {
    const article = document.createElement('article'); article.className='record';
    const title = document.createElement('strong'); title.textContent=`${record.studied_on} · ${record.subject} · ${record.minutes}분`;
    const content = document.createElement('p'); content.textContent=record.content;
    const remove = document.createElement('button'); remove.type='button'; remove.textContent='기록 삭제';
    remove.onclick=async()=>{ if(busy || !confirm('이 학습 기록을 삭제할까요?'))return; lock(true); try { const {data:removed,error}=await db.from('learning_records').delete().eq('id',record.id).select('id'); if(error||!removed.length)throw Error(); await loadRecords(); say('기록을 삭제했습니다.'); }catch{say('삭제하지 못했습니다. 다시 시도해 주세요.');}finally{lock(false);} };
    article.append(title,content,remove); $('records').append(article);
  }
}
function showSession(session) {
  user=session?.user||null; ++generation;
  $('auth-form').hidden=!!user; $('learning-area').hidden=!user; $('logout').hidden=!user;
  $('account-name').textContent=user ? `${user.user_metadata?.username || user.email?.split('@')[0]}님의 학습 기록` : '나의 학습 기록';
  if(!user){$('records').replaceChildren();$('record-summary').textContent='';$('record-form').reset();$('studied-on').value=today();}
  else loadRecords().catch(()=>say('네트워크 연결을 확인해 주세요.'));
}
$('auth-form').onsubmit=async event=>{
  event.preventDefault(); if(busy)return;
  const username=$('username').value.trim().toLowerCase(),password=$('password').value;
  if(!/^[a-z0-9_]{4,24}$/.test(username)||password.length<8||password.length>72){say('아이디와 비밀번호 입력 기준을 확인해 주세요.');return;}
  lock(true);say('처리 중입니다.');
  try{
    if(event.submitter?.id==='signup'){
      const response=await fetch(`${url}/functions/v1/register`,{method:'POST',headers:{apikey:key,'Content-Type':'application/json'},body:JSON.stringify({username,password}),signal:AbortSignal.timeout(15000)});
      const result=await response.json();if(!response.ok)throw Error(result.error||'가입하지 못했습니다.');
    }
    const {data,error}=await db.auth.signInWithPassword({email:email(username),password});
    if(error)throw Error('로그인하지 못했습니다. 아이디와 비밀번호를 확인해 주세요. 비밀번호를 잊었다면 담당 교사에게 문의해 주세요.');
    $('password').value='';showSession(data.session);say('로그인했습니다. 학습 기록은 계정에 저장됩니다.');
  }catch(error){say(error.name==='TimeoutError'?'연결 시간이 초과되었습니다. 잠시 후 다시 시도해 주세요.':error.message||'네트워크 연결을 확인해 주세요.');}finally{lock(false);}
};
$('logout').onclick=async()=>{if(busy)return;lock(true);try{const {error}=await db.auth.signOut();if(error)throw error;showSession(null);say('로그아웃했습니다.');}catch{say('로그아웃하지 못했습니다. 네트워크를 확인해 주세요.');}finally{lock(false);}};
$('record-form').onsubmit=async event=>{
 event.preventDefault();if(busy||!user)return;lock(true);
 try{
  const {error}=await db.from('learning_records').insert({user_id:user.id,studied_on:$('studied-on').value,subject:$('subject').value.trim(),content:$('learning-content').value.trim(),minutes:Number($('learning-minutes').value)});
  if(error)throw error;$('record-form').reset();$('studied-on').value=today();await loadRecords();say('학습 기록을 저장했습니다.');
 }catch{say('저장하지 못했습니다. 입력 내용은 유지됩니다. 연결과 입력값을 확인해 주세요.');}finally{lock(false);}
};
$('reload-records').onclick=()=>loadRecords().catch(()=>say('기록을 불러오지 못했습니다.'));
$('studied-on').value=today();
lock(false);
db.auth.onAuthStateChange((_event,session)=>{setTimeout(()=>showSession(session),0);});
db.auth.getSession().then(({data,error})=>{if(error)say('로그인 상태를 확인하지 못했습니다. 다시 로그인해 주세요.');showSession(data.session);}).catch(()=>say('로그인 서비스에 연결하지 못했습니다.'));
