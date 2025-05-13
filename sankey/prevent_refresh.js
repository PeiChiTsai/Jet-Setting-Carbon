// 阻止页面刷新 - 完全阻止版本
(function() {
  try {
    // 完全禁用beforeunload事件，防止任何形式的reload对话框
    window.addEventListener('beforeunload', function(e) {
      // 阻止默认行为和传播
      e.preventDefault();
      e.stopPropagation();
      
      // 清除任何可能的返回值，阻止对话框显示
      e.returnValue = null;
      return null;
    }, {capture: true});
    
    // 阻止Chrome的reload提示
    window.onbeforeunload = null;
    
    // 修改reload方法
    const originalReload = window.location.reload;
    window.location.reload = function() {
      console.log("Reload attempt blocked");
      return false;
    };
    
    // 阻止form提交
    document.addEventListener('submit', function(e) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }, {capture: true});
    
    // 监听并拦截reload命令键组合
    document.addEventListener('keydown', function(e) {
      // 拦截F5和Ctrl+R组合
      if (e.key === 'F5' || (e.ctrlKey && e.key === 'r')) {
        console.log("Reload key combination blocked");
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    }, {capture: true});
    
    console.log("Page reload dialog prevention active");
  } catch(e) {
    console.error("Error setting up reload prevention:", e);
  }
})(); 