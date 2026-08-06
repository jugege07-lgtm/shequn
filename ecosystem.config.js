// 社群名片 (shequn) pm2 进程配置
// 用途：开机自启脚本的兜底启动 + 统一声明崩溃重启策略
// 注意：实际运行参数以 pm2 save 生成的 dump.pm2 为准，本文件用于兜底与文档化

const NODE = 'C:/Users/Administrator/.workbuddy/binaries/node/versions/22.22.2/node.exe';

module.exports = {
  apps: [
    {
      name: 'shequn-backend',
      cwd: 'C:/code/shequn/backend',
      script: 'C:/code/shequn/backend/dist/main.js',
      interpreter: NODE,
      autorestart: true,        // 崩溃后自动重启
      max_restarts: 100,        // 最大重启次数（防止失控循环）
      min_uptime: 5000,         // 稳定运行至少 5s 才算健康
      restart_delay: 1000,      // 重启前等待 1s
      exp_backoff_restart_delay: 100, // 崩溃频繁时指数退避
      time: true,               // 日志带时间戳
      log: 'C:/code/shequn/logs/pm2-backend.log',
      env: {
        NODE_ENV: 'production',
      },
    },
    {
      name: 'shequn-frontend',
      cwd: 'C:/code/shequn',
      script: 'C:/code/shequn/proxy-server.js',
      interpreter: NODE,
      autorestart: true,
      max_restarts: 100,
      min_uptime: 5000,
      restart_delay: 1000,
      exp_backoff_restart_delay: 100,
      time: true,
      log: 'C:/code/shequn/logs/pm2-frontend.log',
    },
  ],
};
