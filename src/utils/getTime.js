import { h } from "vue";
import { Calendar, Sunrise, Sun, Moon, Sleep } from "@icon-park/vue-next";
import { SpeechLocal } from "@/utils/speech";
import dayjs from "dayjs";
import lunar from "lunar-calendar";

// 时钟
export const getCurrentTime = (use12Hour = false) => {
  let time = new Date();
  let year = time.getFullYear();
  let month = time.getMonth() + 1 < 10 ? "0" + (time.getMonth() + 1) : time.getMonth() + 1;
  let day = time.getDate() < 10 ? "0" + time.getDate() : time.getDate();

  // 处理小时
  let hour = time.getHours();
  let amPm = "";
  if (use12Hour) {
    amPm = hour >= 12 ? "PM" : "AM";
    hour = hour % 12 || 12; // 12小时制，0点显示12
  }
  hour = hour < 10 ? "0" + hour : hour;

  let minute = time.getMinutes() < 10 ? "0" + time.getMinutes() : time.getMinutes();
  let second;
  let weekday;
  if (use12Hour) {
    second = null; // 12小时制不显示秒
    weekday = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
  } else {
    second = time.getSeconds() < 10 ? "0" + time.getSeconds() : time.getSeconds();
    weekday = ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"];
  }
  let currentTime = {
    year,
    month,
    day,
    hour,
    minute,
    second,
    weekday: weekday[time.getDay()],
    amPm,
  };
  return currentTime;
};

// 时光胶囊
export const getTimeCapsule = () => {
  const now = dayjs();
  const dayText = {
    day: "今日",
    week: "本周",
    month: "本月",
    year: "本年",
  };
  const getDifference = (unit) => {
    const start = now.startOf(unit);
    const end = now.endOf(unit);
    const total = end.diff(start, unit === "day" ? "hour" : "day") + 1;
    let passed = now.diff(start, unit === "day" ? "hour" : "day");
    if (unit === "week") {
      passed = (passed + 6) % 7;
    }
    const remaining = total - passed;
    const percentage = (passed / total) * 100;
    return {
      name: dayText[unit],
      total: total,
      passed: passed,
      remaining: remaining,
      percentage: percentage.toFixed(2),
    };
  };
  return {
    day: getDifference("day"),
    week: getDifference("week"),
    month: getDifference("month"),
    year: getDifference("year"),
  };
};

// 欢迎提示
export const helloInit = () => {
  const hour = new Date().getHours();
  let hello = null;
  let iconComponent = null;
  if (hour < 6) {
    hello = "凌晨好";
  } else if (hour < 9) {
    hello = "早上好";
  } else if (hour < 12) {
    hello = "上午好";
  } else if (hour < 14) {
    hello = "中午好";
  } else if (hour < 17) {
    hello = "下午好";
  } else if (hour < 19) {
    hello = "傍晚好";
  } else if (hour < 22) {
    hello = "晚上好";
  } else {
    hello = "夜深了";
  }
  if (hour >= 5 && hour < 11) {
    iconComponent = Sunrise;
  } else if (hour >= 11 && hour < 17) {
    iconComponent = Sun;
  } else if (hour >= 17 && hour < 22) {
    iconComponent = Moon;
  } else {
    iconComponent = Sleep;
  }
  ElMessage({
    message: `${hello}`,
    icon: h(iconComponent, {
      fill: "#efefef",
    }),
  });
};

export const speechHelloInit = () => {
  const hour = new Date().getHours();
  let hellosound = null;
  if (hour < 5) {
    hellosound = "欢迎1.mp3";
  } else if (hour < 7) {
    hellosound = "欢迎2.mp3";
  } else if (hour < 9) {
    hellosound = "欢迎3.mp3";
  } else if (hour < 11) {
    hellosound = "欢迎4.mp3";
  } else if (hour < 14) {
    hellosound = "欢迎5.mp3";
  } else if (hour < 17) {
    hellosound = "欢迎6.mp3";
  } else if (hour < 18) {
    hellosound = "欢迎7.mp3";
  } else if (hour < 22) {
    hellosound = "欢迎8.mp3";
  } else if (hour < 23) {
    hellosound = "欢迎9.mp3";
  } else {
    hellosound = "欢迎10.mp3";
  }
  SpeechLocal(hellosound);
};

// 获取农历日期
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

// 节日提醒
const solarAnniversaries = {
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

const lunarAnniversaries = {
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

const showFestivalMessage = (name) => {
  ElMessage({
    dangerouslyUseHTMLString: true,
    duration: 5000,
    message: `今天是 <strong>${name}</strong>`,
    icon: h(Calendar, {
      fill: "#efefef",
    }),
  });
};

export const checkDays = () => {
  const now = dayjs();

  // 检查公历节日
  const solarKey = now.format("M.D");
  if (solarAnniversaries[solarKey]) {
    showFestivalMessage(solarAnniversaries[solarKey]);
  }

  // 检查农历节日
  try {
    const solarDate = now.toDate();
    const lunarDate = lunar.solarToLunar(
      solarDate.getFullYear(),
      solarDate.getMonth() + 1,
      solarDate.getDate(),
    );
    const lunarMonth = lunarDate.lunarMonth; // 数字 1-12
    const lunarDay = lunarDate.lunarDay; // 数字 1-30

    // 特殊处理除夕（腊月廿九或三十，且明天是正月初一）
    const tomorrow = dayjs().add(1, "day").toDate();
    const lunarTomorrow = lunar.solarToLunar(
      tomorrow.getFullYear(),
      tomorrow.getMonth() + 1,
      tomorrow.getDate(),
    );
    const isNewYearEve =
      lunarMonth === 12 &&
      (lunarDay === 29 || lunarDay === 30) &&
      lunarTomorrow.lunarMonth === 1 &&
      lunarTomorrow.lunarDay === 1;

    let lunarKey = `${lunarMonth}-${lunarDay}`;
    if (isNewYearEve) {
      lunarKey = "12-30";
    }

    if (lunarAnniversaries[lunarKey]) {
      showFestivalMessage(lunarAnniversaries[lunarKey]);
    }
  } catch (e) {
    console.warn("农历转换失败:", e);
  }
};

// 建站日期统计
export const siteDateStatistics = (startDate) => {
  const currentDate = new Date();
  const differenceInTime = currentDate.getTime() - startDate.getTime();
  const differenceInDays = differenceInTime / (1000 * 3600 * 24);
  const differenceInMonths = differenceInDays / 30;
  const differenceInYears = differenceInMonths / 12;
  if (differenceInYears >= 1) {
    return `本站已经苟活了 ${Math.floor(differenceInYears)} 年 ${Math.floor(
      differenceInMonths % 12,
    )} 月 ${Math.round(differenceInDays % 30)} 天`;
  } else if (differenceInMonths >= 1) {
    return `本站已经苟活了 ${Math.floor(differenceInMonths)} 月 ${Math.round(
      differenceInDays % 30,
    )} 天`;
  } else {
    return `本站已经苟活了 ${Math.round(differenceInDays)} 天`;
  }
};
