# 교실 도구함

수업 도구와 계정별 학습 기록을 제공하는 웹앱입니다.

- [GitHub Pages 허브](https://rlaaudwl00.github.io/classroom-hub/)
- [Vercel 교실 도구함](https://classroom-toolbox-seven.vercel.app/)
- [Google 로그인 일기장](https://classroom-diary-5d82f.firebaseapp.com/)

타이머와 PDF 글자 수 도구는 바로 사용할 수 있습니다. PDF는 브라우저 안에서 처리하며 서버에 업로드하지 않습니다.

학습 기록은 Supabase 서울 리전에 계정별로 저장합니다. 영문·숫자·밑줄 4~24자의 아이디와 8~72자의 비밀번호로 가입합니다. 비밀번호를 잊으면 담당 교사에게 문의하세요. 공용 컴퓨터에서는 로그아웃하세요.

일기장은 별도 Firebase 프로젝트에서 Google 로그인과 본인 계정별 저장을 제공합니다. 허브의 일기장 카드에서 엽니다. 실제 일기·로컬 데이터·관리자 키·로컬 서버는 이 공개 저장소에 포함하지 않습니다.

PDF.js 6.4.299와 라이선스는 pdf-counter/vendor/package에 포함되어 있습니다. Vercel의 PDF 링크는 GitHub Pages PDF 도구로 이동합니다. Vercel 배포는 공개 파일을 직접 전달한 방식이므로 GitHub 변경 시 별도 재배포가 필요합니다.
