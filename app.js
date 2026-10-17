'use strict';
const { ClassroomTimer, parseDuration, formatTime } = ClassroomTimerCore;
const $ = id => document.getElementById(id);
document.querySelector('.skip').addEventListener('click', event => { event.preventDefault(); $('main').focus(); $('main').scrollIntoView(); });
// Register the next tool here, then supply its renderer in toolRoutes below.
const apps = [{ id: 'classroom-timer', name: '교실 타이머', description: '남은 시간을 한눈에. 모둠 활동부터 쉬는 시간까지, 수업의 흐름을 함께 맞춰요.', tags: ['시간 관리', '수업 활동', '타이머'], path: '#/timer', icon: '◷', label: 'CLASSROOM TIMER' }];
apps.push({ id: 'pdf-counter', name: 'PDF 글자 수', description: 'PDF의 공백 포함·제외 글자 수와 페이지별 결과를 확인해요. 파일과 결과는 내 컴퓨터에서만 처리합니다.', tags: ['PDF', '글자 수', '문서', '로컬'], path: 'pdf-counter/index.html', icon: '▤', label: 'LOCAL PDF COUNTER' });
apps.push({ id: 'diary', name: '나의 일기장', description: 'Google 계정으로 로그인하고 오늘의 기분과 이야기를 나만의 일기장에 저장해요.', tags: ['일기', 'Google 로그인', '기록'], path: 'https://classroom-diary-5d82f.firebaseapp.com/', icon: '✎', label: 'MY DAILY JOURNAL' });
const timer = new ClassroomTimer(() => Date.now());
let currentRoute = '', pendingRoute = null, audioContext, soundNodes = [];
function renderApps() {
  const query = $('search').value.trim().toLocaleLowerCase('ko');
  const matches = apps.filter(app => [app.name, app.description, ...app.tags].join(' ').toLocaleLowerCase('ko').includes(query));
  $('app-list').replaceChildren();
  for (const app of matches) {
    const link = document.createElement('a'); link.href = app.path; link.className = 'app-card';
    const icon = document.createElement('span'); icon.className = 'app-icon'; icon.textContent = app.icon; icon.setAttribute('aria-hidden', 'true');
    const badge = document.createElement('span'); badge.className = 'app-badge'; badge.textContent = '바로 사용';
    const label = document.createElement('span'); label.className = 'app-label'; label.textContent = app.label;
    const title = document.createElement('h3'); title.textContent = app.name;
    const description = document.createElement('p'); description.textContent = app.description;
    const tags = document.createElement('div'); tags.className = 'tags'; app.tags.slice(0, 2).forEach(tag => { const item = document.createElement('span'); item.textContent = tag; tags.append(item); });
    const action = document.createElement('div'); action.className = 'app-action'; action.append(document.createTextNode(app.name + ' 열기')); const arrow = document.createElement('span'); arrow.textContent = '↗'; arrow.setAttribute('aria-hidden', 'true'); action.append(arrow);
    link.append(icon, badge, label, title, description, tags, action); $('app-list').append(link);
  }
  $('tool-count').textContent = matches.length; $('empty-search').hidden = matches.length > 0; $('search-clear').hidden = !$('search').value; $('search-status').textContent = `도구 ${matches.length}개`;
}
$('search').addEventListener('input', renderApps);
$('search-form').addEventListener('submit', event => { event.preventDefault(); renderApps(); });
for (const id of ['search-clear', 'reset-search']) $(id).onclick = () => { $('search').value = ''; renderApps(); $('search').focus(); };
$('suggest-timer').onclick = () => { $('search').value = '타이머'; renderApps(); $('search').focus(); };
function announce(message) { $('timer-announcement').textContent = message; }
function readTime() {
  const ms = parseDuration($('minutes').value, $('seconds').value);
  $('input-error').hidden = ms !== null;
  $('input-error').textContent = ms === null ? '분은 0~99, 초는 0~59의 정수로 입력해 주세요. 최소 시간은 1초입니다.' : '';
  for (const id of ['minutes', 'seconds']) $(id).setAttribute('aria-invalid', String(ms === null));
  if (ms !== null) timer.setDuration(ms);
  $('start').disabled = ms === null;
  return ms !== null;
}
for (const id of ['minutes', 'seconds']) $(id).addEventListener('input', () => { if (readTime()) draw(); updatePresets(); });
function updatePresets() { document.querySelectorAll('[data-minutes]').forEach(button => button.setAttribute('aria-pressed', String(Number($('minutes').value) === Number(button.dataset.minutes) && $('seconds').value !== '' && Number($('seconds').value) === 0))); }
document.querySelectorAll('[data-minutes]').forEach(button => button.onclick = () => { $('minutes').value = button.dataset.minutes; $('seconds').value = '0'; readTime(); updatePresets(); draw(); });
function prepareAudio() {
  try { const Audio = window.AudioContext || window.webkitAudioContext; if (!Audio) throw new Error('unsupported'); if (!audioContext) audioContext = new Audio(); return audioContext.resume().catch(() => { $('notice').textContent = '소리를 사용할 수 없어요. 종료 문구로 알려드릴게요.'; }); }
  catch { $('notice').textContent = '소리를 사용할 수 없어요. 종료 문구로 알려드릴게요.'; return Promise.resolve(); }
}
function stopSound() { for (const node of soundNodes) { try { node.stop(); } catch {} } soundNodes = []; }
function ring() {
  stopSound();
  if (!audioContext || audioContext.state !== 'running') { $('notice').textContent = '알림음을 재생하지 못했어요. PC 음량과 브라우저 설정을 확인해 주세요.'; return; }
  for (let i = 0; i < 3; i++) { const oscillator = audioContext.createOscillator(), gain = audioContext.createGain(), at = audioContext.currentTime + i * 0.32; oscillator.type = 'sine'; oscillator.frequency.value = i === 2 ? 1046.5 : 880; gain.gain.setValueAtTime(0, at); gain.gain.linearRampToValueAtTime(0.16, at + 0.02); gain.gain.exponentialRampToValueAtTime(0.001, at + 0.25); oscillator.connect(gain); gain.connect(audioContext.destination); oscillator.start(at); oscillator.stop(at + 0.28); oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); }; soundNodes.push(oscillator); }
}
$('test-sound').onclick = async () => { await prepareAudio(); ring(); };
$('sound').onchange = () => { if (!$('sound').checked) stopSound(); else prepareAudio(); };
function completed() { announce('시간이 종료되었습니다.'); if ($('sound').checked) ring(); }
$('start').onclick = () => {
  if (timer.status === 'running') { if (timer.pause()) completed(); else announce('타이머를 일시정지했습니다.'); }
  else { if (timer.status !== 'paused' && !readTime()) return; if ($('sound').checked) prepareAudio(); stopSound(); timer.start(); announce('타이머를 시작했습니다.'); }
  draw();
};
$('reset').onclick = () => { stopSound(); timer.reset(); $('minutes').value = Math.floor(timer.durationMs / 60000); $('seconds').value = timer.durationMs / 1000 % 60; readTime(); updatePresets(); draw(); announce('설정한 시간으로 초기화했습니다.'); };
function draw() {
  const state = timer.status, locked = state === 'running' || state === 'paused';
  $('clock').textContent = formatTime(timer.remainingMs); document.title = currentRoute === '#/timer' ? `${formatTime(timer.remainingMs)} · 교실 타이머` : '교실 도구함 · 수업에 필요한 작은 도구들';
  $('timer-stage').dataset.state = state; $('time-fields').disabled = locked; $('locked-help').hidden = !locked;
  $('state-label').textContent = { idle: '준비됐어요', running: '집중하는 중', paused: '잠시 쉬어가요', finished: '시간 종료' }[state];
  $('clock-caption').textContent = { idle: '시간을 정하고 시작해 보세요', running: '우리의 시간을 차근차근 채워가요', paused: '준비가 되면 다시 시작해 주세요', finished: '수고했어요! 활동을 마무리해 주세요.' }[state];
  $('start-label').textContent = { idle: '시작하기', running: '일시정지', paused: '이어서 시작', finished: '다시 시작' }[state];
  $('start').firstElementChild.textContent = state === 'running' ? 'Ⅱ' : '▶';
  const percent = Math.max(0, Math.min(100, timer.remainingMs / timer.durationMs * 100)); $('progress-fill').style.width = `${percent}%`; $('progress').setAttribute('aria-valuenow', Math.round(percent));
}
setInterval(() => { if (timer.status !== 'running') return; if (timer.tick()) completed(); draw(); }, 100);
document.addEventListener('visibilitychange', () => { if (!document.hidden) { if (timer.tick()) completed(); draw(); } });
$('fullscreen').onclick = async () => { try { if (document.fullscreenElement) await document.exitFullscreen(); else { if (!$('timer-stage').requestFullscreen) throw new Error('unsupported'); await $('timer-stage').requestFullscreen(); } } catch { $('notice').textContent = '전체 화면을 사용할 수 없어요. 일반 화면에서 계속 사용할 수 있습니다.'; } };
document.addEventListener('fullscreenchange', () => { const active = !!document.fullscreenElement; $('fullscreen').setAttribute('aria-label', active ? '전체 화면 종료' : '전체 화면으로 보기'); $('fullscreen').lastElementChild.textContent = active ? '화면 종료' : '전체 화면'; });
document.addEventListener('keydown', event => { if (event.key === 'Escape' && document.fullscreenElement) document.exitFullscreen().catch(() => {}); });
const toolRoutes = { '#/timer': () => { $('timer-view').hidden = false; } };
function showRoute(route) {
  $('hub-view').hidden = true; $('timer-view').hidden = true; $('not-found').hidden = true;
  if (route === '#/') $('hub-view').hidden = false;
  else if (toolRoutes[route]) toolRoutes[route](); else $('not-found').hidden = false;
  currentRoute = route; draw(); if (route !== '#/timer') document.title = '교실 도구함 · 수업에 필요한 작은 도구들';
  window.scrollTo(0, 0);
}
function routeChanged() {
  const route = location.hash || '#/'; if (route === currentRoute) return;
  if (currentRoute === '#/timer' && ['running', 'paused'].includes(timer.status)) { pendingRoute = route; history.replaceState(null, '', '#/timer'); $('leave-dialog').showModal(); return; }
  if (currentRoute === '#/timer') { stopSound(); timer.reset(); }
  showRoute(route);
}
$('leave-cancel').onclick = () => { pendingRoute = null; $('leave-dialog').close(); };
$('leave-dialog').addEventListener('cancel', () => { pendingRoute = null; });
$('leave-confirm').onclick = async () => { const target = pendingRoute || '#/'; pendingRoute = null; stopSound(); timer.reset(); $('leave-dialog').close(); if (document.fullscreenElement) await document.exitFullscreen().catch(() => {}); history.replaceState(null, '', target); showRoute(target); $('main').focus(); };
window.addEventListener('hashchange', routeChanged);
renderApps(); routeChanged(); draw();



