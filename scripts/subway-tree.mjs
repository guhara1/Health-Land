// 전국 지하철 노선/역 페이지 생성기 (권역 시스템별)
// - 시스템(수도권/부산/대구/광주/대전 등)별 레지스트리 → 같은 도시 내에서만 환승 통합
// - 도시 간 동일 역명(서울 시청 ≠ 부산 시청)은 별개 페이지로 분리, 메타 고유화
// - /subway/(인덱스) → /subway/line/{노선}/ → /subway/{역}/ (역 정규 페이지)
import { layout, esc, faqLd, articleLd, pricingTable, pricingLd } from "../src/templates/layout.mjs";
import { site } from "../data/site.mjs";
import { programBySlug } from "../data/programs.mjs";
import { slugify } from "./romanize.mjs";

const MODIFIED = "2026-06-21";
const PROGRAM_PICKS = ["swedish", "aroma-therapy", "thai-massage", "home-care", "foot-massage"];
const phone = site.phone;

function seed(str) { let h = 0; for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0; return h; }
const pick = (s, arr) => arr[s % arr.length];
let _lineBySlug = {};

function authorBox() {
  return `
  <aside class="author-box">
    <div class="avatar">HL</div>
    <div class="meta">
      <strong>${esc(site.author.name)}</strong> · ${esc(site.author.role)}
      <p>${esc(site.author.bio)}</p>
      <p class="updated">최종 수정일 ${MODIFIED} · 검수: ${esc(site.author.reviewer)}</p>
    </div>
  </aside>`;
}
function callout() {
  return `<div class="callout">표시된 정보와 가격은 변동될 수 있으므로, <strong>실제 방문 가능 여부와 비용은 예약 전 ${esc(phone)}로 직접 확인</strong>하는 것이 정확합니다.</div>`;
}
const ctaBtn = (label) => `<p><a class="btn btn-primary" href="${site.phoneHref}">📞 ${esc(label)} 전화예약 ${esc(phone)}</a></p>`;
function programChips(place) {
  const pre = place ? `${place} ` : "";
  return `<div class="link-cloud">${PROGRAM_PICKS.map((slug) => `<a href="/program/${slug}/">${esc(pre + programBySlug[slug].label)}</a>`).join("")}</div>`;
}
const crumb = (parts) => parts.map(([name, url]) => ({ name, url: url || "" }));

// 역 타이틀·디스크립션 변형 (역명 + 노선명으로 도시 간 동명역까지 고유화)
function stationMeta(station, l1) {
  const s = seed("st|" + l1 + "|" + station);
  const titles = [
    `${station} 출장마사지·홈타이 안내 — ${l1} | ${site.name}`,
    `${l1} ${station} 출장마사지·홈타이 이용 안내 | ${site.name}`,
    `${station} 홈타이·출장마사지 방문 안내 (${l1}) | ${site.name}`,
    `${station} 출장마사지 예약 가이드 — ${l1} | ${site.name}`,
  ];
  const descs = [
    `${l1} ${station} 인근 출장마사지·홈타이 방문 권역과 예약 확인 안내.`,
    `${station}(${l1})에서 출장마사지·홈타이를 찾을 때 볼 방문·예약 기준 안내.`,
    `${l1} ${station} 인근 홈타이·출장마사지 이용 흐름과 비용·예약 안내.`,
    `${station}(${l1}) 출장마사지 예약 체크리스트와 인접역 정보 안내.`,
    `${l1} ${station} 기준 출장마사지·홈타이 방문·예약 안내입니다.`,
  ];
  return { title: titles[s % titles.length], description: descs[(s >>> 2) % descs.length].slice(0, 80) };
}

