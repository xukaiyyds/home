<template>
  <div class="setting">
    <el-collapse class="collapse" v-model="activeName" accordion>
      <el-collapse-item title="基础设置" name="1">
        <div class="item">
          <span class="text">使用十二小时制时间</span>
          <el-switch
            v-model="use12HourFormat"
            inline-prompt
            :active-icon="CheckSmall"
            :inactive-icon="CloseSmall"
          />
        </div>
        <div class="item">
          <span class="text">在首页显示捷径列表</span>
          <el-switch
            v-model="shortcutHome"
            inline-prompt
            :active-icon="CheckSmall"
            :inactive-icon="CloseSmall"
          />
        </div>
        <div class="item">
          <span class="text">点击网抑音乐打开音乐列表</span>
          <el-switch
            v-model="musicClick"
            inline-prompt
            :active-icon="CheckSmall"
            :inactive-icon="CloseSmall"
          />
        </div>
        <div class="item">
          <span class="text">搜索和设置页可以同时打开</span>
          <el-switch
            v-model="prioritizeFirst"
            inline-prompt
            :active-icon="CheckSmall"
            :inactive-icon="CloseSmall"
          />
        </div>
        <div class="item">
          <span class="text">打开搜索自动聚焦搜索引擎</span>
          <el-switch
            v-model="focusSearch"
            inline-prompt
            :active-icon="CheckSmall"
            :inactive-icon="CloseSmall"
          />
        </div>
        <div class="item">
          <span class="text">搜索后自动清空输入框内容</span>
          <el-switch
            v-model="clearContent"
            inline-prompt
            :active-icon="CheckSmall"
            :inactive-icon="CloseSmall"
          />
        </div>
        <div class="item">
          <span class="text">按下快捷键后弹出提示消息</span>
          <el-switch
            v-model="messageShow"
            inline-prompt
            :active-icon="CheckSmall"
            :inactive-icon="CloseSmall"
          />
        </div>
        <div class="item">
          <span class="text">当天气获取失败时显示农历</span>
          <el-switch
            v-model="showLunar"
            inline-prompt
            :active-icon="CheckSmall"
            :inactive-icon="CloseSmall"
          />
        </div>
        <div class="item">
          <span class="text">在时光胶囊下显示建站日期</span>
          <el-switch
            v-model="siteStartShow"
            inline-prompt
            :active-icon="CheckSmall"
            :inactive-icon="CloseSmall"
          />
        </div>
      </el-collapse-item>
      <el-collapse-item title="个性壁纸" name="2">
        <div class="bg-set">
          <el-radio-group v-model="coverType" text-color="#ffffff" @change="radioChange">
            <el-radio :value="0" size="large" border>默认壁纸</el-radio>
            <el-radio :value="1" size="large" border>每日一图</el-radio>
            <el-radio :value="2" size="large" border>淡雅风格</el-radio>
            <el-radio :value="3" size="large" border>星空风格</el-radio>
            <el-radio :value="4" size="large" border>随机风景</el-radio>
            <el-radio :value="5" size="large" border>随机动漫</el-radio>
          </el-radio-group>
          <el-button @click="dialogFormVisible = true" size="large">
            <template v-if="coverType === 6" #icon>
              <success theme="outline" fill="#efefef" />
            </template>
            {{ coverType === 6 ? "已开启自定义" : "自定义壁纸" }}
          </el-button>
        </div>
        <el-dialog
          v-model="dialogFormVisible"
          title="自定义壁纸"
          :modal="false"
          align-center
          fullscreen
        >
          <el-form @submit.prevent>
            <el-form-item label="图片链接">
              <el-input
                v-model="customCoverUrl"
                @keyup.enter="setCustomCover"
                class="bg-input"
                size="small"
                autocomplete="off"
                placeholder="例如：https://plog.xukaiyyds.cn/img/wallpaper/动漫/01.jpg"
                :clear-icon="CloseSmall"
                clearable
              />
            </el-form-item>
            <el-form-item label="壁纸网站">
              <a class="btn-links" href="https://www.bizhihui.com" target="_blank">
                <el-button type="primary" size="small" round>壁纸汇</el-button>
              </a>
              <a class="btn-links" href="https://desk.3gbizhi.com" target="_blank">
                <el-button type="primary" size="small" round>3G壁纸</el-button>
              </a>
              <a class="btn-links" href="https://unsplash.com/t/wallpapers" target="_blank">
                <el-button type="primary" size="small" round>Unsplash</el-button>
              </a>
              <a class="btn-links" href="https://www.wallpaperhub.app/wallpapers" target="_blank">
                <el-button type="primary" size="small" round>WallpaperHub</el-button>
              </a>
              <a class="btn-links" href="https://wallhaven.cc" target="_blank">
                <el-button type="primary" size="small" round>Wallhaven</el-button>
              </a>
            </el-form-item>
            <el-form-item label="图床工具">
              <a class="btn-links" href="https://www.superbed.cn" target="_blank">
                <el-button type="primary" size="small" round>聚合图床</el-button>
              </a>
              <a class="btn-links" href="https://imgchr.com" target="_blank">
                <el-button type="primary" size="small" round>路过图床</el-button>
              </a>
              <a class="btn-links" href="https://7bu.top" target="_blank">
                <el-button type="primary" size="small" round>去不图床</el-button>
              </a>
            </el-form-item>
            <el-form-item label="收藏壁纸">
              <a class="btn-links" href="https://plog.xukaiyyds.cn/wallpaper" target="_blank">
                <el-button type="primary" size="small" round>壁纸库</el-button>
              </a>
            </el-form-item>
            <el-form-item label="使用方法">
              <el-text type="info" size="small"
                >1. 在各大高清壁纸网站中选好心仪的壁纸，然后下载下来。</el-text
              >
              <el-text type="info" size="small"
                >2. 将下载好的壁纸上传到你的图床工具网站中。</el-text
              >
              <el-text type="info" size="small">3. 将上传好的图片链接复制到此处即可。</el-text>
              <el-text type="info" size="small"
                >4.
                或者直接从我收藏的壁纸库里挑选心仪的壁纸，然后右键选择新窗口打开图片，复制地址栏里的链接粘贴到这里。</el-text
              >
            </el-form-item>
            <el-form-item class="btn-right">
              <el-button type="info" @click="dialogFormVisible = false">返回</el-button>
              <el-button type="primary" @click="setCustomCover">确认</el-button>
            </el-form-item>
          </el-form>
        </el-dialog>
      </el-collapse-item>
      <el-collapse-item title="主题与背景" name="3">
        <div class="item">
          <span class="text">主题模式</span>
          <el-radio-group v-model="themeType" text-color="#FFFFFF">
            <el-radio value="light" border>浅色模式</el-radio>
            <el-radio value="dark" border>深色模式</el-radio>
          </el-radio-group>
        </div>
        <div class="item">
          <span class="text">背景模糊</span>
          <el-slider
            v-model="backgroundBlur"
            :min="0"
            :max="10"
            :step="5"
            show-stops
            :show-tooltip="false"
          />
        </div>
        <div class="item">
          <span class="text">背景遮罩</span>
          <el-switch
            v-model="showBackgroundGray"
            inline-prompt
            :active-icon="CheckSmall"
            :inactive-icon="CloseSmall"
          />
        </div>
        <div class="item">
          <span class="text">背景特效</span>
          <el-switch
            v-model="showParticle"
            inline-prompt
            :active-icon="CheckSmall"
            :inactive-icon="CloseSmall"
          />
        </div>
        <div class="item">
          <el-radio-group
            v-show="showParticle"
            v-model="particleType"
            size="small"
            text-color="#FFFFFF"
          >
            <el-radio value="snow" border>雪花</el-radio>
            <el-radio value="bubble" border>气泡</el-radio>
            <el-radio value="star" border>星空</el-radio>
            <el-radio value="firefly" border>萤火虫</el-radio>
          </el-radio-group>
        </div>
      </el-collapse-item>
      <el-collapse-item title="个性化调整" name="4">
        <div class="item">
          <span class="text">语音交互</span>
          <el-switch
            v-model="webSpeech"
            inline-prompt
            :active-icon="CheckSmall"
            :inactive-icon="CloseSmall"
          />
        </div>
        <div class="item">
          <span class="text">动画模型</span>
          <el-switch
            v-model="live2dShow"
            inline-prompt
            :active-icon="CheckSmall"
            :inactive-icon="CloseSmall"
          />
        </div>
        <div class="item">
          <el-radio-group v-show="live2dShow" v-model="modelType" size="small" text-color="#FFFFFF">
            <el-radio @change="refreshPrompt" value="Mao" border>Mao</el-radio>
            <el-radio @change="refreshPrompt" value="Hiyori" border>Hiyori</el-radio>
            <el-radio @change="refreshPrompt" value="Mark" border>Mark</el-radio>
            <el-radio @change="refreshPrompt" value="Wanko" border>Wanko</el-radio>
          </el-radio-group>
        </div>
        <div class="item">
          <span class="text">底栏歌词</span>
          <el-switch
            v-model="playerLrcShow"
            inline-prompt
            :active-icon="CheckSmall"
            :inactive-icon="CloseSmall"
          />
        </div>
        <div class="item" v-show="playerLrcShow">
          <span class="text">底栏进度条</span>
          <el-switch
            v-model="footerProgressBar"
            inline-prompt
            :active-icon="CheckSmall"
            :inactive-icon="CloseSmall"
          />
        </div>
        <div class="item" v-if="playerLrcShow" v-show="footerProgressBar">
          <span class="text">进度图标常驻</span>
          <el-switch
            v-model="forceShowIcon"
            inline-prompt
            :active-icon="CheckSmall"
            :inactive-icon="CloseSmall"
          />
        </div>
        <div class="item">
          <span class="text">底栏背景模糊</span>
          <el-switch
            v-model="footerBlur"
            inline-prompt
            :active-icon="CheckSmall"
            :inactive-icon="CloseSmall"
          />
        </div>
      </el-collapse-item>
      <el-collapse-item title="播放器配置" name="5">
        <div class="item">
          <span class="text">自动播放</span>
          <el-switch
            v-model="playerAutoplay"
            @change="refreshPrompt"
            inline-prompt
            :active-icon="CheckSmall"
            :inactive-icon="CloseSmall"
          />
        </div>
        <div class="item">
          <span class="text">随机播放</span>
          <el-switch
            v-model="playerOrder"
            inline-prompt
            :active-icon="CheckSmall"
            :inactive-icon="CloseSmall"
            active-value="random"
            inactive-value="list"
          />
        </div>
        <div class="item">
          <span class="text">循环模式</span>
          <el-radio-group v-model="playerLoop" size="small" text-color="#FFFFFF">
            <el-radio value="all" border>列表</el-radio>
            <el-radio value="one" border>单曲</el-radio>
            <el-radio value="none" border>不循环</el-radio>
          </el-radio-group>
        </div>
        <div class="item">
          <span class="text">切换歌单</span>
          <el-radio-group v-model="playerSwitchId" size="small" text-color="#FFFFFF">
            <el-radio :value="0" border>默认</el-radio>
            <el-radio :value="1" border>民谣</el-radio>
            <el-radio :value="2" border>欧美</el-radio>
            <el-radio :value="3" border>自定义</el-radio>
          </el-radio-group>
          <el-input
            v-model="playCustomSong"
            v-show="playerSwitchId === 3"
            @change="refreshPrompt"
            type="number"
            class="song-input"
            size="small"
            placeholder="复制网易云音乐歌单链接?id=后面的数字，例如：5059633707"
            :clear-icon="CloseSmall"
            clearable
          />
        </div>
      </el-collapse-item>
      <el-collapse-item title="备份与恢复" name="6">
        <div class="item">
          <span class="text">重置站点为默认状态</span>
          <el-button @click="resetSite" class="danger" size="small">重置</el-button>
        </div>
        <div class="item">
          <span class="text">将站点数据进行备份</span>
          <el-button @click="backupSite" class="success" size="small">备份</el-button>
        </div>
        <div class="item">
          <span class="text">将备份好的站点数据进行恢复</span>
          <input
            ref="recoverRef"
            type="file"
            style="display: none"
            accept=".json"
            @change="recoverSite"
          />
          <el-button @click="recoverRef?.click()" class="success" size="small">恢复</el-button>
        </div>
      </el-collapse-item>
    </el-collapse>
  </div>
