<template>
  <div class="weather" v-if="hasWeather">
    <span>{{ weatherData.city }}&nbsp;</span>
    <span>{{ weatherData.weather.weather }}&nbsp;</span>
    <span>{{ weatherData.weather.temperature }}℃</span>
    <template v-if="!store.use12HourFormat">
      <span class="sm-hidden">&nbsp;{{ windDirectionText }}&nbsp;</span>
      <span class="sm-hidden">{{ weatherData.weather.windpower }}&nbsp;级</span>
    </template>
  </div>
  <div class="weather" v-else>
    <template v-if="store.showLunar">
      <span v-if="store.use12HourFormat">{{ lunarInfo.month }}{{ lunarInfo.day }}</span>
      <span v-else>{{ lunarInfo.year }}年 {{ lunarInfo.month }}{{ lunarInfo.day }}</span>
    </template>
    <span v-else>{{ weatherMsg }}</span>
  </div>
</template>

<script setup>
import { getXiaomiWeather, getXiaomiCityByGeo } from "@/api";
import { Error } from "@icon-park/vue-next";
import { getLunarDate } from "@/utils/getTime.js";
import { SpeechLocal } from "@/utils/speech";
import { mainStore } from "@/store";

const store = mainStore();

/* ==================== 静态配置 ==================== */

// 天气代码 → 中文描述
const WEATHER_TEXT_MAP = {
  0: "晴",
  1: "多云",
  2: "阴",
  3: "阵雨",
  4: "雷阵雨",
  5: "雷阵雨伴有冰雹",
  6: "雨夹雪",
  7: "小雨",
  8: "中雨",
  9: "大雨",
  10: "暴雨",
  13: "阵雪",
  14: "小雪",
  15: "中雪",
  16: "大雪",
  17: "暴雪",
  18: "雾",
  19: "冻雨",
  20: "沙尘暴",
  29: "浮尘",
  30: "扬沙",
  31: "强沙尘暴",
  32: "霾",
};

// 风向角度 → 中文方向（8 方位）
const WIND_DIRECTIONS = ["北", "东北", "东", "东南", "南", "西南", "西", "西北"];

// 风速换算风力的系数与上限
const WIND_SPEED_DIVISOR = 5;
const WIND_POWER_MAX = 12;

// 失败语音播报延迟
const SPEECH_FAIL_DELAY = 7000;

/* ==================== 本地数据 ==================== */

// 农历信息（同步计算，无需响应式）
const lunarInfo = getLunarDate();

// 天气状态文案（无数据时展示）
const weatherMsg = ref("正在获取天气数据");

// 天气数据
const weatherData = reactive({
  city: null,
  weather: {
    weather: null, // 天气现象
    temperature: null, // 实时气温
    winddirection: null, // 风向描述
    windpower: null, // 风力级别
  },
});

/* ==================== 计算属性 ==================== */

// 数据是否就绪（模板判断依据）
const hasWeather = computed(() => weatherData.city && weatherData.weather.weather);

// 风向文案（自动补"风"字）
const windDirectionText = computed(() => {
  const dir = weatherData.weather.winddirection;
  if (!dir) return "";
  return dir.endsWith("风") ? dir : `${dir}风`;
});

/* ==================== 数据转换 ==================== */

// 天气代码转文字
const getWeatherText = (code) => WEATHER_TEXT_MAP[code] || "未知";

// 风向角度转文字
const getWindDirection = (degree) => {
  const index = Math.round((degree % 360) / 45) % 8;
  return WIND_DIRECTIONS[index];
};

// 风速（米/秒）转风力等级
const getWindPower = (speed) => Math.min(Math.ceil(speed / WIND_SPEED_DIVISOR), WIND_POWER_MAX);

/* ==================== 错误处理 ==================== */

const onError = (message) => {
  ElMessage({
    message,
    icon: h(Error, { theme: "filled", fill: "#efefef" }),
  });
  console.error(message);
};

// 处理天气加载失败
const handleWeatherError = (error) => {
  console.error("天气信息获取失败:", error);

  // 只有未开启农历时，才提示错误信息
  if (store.showLunar) return;

  onError("定位失败，无法获取天气信息");
  if (store.webSpeech) {
    setTimeout(() => SpeechLocal("天气加载失败.mp3"), SPEECH_FAIL_DELAY);
  }
  weatherMsg.value = "天气数据获取失败";
};

/* ==================== 数据获取 ==================== */

const getWeatherData = async () => {
  try {
    // 浏览器定位
    const position = await new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject);
    });
    const { latitude, longitude } = position.coords;

    // 城市信息
    const cityInfo = await getXiaomiCityByGeo(longitude, latitude);
    if (!cityInfo?.locationKey) throw "城市信息获取失败";
    weatherData.city = cityInfo.name;

    // 天气信息
    const result = await getXiaomiWeather(latitude, longitude, cityInfo.locationKey);
    if (!result.current) throw "天气数据获取失败";
    const current = result.current;

    const windDegree = parseFloat(current.wind?.direction?.value || 0);
    const windSpeed = parseFloat(current.wind?.speed?.value || 0);

    weatherData.weather = {
      weather: getWeatherText(current.weather),
      temperature: current.temperature?.value,
      winddirection: getWindDirection(windDegree),
      windpower: getWindPower(windSpeed),
    };
  } catch (error) {
    handleWeatherError(error);
  }
};

/* ==================== 生命周期 ==================== */

onMounted(getWeatherData);
</script>
