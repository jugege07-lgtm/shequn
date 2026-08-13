package com.jugekeji.shequn;

import android.os.Bundle;
import androidx.activity.EdgeToEdge;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        // 启用 edge-to-edge：让 WebView 内容绘制到状态栏后面，状态栏透明，
        // 由 H5 页面顶部背景（首页紫色 banner / 各页白色 header）铺满状态栏区域；
        // 内容通过 env(safe-area-inset-top)（index.html 已设 viewport-fit=cover）自动避让状态栏。
        //
        // 必须在 super.onCreate()（BridgeActivity 内部布局 WebView）之前调用，否则 WebView
        // 不会延伸到状态栏后面，env(safe-area-inset-top) 拿不到真实值。
        // androidx.activity.EdgeToEdge 兼容 Android 14-（主动 opt-in）与 Android 15+
        // （系统强制 edge-to-edge，此处保证 inset 正确传递给 WebView）。
        //
        // 历史说明：v1.0.3 曾启用 EdgeToEdge，但当时 CSS 仍给 .phone-frame 加了顶部安全区
        // padding、各 header 用负 margin，导致灰条+白条叠加而失败；后续版本修正了 CSS
        // （移除 phone-frame 顶部 padding、移除 header 负 margin、统一用 env() padding），
        // 却误把 EdgeToEdge 也一并移除——于是 env(safe-area-inset-top) 退化为 0，且状态栏
        // 回到 NoActionBarLaunch 主题的白色，重新出现白条。本版本恢复 EdgeToEdge，配合已修正
        // 的 CSS，二者缺一不可，这才是正确组合。
        EdgeToEdge.enable(this);
        super.onCreate(savedInstanceState);
    }
}