</template>

<script setup>
import {
  CheckSmall,
  CloseSmall,
  SuccessPicture,
  Error,
  Correct,
  Success,
  Redo,
} from "@icon-park/vue-next";
import { mainStore } from "@/store";
import { storeToRefs } from "pinia";
import { SpeechLocal } from "@/utils/speech";
import identifyInput from "@/utils/identifyInput";

const store = mainStore();
const {
  coverType,
  themeType,
  backgroundBlur,
  showBackgroundGray,
  showParticle,
  darkstar,
  firefly,
  snowflake,
  bubble,
  siteStartShow,
  focusSearch,
  clearContent,
  showLunar,
  use12HourFormat,
  prioritizeFirst,
  messageShow,
  musicClick,
  playerLrcShow,
  footerBlur,
  footerProgressBar,
  forceShowIcon,
  playerAutoplay,
  playerOrder,
  playerLoop,
  playerSwitchId,
  playCustomSong,
  shortcutHome,
  live2dShow,
  webSpeech,
  modelType,
} = storeToRefs(store);

// 默认选中项
const activeName = ref("2");

// 壁纸切换
const radioChange = () => {
  ElMessage({
    message: "壁纸更换成功",
    icon: h(SuccessPicture, {
      fill: "#efefef",
    }),
  });
  if (store.webSpeech) {
    SpeechLocal("更换壁纸成功.mp3");
  }
};

