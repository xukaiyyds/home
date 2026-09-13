import { h } from "vue";
import { Calendar, Sunrise, Sun, Moon, Sleep } from "@icon-park/vue-next";
import { SpeechLocal } from "@/utils/speech";
import dayjs from "dayjs";
import lunar from "lunar-calendar";

/* ==================== 静态配置 ==================== */

// 星期名称
const WEEKDAYS_SHORT = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
const WEEKDAYS_FULL = ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"];

// 时光胶囊名称
const CAPSULE_LABELS = {
  day: "今日",
  week: "本周",
  month: "本月",
  year: "本年",
};

// 欢迎语时段（hour < max 即命中）
const HELLO_TEXT_PERIODS = [
  { max: 6, text: "凌晨好" },
  { max: 9, text: "早上好" },
  { max: 12, text: "上午好" },
  { max: 14, text: "中午好" },
  { max: 17, text: "下午好" },
  { max: 19, text: "傍晚好" },
  { max: 22, text: "晚上好" },
  { max: 24, text: "夜深了" },
];

// 欢迎语图标时段（闭开区间 [min, max)）
const HELLO_ICON_PERIODS = [
  { min: 5, max: 11, icon: Sunrise },
  { min: 11, max: 17, icon: Sun },
  { min: 17, max: 22, icon: Moon },
];

// 欢迎语语音文件时段（hour < max 即命中）
const SPEECH_HELLO_PERIODS = [
  { max: 5, file: "欢迎1.mp3" },
  { max: 7, file: "欢迎2.mp3" },
  { max: 9, file: "欢迎3.mp3" },
  { max: 11, file: "欢迎4.mp3" },
  { max: 14, file: "欢迎5.mp3" },
  { max: 17, file: "欢迎6.mp3" },
  { max: 18, file: "欢迎7.mp3" },
  { max: 22, file: "欢迎8.mp3" },
  { max: 23, file: "欢迎9.mp3" },
  { max: 24, file: "欢迎10.mp3" },
];

// 公历节日（M.D 格式）
const SOLAR_FESTIVALS = {
  1.1: "元旦",
  2.14: "情人节",
  3.8: "妇女节",
  4.1: "愚人节",
  5.1: "劳动节",
  5.4: "青年节",
  6.1: "儿童节",
  10.1: "国庆节",
  12.24: "平安夜",
  12.25: "圣诞节",
};

// 农历节日（lunarMonth-lunarDay 格式）
const LUNAR_FESTIVALS = {
  "1-1": "春节",
  "1-15": "元宵节",
  "2-2": "龙抬头",
  "5-5": "端午节",
  "7-7": "七夕节",
  "8-15": "中秋节",
  "9-9": "重阳节",
  "12-8": "腊八节",
  "12-23": "小年",
  "12-30": "除夕",
};

// 建站日期统计
const MS_PER_DAY = 1000 * 60 * 60 * 24;
const DAYS_PER_MONTH = 30;
const MONTHS_PER_YEAR = 12;

/* ==================== 工具函数 ==================== */

// 数字补零
const pad2 = (n) => String(n).padStart(2, "0");

// 按小时查找时段配置
const findPeriod = (hour, periods, key) => {
  return periods.find((p) => hour < p.max)?.[key];
};

/* ==================== 时钟 ==================== */

export const getCurrentTime = (use12Hour = false) => {
  const now = new Date();

  const year = now.getFullYear();
  const month = pad2(now.getMonth() + 1);
  const day = pad2(now.getDate());

  let hour = now.getHours();
  let amPm = "";
  if (use12Hour) {
    amPm = hour >= 12 ? "PM" : "AM";
    hour = hour % 12 || 12; // 0 点显示 12
  }
  hour = pad2(hour);

  const minute = pad2(now.getMinutes());
  // 12 小时制不显示秒
  const second = use12Hour ? null : pad2(now.getSeconds());
  const weekday = (use12Hour ? WEEKDAYS_SHORT : WEEKDAYS_FULL)[now.getDay()];

  return { year, month, day, hour, minute, second, weekday, amPm };
};

/* ==================== 时光胶囊 ==================== */

