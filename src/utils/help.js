import { KeyboardOne, Close } from "@icon-park/vue-next";

// 帮助弹窗内容（统一维护）
export const helpContent = `
  <div style="display:flex; justify-content:space-between; align-items:baseline; padding:4px 0; border-bottom:1px dashed #e0e0e0;"><span style="text-align:left; white-space:nowrap; margin-right:20px;">Alt + H</span><span style="text-align:left; white-space:nowrap; color:#CFD3DC;">（回到主页面）</span></div>
  <div style="display:flex; justify-content:space-between; align-items:baseline; padding:4px 0; border-bottom:1px dashed #e0e0e0;"><span style="text-align:left; white-space:nowrap; margin-right:20px;">空格</span><span style="text-align:left; white-space:nowrap; color:#CFD3DC;">（播放/暂停音乐）</span></div>
  <div style="display:flex; justify-content:space-between; align-items:baseline; padding:4px 0; border-bottom:1px dashed #e0e0e0;"><span style="text-align:left; white-space:nowrap; margin-right:20px;">左/右方向键</span><span style="text-align:left; white-space:nowrap; color:#CFD3DC;">（上一曲/下一曲）</span></div>
  <div style="display:flex; justify-content:space-between; align-items:baseline; padding:4px 0; border-bottom:1px dashed #e0e0e0;"><span style="text-align:left; white-space:nowrap; margin-right:20px;">上/下方向键</span><span style="text-align:left; white-space:nowrap; color:#CFD3DC;">（增加/减少音量）</span></div>
  <div style="display:flex; justify-content:space-between; align-items:baseline; padding:4px 0; border-bottom:1px dashed #e0e0e0;"><span style="text-align:left; white-space:nowrap; margin-right:20px;">Alt + M</span><span style="text-align:left; white-space:nowrap; color:#CFD3DC;">（打开/关闭音乐列表）</span></div>
  <div style="display:flex; justify-content:space-between; align-items:baseline; padding:4px 0; border-bottom:1px dashed #e0e0e0;"><span style="text-align:left; white-space:nowrap; margin-right:20px;">Tab</span><span style="text-align:left; white-space:nowrap; color:#CFD3DC;">（打开/关闭时光胶囊）</span></div>
  <div style="display:flex; justify-content:space-between; align-items:baseline; padding:4px 0; border-bottom:1px dashed #e0e0e0;"><span style="text-align:left; white-space:nowrap; margin-right:20px;">Alt + D</span><span style="text-align:left; white-space:nowrap; color:#CFD3DC;">（切换浅色/深色主题）</span></div>
  <div style="display:flex; justify-content:space-between; align-items:baseline; padding:4px 0; border-bottom:1px dashed #e0e0e0;"><span style="text-align:left; white-space:nowrap; margin-right:20px;">Alt + S</span><span style="text-align:left; white-space:nowrap; color:#CFD3DC;">（打开/关闭全网搜索）</span></div>
  <div style="display:flex; justify-content:space-between; align-items:baseline; padding:4px 0; border-bottom:1px dashed #e0e0e0;"><span style="text-align:left; white-space:nowrap; margin-right:20px;">鼠标右键</span><span style="text-align:left; white-space:nowrap; color:#CFD3DC;">（打开/关闭全局设置）</span></div>
  <div style="display:flex; justify-content:space-between; align-items:baseline; padding:4px 0; border-bottom:1px dashed #e0e0e0;"><span style="text-align:left; white-space:nowrap; margin-right:20px;">鼠标中键</span><span style="text-align:left; white-space:nowrap; color:#CFD3DC;">（启用/退出壁纸预览）</span></div>
  <div style="display:flex; justify-content:space-between; align-items:baseline; padding:4px 0; border-bottom:1px dashed #e0e0e0;"><span style="text-align:left; white-space:nowrap; margin-right:20px;">鼠标滚轮</span><span style="text-align:left; white-space:nowrap; color:#CFD3DC;">（滑动网站/捷径列表）</span></div>
  <div style="display:flex; justify-content:space-between; align-items:baseline; padding:4px 0; border-bottom:1px dashed #e0e0e0;"><span style="text-align:left; white-space:nowrap; margin-right:20px;">右键捷径链接</span><span style="text-align:left; white-space:nowrap; color:#CFD3DC;">（编辑/删除捷径）</span></div>
  <div style="display:flex; justify-content:space-between; align-items:baseline; padding:4px 0;"><span style="text-align:left; white-space:nowrap; margin-right:20px;">双击底栏歌词</span><span style="text-align:left; white-space:nowrap; color:#CFD3DC;">（启用/禁用进度图标常驻）</span></div>
`;

// 弹窗状态（单例）
let isHelpOpen = false;

// 打开/关闭帮助弹窗
export const toggleHelp = () => {
  if (isHelpOpen) {
    ElMessageBox.close();
    isHelpOpen = false;
    return;
  }
  ElMessageBox.alert(helpContent, "本站快捷键", {
    dangerouslyUseHTMLString: true,
    modal: true,
    closeOnClickModal: true,
    closeOnPressEscape: true,
    showConfirmButton: false,
    draggable: true,
    center: true,
    icon: markRaw(KeyboardOne),
    closeIcon: markRaw(Close),
  })
    .catch(() => {})
    .finally(() => {
      isHelpOpen = false;
    });
  isHelpOpen = true;
};
