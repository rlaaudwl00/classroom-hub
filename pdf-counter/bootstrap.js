'use strict';
const input = document.getElementById('pdf-file');
const status = document.getElementById('status');
input.disabled = true;
if (location.protocol === 'file:') {
  status.textContent = '이 화면은 파일로 직접 열려 PDF 분석을 실행할 수 없습니다. 교실 도구함의 열기.cmd를 실행하거나 제공된 웹사이트 주소로 접속해 주세요.';
} else {
  status.textContent = 'PDF 분석 기능을 준비하고 있어요…';
  const timeout = setTimeout(() => { status.textContent = '분석 기능을 불러오는 데 시간이 걸립니다. 새로고침한 뒤 다시 시도해 주세요.'; }, 20000);
  import('./counter.js').then(() => { clearTimeout(timeout); input.disabled = false; status.textContent = 'PDF를 선택해 주세요.'; }).catch(() => { clearTimeout(timeout); status.textContent = 'PDF 분석 기능을 불러오지 못했습니다. 최신 Chrome 또는 Edge에서 새로고침해 주세요.'; });
}
