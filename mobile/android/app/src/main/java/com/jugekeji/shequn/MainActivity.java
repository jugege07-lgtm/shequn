package com.jugekeji.shequn;

import android.os.Bundle;
import androidx.activity.EdgeToEdge;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        // 必须在 super.onCreate()（BridgeActivity 内部 setContentView / WebView 布局）之前启用
        // edge-to-edge，让 WebView 内容绘制到状态栏/导航栏后面。
        // Capacitor 8 的 SystemBars 插件会据此计算并注入 --safe-area-inset-* CSS 变量，
        // 由 H5 端 .header/.phone-frame 用白色背景覆盖状态栏并给内容避让。
        //
        // 注意：不要再使用 legacy 的 SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN / LAYOUT_STABLE 等
        // 全屏布局标志，它们会干扰 ViewCompat 的 WindowInsets 计算，导致 Capacitor 注入的
        // safe-area 值为 0，从而在 App 顶部露出浅灰色区域，并把二级页面顶部内容压到状态栏下面。
        // edge-to-edge 统一交给 androidx.activity.EdgeToEdge 处理（兼容 Android 14- 与 Android 15+）。
        EdgeToEdge.enable(this);
        super.onCreate(savedInstanceState);
    }
}