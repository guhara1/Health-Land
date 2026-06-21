import { site, primaryNav, programMenu } from "../../data/site.mjs";
import { regionGroups, regionNameBySlug } from "../../data/regions.mjs";

// HTML 이스케이프
export const esc = (s = "") =>
  String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const abs = (url) => (url.startsWith("http") ? url : site.baseUrl + url);

// 메가메뉴 데이터: [{ group, items: [{ label, url }] }]
const PROGRAM_MEGA = programMenu.map((g) => ({
  group: g.group,
  items: g.items.map((i) => ({ label: i.label, url: `/program/${i.slug}/` })),
}));
const REGION_MEGA = regionGroups.map((g) => ({
  group: g.group,
  items: g.slugs.map((s) => ({
    label: regionNameBySlug[s] || s,
    url: `/region/${s}/`,
  })),
}));

// 메가메뉴 렌더 (PC 4열 / 모바일 아코디언 공용 마크업)
function renderMega(menu) {
  const cols = menu
    .map(
      (g) => `
        <div class="mega-col">
          <h4>${esc(g.group)}</h4>
          <ul>
            ${g.items
              .map((i) => `<li><a href="${i.url}">${esc(i.label)}</a></li>`)
              .join("\n            ")}
          </ul>
        </div>`
    )
    .join("");
  return `<div class="mega"><div class="mega-grid">${cols}</div></div>`;
}

function renderNav(currentPath) {
  const items = primaryNav
    .map((item) => {
      const active = item.url === currentPath ? ' aria-current="page"' : "";
      const menu =
        item.mega === "program"
          ? PROGRAM_MEGA
          : item.mega === "region"
          ? REGION_MEGA
          : null;
      if (menu) {
        return `<li class="has-mega">
          <a href="${item.url}" aria-haspopup="true" aria-expanded="false"${active}>${esc(
          item.label
        )}</a>
          ${renderMega(menu)}
        </li>`;
      }
      return `<li><a href="${item.url}"${active}>${esc(item.label)}</a></li>`;
    })
    .join("\n        ");
  return `<nav class="nav" id="primary-nav" aria-label="주 메뉴"><ul>${items}</ul></nav>`;
}

function renderHeader(currentPath) {
  return `
  <a class="skip-link" href="#main">본문 바로가기</a>
  <header class="site-header">
    <div class="container header-inner">
      <a class="brand" href="/" aria-label="${esc(site.name)} 홈">
        <span class="brand-mark">HL</span>
        <span>${esc(site.name)}<small>${esc(site.tagline)}</small></span>
      </a>
      ${renderNav(currentPath)}
      <a class="header-cta desktop" href="${site.phoneHref}">📞 전화예약 ${esc(
    site.phone
  )}</a>
      <button class="nav-toggle" aria-label="메뉴 열기" aria-controls="primary-nav" aria-expanded="false">☰</button>
    </div>
  </header>
  <div class="nav-backdrop"></div>`;
}

function renderFooter() {
  const progCols = programMenu.slice(0, 2);
  const footProg = progCols
    .map(
      (g) => `
        <div>
          <h4>${esc(g.group)}</h4>
          <ul>
            ${g.items
              .slice(0, 6)
              .map(
                (i) => `<li><a href="/program/${i.slug}/">${esc(i.label)}</a></li>`
              )
              .join("\n            ")}
          </ul>
        </div>`
    )
    .join("");

  return `
  <footer class="site-footer">
    <div class="container">
      <div class="footer-grid">
        <div class="footer-brand">
          <h4>${esc(site.name)}</h4>
          <p>${esc(site.tagline)}</p>
          <p class="phone"><a href="${site.phoneHref}">${esc(site.phone)}</a></p>
          <p>전화예약으로 지역·프로그램·이용 조건을 안내받을 수 있습니다.</p>
        </div>
        ${footProg}
        <div>
          <h4>안내</h4>
          <ul>
            <li><a href="/guide/">예약 가이드</a></li>
            <li><a href="/about/">이용 안내</a></li>
            <li><a href="/region/">지역별 찾기</a></li>
            <li><a href="/subway/">지하철역별 찾기</a></li>
            <li><a href="/program/">마사지 프로그램</a></li>
            <li><a href="/contact/">문의하기</a></li>
          </ul>
        </div>
      </div>
      <div class="footer-bottom">
        <p>© ${new Date().getFullYear()} ${esc(site.name)}. 전화예약 ${esc(
    site.phone
  )}</p>
        <p class="disclaimer">본 사이트는 출장마사지·홈타이 업체 정보를 안내하는 플랫폼이며, 모든 가격·운영 정보는 변동될 수 있으므로 예약 전 업체에 직접 확인하시기 바랍니다. 건전한 관리 서비스만을 안내합니다.</p>
      </div>
    </div>
  </footer>
  <a class="mobile-callbar" href="${site.phoneHref}">📞 전화예약 ${esc(
    site.phone
  )}</a>`;
}

