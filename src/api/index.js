/**
 * 音乐播放器
 */

// 缓存机制
const memCache = new Map();
const pendingMap = new Map(); // 防止同一歌单同时发起多次请求

// 缓存有效期：12 小时（毫秒）
const CACHE_TTL = 12 * 60 * 60 * 1000;

const readCache = (key) => {
  // 1. 内存缓存优先
  const mem = memCache.get(key);
  if (mem) return mem;
  // 2. 读 localStorage
  try {
    const raw = localStorage.getItem(`player_cache:${key}`);
    if (!raw) return null;
    const obj = JSON.parse(raw);
    if (!obj?.ts || !obj?.data) return null;
    if (Date.now() - obj.ts > CACHE_TTL) return null;
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

// 获取音乐播放列表
export const getPlayerList = async (server, type, id) => {
  const base = import.meta.env.VITE_SONG_API;
  const cacheKey = `${server}:${type}:${id}`;

  if (server !== "netease" || type !== "playlist") {
    throw new Error(`不支持的 server/type: ${server}/${type}`);
  }

  // 1. 查缓存
  const cached = readCache(cacheKey);
  if (cached) {
    console.log(`[播放器] 命中缓存: ${cacheKey}`);
    return cached;
  }

  // 2. 检查是否已有相同请求在进行
  if (pendingMap.has(cacheKey)) {
    return pendingMap.get(cacheKey);
  }

  // 3. 发起请求
  const request = (async () => {
    const trackRes = await fetch(`${base}/playlist/track/all?id=${id}`);
    const trackData = await trackRes.json();
    if (trackData.code !== 200) throw new Error(trackData.msg || "歌单加载失败");

    const songs = trackData.songs || [];
    if (!songs.length) throw new Error("歌单为空");

    const chunkSize = 100;
    const urlMap = {};
    const chunks = [];
    for (let i = 0; i < songs.length; i += chunkSize) {
      chunks.push(songs.slice(i, i + chunkSize));
    }

    const results = await Promise.all(
      chunks.map((chunk) => {
        const ids = chunk.map((s) => s.id).join(",");
        return fetch(`${base}/song/url/v1?id=${ids}&level=exhigh`)
          .then((r) => r.json())
          .catch((e) => {
            console.warn("[播放器] URL 批量请求失败", e);
            return { data: [] };
          });
      }),
    );

    results.forEach((data) => {
      (data.data || []).forEach((item) => {
        if (item.url) urlMap[item.id] = item.url;
      });
    });

    const result = songs
      .map((song) => {
        const rawUrl = urlMap[song.id] || "";
        return {
          id: song.id,
          name: song.name,
          artist: (song.ar || []).map((a) => a.name).join(" / "),
          album: song.al?.name || import.meta.env.VITE_SITE_NAME,
          cover: song.al?.picUrl || "",
          url: rawUrl.replace(/^http:\/\//, "https://"),
          lrc: "",
        };
      })
      .filter((s) => s.url);

    // 4. 写入缓存
    if (result.length) {
      writeCache(cacheKey, result);
    }
    return result;
  })();

  pendingMap.set(cacheKey, request);
  try {
    return await request;
  } finally {
    pendingMap.delete(cacheKey);
  }
};

/**
 * 一言
 */

// 获取一言数据
export const getHitokoto = async (useFloatingPlayer = false) => {
  const url = useFloatingPlayer ? "https://v1.hitokoto.cn" : "https://v1.hitokoto.cn/?c=j";
  const res = await fetch(url);
  return await res.json();
};

/**
 * 天气
 */

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
