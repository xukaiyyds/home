/**
 * 音乐播放器
 */

/* ==================== 缓存机制 ==================== */

const memCache = new Map();
const pendingMap = new Map(); // 防止同一歌单同时发起多次请求

// 元信息缓存有效期：3 天（歌名、歌手、ID 这些不变）
const META_CACHE_TTL = 3 * 24 * 60 * 60 * 1000;

const readCache = (key, ttl) => {
  // 1. 内存缓存优先
  const mem = memCache.get(key);
  if (mem) return mem;
  // 2. 读 localStorage
  try {
    const raw = localStorage.getItem(`player_cache:${key}`);
    if (!raw) return null;
    const obj = JSON.parse(raw);
    if (!obj?.ts || !obj?.data) return null;
    if (Date.now() - obj.ts > ttl) return null;
    memCache.set(key, obj.data);
    return obj.data;
  } catch {
    return null;
  }
};

const writeCache = (key, data) => {
  memCache.set(key, data);
  try {
    localStorage.setItem(`player_cache:${key}`, JSON.stringify({ ts: Date.now(), data }));
  } catch {
    // 存储满了或隐私模式，忽略
  }
};

/* ==================== 获取音乐播放列表 ==================== */

export const getPlayerList = async (server, type, id) => {
  const base = import.meta.env.VITE_SONG_API;
  const metaKey = `meta:${server}:${type}:${id}`;
  const reqKey = `${server}:${type}:${id}`; // 请求 key

  if (server !== "netease" || type !== "playlist") {
    throw new Error(`不支持的 server/type: ${server}/${type}`);
  }

  // 防并发：同一歌单正在请求中，复用
  if (pendingMap.has(reqKey)) {
    return pendingMap.get(reqKey);
  }

  const request = (async () => {
    // 1. 拿歌单元信息（可缓存）
    let songs = readCache(metaKey, META_CACHE_TTL);
    if (!songs) {
      const trackRes = await fetch(`${base}/playlist/track/all?id=${id}`);
      const trackData = await trackRes.json();
      if (trackData.code !== 200) throw new Error(trackData.msg || "歌单加载失败");
      songs = trackData.songs || [];
      if (!songs.length) throw new Error("歌单为空");
      writeCache(metaKey, songs);
    } else {
      // console.log(`[播放器] 命中元信息缓存: ${metaKey}`);
    }

    // 2. 每次都重新拿 URL（URL 有时效，必须新鲜）
    const urlMap = {};

    // 每批 30 首，URL 长度可控
    const chunkSize = 30;
    const chunks = [];
    for (let i = 0; i < songs.length; i += chunkSize) {
      chunks.push(songs.slice(i, i + chunkSize));
    }

    // 单批请求，失败时自动拆成两半重试
    const fetchChunk = async (chunk) => {
      if (!chunk.length) return;

      const ids = chunk.map((s) => s.id).join(",");
      try {
        const res = await fetch(`${base}/song/url/v1?id=${ids}&level=exhigh`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();

        // 检查返回数量是否合理
        const list = data.data || [];
        const successCount = list.filter((d) => d.url).length;

        // 返回数量明显不对（少于一半），抛错触发拆分
        if (chunk.length > 1 && successCount < chunk.length / 2) {
          throw new Error(`返回 ${successCount}/${chunk.length}，疑似限流`);
        }

        list.forEach((item) => {
          if (item.url) urlMap[item.id] = item.url;
        });
      } catch (e) {
        console.warn(`[播放器] 批次失败（${chunk.length} 首），尝试拆分`, e);
        if (chunk.length === 1) {
          console.warn(`[播放器] 单曲请求失败，跳过: ${chunk[0].name} (${chunk[0].id})`);
          return;
        }
        const mid = Math.ceil(chunk.length / 2);
        await fetchChunk(chunk.slice(0, mid));
        await fetchChunk(chunk.slice(mid));
      }
    };

    // 分批串行（避免并发过多触发限流）
    for (let i = 0; i < chunks.length; i++) {
      await fetchChunk(chunks[i]);
      // 最后一批不用等
      if (i < chunks.length - 1) {
        await new Promise((r) => setTimeout(r, 150));
      }
    }

    // 3. 组装
    return songs
      .map((song) => {
        const rawUrl = urlMap[song.id] || "";
        if (!rawUrl) return null;
        const url = rawUrl.replace(/^http:\/\//, "https://");
        if (!url.startsWith("https://")) return null;
        return {
          id: song.id,
          name: song.name,
          artist: (song.ar || []).map((a) => a.name).join(" / "),
          album: song.al?.name || import.meta.env.VITE_SITE_NAME,
          cover: song.al?.picUrl || "",
          url,
          lrc: "",
        };
      })
      .filter(Boolean);
  })();

  pendingMap.set(reqKey, request);
  try {
    return await request;
  } finally {
    pendingMap.delete(reqKey);
  }
};

/* ==================== 一言 ==================== */

export const getHitokoto = async (useFloatingPlayer = false) => {
  const url = useFloatingPlayer ? "https://v1.hitokoto.cn" : "https://v1.hitokoto.cn/?c=j";
  const res = await fetch(url);
  return await res.json();
};

/* ==================== 天气 ==================== */

// 使用代理地址
const PROXY_BASE_URL = "https://weather.xukaiyyds.cn/api/proxy";

// 获取城市信息
export const getXiaomiCityByGeo = async (longitude, latitude) => {
  const url = `${PROXY_BASE_URL}/location/city/geo?longitude=${longitude}&latitude=${latitude}&locale=zh_cn`;
  const response = await fetch(url);
  const data = await response.json();
  return data?.[0];
};

// 获取天气信息
export const getXiaomiWeather = async (latitude, longitude, locationKey) => {
  const url = `${PROXY_BASE_URL}/weather/all?latitude=${latitude}&longitude=${longitude}&locationKey=${encodeURIComponent(locationKey)}&days=15&appKey=weather20151024&sign=zUFJoAR2ZVrDy1vF3D07&isGlobal=false&locale=zh_cn`;
  const response = await fetch(url);
  return await response.json();
};