// JSON-LD 직렬화
const jsonld = (obj) =>
  `<script type="application/ld+json">${JSON.stringify(obj).replace(
    /</g,
    "\\u003c"
  )}</script>`;

/**
 * 페이지 레이아웃
 * @param {object} o
 * @param {string} o.title - <title>
 * @param {string} o.description - 메타 디스크립션 (80자 이내 권장)
 * @param {string} o.path - 현재 경로 (예: /program/swedish/)
 * @param {string} o.body - 본문 HTML
 * @param {string} [o.ogImage] - 선호 썸네일 경로
 * @param {object[]} [o.structuredData] - 추가 JSON-LD 객체 배열
 * @param {Array<{name,url}>} [o.breadcrumb]
 */
export function layout(o) {
  const canonical = abs(o.path);
  const ogImage = abs(o.ogImage || "/assets/og-default.svg");
  const desc = o.description || site.tagline;

  // 조직(LocalBusiness) 기본 JSON-LD
  const orgLd = {
    "@context": "https://schema.org",
    "@type": "HealthAndBeautyBusiness",
    name: site.name,
    description: site.tagline,
    url: site.baseUrl,
    telephone: site.phone,
    image: ogImage,
    areaServed: "KR",
    knowsLanguage: "ko",
    priceRange: "₩90,000~₩180,000",
  };

  const breadcrumbLd = o.breadcrumb
    ? {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: o.breadcrumb.map((b, i) => ({
          "@type": "ListItem",
          position: i + 1,
          name: b.name,
          item: abs(b.url),
        })),
      }
    : null;

  const extra = (o.structuredData || [])
    .concat(breadcrumbLd ? [breadcrumbLd] : [])
    .map(jsonld)
    .join("\n  ");

  return `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${esc(o.title)}</title>
  <meta name="description" content="${esc(desc)}" />
  <link rel="canonical" href="${canonical}" />
  <meta name="robots" content="index, follow, max-image-preview:large" />
  <meta name="author" content="${esc(site.author.name)}" />

  <!-- Open Graph / 선호 썸네일 지정 -->
  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="${esc(site.name)}" />
  <meta property="og:title" content="${esc(o.title)}" />
  <meta property="og:description" content="${esc(desc)}" />
  <meta property="og:url" content="${canonical}" />
  <meta property="og:image" content="${ogImage}" />
  <meta property="og:locale" content="${site.locale}" />
  <meta name="twitter:card" content="summary_large_image" />

  <link rel="icon" href="/assets/favicon.svg" type="image/svg+xml" />
  <script>document.documentElement.classList.add('js')</script>
  <link rel="preconnect" href="https://cdn.jsdelivr.net" crossorigin />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Noto+Serif+KR:wght@500;600;700&display=swap" />
  <link rel="stylesheet" href="/assets/styles.css" />

  ${jsonld(orgLd)}
  ${extra}
</head>
<body>
  ${renderHeader(o.path)}
  <main id="main">
    ${o.body}
  </main>
  ${renderFooter()}
  <script src="/assets/main.js" defer></script>
</body>
</html>`;
}

// 코스별 기본 요금표 (전 페이지 공용 컴포넌트)
export const PRICING = [
  { name: "60분 코스", price: "90,000", dur: "60분", desc: "기본 컨디션·릴랙스 케어" },
  { name: "90분 코스", price: "150,000", dur: "90분", desc: "아로마 포함 추천 구성", featured: true },
  { name: "120분 코스", price: "180,000", dur: "120분", desc: "전신 집중 프리미엄 케어" },
];