// 自定义壁纸
const dialogFormVisible = ref(false);
const customCoverUrl = ref("");

const setCustomCover = () => {
  const url = customCoverUrl.value;

  if (identifyInput(url) !== "url") {
    ElMessage({
      message: "请输入正确的网址",
      icon: h(Error, {
        theme: "filled",
        fill: "#efefef",
      }),
    });
    if (store.webSpeech) {
      SpeechLocal("壁纸ID设置失败.mp3");
    }
    return;
  }

  coverType.value = 6;

  if (url !== store.backgroundCustom) {
    store.backgroundCustom = url;
    store.bgUrl = url;
    ElMessage({
      message: "自定义壁纸更换成功",
      icon: h(SuccessPicture, {
        fill: "#efefef",
      }),
    });
    if (store.webSpeech) {
      SpeechLocal("壁纸ID设置成功.mp3");
    }
  }

  dialogFormVisible.value = false;
};

// 粒子特效
const particleType = ref("star");

// 监听粒子类型变化
watch(particleType, (newVal) => {
  store.currentParticle = newVal;
  // 先将所有特效关闭
  darkstar.value = false;
  snowflake.value = false;
  firefly.value = false;
  bubble.value = false;

  // 再开启选中的特效
  if (newVal === "star") darkstar.value = true;
  else if (newVal === "snow") snowflake.value = true;
  else if (newVal === "firefly") firefly.value = true;
  else if (newVal === "bubble") bubble.value = true;
});

