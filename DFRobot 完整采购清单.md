# DFRobot 完整采购清单

这版清单统一在 DFRobot 购买，并按当前库存把 7 个音阶键改为黄色按钮模块。

| 硬件 | 商品 | 数量 | 单价参考 | 链接 |
|---|---|---:|---:|---|
| ESP32-S3 开发板 | ESP32-S3-DevKitC-1 开发板，货号 DFR0895 | 1 | ￥115 | https://www.dfrobot.com.cn/goods-3543.html |
| 音阶按键 | Gravity 数字大按钮模块 黄色，DFR0029-Y | 7 | ￥10/个 | https://www.dfrobot.com.cn/goods-78.html |
| 录音键 | Gravity 数字大按钮模块 红色，DFR0029-R | 1 | ￥10 | https://www.dfrobot.com.cn/goods-862.html |
| 生成键 | Gravity 数字大按钮模块 绿色，DFR0029-G | 1 | ￥10 | https://www.dfrobot.com.cn/goods-863.html |
| 灯环 | WS2812-16 RGB LED Ring，DFR0888-16 | 1 | ￥45 | https://www.dfrobot.com.cn/goods-3471.html |
| 面包板 | 中型面包板，FIT0096 | 1 | ￥15 | https://www.dfrobot.com.cn/goods-422.html |
| 杜邦线 | 面包实验杜邦线，公母头，FIT0121 | 1 | ￥23 | https://www.dfrobot.com.cn/goods-432.html |
| USB 数据线 | Type-C & Micro 二合一 USB 线，FIT0668 | 1 | ￥25 | https://www.dfrobot.com.cn/goods-2843.html |

**总价估算：约 ￥303，不含运费。**

## 按键颜色分配

| 用途 | 颜色 | 数量 |
|---|---|---:|
| Do / Re / Mi / Fa / Sol / La / Si | 黄色 | 7 |
| 录音键 | 红色 | 1 |
| 生成键 | 绿色 | 1 |

白色按钮当前没货，所以不买白色。备用键不是 MVP 必需项。

## 接线注意

DFRobot Gravity 数字大按钮模块是三线模块：

| 按钮模块 | ESP32-S3 |
|---|---|
| VCC | 3V3 |
| GND | GND |
| SIG | 对应 GPIO |

这个模块按下时 `SIG` 输出高电平，所以固件已经按 **高电平触发** 更新。不要按裸按键的 `INPUT_PULLUP` 低电平接法来接。