export function pricingTable() {
  const cards = PRICING.map(
    (c) => `
      <div class="price-card${c.featured ? " featured" : ""}">
        ${c.featured ? '<span class="badge">추천</span>' : ""}
        <h3>${esc(c.name)}</h3>
        <div class="price"><strong>${esc(c.price)}</strong><span>원</span></div>
        <p class="dur">${esc(c.dur)}</p>
        <p class="desc">${esc(c.desc)}</p>
        <a class="btn ${c.featured ? "btn-gold" : "btn-outline"}" href="${site.phoneHref}">예약 문의</a>
      </div>`
  ).join("");
  return `
  <section class="pricing" aria-label="코스별 기본 요금">
    <div class="container">
      <div class="pricing-head">
        <h2>코스별 기본 요금</h2>
        <p>60·90·120분 코스별 기본 요금입니다. 숨겨진 추가 비용 없이 투명하게 안내합니다.</p>
      </div>
      <div class="pricing-grid">${cards}</div>
      <p class="pricing-note">지역·예약 시간대·이동 거리에 따라 상담 시 최종 확인됩니다. <a href="/guide/">상세 요금 안내 보기 →</a></p>
    </div>
  </section>`;
}

// 고객 후기 (전 페이지 공용 컴포넌트)
export const REVIEWS = [
  { name: "김○○", meta: "서울 강남 · 스웨디시", rating: 5, text: "예약하고 35분 만에 도착했어요. 스웨디시로 뭉친 어깨가 한결 가벼워졌습니다." },
  { name: "이○○", meta: "경기 수원 · 홈타이", rating: 5, text: "집에서 편하게 받을 수 있어 좋았어요. 관리사님이 친절하고 시간도 정확했습니다." },
  { name: "박○○", meta: "부산 해운대 · 아로마", rating: 4, text: "출장 아로마 받았는데 향도 좋고 분위기가 차분해서 만족스러웠습니다." },
  { name: "정○○", meta: "인천 · 24시간", rating: 5, text: "늦은 시간에도 빠르게 안내받았어요. 가격도 처음 안내와 같아 신뢰가 갔습니다." },
  { name: "최○○", meta: "대구 · 타이마사지", rating: 5, text: "스트레칭 위주로 시원하게 받았네요. 다음에 또 이용할 생각입니다." },
  { name: "한○○", meta: "서울 마포 · 홈타이", rating: 4, text: "홈타이 처음인데 준비물 안내가 자세해서 편하게 받았습니다." },
];

export function reviewsSection() {
  const cards = REVIEWS.map(
    (r) => `
      <div class="review-card">
        <div class="stars" aria-label="별점 ${r.rating}점">${"★".repeat(r.rating)}<span class="off">${"★".repeat(5 - r.rating)}</span></div>
        <p class="review-text">“${esc(r.text)}”</p>
        <p class="review-meta"><strong>${esc(r.name)}</strong> · ${esc(r.meta)}</p>
      </div>`
  ).join("");
  return `
  <section class="reviews" aria-label="고객 후기">
    <div class="container">
      <div class="reviews-head">
        <span class="eyebrow">고객 후기</span>
        <h2>실제 이용 고객의 후기</h2>
        <div class="rating-badge">
          <span class="g">G</span>
          <span class="score">4.8</span>
          <span class="stars">★★★★★</span>
          <span class="count">/ 5.0 · 후기 1,300+</span>
        </div>
      </div>
      <div class="grid grid-3">${cards}</div>
      <p class="reviews-note">후기는 이용 고객이 남긴 내용을 바탕으로 정리한 예시이며, 실제 경험과 만족도는 개인·업체에 따라 다를 수 있습니다.</p>
    </div>
  </section>`;
}

// 요금 구조화 데이터 (OfferCatalog)
export const pricingLd = () => ({
  "@context": "https://schema.org",
  "@type": "Service",
  serviceType: "출장마사지·홈타이",
  provider: { "@type": "HealthAndBeautyBusiness", name: site.name, telephone: site.phone },
  areaServed: "KR",
  offers: PRICING.map((c) => ({
    "@type": "Offer",
    name: c.name,
    price: c.price.replace(/,/g, ""),
    priceCurrency: "KRW",
    description: c.desc,
  })),
});

// FAQPage JSON-LD 헬퍼
export const faqLd = (faqs) => ({
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map((f) => ({
    "@type": "Question",
    name: f.q,
    acceptedAnswer: { "@type": "Answer", text: f.a },
  })),
});

// Article JSON-LD 헬퍼 (E-E-A-T: author/reviewer/dateModified)
export const articleLd = (o) => ({
  "@context": "https://schema.org",
  "@type": "Article",
  headline: o.headline,
  description: o.description,
  image: abs(o.image || "/assets/og-default.svg"),
  datePublished: o.published || "2026-01-10",
  dateModified: o.modified || "2026-06-21",
  author: {
    "@type": "Organization",
    name: site.author.name,
    url: site.baseUrl + "/about/",
  },
  publisher: {
    "@type": "Organization",
    name: site.name,
    url: site.baseUrl,
  },
  mainEntityOfPage: abs(o.path),
});
