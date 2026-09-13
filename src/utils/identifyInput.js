/* ==================== 静态正则（模块级只创建一次） ==================== */

// 网址：包含 http:// 或 https:// 协议头
const URL_REGEX = /https?:\/\/[\w.-]+/i;

// IPv4 地址（每段 0-255）
const IPV4_REGEX =
  /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;

// 邮箱（宽松校验）
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/* ==================== 主函数 ==================== */

/**
 * 判断输入字符串的类型。
 * @param {string} input - 待判断的字符串
 * @returns {"url" | "email" | "text"} - "url" 网址 / "email" 邮箱 / "text" 普通文本
 */
const identifyInput = (input) => {
  if (URL_REGEX.test(input) || IPV4_REGEX.test(input)) return "url";
  if (EMAIL_REGEX.test(input)) return "email";
  return "text";
};

export default identifyInput;