watch(darkstar, (val) => {
  if (val) particleType.value = "star";
});
watch(snowflake, (val) => {
  if (val) particleType.value = "snow";
});
watch(firefly, (val) => {
  if (val) particleType.value = "firefly";
});
watch(bubble, (val) => {
  if (val) particleType.value = "bubble";
});

// 站点重置
const resetSite = () => {
  if (store.webSpeech) {
    SpeechLocal("重置.mp3");
  }
  ElMessageBox.confirm(
    `重置后你所有的 <strong><el-text style="color:#409EFF">捷径数据</el-text></strong> 与 <strong><el-text style="color:#409EFF">站点配置</el-text></strong> 都将<el-text style="color:#E6A23C">丢失</el-text>！操作前请确保你已经<el-text style="color:#67C23A">做好了备份</el-text>`,
    "站点重置",
    {
      dangerouslyUseHTMLString: true,
      confirmButtonClass: "danger",
      cancelButtonClass: "cancel-deletion",
      confirmButtonText: "重置",
      cancelButtonText: "取消",
      type: "warning",
    },
  )
    .then(() => {
      if (store.webSpeech) {
        SpeechLocal("重置中.mp3");
      }
      setTimeout(() => {
        localStorage.clear();
        ElMessage({
          message: "重置成功，即将刷新",
          icon: h(Correct, {
            theme: "filled",
            fill: "#efefef",
          }),
        });
      }, 2500);
      const loading = ElLoading.service({
        lock: true,
        text: "Loading",
        background: "rgba(0, 0, 0, 0.7)",
      });
      setTimeout(() => {
        loading.close();
        window.location.reload();
      }, 4000);
    })
    .catch(() => {});
};