export const getTimeCapsule = () => {
  const now = dayjs();

  // 计算某个时间单位的进度
  const getDifference = (unit) => {
    const start = now.startOf(unit);
    const end = now.endOf(unit);
    // "day" 单位按小时粒度统计，其余按天粒度
    const diffUnit = unit === "day" ? "hour" : "day";

    const total = end.diff(start, diffUnit) + 1;
    let passed = now.diff(start, diffUnit);
    // 周进度：以周一为一周开始
    if (unit === "week") passed = (passed + 6) % 7;

    return {
      name: CAPSULE_LABELS[unit],
      total,
      passed,
      remaining: total - passed,
      percentage: ((passed / total) * 100).toFixed(2),
    };
  };

  return {
    day: getDifference("day"),
    week: getDifference("week"),
    month: getDifference("month"),
    year: getDifference("year"),
  };
};

/* ==================== 欢迎提示 ==================== */

export const helloInit = () => {
  const hour = new Date().getHours();

  const text = findPeriod(hour, HELLO_TEXT_PERIODS, "text") ?? "你好";
  const icon = HELLO_ICON_PERIODS.find((p) => hour >= p.min && hour < p.max)?.icon ?? Sleep;

  ElMessage({
    message: text,
    icon: h(icon, { fill: "#efefef" }),
  });
};

export const speechHelloInit = () => {
  const hour = new Date().getHours();
  const file = findPeriod(hour, SPEECH_HELLO_PERIODS, "file");
  if (file) SpeechLocal(file);
};

/* ==================== 农历 ==================== */

export const getLunarDate = () => {
  const now = new Date();
  const lunarDate = lunar.solarToLunar(now.getFullYear(), now.getMonth() + 1, now.getDate());

  return {
    year: lunarDate.GanZhiYear,
    month: lunarDate.lunarMonthName,
    day: lunarDate.lunarDayName,
    isLeap: lunarDate.isLeap,
  };
};

/* ==================== 节日提醒 ==================== */

const showFestivalMessage = (name) => {
  ElMessage({
    dangerouslyUseHTMLString: true,
    duration: 5000,
    message: `今天是 <strong>${name}</strong>`,
    icon: h(Calendar, { fill: "#efefef" }),
  });
};

export const checkDays = () => {
  const now = dayjs();

  // 公历节日
  const solarName = SOLAR_FESTIVALS[now.format("M.D")];
  if (solarName) showFestivalMessage(solarName);

  // 农历节日
  try {
    const today = now.toDate();
    const lunarToday = lunar.solarToLunar(
      today.getFullYear(),
      today.getMonth() + 1,
      today.getDate(),
    );

    const month = lunarToday.lunarMonth;
    const day = lunarToday.lunarDay;

    // 除夕特殊处理：腊月廿九或三十，且明天是正月初一
    const tomorrow = dayjs().add(1, "day").toDate();
    const lunarTomorrow = lunar.solarToLunar(
      tomorrow.getFullYear(),
      tomorrow.getMonth() + 1,
      tomorrow.getDate(),
    );
    const isNewYearEve =
      month === 12 &&
      (day === 29 || day === 30) &&
      lunarTomorrow.lunarMonth === 1 &&
      lunarTomorrow.lunarDay === 1;

    const key = isNewYearEve ? "12-30" : `${month}-${day}`;
    const lunarName = LUNAR_FESTIVALS[key];
    if (lunarName) showFestivalMessage(lunarName);
  } catch (error) {
    console.warn("农历转换失败:", error);
  }
};

/* ==================== 建站日期统计 ==================== */

export const siteDateStatistics = (startDate) => {
  const elapsedMs = Date.now() - startDate.getTime();
  const days = elapsedMs / MS_PER_DAY;
  const months = days / DAYS_PER_MONTH;
  const years = months / MONTHS_PER_YEAR;

  if (years >= 1) {
    return `本站已经苟活了 ${Math.floor(years)} 年 ${Math.floor(months % MONTHS_PER_YEAR)} 月 ${Math.round(days % DAYS_PER_MONTH)} 天`;
  }
  if (months >= 1) {
    return `本站已经苟活了 ${Math.floor(months)} 月 ${Math.round(days % DAYS_PER_MONTH)} 天`;
  }
  return `本站已经苟活了 ${Math.round(days)} 天`;
};
