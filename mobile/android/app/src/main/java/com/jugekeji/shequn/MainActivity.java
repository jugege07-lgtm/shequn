package com.jugekeji.shequn;

import android.graphics.Color;
import android.os.Bundle;
import android.view.View;
import android.view.Window;
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
        // 组合使用 legacy 全屏布局标志，确保各类 Android 版本/厂商系统都能可靠地
        // 让 WebView 内容绘制到状态栏后面（仅 setDecorFitsSystemWindows 在部分设备上不生效）。
        //   LAYOUT_FULLSCREEN : 内容延伸到状态栏后面
        //   LAYOUT_STABLE     : 布局稳定，避免切换时跳动
        //   LIGHT_STATUS_BAR  : 浅色状态栏图标（适配白色/浅色页面背景）
        Window w = getWindow();
        w.setStatusBarColor(Color.TRANSPARENT);
        w.getDecorView().setSystemUiVisibility(
            View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN |
            View.SYSTEM_UI_FLAG_LAYOUT_STABLE |
            View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR);
    }
}