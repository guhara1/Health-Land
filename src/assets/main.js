// 헬스랜드 - 내비게이션 (PC 메가메뉴 hover / 모바일 아코디언)
(function () {
  "use strict";
  var toggle = document.querySelector(".nav-toggle");
  var nav = document.getElementById("primary-nav");
  var backdrop = document.querySelector(".nav-backdrop");

  function isMobile() {
    return window.matchMedia("(max-width: 1100px)").matches;
  }

  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("open");
      toggle.setAttribute("aria-expanded", String(open));
      if (backdrop) backdrop.classList.toggle("show", open);
      document.body.style.overflow = open ? "hidden" : "";
    });
  }

  if (backdrop) {
    backdrop.addEventListener("click", function () {
      nav.classList.remove("open");
      backdrop.classList.remove("show");
      if (toggle) toggle.setAttribute("aria-expanded", "false");
      document.body.style.overflow = "";
    });
  }

  // 모바일에서 메가메뉴(마사지 프로그램 / 지역별 찾기) 아코디언 토글
  var megaParents = document.querySelectorAll(".has-mega");
  megaParents.forEach(function (parent) {
    var link = parent.querySelector(":scope > a");
    if (!link) return;
    link.addEventListener("click", function (e) {
      if (isMobile()) {
        e.preventDefault();
        var open = parent.classList.toggle("open");
        link.setAttribute("aria-expanded", String(open));
      }
    });
  });

  // 리사이즈 시 모바일 메뉴 상태 정리
  window.addEventListener("resize", function () {
    if (!isMobile()) {
      nav && nav.classList.remove("open");
      backdrop && backdrop.classList.remove("show");
      document.body.style.overflow = "";
    }
  });

  // 스크롤 등장 마이크로 인터랙션 (장식 요소에만 적용 — 본문 텍스트는 항상 표시)
  try {
    var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var targets = document.querySelectorAll(
      ".section-head, .card, .price-card, .author-box, .toc, .callout, .chip-row, .pricing-head"
    );
    if (!reduce && "IntersectionObserver" in window && targets.length) {
      targets.forEach(function (el) { el.classList.add("reveal"); });
      var io = new IntersectionObserver(function (entries, obs) {
        entries.forEach(function (e) {
          if (e.isIntersecting) { e.target.classList.add("is-visible"); obs.unobserve(e.target); }
        });
      }, { rootMargin: "0px 0px -8% 0px", threshold: 0.06 });
      targets.forEach(function (el) { io.observe(el); });
      // 안전장치: 혹시 누락되면 강제 표시
      window.addEventListener("load", function () {
        setTimeout(function () {
          targets.forEach(function (el) { el.classList.add("is-visible"); });
        }, 1400);
      });
    }
  } catch (e) { /* 실패해도 콘텐츠는 그대로 보임 */ }
})();