// 站点备份
const backupSite = () => {
  try {
    const date = new Date();
    const dateString = date.toISOString().replace(/[:.]/g, "-");
    const fileName = `Site_Backup_${dateString}.json`;
    const jsonData = JSON.stringify(store.$state);
    const blob = new Blob([jsonData], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    // 备份完成
    ElMessage({
      message: "站点数据备份成功",
      icon: h(Correct, {
        theme: "filled",
        fill: "#efefef",
      }),
    });
  } catch (error) {
    ElMessage({
      message: "站点数据备份失败",
      icon: h(Error, {
        theme: "filled",
        fill: "#efefef",
      }),
    });
    console.error("站点数据备份失败：", error);
  }
};

// 站点恢复
const recoverRef = ref(null);
const recoverSite = async (event) => {
  try {
    const fileInput = event.target;
    if (!fileInput?.files.length) {
      ElMessage({
        message: "请选择要恢复的备份文件",
        icon: h(Error, {
          theme: "filled",
          fill: "#efefef",
        }),
      });
      return false;
    }
    const file = fileInput.files[0];
    const jsonData = await file.text();
    const data = JSON.parse(jsonData);
    // 恢复数据
    ElMessageBox.confirm(
      `确认使用该恢复文件？你现有的 <strong><el-text style="color:#409EFF">捷径数据</el-text></strong> 以及 <strong><el-text style="color:#409EFF">站点配置</el-text></strong> 都将被<el-text style="color:#E6A23C">覆盖</el-text>！`,
      "站点恢复",
      {
        dangerouslyUseHTMLString: true,
        confirmButtonClass: "success",
        cancelButtonClass: "cancel-deletion",
        confirmButtonText: "恢复",
        cancelButtonText: "取消",
        type: "warning",
      },
    )
      .then(() => {
        const isSuccess = store.recoverSiteData(data);
        if (isSuccess) {
          if (store.webSpeech) {
            SpeechLocal("恢复中.mp3");
          }
          setTimeout(() => {
            ElMessage({
              message: "恢复成功，即将刷新",
              icon: h(Correct, {
                theme: "filled",
                fill: "#efefef",
              }),
            });
          }, 2500);
          const loading = ElLoading.service({
            lock: true,
            text: "Loading",
            background: "rgba(0, 0, 0, 0.7)",
          });
          setTimeout(() => {
            loading.close();
            window.location.reload();
          }, 4000);
        } else {
          ElMessage({
            message: "站点数据恢复失败，请重试",
            icon: h(Error, {
              theme: "filled",
              fill: "#efefef",
            }),
          });
        }
      })
      .catch(() => {
        recoverRef.value.value = null;
      });
  } catch (error) {
    ElMessage({
      message: "站点数据恢复失败，请重试",
      icon: h(Error, {
        theme: "filled",
        fill: "#efefef",
      }),
    });
    console.error("站点数据恢复失败：", error);
  }
};

// 刷新提示
const refreshPrompt = () => {
  ElMessage({
    message: "刷新后生效",
    icon: h(Redo, {
      theme: "filled",
      fill: "#efefef",
    }),
  });
};

onMounted(() => {
  // 根据已有状态设置单选按钮
  if (darkstar.value) particleType.value = "star";
  else if (snowflake.value) particleType.value = "snow";
  else if (firefly.value) particleType.value = "firefly";
  else if (bubble.value) particleType.value = "bubble";
  else particleType.value = "star";
  store.currentParticle = particleType.value;
  // 检测是否存在自定义壁纸
  if (store.backgroundCustom) customCoverUrl.value = store.backgroundCustom;
});
</script>

<style lang="scss" scoped>
.setting {
  .collapse {
    border-radius: 8px;
    --el-collapse-content-bg-color: #ffffff10;
    --el-collapse-content-bg-color: var(--main-cards-body-bg-color);
    border-color: transparent;
    overflow: hidden;

    :deep(.el-collapse-item__header) {
      padding-left: 18px;
      font-size: 15px;
      color: #fff;
      text-shadow: 0px 0px 4px #00000033;
      background-color: var(--main-cards-header-bg-color);
      border-color: transparent;
    }

    :deep(.el-collapse-item__wrap) {
      border-color: transparent;

      .bg-set {
        text-align: center;

        .el-button {
          margin: 10px 0;
          background: var(--main-open-music-bg-color);
          border-radius: 8px;
          border-color: transparent;
        }
      }

      .btn-right {
        float: right;
        margin-top: 50px;
        margin-right: 10px;
      }

      .btn-links {
        margin-right: 7px;
      }

      .el-slider {
        --el-slider-runway-bg-color: var(--main-cards-header-bg-color);
        flex-basis: 50%;
      }

      .el-slider__bar {
        background-color: #efefef;
      }

      .el-slider__button {
        border-color: transparent;
      }

      .song-input {
        margin-top: 4px;
        --el-input-focus-border-color: #eeeeee;
        /* 隐藏 Chrome / Safari / Edge 的步进箭头 */
        input[type="number"]::-webkit-inner-spin-button,
        input[type="number"]::-webkit-outer-spin-button {
          -webkit-appearance: none;
        }
      }

      .el-collapse-item__content {
        padding: 20px;

        .item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          font-size: 14px;

          .el-switch__core {
            border-color: transparent;
            background-color: var(--main-cards-bg-color);
          }

          .el-radio-group {
            .el-radio {
              margin: 2px 10px 2px 0;
              border-radius: 5px;

              &:last-child {
                margin-right: 0;
              }
            }
          }

          .el-button {
            margin: 4px 0;
            background-color: var(--main-open-music-bg-color);
          }
          .danger {
            &:hover {
              background-color: rgb(247, 137, 137);
            }
            &:active {
              border-color: #f56c6c;
            }
          }
          .success {
            &:hover {
              background-color: rgb(133, 206, 97);
            }
            &:active {
              border-color: #67c23a;
            }
          }
        }

        .el-radio-group {
          justify-content: space-between;

          .el-radio {
            margin: 10px 16px;
            background: var(--main-open-music-bg-color);
            border: 2px solid transparent;
            border-radius: 8px;

            .el-radio__label {
              color: #fff;
            }

            .el-radio__inner {
              background: #ffffff06 !important;
              border: 2px solid #eeeeee !important;
            }

            &.is-checked {
              background: #ffffff06 !important;
              border: 2px solid #eeeeee !important;
            }

            .is-checked {
              .el-radio__inner {
                background-color: #ffffff30 !important;
                border-color: #fff !important;
              }

              & + .el-radio__label {
                color: #fff !important;
              }
            }
          }
        }
      }
    }
  }
}
</style>
