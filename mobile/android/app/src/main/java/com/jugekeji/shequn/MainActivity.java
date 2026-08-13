package com.jugekeji.shequn;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        // 状态栏颜色由 values/styles.xml 统一设为浅蓝灰(#f0f2f8)，与 H5 页面背景一致。
        // 不启用 EdgeToEdge：
        //   - Android 14-：状态栏不透明显示浅蓝灰，WebView 从状态栏下方渲染，顶部视觉无缝
        //   - Android 15+：系统强制 edge-to-edge，状态栏区域由 H5 页面顶部背景铺满
        // 不使用 SystemBars 动态切换/注入 safe-area 变量（WebView 版本差异会导致注入值不准，
        // 产生顶部灰色条/多余白条），故也不依赖 EdgeToEdge 与 --safe-area-inset-* 的联动。
        super.onCreate(savedInstanceState);
    }
}
