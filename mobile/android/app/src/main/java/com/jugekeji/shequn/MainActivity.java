package com.jugekeji.shequn;

import android.os.Bundle;
import android.view.View;
import androidx.core.view.WindowCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        // edge-to-edge：让 WebView 内容/背景向上延伸绘制到状态栏后面，
        // 使 App 页面背景覆盖时间、信号图标栏区域（内容安全区由 CSS env(safe-area-inset-top) 避让）。
        WindowCompat.setDecorFitsSystemWindows(getWindow(), false);
        // 强制状态栏为浅色图标（深色图标显示在浅色 WebView 背景上），
        // 避免系统深色模式/force-dark 把状态栏渲染成灰色或暗色条。
        // 使用基础 View API（API 23+，minSdk 24 满足），避免依赖 androidx.core 版本不一致导致的编译失败。
        getWindow().getDecorView().setSystemUiVisibility(View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR);
    }
}