// ---------- 역 페이지(정규) ----------
function stationPage(reg, sys) {
  const station = reg.name;
  const s = seed("S" + sys.id + station);
  const lineNames = reg.lines.map((l) => l.lineName);
  const l1 = lineNames[0];
  const isTransfer = reg.lines.length > 1;

  const neigh = [];
  for (const l of reg.lines) {
    const line = _lineBySlug[l.lineSlug];
    if (line.stations[l.idx - 1]) neigh.push(line.stations[l.idx - 1]);
    if (line.stations[l.idx + 1]) neigh.push(line.stations[l.idx + 1]);
  }
  const uniqNeigh = [...new Set(neigh)].slice(0, 6);
  const neighText = uniqNeigh.length ? uniqNeigh.join("·") : "인근 역";
  const lineText = lineNames.join("·");

  const openers = [
    `${station}은(는) ${lineText}이(가) 지나는 지하철역입니다.`,
    `${lineText}의 ${station} 일대는 유동 인구가 이어지는 역세권입니다.`,
    `${station}은(는) ${lineText} 이용객이 오가는 역으로, 인근 출장마사지·홈타이 문의가 이어집니다.`,
  ];
  const transferLine = isTransfer ? `${station}은(는) ${reg.lines.length}개 노선이 만나는 환승역이라 여러 방향에서 접근이 가능합니다. ` : "";

  const faqs = [
    { q: `${station} 인근에서 출장마사지는 어떻게 예약하나요?`, a: `전화로 ${station} 인근 위치와 원하는 프로그램·시간을 알리면 방문 가능 여부와 도착 소요 시간을 안내받을 수 있습니다. 비용과 포함 범위도 함께 확인하세요.` },
    { q: `${station}에서 홈타이도 이용할 수 있나요?`, a: `홈타이는 집·숙소로 받는 방문 형태의 출장마사지를 뜻하며, ${station} 인근에서도 방문 가능 권역인지 예약 시 확인하면 됩니다. 스웨디시·아로마·타이마사지 등 프로그램을 선택할 수 있습니다.` },
    { q: `${station}까지 방문에 얼마나 걸리나요?`, a: `출발지와 시간대, 역 인근 권역에 따라 달라집니다. 정확한 방문 소요 시간은 예약 시 확인하는 것이 좋습니다.` },
  ];

  const lineLinks = reg.lines.map((l) => `<a href="/subway/line/${l.lineSlug}/">${esc(l.lineName)}</a>`).join("");
  const neighLinks = uniqNeigh.map((n) => `<a href="/subway/${sys.reg.get(n).slug}/">${esc(n)}</a>`).join("");

  const body = `
  <nav class="breadcrumb container" aria-label="위치">
    <a href="/">홈</a><span>›</span><a href="/subway/">지하철역별 찾기</a><span>›</span><a href="/subway/line/${reg.lines[0].lineSlug}/">${esc(l1)}</a><span>›</span>${esc(station)}
  </nav>
  <article class="section-tight"><div class="container prose">
    <p class="card-tag" style="color:var(--color-accent);font-weight:700">${esc(sys.name)} 지하철 · ${esc(lineText)}</p>
    <h1>${esc(station)} 출장마사지·홈타이 이용 안내</h1>

    <h2>${esc(station)} 역세권 개요</h2>
    <p>${esc(pick(s, openers))} ${esc(transferLine)}인접역으로는 ${esc(neighText)} 등이 있어, ${esc(station)} 인근에서 출장마사지나 홈타이를 찾을 때는 방문 권역과 도착 소요 시간을 먼저 확인하는 것이 좋습니다.</p>
    <p>역세권은 출발지에 따라 방문 소요 시간이 달라질 수 있으므로, 원하는 시간대를 미리 정해 ${esc(station)} 인근 위치를 알리면 안내가 빠릅니다. 표시된 운영 정보나 가격은 변동될 수 있어, 실제 방문 가능 여부와 비용은 예약 단계에서 확인하는 것이 정확합니다.</p>

    <h2>${esc(station)} 인근에서 출장마사지·홈타이를 찾는 경우</h2>
    <ul>
      <li>${esc(station)} 인근에서 이동 없이 집·숙소에서 편하게 관리받고 싶은 경우</li>
      <li>퇴근 후나 늦은 시간에 ${esc(station)} 주변에서 이용하고 싶은 경우</li>
      <li>${esc(lineText)} 이용으로 이동이 잦아 어깨·허리 피로가 누적된 경우</li>
      <li>처음이라 부드러운 스웨디시나 발마사지처럼 부담이 적은 프로그램부터 비교하고 싶은 경우</li>
    </ul>

    <h2>${esc(station)} 이용 시 확인할 점</h2>
    <p>표시된 운영 시간이나 가격은 변동될 수 있으므로, 방문 가능 여부·총 비용·추가 요금은 예약 단계에서 직접 확인하는 것이 좋습니다. 역 인근이라도 실제 방문 권역과 도착 시간은 출발지에 따라 다릅니다.</p>
    <ul>
      <li>${esc(station)} 인근 방문 가능 권역과 도착 소요 시간</li>
      <li>원하는 프로그램(스웨디시·아로마·타이마사지 등)과 관리 시간</li>
      <li>표시 가격에 방문비·심야 요금 포함 여부</li>
      <li>관리사 성별 지정 등 추가 요청 가능 여부</li>
      <li>관리 공간·타월 등 준비물</li>
    </ul>
    ${callout()}

    <h2>${esc(station)} 인근에서 비교해 볼 관리 방식</h2>
    <p>부드러운 오일 관리를 원한다면 스웨디시나 아로마테라피, 스트레칭 위주의 시원한 관리를 원한다면 타이마사지를 비교해 보세요. 집·숙소로 편하게 받고 싶다면 홈타이, 다리만 가볍게 풀고 싶다면 발마사지처럼 부분 관리도 선택할 수 있습니다.</p>
    ${programChips(station)}

    <h2>${esc(station)} 출장마사지·홈타이 이용 흐름</h2>
    <p>예약 시 ${esc(station)} 인근 위치와 원하는 프로그램·시간을 전달하면, 방문 가능 여부와 도착 예정 시간을 안내받게 됩니다. 방문 형태(홈타이)는 관리 공간과 타월 등 간단한 준비만 갖추면 익숙한 공간에서 관리받을 수 있고, 관리 후 별도 이동 없이 그대로 쉴 수 있다는 점이 장점입니다. 늦은 시간 이용을 원한다면 심야 방문 가능 여부와 추가 요금을 미리 확인하세요.</p>

    <h2>${esc(station)} 노선·인접역</h2>
    <p>${esc(station)}이(가) 속한 노선과 인접역을 함께 확인하면 이동 동선에 맞는 안내를 받기 좋습니다.</p>
    <div class="link-cloud">${lineLinks}${neighLinks}</div>

    <h2>자주 묻는 질문</h2>
    <div class="faq">
      ${faqs.map((f) => `<details><summary>${esc(f.q)}</summary><p>${esc(f.a)}</p></details>`).join("\n      ")}
    </div>
    ${authorBox()}
    ${ctaBtn(station + " 출장마사지")}
  </div></article>
  ${pricingTable()}`;

  const path = `/subway/${reg.slug}/`;
  return {
    path,
    file: `subway/${reg.slug}/index.html`,
    html: layout({
      ...stationMeta(station, l1),
      path,
      body,
      structuredData: [
        faqLd(faqs),
        articleLd({ headline: `${station} 출장마사지·홈타이 이용 안내`, description: `${l1} ${station} 인근 출장마사지·홈타이 이용 안내`, path, modified: MODIFIED }),
        pricingLd(),
      ],
      breadcrumb: crumb([["홈", "/"], ["지하철역별 찾기", "/subway/"], [l1, `/subway/line/${reg.lines[0].lineSlug}/`], [station, path]]),
    }),
  };
}

