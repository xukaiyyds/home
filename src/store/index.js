import { defineStore } from "pinia";
import searchEngineList from "@/assets/searchEngineList.json";
import defaultShortCut from "@/assets/defaultShortCut.json";
import defaultSiteLinks from "@/assets/siteLinks.json";

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
      searchEngine: "Baidu", // 搜索引擎
      clearContent: true, // 清空输入框
      messageShow: true, // 操作消息显示
      musicClick: false, // 音乐链接是否跳转
      musicIsOk: false, // 音乐是否加载完成
      musicVolume: 0, // 音乐音量
      musicOpenState: false, // 音乐面板开启状态
      backgroundShow: false, // 壁纸展示状态
      boxOpenState: false, // 盒子开启状态
      mobileOpenState: false, // 移动端开启状态
      mobileFuncState: false, // 移动端功能区开启状态
      setOpenState: false, // 设置页面开启状态
      searchOpenState: false, // 搜索页面开启状态
      playerState: false, // 当前播放状态
      playerTitle: null, // 当前播放歌曲名
      playerArtist: null, // 当前播放歌手名
      playerLrc: "歌词加载中", // 当前播放歌词
      playerLrcShow: true, // 是否显示底栏歌词
      footerBlur: true, // 底栏模糊
      playerAutoplay: false, // 是否自动播放
      playerLoop: "all", // 循环播放 "all", "one", "none"
      playerOrder: "list", // 循环顺序 "list", "random"
      shortcutHome: false, // 是否在首页显示捷径
      shortcutData: defaultShortCut, // 捷径数据
      live2dShow: true, // 是否显示live2d模型
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
      if (searchEngineList.some((engine) => engine.key === engineKey)) {
        this.searchEngine = engineKey;
      }
    },
    // 更改捷径数据
    setShortcutData(value) {
      this.shortcutData = value;
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
      "shortcutHome",
      "shortcutData",
      "clearContent",
      "messageShow",
      "musicClick",
      "playerLrcShow",
      "footerBlur",
      "playerAutoplay",
      "playerLoop",
      "playerOrder",
      "live2dShow",
      "modelType",
      "modelPath",
    ],
  },
});
