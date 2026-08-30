<template>
  <div class="weather" v-if="weatherData.city && weatherData.weather.weather">
    <span>{{ weatherData.city }}&nbsp;</span>
    <span>{{ weatherData.weather.weather }}&nbsp;</span>
    <span>{{ weatherData.weather.temperature }}℃</span>
    <span class="sm-hidden">
      &nbsp;{{
        weatherData.weather.winddirection?.endsWith("风")
          ? weatherData.weather.winddirection
          : weatherData.weather.winddirection + "风"
      }}&nbsp;
    </span>
    <span class="sm-hidden">{{ weatherData.weather.windpower }}&nbsp;级</span>
  </div>
  <div class="weather" v-else>
    <span>{{ weatherMsg }}</span>
  </div>
</template>

<script setup>
import { getXiaomiWeather, getXiaomiCityByGeo } from "@/api";
import { Error } from "@icon-park/vue-next";

const weatherMsg = ref("正在获取天气数据");

// 天气数据
const weatherData = reactive({
  city: null, // 城市
  weather: {
    weather: null, // 天气现象
    temperature: null, // 实时气温
    winddirection: null, // 风向描述
    windpower: null, // 风力级别
  },
});

// 天气代码转文字
const getWeatherText = (code) => {
  const weatherMap = {
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
  return weatherMap[code] || "未知";
};

// 风向角度转文字
const getWindDirection = (degree) => {
  const directions = ["北", "东北", "东", "东南", "南", "西南", "西", "西北"];
  const index = Math.round((degree % 360) / 45) % 8;
  return directions[index];
};

// 获取天气数据
const getWeatherData = async () => {
  try {
    // 获取定位（使用浏览器地理定位）
    const position = await new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject);
    });

    const { latitude, longitude } = position.coords;

    // 获取城市信息
    const cityInfo = await getXiaomiCityByGeo(longitude, latitude);
    if (!cityInfo || !cityInfo.locationKey) {
      throw "城市信息获取失败";
    }

    weatherData.city = cityInfo.name;

    // 获取天气信息
    const result = await getXiaomiWeather(latitude, longitude, cityInfo.locationKey);

    if (!result.current) {
      throw "天气数据获取失败";
    }
    const current = result.current;
    const windDegree = parseFloat(current.wind?.direction?.value || 0);
    const windSpeed = parseFloat(current.wind?.speed?.value || 0);

    // 风速转风力等级（简化计算）
    const windPower = Math.min(Math.ceil(windSpeed / 5), 12);

    weatherData.weather = {
      weather: getWeatherText(current.weather),
      temperature: current.temperature?.value,
      winddirection: getWindDirection(windDegree),
      windpower: windPower,
    };
  } catch (error) {
    console.error("天气信息获取失败:" + error);
    weatherMsg.value = "天气数据获取失败";
    onError("定位失败，无法获取天气信息");
  }
};

// 报错信息
const onError = (message) => {
  ElMessage({
    message,
    icon: h(Error, {
      theme: "filled",
      fill: "#efefef",
    }),
  });
  console.error(message);
};

onMounted(() => {
  // 调用获取天气
  getWeatherData();
});
</script>
