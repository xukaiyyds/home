import { defineStore } from "pinia";
import searchEngineList from "@/assets/searchEngineList.json";
import defaultShortCut from "@/assets/defaultShortCut.json";
import defaultSiteLinks from "@/assets/siteLinks.json";

/* ==================== 模块级常量 ==================== */

// 展平后的搜索引擎列表（避免 getter 每次调用都 flatMap）
const ALL_ENGINES = searchEngineList.flatMap((group) => group.options);

/* ==================== Store ==================== */

export const mainStore = defineStore("main", {
  state: () => ({
    // ---- 窗口与主题 ----
    innerWidth: 0, // 当前窗口宽度
    themeType: null, // 主题颜色（null 表示用户未设置，首次启动跟随系统）

    // ---- 壁纸 ----
    imgLoadStatus: false, // 壁纸加载状态
    coverType: 0, // 壁纸种类
    backgroundCustom: "", // 自定义壁纸
    bgUrl: "", // 壁纸 URL
    backgroundBlur: 0, // 壁纸模糊
    savedBackgroundBlur: 0, // 已保存壁纸模糊
    showBackgroundGray: true, // 显示壁纸遮罩
    backgroundShow: false, // 壁纸预览状态

    // ---- 粒子特效 ----
    showParticle: false, // 显示粒子特效
    currentParticle: "", // 当前粒子类型
    darkstar: false, // 星空特效
    firefly: false, // 萤火虫特效
    snowflake: false, // 雪花特效
    bubble: false, // 气泡特效

    // ---- 页面浮层状态 ----
    boxOpenState: false, // 盒子开启状态
    mobileOpenState: false, // 移动端菜单开启状态
    mobileFuncState: false, // 移动端功能区开启状态
    setOpenState: false, // 设置页面开启状态
    searchOpenState: false, // 搜索页面开启状态

    // ---- 搜索引擎 ----
    searchEngine: "Baidu", // 当前搜索引擎
    focusSearch: true, // 打开搜索页自动聚焦
    clearContent: true, // 搜索后清空输入框
    customEngineUrl: "", // 自定义搜索引擎 URL
    customEngineName: "", // 自定义搜索引擎名称

    // ---- 捷径与站点链接 ----
    shortcutData: defaultShortCut, // 捷径数据
    shortcutHome: false, // 首页显示捷径列表
    musicClick: false, // 点击网抑音乐打开音乐列表

    // ---- 音乐播放器 ----
    musicOpenState: false, // 音乐面板开启状态
    musicListShow: false, // 音乐列表是否打开
    musicIsOk: false, // 音乐是否加载完成
    musicVolume: 0.7, // 音乐音量
    lastMusicVolume: 0.7, // 静音前备份
    playerState: false, // 当前是否正在播放
    playerAutoplay: false, // 是否自动播放
    playerLoop: "all", // 循环模式 "all" | "one" | "none"
    playerOrder: "list", // 播放顺序 "list" | "random"
    playerSwitchId: 0, // 切换歌单
    playerTypeId: "", // 歌单 ID
    playCustomSong: "", // 自定义歌单 ID
    playerTitle: null, // 当前播放歌曲名
    playerArtist: null, // 当前播放歌手名
    playerLrc: "歌词加载中", // 当前播放歌词
    playerYrcEnabled: false, // 逐字歌词开关
    playerYrcLines: [], // 逐字歌词原始数据 [{ start, duration, words }]
    playerYrcCurrent: null, // 当前正在显示的字 [{ text, isSung, isCurrent }]
    playerCover: null, // 当前播放歌曲封面
    useFloatingPlayer: false, // 启用悬浮播放器
    floatingMusicOpenState: false, // 悬浮播放器面板开启状态
    audioCurrent: 0, // 悬浮面板用：当前秒数
    audioDuration: 0, // 悬浮面板用：总秒数
    playerCurrentTime: 0, // 底栏进度条用：当前秒数
    playerDuration: 0, // 底栏进度条用：总秒数
    audioRef: null, // 音频元素引用

    // ---- 底栏 ----
    footerBlur: true, // 底栏模糊
    playerLrcShow: true, // 显示底栏歌词
    playerTrLrc: false, // 显示歌词翻译
    playerTransLines: [], // 翻译行 [{ ms, text }]，逐字模式用
    footerProgressBar: true, // 显示底栏进度条
    forceShowIcon: false, // 进度图标常驻

    // ---- 时间与提示 ----
    use12HourFormat: false, // 使用 12 小时制
    showLunar: true, // 天气失败时显示农历
    messageShow: true, // 操作消息显示
    siteStartShow: true, // 建站日期显示

    // ---- 个性化 ----
    webSpeech: true, // 语音播报
    live2dShow: false, // 显示 live2d 模型
    modelType: "Mao", // live2d 模型种类
    modelPath: "", // live2d 模型路径
  }),

  getters: {
    // 获取歌词
    getPlayerLrc: (state) => state.playerLrc,

    // 获取歌曲信息
    getPlayerData: (state) => ({
      name: state.playerTitle,
      artist: state.playerArtist,
      cover: state.playerCover,
    }),

    // 获取页面宽度
    getInnerWidth: (state) => state.innerWidth,

    // 获取当前搜索引擎（使用模块级 ALL_ENGINES，避免重复 flatMap）
    getCurrentEngine: (state) =>
      ALL_ENGINES.find((engine) => engine.key === state.searchEngine) || ALL_ENGINES[0],

    // 获取网站链接（捷径模式返回自定义数据，否则返回默认站点列表）
    siteLinks: (state) => (state.shortcutHome ? state.shortcutData : defaultSiteLinks),
  },

  actions: {
    /* ---------- 窗口与主题 ---------- */

    setInnerWidth(value) {
      this.innerWidth = value;
      if (value >= 720) {
        this.mobileOpenState = false;
        this.mobileFuncState = false;
      }
    },

    /* ---------- 壁纸 ---------- */

    setImgLoadStatus(value) {
      this.imgLoadStatus = value;
    },

    /* ---------- 播放器状态 ---------- */

    // 修改：参数改为"是否暂停"，内部取反得到播放状态
    // 调用方传入 audio.paused 即可
    setPlayerState(paused) {
      this.playerState = !paused;
    },

    setPlayerLrc(value) {
      this.playerLrc = value;
    },

    setPlayerData(title, artist, cover) {
      this.playerTitle = title;
      this.playerArtist = artist;
      this.playerCover = cover;
    },

    /* ---------- 搜索引擎 ---------- */

    // 修复：原实现用 searchEngineList.some(...) 遍历的是分组，分组没有 key 属性，
    // 导致任何引擎都校验不通过。改为使用展平后的 ALL_ENGINES。
    setSearchEngine(engineKey) {
      if (ALL_ENGINES.some((engine) => engine.key === engineKey)) {
        this.searchEngine = engineKey;
      }
    },

    setCustomEngine(url, name = "自定义") {
      this.customEngineUrl = url;
      this.customEngineName = name;
      this.searchEngine = "custom";
    },

    /* ---------- 捷径 ---------- */

    setShortcutData(value) {
      this.shortcutData = value;
    },

    /* ---------- 数据恢复 ---------- */

    recoverSiteData(data) {
      try {
        for (const key in data) {
          if (Object.prototype.hasOwnProperty.call(data, key)) {
            this[key] = data[key];
          }
        }
        return true;
      } catch (error) {
        console.error("站点数据恢复时处理失败：", error);
        return false;
      }
    },
  },

  persist: {
    key: "data",
    storage: window.localStorage,
    paths: [
      /* 主题与壁纸 */
      "themeType",
      "coverType",
      "backgroundCustom",
      "bgUrl",
      "backgroundBlur",
      "savedBackgroundBlur",
      "showBackgroundGray",

      /* 粒子特效 */
      "showParticle",
      "currentParticle",
      "darkstar",
      "firefly",
      "snowflake",
      "bubble",

      /* 搜索引擎 */
      "searchEngine",
      "focusSearch",
      "clearContent",
      "customEngineUrl",
      "customEngineName",

      /* 捷径与站点 */
      "shortcutData",
      "shortcutHome",
      "musicClick",

      /* 音乐播放器 */
      "musicVolume",
      "playerAutoplay",
      "playerLoop",
      "playerOrder",
      "playerSwitchId",
      "playerTypeId",
      "playCustomSong",
      "useFloatingPlayer",

      /* 底栏 */
      "footerBlur",
      "playerLrcShow",
      "playerTrLrc",
      "playerYrcEnabled",
      "footerProgressBar",
      "forceShowIcon",

      /* 时间与提示 */
      "use12HourFormat",
      "showLunar",
      "messageShow",
      "siteStartShow",

      /* 个性化 */
      "webSpeech",
      "live2dShow",
      "modelType",
      "modelPath",
    ],
  },
});
