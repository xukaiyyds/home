import { defineStore } from "pinia";
import searchEngineList from "@/assets/searchEngineList.json";
import defaultShortCut from "@/assets/defaultShortCut.json";
import defaultSiteLinks from "@/assets/siteLinks.json";

export const mainStore = defineStore("main", {
  state: () => {
    return {
      innerWidth: null, // 当前窗口宽度
      themeType: null, // 主题颜色
      imgLoadStatus: false, // 壁纸加载状态
      coverType: 0, // 壁纸种类
      backgroundCustom: "", // 自定义壁纸
      bgUrl: "", // 自定义壁纸URL
      backgroundBlur: 0, // 壁纸模糊
      savedBackgroundBlur: 0, // 已保存壁纸模糊
      showBackgroundGray: true, // 显示壁纸遮罩
      backgroundShow: false, // 壁纸预览状态
      showParticle: false, // 显示粒子特效
      currentParticle: "", // 默认特效跟随系统
      darkstar: false, // 星空特效
      firefly: false, // 萤火虫特效
      snowflake: false, // 雪花特效
      bubble: false, // 气泡特效
      boxOpenState: false, // 盒子开启状态
      mobileOpenState: false, // 移动端开启状态
      mobileFuncState: false, // 移动端功能区开启状态
      prioritizeFirst: true, // 搜索和设置页面层级
      openTimes: {}, // 记录搜索和设置页面打开的时间戳
      setOpenState: false, // 设置页面开启状态
      searchOpenState: false, // 搜索页面开启状态
      searchEngine: "Baidu", // 搜索引擎
      focusSearch: true, // 自动聚焦搜索引擎
      clearContent: true, // 清空搜索输入框内容
      customEngineUrl: "", // 自定义搜索引擎 URL
      customEngineName: "", // 自定义搜索引擎名称
      shortcutData: defaultShortCut, // 捷径数据
      musicOpenState: false, // 音乐播放器开启状态
      musicListShow: false, // 音乐列表是否打开
      musicIsOk: false, // 音乐是否加载完成
      musicVolume: 0.7, // 音乐音量
      playerState: false, // 当前播放状态
      lastMusicVolume: 0.7, // 静音前备份
      playerAutoplay: false, // 是否自动播放
      playerLoop: "all", // 循环播放 "all", "one", "none"
      playerOrder: "list", // 循环顺序 "list", "random"
      playerSwitchId: 0, // 切换歌单
      playerTypeId: "", // 歌单ID
      playCustomSong: "", // 自定义歌单
      playerTitle: null, // 当前播放歌曲名
      playerArtist: null, // 当前播放歌手名
      playerLrc: "歌词加载中", // 当前播放歌词
      playerCover: null, // 当前播放歌曲封面
      useFloatingPlayer: false, // 启用悬浮播放器
      floatingMusicOpenState: false, // 悬浮播放器面板开启状态
      footerBlur: true, // 底栏模糊
      playerLrcShow: true, // 显示底栏歌词
      audioCurrent: 0, // 悬浮播放器面板用：当前秒数
      audioDuration: 0, // 悬浮播放器面板用：总秒数
      footerProgressBar: false, // 显示底栏进度条
      forceShowIcon: false, // 进度图标常驻
      playerCurrentTime: 0, // 底栏进度条用：当前秒数
      playerDuration: 0, // 底栏进度条用：总秒数
      audioRef: null, // 存储音频元素
      playerCanplay: false, // 当音频还未准备好播放时，显示加载图标
      shortcutHome: false, // 在首页显示捷径
      musicClick: false, // 音乐链接是否跳转
      use12HourFormat: false, // 显示12小时制时间
      showLunar: true, // 显示农历
      messageShow: true, // 操作消息显示
      siteStartShow: true, // 建站日期显示
      webSpeech: false, // 语音播报
      live2dShow: false, // 显示live2d模型
      modelType: "Mao", // live2d模型种类
      modelPath: "", // live2d模型路径
    };
  },
  getters: {
    // 获取歌词
    getPlayerLrc(state) {
      return state.playerLrc;
    },
    // 获取歌曲信息
    getPlayerData(state) {
      return {
        name: state.playerTitle,
        artist: state.playerArtist,
        cover: state.playerCover,
      };
    },
    // 获取页面宽度
    getInnerWidth(state) {
      return state.innerWidth;
    },
    // 获取当前搜索引擎
    getCurrentEngine: (state) => {
      const allEngines = searchEngineList.flatMap((group) => group.options);
      return allEngines.find((engine) => engine.key === state.searchEngine) || allEngines[0];
    },
    // 获取网站链接
    siteLinks: (state) => {
      return state.shortcutHome ? state.shortcutData : defaultSiteLinks;
    },
  },
  actions: {
    // 更改当前页面宽度
    setInnerWidth(value) {
      this.innerWidth = value;
      if (value >= 720) {
        this.mobileOpenState = false;
        this.mobileFuncState = false;
      }
    },
    // 更改播放状态
    setPlayerState(value) {
      if (value) {
        this.playerState = false;
      } else {
        this.playerState = true;
      }
    },
    // 更改歌词
    setPlayerLrc(value) {
      this.playerLrc = value;
    },
    // 更改歌曲进度
    setPlayerCanplay(value) {
      this.playerCanplay = value;
    },
    // 更改歌曲数据
    setPlayerData(title, artist, cover) {
      this.playerTitle = title;
      this.playerArtist = artist;
      this.playerCover = cover;
    },
    // 更改壁纸加载状态
    setImgLoadStatus(value) {
      this.imgLoadStatus = value;
    },
    // 更改搜索引擎
    setSearchEngine(engineKey) {
      if (searchEngineList.some((engine) => engine.key === engineKey)) {
        this.searchEngine = engineKey;
      }
    },
    // 更改自定义搜索引擎
    setCustomEngine(url, name = "自定义") {
      this.customEngineUrl = url;
      this.customEngineName = name;
      this.searchEngine = "custom";
    },
    // 更改捷径数据
    setShortcutData(value) {
      this.shortcutData = value;
    },
    /* 更改页面层级 */
    registerPage(id) {
      if (!this.openTimes[id]) {
        this.openTimes[id] = Date.now();
      }
    },
    unregisterPage(id) {
      delete this.openTimes[id];
    },
    getZIndex(id) {
      const time = this.openTimes[id];
      if (time === undefined) return 0;
      if (!this.prioritizeFirst) {
        const fixedMap = { settings: 3, search: 2 };
        return fixedMap[id] || 0;
      }
      const entries = Object.entries(this.openTimes);
      const sorted = entries.slice().sort((a, b) => a[1] - b[1]);
      const index = sorted.findIndex(([key]) => key === id);
      return 1000 + index * 10 + 5;
    },
    togglePrioritizeFirst() {
      this.prioritizeFirst = !this.prioritizeFirst;
    },
    // 恢复数据
    recoverSiteData(data) {
      let isSuccess = false;
      try {
        for (const key in data) {
          if (Object.hasOwnProperty.call(data, key)) {
            const item = data[key];
            this[key] = item;
          }
        }
        isSuccess = true;
      } catch (error) {
        console.error("站点数据恢复时处理失败：", error);
        isSuccess = false;
      }
      return isSuccess;
    },
  },
  persist: {
    key: "data",
    storage: window.localStorage,
    paths: [
      "themeType",
      "coverType",
      "backgroundCustom",
      "bgUrl",
      "backgroundBlur",
      "savedBackgroundBlur",
      "showBackgroundGray",
      "showParticle",
      "currentParticle",
      "darkstar",
      "firefly",
      "snowflake",
      "bubble",
      "prioritizeFirst",
      "searchEngine",
      "focusSearch",
      "clearContent",
      "customEngineUrl",
      "customEngineName",
      "shortcutData",
      "musicVolume",
      "playerAutoplay",
      "playerLoop",
      "playerOrder",
      "playerSwitchId",
      "playerTypeId",
      "playCustomSong",
      "useFloatingPlayer",
      "footerBlur",
      "playerLrcShow",
      "footerProgressBar",
      "forceShowIcon",
      "shortcutHome",
      "musicClick",
      "use12HourFormat",
      "showLunar",
      "messageShow",
      "siteStartShow",
      "webSpeech",
      "live2dShow",
      "modelType",
      "modelPath",
    ],
  },
});
