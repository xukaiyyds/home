/**
 * 音乐播放器
 */
// 获取音乐播放列表（api-enhanced 风格）
export const getPlayerList = async (server, type, id) => {
  const base = import.meta.env.VITE_SONG_API;

  if (server !== "netease" || type !== "playlist") {
    throw new Error(`不支持的 server/type: ${server}/${type}`);
  }

  // 1. 拿歌单全部歌曲
  const trackRes = await fetch(`${base}/playlist/track/all?id=${id}`);
  const trackData = await trackRes.json();
  if (trackData.code !== 200) throw new Error(trackData.msg || "歌单加载失败");

  const songs = trackData.songs || [];
  if (!songs.length) throw new Error("歌单为空");

  // 2. 分批拿播放 URL（每批 50 首，并行请求）
  const chunkSize = 50;
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

  // 3. 组装（强制 https，避免混合内容拦截）
  return songs
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