// ---------- 노선 페이지 ----------
function linePage(line, sys) {
  const stationLinks = line.stations.map((st) => `<a href="/subway/${sys.reg.get(st).slug}/">${esc(st)}</a>`).join("");
  const area = line.area || sys.name;
  const faqs = [
    { q: `${line.name} 어느 역에서 출장마사지를 이용할 수 있나요?`, a: `${line.name} 각 역 인근에서 이용 가능 여부를 확인할 수 있습니다. 위 역 목록에서 원하는 역을 선택한 뒤 예약 시 위치를 알리면 됩니다.` },
    { q: `${line.name}에서 홈타이도 가능한가요?`, a: `홈타이는 집·숙소로 받는 방문 형태의 출장마사지를 뜻하며, 역 인근이 방문 가능 권역인지 예약 시 확인하면 됩니다.` },
    { q: `예약은 어떻게 하나요?`, a: `전화로 원하는 역·프로그램·시간을 알리면 방문 가능 여부와 도착 소요 시간을 안내받을 수 있습니다. 전화예약 ${phone}.` },
  ];
  const body = `
  <nav class="breadcrumb container" aria-label="위치">
    <a href="/">홈</a><span>›</span><a href="/subway/">지하철역별 찾기</a><span>›</span>${esc(line.name)}
  </nav>
  <article class="section-tight"><div class="container prose">
    <p class="card-tag" style="color:var(--color-accent);font-weight:700">${esc(sys.name)} 지하철</p>
    <h1>${esc(line.name)} 역별 출장마사지·홈타이 안내</h1>
    <p>${esc(line.name)}은(는) ${esc(area)}을(를) 지나는 노선으로 ${line.stations.length}개 역을 운행합니다. 같은 노선이라도 역에 따라 방문 권역과 도착 소요 시간이 달라지므로, 원하는 역을 먼저 고르면 출장마사지·홈타이 안내를 더 정확히 확인할 수 있습니다. 노선이 지나는 지역과 환승역을 함께 고려하면 이동 동선에 맞는 역을 고르기 쉽습니다.</p>

    <h2>${esc(line.name)} 역에서 찾기</h2>
    <p>아래에서 역을 선택하면 해당 역 인근의 출장마사지·홈타이 이용 안내를 확인할 수 있습니다.</p>
    <div class="link-cloud">${stationLinks}</div>

    <h2>${esc(line.name)} 인근에서 비교해 볼 관리 방식</h2>
    <p>부드러운 오일 관리를 원한다면 스웨디시·아로마테라피, 스트레칭 위주라면 타이마사지, 집·숙소에서 편하게 받고 싶다면 홈타이, 가벼운 부분 관리는 발마사지를 비교해 보세요.</p>
    ${programChips(line.name)}
    ${callout()}

    <h2>${esc(line.name)} 인근에서 출장마사지·홈타이를 찾는 경우</h2>
    <ul>
      <li>${esc(line.name)} 역세권에서 이동 없이 집·숙소에서 편하게 관리받고 싶은 경우</li>
      <li>퇴근 후나 늦은 시간에 노선 인근에서 이용하고 싶은 경우</li>
      <li>출퇴근 이동이 잦아 어깨·허리 피로가 누적된 경우</li>
      <li>처음이라 부드러운 스웨디시·발마사지부터 비교해 보고 싶은 경우</li>
    </ul>

    <h2>${esc(line.name)} 이용 안내</h2>
    <p>역세권에서 출장마사지나 홈타이를 예약할 때는 원하는 역, 프로그램, 시간을 함께 전달하면 방문 가능 여부와 도착 예정 시간을 안내받을 수 있습니다. 노선이 길수록 역마다 권역이 다르니, 가까운 역을 먼저 정해 두면 예약과 안내가 한결 빠릅니다. 표시 가격에 방문비·심야 요금이 포함되는지도 미리 확인해 두세요.</p>

    <h2>예약 전 체크리스트</h2>
    <ul>
      <li>방문 희망 역과 인근 방문 소요 시간</li>
      <li>원하는 프로그램과 관리 시간</li>
      <li>표시 가격에 방문비·심야 요금 포함 여부</li>
      <li>관리사 성별 지정 등 추가 요청</li>
      <li>관리 공간·타월 등 준비물</li>
    </ul>

    <h2>${esc(line.name)} 방문(홈타이)과 매장 이용 비교</h2>
    <p>매장 이용이 시설과 부대 서비스를 함께 쓰는 방식이라면, 홈타이는 역 인근 집·숙소로 관리사가 찾아오는 방문 방식입니다. 이동 부담이 적고 관리 후 바로 쉴 수 있는 대신, 관리 공간과 타월 등 준비물을 직접 챙겨야 하므로 예약 시 준비 사항을 확인하는 것이 좋습니다. 어떤 방식이 맞을지는 이용 목적과 시간에 따라 달라집니다.</p>

    <h2>지역·프로그램과 함께 보기</h2>
    <p>노선 인근 지역과 관리 프로그램을 함께 확인하면 선택 기준을 잡기 쉽습니다.</p>
    <div class="link-cloud">
      <a href="/region/seoul/">서울</a><a href="/region/gyeonggi/">경기</a><a href="/region/incheon/">인천</a><a href="/region/busan/">부산</a>
      <a href="/program/swedish/">스웨디시</a><a href="/program/aroma-therapy/">아로마테라피</a><a href="/program/home-care/">홈타이</a><a href="/guide/">예약 가이드</a>
    </div>

    <h2>자주 묻는 질문</h2>
    <div class="faq">
      ${faqs.map((f) => `<details><summary>${esc(f.q)}</summary><p>${esc(f.a)}</p></details>`).join("\n      ")}
    </div>
    ${authorBox()}
    ${ctaBtn(line.name + " 출장마사지")}
  </div></article>
  ${pricingTable()}`;

  const path = `/subway/line/${line.slug}/`;
  return {
    path,
    file: `subway/line/${line.slug}/index.html`,
    html: layout({
      title: `${line.name} 역별 출장마사지·홈타이 안내 | ${site.name}`,
      description: `${line.name} 역별 출장마사지·홈타이 방문 권역과 예약 확인 사항을 정리했습니다.`.slice(0, 80),
      path,
      body,
      structuredData: [faqLd(faqs), articleLd({ headline: `${line.name} 역별 출장마사지·홈타이 안내`, description: `${line.name} 역별 출장마사지·홈타이 안내`, path, modified: MODIFIED }), pricingLd()],
      breadcrumb: crumb([["홈", "/"], ["지하철역별 찾기", "/subway/"], [line.name, path]]),
    }),
  };
}

