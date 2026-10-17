import * as pdfjs from './vendor/package/build/pdf.mjs';
pdfjs.GlobalWorkerOptions.workerSrc = new URL('./vendor/package/build/pdf.worker.mjs', import.meta.url).href;
const $ = id => document.getElementById(id);
let generation = 0, task = null;
export function countText(text) {
  const normalized = text.normalize('NFC').replace(/\r\n?|\n|\u2028|\u2029/g, '');
  return { withSpace: Array.from(normalized).length, withoutSpace: Array.from(normalized.replace(/\s/gu, '')).length };
}
function reset() {
  generation++;
  if (task) { task.destroy().catch(() => {}); task = null; }
  $('pdf-file').value = ''; $('result').hidden = true; $('text').textContent = ''; $('page-rows').replaceChildren(); $('filename').textContent = '';
  $('progress').hidden = true; $('status').textContent = 'PDF를 선택해 주세요.';
}
$('clear').onclick = reset;
async function analyze(file) {
  reset(); const token = generation;
  if (!file) return;
  if (!/\.pdf$/i.test(file.name)) { $('status').textContent = 'PDF 파일을 선택해 주세요.'; return; }
  if (file.size > 100 * 1024 * 1024) { $('status').textContent = '100 MB 이하 PDF를 선택해 주세요.'; return; }
  $('status').textContent = 'PDF를 컴퓨터 안에서 읽고 있어요…';
  let loading = null;
  try {
    const data = new Uint8Array(await file.arrayBuffer()); if (token !== generation) return;
    loading = pdfjs.getDocument({ data, isEvalSupported: false, disableFontFace: true, useSystemFonts: true, cMapUrl: new URL('./vendor/package/cmaps/', import.meta.url).href, cMapPacked: true, standardFontDataUrl: new URL('./vendor/package/standard_fonts/', import.meta.url).href, enableXfa: false });
    task = loading;
    loading.onPassword = () => { loading.destroy().catch(() => {}); if (token === generation) $('status').textContent = '암호가 설정된 PDF입니다. 컴퓨터에서 암호를 해제한 사본을 선택해 주세요.'; };
    const doc = await loading.promise; if (token !== generation) return;
    $('progress').hidden = false; $('progress').max = doc.numPages;
    let total = 0, compact = 0, empty = 0; const texts = [], rows = document.createDocumentFragment();
    for (let i = 1; i <= doc.numPages; i++) {
      if (token !== generation) return;
      const page = await doc.getPage(i); const content = await page.getTextContent();
      if (token !== generation) return;
      const text = content.items.filter(item => typeof item.str === 'string').map(item => item.str + (item.hasEOL ? '\n' : '')).join('');
      const count = countText(text); total += count.withSpace; compact += count.withoutSpace; if (!count.withoutSpace) empty++;
      texts.push(`[${i}쪽]\n${text}`);
      const row = document.createElement('tr'); for (const value of [i+'쪽', count.withSpace.toLocaleString(), count.withoutSpace.toLocaleString(), count.withoutSpace ? '텍스트 추출됨' : '텍스트 없음 / OCR 필요 가능']) { const cell = document.createElement('td'); cell.textContent = value; row.append(cell); } rows.append(row);
      page.cleanup(); $('progress').value = i; $('status').textContent = `${doc.numPages}쪽 중 ${i}쪽 분석 중…`;
      await new Promise(resolve => setTimeout(resolve, 0));
    }
    $('filename').textContent = file.name; $('with-space').textContent = total.toLocaleString(); $('without-space').textContent = compact.toLocaleString(); $('pages').textContent = doc.numPages.toLocaleString(); $('page-rows').append(rows); $('text').textContent = texts.join('\n\n');
    $('warning').textContent = empty ? `텍스트가 없는 페이지가 ${empty}쪽 있습니다. 이미지·스캔 페이지는 집계되지 않습니다. 합계는 추출된 텍스트만의 글자 수입니다.` : '추출된 텍스트 기준입니다. 이미지 속 글자와 텍스트 변환이 누락된 부분은 집계되지 않을 수 있습니다.';
    $('result').hidden = false; $('status').textContent = '분석 완료 · 파일과 결과는 외부로 전송되지 않았습니다.';
  } catch (error) {
    if (token === generation && !/암호/.test($('status').textContent)) $('status').textContent = 'PDF를 읽지 못했습니다. 손상되었거나 지원하지 않는 PDF일 수 있습니다. 다른 파일을 선택해 주세요.';
  } finally {
    if (loading) await loading.destroy().catch(() => {});
    if (token === generation) { task = null; $('progress').hidden = true; }
  }
}
$('pdf-file').onchange = event => analyze(event.target.files[0]);
const drop = document.querySelector('.upload');
for (const type of ['dragenter','dragover']) drop.addEventListener(type,event => { event.preventDefault(); drop.classList.add('drag'); });
drop.addEventListener('dragleave',()=>drop.classList.remove('drag'));
drop.addEventListener('drop',event=>{event.preventDefault();drop.classList.remove('drag');if(event.dataTransfer.files.length!==1){reset();$('status').textContent='PDF를 한 번에 1개씩 선택해 주세요.';return;}analyze(event.dataTransfer.files[0]);});

window.addEventListener('pagehide', reset);
