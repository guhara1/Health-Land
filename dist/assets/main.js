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
})();
