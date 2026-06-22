(function () {
  const SEOUL_CENTER = { lat: 37.5665, lng: 126.9780 };
  const pools = window.SWIM_POOLS || [];
  const state = {
    filter: "all",
    query: "",
    map: null,
    overlays: [],
    activeOverlay: null,
    infoOverlay: null,
    renderedPools: pools
  };

  const els = {
    map: document.getElementById("map"),
    fallbackMap: document.getElementById("fallbackMap"),
    setupNotice: document.getElementById("setupNotice"),
    searchInput: document.getElementById("searchInput"),
    chips: Array.from(document.querySelectorAll(".chip")),
    poolList: document.getElementById("poolList"),
    countBadge: document.getElementById("countBadge"),
    template: document.getElementById("poolCardTemplate"),
    locateButton: document.getElementById("locateButton")
  };

  function matchesFilter(pool) {
    if (state.filter === "all") return true;
    return pool.tags.includes(state.filter);
  }

  function matchesQuery(pool) {
    if (!state.query) return true;
    const haystack = [
      pool.name,
      pool.district,
      pool.address,
      pool.hours,
      pool.price,
      pool.note
    ].join(" ").toLowerCase();
    return haystack.includes(state.query);
  }

  function getVisiblePools() {
    return pools.filter((pool) => matchesFilter(pool) && matchesQuery(pool));
  }

  function renderList() {
    state.renderedPools = getVisiblePools();
    els.poolList.replaceChildren();
    els.countBadge.textContent = `${state.renderedPools.length}곳`;

    state.renderedPools.forEach((pool) => {
      const node = els.template.content.firstElementChild.cloneNode(true);
      node.querySelector("h3").textContent = pool.name;
      node.querySelector(".pool-meta").textContent = `${pool.district} · ${pool.address}`;
      node.querySelector(".hours").textContent = pool.hours;
      node.querySelector(".price").textContent = pool.price;
      node.querySelector(".note").textContent = pool.note;
      node.querySelector(".pool-card-button").addEventListener("click", () => focusPool(pool.id));
      els.poolList.appendChild(node);
    });
  }

  function loadKakaoMap() {
    const key = (window.KAKAO_JAVASCRIPT_KEY || "").trim();
    if (!key) {
      els.setupNotice.classList.remove("hidden");
      els.fallbackMap.classList.remove("hidden");
      renderList();
      return;
    }

    const script = document.createElement("script");
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${encodeURIComponent(key)}&autoload=false`;
    script.async = true;
    script.onload = () => window.kakao.maps.load(initMap);
    script.onerror = () => {
      els.setupNotice.classList.remove("hidden");
      els.fallbackMap.classList.remove("hidden");
      renderList();
    };
    document.head.appendChild(script);
  }

  function initMap() {
    els.fallbackMap.classList.add("hidden");
    state.map = new window.kakao.maps.Map(els.map, {
      center: new window.kakao.maps.LatLng(SEOUL_CENTER.lat, SEOUL_CENTER.lng),
      level: 8
    });
    renderMarkers();
    renderList();
  }

  function clearMarkers() {
    state.overlays.forEach((item) => item.overlay.setMap(null));
    state.overlays = [];
    if (state.infoOverlay) state.infoOverlay.setMap(null);
    state.infoOverlay = null;
  }

  function renderMarkers() {
    if (!state.map) return;
    clearMarkers();
    const visiblePools = getVisiblePools();
    const bounds = new window.kakao.maps.LatLngBounds();

    visiblePools.forEach((pool) => {
      const position = new window.kakao.maps.LatLng(pool.lat, pool.lng);
      const markerEl = document.createElement("button");
      markerEl.type = "button";
      markerEl.className = "seal-marker";
      markerEl.textContent = "🦭";
      markerEl.setAttribute("aria-label", `${pool.name} 정보 보기`);

      const overlay = new window.kakao.maps.CustomOverlay({
        position,
        content: markerEl,
        yAnchor: 0,
        zIndex: 10
      });

      overlay.setMap(state.map);
      state.overlays.push({ id: pool.id, overlay, element: markerEl, pool });
      bounds.extend(position);

      markerEl.addEventListener("mouseenter", () => showInfo(pool));
      markerEl.addEventListener("focus", () => showInfo(pool));
      markerEl.addEventListener("click", () => focusPool(pool.id, false));
    });

    if (visiblePools.length > 1) {
      state.map.setBounds(bounds, 44, 44, 44, 44);
    }
  }

  function showInfo(pool) {
    if (!state.map) return;
    if (state.infoOverlay) state.infoOverlay.setMap(null);
    state.overlays.forEach((item) => item.element.classList.toggle("active", item.id === pool.id));

    const content = document.createElement("div");
    content.className = "info-window";
    content.innerHTML = `
      <h3>${escapeHtml(pool.name)}</h3>
      <p>${escapeHtml(pool.district)} · ${escapeHtml(pool.address)}</p>
      <p>${escapeHtml(pool.hours)}</p>
      <p class="price-line">${escapeHtml(pool.price)}</p>
      <p>${escapeHtml(pool.note)}</p>
    `;

    state.infoOverlay = new window.kakao.maps.CustomOverlay({
      position: new window.kakao.maps.LatLng(pool.lat, pool.lng),
      content,
      yAnchor: 0,
      zIndex: 30
    });
    state.infoOverlay.setMap(state.map);
  }

  function focusPool(poolId, moveMap = true) {
    const pool = pools.find((item) => item.id === poolId);
    if (!pool) return;

    if (state.map && moveMap) {
      state.map.panTo(new window.kakao.maps.LatLng(pool.lat, pool.lng));
    }
    showInfo(pool);

    const cardButtons = Array.from(document.querySelectorAll(".pool-card-button"));
    const index = state.renderedPools.findIndex((item) => item.id === poolId);
    if (index >= 0 && cardButtons[index]) {
      cardButtons[index].scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function applyFilters() {
    renderList();
    renderMarkers();
  }

  els.searchInput.addEventListener("input", (event) => {
    state.query = event.target.value.trim().toLowerCase();
    applyFilters();
  });

  els.chips.forEach((chip) => {
    chip.addEventListener("click", () => {
      state.filter = chip.dataset.filter;
      els.chips.forEach((item) => item.classList.toggle("active", item === chip));
      applyFilters();
    });
  });

  els.locateButton.addEventListener("click", () => {
    if (!state.map || !navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (position) => {
        state.map.panTo(new window.kakao.maps.LatLng(position.coords.latitude, position.coords.longitude));
        state.map.setLevel(5);
      },
      () => {
        state.map.panTo(new window.kakao.maps.LatLng(SEOUL_CENTER.lat, SEOUL_CENTER.lng));
      },
      { enableHighAccuracy: true, timeout: 6000 }
    );
  });

  renderList();
  loadKakaoMap();
})();
