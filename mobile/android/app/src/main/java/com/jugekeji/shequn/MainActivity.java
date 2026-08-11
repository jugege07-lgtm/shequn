package com.jugekeji.shequn;

import android.os.Bundle;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        // edge-to-edge：让 WebView 内容/背景向上延伸绘制到状态栏后面，
        // 使 App 页面背景覆盖时间、信号图标栏区域（内容安全区由 CSS env(safe-area-inset-top) 避让）
        WindowCompat.setDecorFitsSystemWindows(getWindow(), false);
        // 浅色背景 + 深色状态栏图标，保证可读性
        WindowInsetsControllerCompat controller =
                WindowCompat.getInsetsController(getWindow(), getWindow().getDecorView());
        if (controller != null) {
            controller.setSystemBarsAppearance(
                    WindowInsetsControllerCompat.APPEARANCE_LIGHT_STATUS_BARS,
                    WindowInsetsControllerCompat.APPEARANCE_LIGHT_STATUS_BARS);
        }
    }
}