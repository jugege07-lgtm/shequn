package com.jugekeji.shequn;

import android.os.Bundle;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsControllerCompat;
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
        // 注意：APPEARANCE_LIGHT_STATUS_BARS 常量在部分 androidx.core 版本下无法解析，
        // 这里直接用其数值 0x10 以避免 CI 依赖版本不一致导致的编译失败。
        WindowInsetsControllerCompat insets = WindowCompat.getInsetsController(getWindow(), getWindow().getDecorView());
        insets.setSystemBarsAppearance(0x10, 0x10);
    }
}