// ---------- 지하철 인덱스 ----------
function subwayIndex(systems, stationCount, lineCount) {
  const sections = systems.map((sys) => {
    const cards = sys.lines.map((l) => `<a class="card" href="/subway/line/${l.slug}/">
        <h3>${esc(l.name)}</h3>
        <p>${esc(l.area || sys.name)} · ${l.stations.length}개 역</p>
      </a>`).join("\n      ");
    return `<div class="section-head" style="margin-top:var(--sp-6)"><span class="eyebrow">${esc(sys.name)} 지하철</span></div>
    <div class="grid grid-3">${cards}</div>`;
  }).join("\n");
  const body = `
  <section class="hero"><div class="container">
    <p class="eyebrow">지하철역별 찾기</p>
    <h1>전국 지하철역 출장마사지·홈타이 찾기</h1>
    <p>수도권·부산·대구·광주·대전 등 전국 지하철 노선과 역 기준으로 출장마사지·홈타이 이용 안내를 확인할 수 있습니다. 노선을 고른 뒤 가까운 역을 선택하면 역세권 안내를 볼 수 있습니다. (총 ${lineCount}개 노선·${stationCount}개 역)</p>
    <div class="hero-actions">
      <a class="btn btn-gold" href="${site.phoneHref}">📞 전화예약 ${esc(phone)}</a>
      <a class="btn btn-outline" href="/region/">지역별 찾기</a>
    </div>
  </div></section>
  <section class="section"><div class="container">
    ${sections}
  </div></section>
  <section class="section section-alt"><div class="container prose">
    <h2>지하철역 기준으로 찾는 방법</h2>
    <p>전국 지하철은 노선마다 지나는 지역과 분위기가 다릅니다. 노선을 먼저 고른 뒤 가까운 역을 선택하면, 해당 역세권 기준으로 출장마사지·홈타이 방문 권역과 예약 안내를 확인할 수 있습니다. 같은 역이라도 출발지에 따라 방문 소요 시간이 달라지므로, 원하는 역과 시간대를 정해 두면 안내가 빠릅니다.</p>
    <p>관리 방식은 부드러운 오일 관리(스웨디시·아로마테라피), 스트레칭 위주의 타이마사지, 집·숙소로 받는 홈타이, 가벼운 부분 관리(발마사지)로 나눠 비교하면 선택이 쉬워집니다. 환승역은 여러 노선이 만나 접근이 편하므로, 이동 동선에 맞는 역을 고르는 것도 방법입니다.</p>
    ${callout()}
    <h2>자주 묻는 질문</h2>
    <div class="faq">
      <details><summary>지하철역 기준으로 어떻게 예약하나요?</summary><p>원하는 노선과 역을 고른 뒤 전화로 역 인근 위치·프로그램·시간을 알리면 방문 가능 여부와 도착 소요 시간을 안내받을 수 있습니다.</p></details>
      <details><summary>역 인근에서 홈타이도 되나요?</summary><p>홈타이는 집·숙소로 받는 방문 형태의 출장마사지로, 역 인근이 방문 가능 권역인지 예약 시 확인하면 됩니다.</p></details>
      <details><summary>어느 지역까지 가능한가요?</summary><p>노선·역마다 방문 권역이 다를 수 있습니다. 역을 선택하고 예약 시 위치를 알리면 됩니다.</p></details>
    </div>
    ${authorBox()}
  </div></section>`;
  return {
    path: "/subway/",
    file: "subway/index.html",
    html: layout({
      title: `전국 지하철역 출장마사지·홈타이 찾기 | ${site.name}`,
      description: "전국 지하철 노선·역별 출장마사지·홈타이 이용 안내를 확인하세요.",
      path: "/subway/",
      body,
      breadcrumb: crumb([["홈", "/"], ["지하철역별 찾기", "/subway/"]]),
    }),
  };
}

