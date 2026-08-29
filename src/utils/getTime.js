import { h } from "vue";
import { Calendar } from "@icon-park/vue-next";
import dayjs from "dayjs";
import { Lunar } from 'lunar-javascript';

// 时钟
export const getCurrentTime = () => {
  let time = new Date();
  let year = time.getFullYear();
  let month = time.getMonth() + 1 < 10 ? "0" + (time.getMonth() + 1) : time.getMonth() + 1;
  let day = time.getDate() < 10 ? "0" + time.getDate() : time.getDate();
  let hour = time.getHours() < 10 ? "0" + time.getHours() : time.getHours();
  let minute = time.getMinutes() < 10 ? "0" + time.getMinutes() : time.getMinutes();
  let second = time.getSeconds() < 10 ? "0" + time.getSeconds() : time.getSeconds();
  let weekday = ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"];
  let currentTime = {
    year,
    month,
    day,
    hour,
    minute,
    second,
    weekday: weekday[time.getDay()],
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
  /**
   * 计算时间差的函数
   * @param {String} unit 时间单位，可以是 'day', 'week', 'month', 'year'
   */
  const getDifference = (unit) => {
    // 获取当前时间单位的开始时间
    const start = now.startOf(unit);
    // 获取当前时间单位的结束时间
    const end = now.endOf(unit);
    // 计算总的天数或小时数
    const total = end.diff(start, unit === "day" ? "hour" : "day") + 1;
    // 计算已经过去的天数或小时数
    let passed = now.diff(start, unit === "day" ? "hour" : "day");
    if (unit === "week") {
      passed = (passed + 6) % 7;
    }
    const remaining = total - passed;
    const percentage = (passed / total) * 100;
    // 返回数据
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
  ElMessage({
    dangerouslyUseHTMLString: true,
    message: `<strong>${hello}</strong> 欢迎来到我的主页`,
  });
};

// 节日提醒
const solarAnniversaries = {
  '1.1': '元旦',
  '2.14': '情人节',
  '3.8': '妇女节',
  '4.1': '愚人节',
  '5.1': '劳动节',
  '5.4': '青年节',
  '6.1': '儿童节',
  '10.1': '国庆节',
  '12.24': '平安夜',
  '12.25': '圣诞节',
};

const lunarAnniversaries = {
  '1-1': '春节',
  '1-15': '元宵节',
  '2-2': '龙抬头',
  '5-5': '端午节',
  '7-7': '七夕节',
  '8-15': '中秋节',
  '9-9': '重阳节',
  '12-8': '腊八节',
  '12-23': '小年',
  '12-30': '除夕',
};

const showFestivalMessage = (name) => {
  ElMessage({
    message: `今天是${name}`,
    duration: 5000,
    icon: h(Calendar, { theme: 'filled', fill: '#efefef' }),
  });
};

export const checkDays = () => {
  const now = dayjs();

  // 检查公历节日
  const solarKey = now.format('M.D');
  if (solarAnniversaries[solarKey]) {
    showFestivalMessage(solarAnniversaries[solarKey]);
  }

  // 检查农历节日
  try {
    const lunar = Lunar.fromDate(now.toDate());
    const lunarMonth = lunar.getMonth();
    const lunarDay = lunar.getDay();

    // 特殊处理除夕（腊月廿九或三十，且明天是正月初一）
    const tomorrow = dayjs().add(1, 'day');
    const lunarTomorrow = Lunar.fromDate(tomorrow.toDate());
    const isNewYearEve = (lunarMonth === 12 && (lunarDay === 29 || lunarDay === 30)) &&
      lunarTomorrow.getMonth() === 1 && lunarTomorrow.getDay() === 1;

    let lunarKey = `${lunarMonth}-${lunarDay}`;
    if (isNewYearEve) {
      lunarKey = '12-30';
    }

    if (lunarAnniversaries[lunarKey]) {
      showFestivalMessage(lunarAnniversaries[lunarKey]);
    }
  } catch (e) {
    console.warn('农历转换失败:', e);
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
