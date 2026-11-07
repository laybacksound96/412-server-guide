# 412's server 가이드

Project Zomboid Build 42 멀티플레이 서버 "412's server"의 플레이어 가이드.

- 서버 안내·규칙: https://laybacksound96.github.io/412-server-guide/
- 모드 가이드 (버전별 모드 설명, 검색 가능): https://laybacksound96.github.io/412-server-guide/mods.html
- 업데이트 내역: https://github.com/laybacksound96/412-server-guide/wiki

## 구성
- `docs/versions.json`: 버전 목록(최신이 위)과 지금 운영 중인 버전(`current`)
- `docs/w9/`, `docs/w10/` …: 버전마다 `index.html`(서버 안내), `changes.html`(이번 버전), `mods.html`·`mods.json`(모드 가이드)
- `docs/index.html`, `docs/mods.html`: 운영 중인 버전 폴더로 넘겨 주는 페이지. 리셋 때 `versions.json`의 `current`와 함께 바꾼다
- `docs/site.js`: 버전 드롭다운, 지난/예정 버전 안내 띠, 모드 가이드, 이전 버전과의 모드 비교(NEW 표시)
