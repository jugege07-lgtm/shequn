package com.jugekeji.shequn;

import android.os.Bundle;
import androidx.core.view.WindowCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        // edge-to-edge：让 WebView 内容/背景向上延伸绘制到状态栏后面，
        // 使 App 页面背景覆盖时间、信号图标栏区域（内容安全区由 CSS env(safe-area-inset-top) 避让）。
        // 状态栏图标深浅色由 styles.xml 的 android:windowLightStatusBar 控制，
        // 不在此调用 WindowInsetsControllerCompat 的 setSystemBarsAppearance（低版本 androidx.core 无此方法导致编译失败）。
        WindowCompat.setDecorFitsSystemWindows(getWindow(), false);
    }
}