(function () {
  const SEOUL_CENTER = { lat: 37.5665, lng: 126.978 };
  const pools = window.SWIM_POOLS || [];
  const state = {
    filter: "all",
    query: "",
    map: null,
    overlays: [],
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

  function showSetupNotice(title, detail) {
    const origin = window.location.origin;
    els.setupNotice.innerHTML =
      `<strong>${escapeHtml(title)}</strong>` +
      `<span>${escapeHtml(detail)}</span>` +
      `<span>Current origin: ${escapeHtml(origin)}</span>`;
    els.setupNotice.classList.remove("hidden");
    els.fallbackMap.classList.remove("hidden");
  }

  function matchesFilter(pool) {
    if (state.filter === "all") return true;
    return pool.tags.includes(state.filter);
  }

  function getTypeLabel(pool) {
    if (pool.tags.includes("hangang")) return "한강";
    if (pool.tags.includes("private")) return "민간";
    return "공공";
  }

  function matchesQuery(pool) {
    if (!state.query) return true;
    const haystack = [pool.name, pool.district, pool.address, pool.hours, pool.price, pool.note, pool.source]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return haystack.includes(state.query);
  }

  function getVisiblePools() {
    return pools.filter((pool) => matchesFilter(pool) && matchesQuery(pool));
  }

  function createCard(pool) {
    const node = els.template.content.firstElementChild.cloneNode(true);
    node.querySelector("h3").textContent = pool.name;
    node.querySelector(".pool-meta").textContent = `${getTypeLabel(pool)} · ${pool.address}`;
    node.querySelector(".hours").textContent = pool.hours;
    node.querySelector(".price").textContent = pool.price;
    node.querySelector(".note").textContent = pool.note;
    node.querySelector(".pool-card-button").addEventListener("click", () => focusPool(pool.id));
    return node;
  }

  function renderList() {
    state.renderedPools = getVisiblePools();
    els.poolList.replaceChildren();
    els.countBadge.textContent = `${state.renderedPools.length}곳`;

    const grouped = new Map();
    state.renderedPools.forEach((pool) => {
      if (!grouped.has(pool.district)) grouped.set(pool.district, []);
      grouped.get(pool.district).push(pool);
    });

    Array.from(grouped.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .forEach(([district, districtPools]) => {
        const group = document.createElement("section");
        group.className = "district-group";

        const header = document.createElement("div");
        header.className = "district-group-header";
        header.innerHTML = `<h3>${escapeHtml(district)}</h3><span>${districtPools.length}곳</span>`;
        group.appendChild(header);

        const grid = document.createElement("div");
        grid.className = "pool-list";
        districtPools.forEach((pool) => grid.appendChild(createCard(pool)));

        group.appendChild(grid);
        els.poolList.appendChild(group);
      });
  }

  function loadKakaoMap() {
    const key = (window.KAKAO_JAVASCRIPT_KEY || "").trim();

    if (!key) {
      showSetupNotice(
        "Kakao Maps key is missing",
        "Set window.KAKAO_JAVASCRIPT_KEY in config.js, then reload this page."
      );
      renderList();
      return;
    }

    const script = document.createElement("script");
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${encodeURIComponent(key)}&autoload=false`;
    script.async = true;

    const loadTimer = window.setTimeout(() => {
      if (!window.kakao || !window.kakao.maps) {
        showSetupNotice(
          "Kakao Maps script timed out",
          `The SDK URL did not finish initializing: ${script.src}`
        );
      }
    }, 8000);

    script.onload = () => {
      window.clearTimeout(loadTimer);
      if (!window.kakao || !window.kakao.maps) {
        showSetupNotice(
          "Kakao Maps loaded but did not initialize",
          `The SDK response arrived, but window.kakao.maps is still unavailable. URL: ${script.src}`
        );
        renderList();
        return;
      }

      window.kakao.maps.load(initMap);
    };

    script.onerror = () => {
      window.clearTimeout(loadTimer);
      showSetupNotice(
        "Kakao Maps script failed to load",
        `Check that this exact origin is registered in Kakao Developers: ${window.location.origin}. URL: ${script.src}`
      );
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

    if (state.infoOverlay) {
      state.infoOverlay.setMap(null);
      state.infoOverlay = null;
    }
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
      markerEl.textContent = "*";
      markerEl.setAttribute("aria-label", `Show location for ${pool.name}`);

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
    } else if (visiblePools.length === 1) {
      state.map.panTo(new window.kakao.maps.LatLng(visiblePools[0].lat, visiblePools[0].lng));
    }
  }

  function showInfo(pool) {
    if (!state.map) return;

    if (state.infoOverlay) {
      state.infoOverlay.setMap(null);
    }

    state.overlays.forEach((item) => {
      item.element.classList.toggle("active", item.id === pool.id);
    });

    const content = document.createElement("div");
    content.className = "info-window";
    content.innerHTML = `
      <h3>${escapeHtml(pool.name)}</h3>
      <p>${escapeHtml(getTypeLabel(pool))} · ${escapeHtml(pool.district)} - ${escapeHtml(pool.address)}</p>
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