export function buildSubwayPages(systems) {
  // 노선 슬러그 + 전역 노선 맵
  _lineBySlug = {};
  for (const sys of systems) {
    for (const l of sys.lines) { l.slug = l.slug || slugify(l.name); _lineBySlug[l.slug] = l; }
  }
  // 시스템별 역 레지스트리 + 전역 슬러그 중복 방지
  const usedSlugs = new Set();
  let stationCount = 0, lineCount = 0;
  for (const sys of systems) {
    sys.reg = new Map();
    for (const line of sys.lines) {
      lineCount++;
      line.stations.forEach((st, idx) => {
        let r = sys.reg.get(st);
        if (!r) { r = { name: st, lines: [] }; sys.reg.set(st, r); }
        r.lines.push({ lineName: line.name, lineSlug: line.slug, idx });
      });
    }
    for (const r of sys.reg.values()) {
      let base = slugify(r.name.replace(/역$/, "")) || "station";
      if (sys.id !== "sudogwon") base = sys.id + "-" + base;
      let sg = base, n = 2;
      while (usedSlugs.has(sg)) sg = base + "-" + n++;
      usedSlugs.add(sg);
      r.slug = sg;
    }
    stationCount += sys.reg.size;
  }
  const pages = [subwayIndex(systems, stationCount, lineCount)];
  for (const sys of systems) {
    for (const line of sys.lines) pages.push(linePage(line, sys));
    for (const r of sys.reg.values()) pages.push(stationPage(r, sys));
  }
  return pages;
}
