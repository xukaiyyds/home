import { defineStore } from "pinia";

// 定义搜索引擎列表
export const searchEngineList = [
    { key: 'baidu', name: '百度', icon: '🔍', searchUrl: 'https://www.baidu.com/s?wd=' },
    { key: 'bing', name: 'Bing', icon: '💡', searchUrl: 'https://www.bing.com/search?q=' },
    { key: 'google', name: 'Google', icon: '🌐', searchUrl: 'https://www.google.com/search?q=' },
    { key: 'github', name: 'GitHub', icon: '🐙', searchUrl: 'https://github.com/search?q=' },
    { key: 'bilibili', name: 'B站', icon: '📺', searchUrl: 'https://search.bilibili.com/all?keyword=' },
];

export const mainStore = defineStore("main", {
  state: () => {
    return {
      imgLoadStatus: false, // 壁纸加载状态
      innerWidth: null, // 当前窗口宽度
      coverType: 0, // 壁纸种类
      bgUrl: "", // 壁纸URL
      backgroundCustom: "", // 壁纸自定义
      themeType: "dark", // 主题颜色
      backgroundBlur: 0, // 壁纸模糊
      savedBackgroundBlur: 0, // 已保存壁纸模糊
      showBackgroundGray: true, // 壁纸遮罩显示
      darkstarShow: false, // 星空特效显示
      snowflakeShow: false, // 雪花特效显示
      siteStartShow: false, // 建站日期显示
      searchEngine: "baidu", // 搜索引擎
      musicClick: false, // 音乐链接是否跳转
      musicIsOk: false, // 音乐是否加载完成
      musicVolume: 0, // 音乐音量
      musicOpenState: false, // 音乐面板开启状态
      backgroundShow: false, // 壁纸展示状态
      boxOpenState: false, // 盒子开启状态
      mobileOpenState: false, // 移动端开启状态
      mobileFuncState: false, // 移动端功能区开启状态
      setOpenState: false, // 设置页面开启状态
      playerState: false, // 当前播放状态
      playerTitle: null, // 当前播放歌曲名
      playerArtist: null, // 当前播放歌手名
      playerLrc: "歌词加载中", // 当前播放歌词
      playerLrcShow: true, // 是否显示底栏歌词
      footerBlur: true, // 底栏模糊
      playerAutoplay: false, // 是否自动播放
      playerLoop: "all", // 循环播放 "all", "one", "none"
      playerOrder: "list", // 循环顺序 "list", "random"
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
      };
    },
    // 获取页面宽度
    getInnerWidth(state) {
      return state.innerWidth;
    },
    // 获取当前搜索引擎
    getCurrentEngine: (state) => {
      return searchEngineList.find(engine => engine.key === state.searchEngine) || searchEngineList[0];
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
    // 更改歌曲数据
    setPlayerData(title, artist) {
      this.playerTitle = title;
      this.playerArtist = artist;
    },
    // 更改壁纸加载状态
    setImgLoadStatus(value) {
      this.imgLoadStatus = value;
    },
    // 更改搜索引擎
    setSearchEngine(engineKey) {
      if (searchEngineList.some(engine => engine.key === engineKey)) {
        this.searchEngine = engineKey;
      }
    },
  },
  persist: {
    key: "data",
    storage: window.localStorage,
    paths: [
      "coverType",
      "bgUrl",
      "backgroundCustom",
      "musicVolume",
      "themeType",
      "backgroundBlur",
      "savedBackgroundBlur",
      "showBackgroundGray",
      "darkstarShow",
      "snowflakeShow",
      "siteStartShow",
      "searchEngine",
      "musicClick",
      "playerLrcShow",
      "footerBlur",
      "playerAutoplay",
      "playerLoop",
      "playerOrder",
    ],
  },
});
