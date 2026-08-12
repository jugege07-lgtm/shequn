package com.jugekeji.shequn;

import android.os.Bundle;
import android.view.View;
import androidx.core.view.WindowCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        // edge-to-edge：必须在 super.onCreate()（BridgeActivity 内部 setContentView）
        // 之前设置，否则 WebView 已按非沉浸式布局，状态栏区域无法被 App 背景覆盖，
        // 导致顶部出现浅灰色区域、二级页面内容被状态栏压住。
        WindowCompat.setDecorFitsSystemWindows(getWindow(), false);
        super.onCreate(savedInstanceState);
        // 强制状态栏为浅色图标（深色图标显示在浅色 WebView 背景上），
        // 避免系统深色模式/force-dark 把状态栏渲染成灰色或暗色条。
        // 使用基础 View API（API 23+，minSdk 24 满足），避免依赖 androidx.core 版本不一致导致的编译失败。
        getWindow().getDecorView().setSystemUiVisibility(View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR);
    }
}