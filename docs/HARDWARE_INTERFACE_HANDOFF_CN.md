# AI Builder 硬件接口与代码交接

本文档记录 2026-06-02 晚间实际可运行的硬件连接方案、串口接口参数，以及当天为适配硬件临时调整过的代码。演示时以本文档为准。

## 1. 当前可运行状态

- ESP32-S3 固件已经刷入。
- 网页端通过 Chrome Web Serial 连接 ESP32。
- 灯环信号脚已从 `GPIO11` 改为 `GPIO14`。
- 9 个按钮使用“3 连母头直插 ESP32 连续 3 个脚”的救急方案。
- 所有按钮已验证可触发：
  - 7 个黄色音阶键：`C/D/E/F/G/A/B`
  - 1 个红色录音键：`REC`
  - 1 个绿色生成键：`GENERATE`

## 2. Web Serial 接口参数

| 参数 | 值 |
|---|---|
| 浏览器 | Chrome / Edge，不能用 Safari |
| 页面地址 | `http://127.0.0.1:5174/` |
| 串口波特率 | `115200` |
| 数据格式 | ASCII 文本行 |
| 行结束符 | `\n` |
| ESP32 典型设备名 | `USB JTAG/serial debug unit` |
| macOS 串口示例 | `/dev/cu.usbmodem11101` 或类似 `/dev/cu.usbmodem1101` |

网页连接步骤：

1. 启动网页：

   ```bash
   cd "/Users/jack/work/ai builder/desktop-app"
   npm install
   npm run dev -- --host 127.0.0.1 --port 5174
   ```

2. Chrome 打开：

   ```text
   http://127.0.0.1:5174/
   ```

3. 点击页面右侧 `Connect Hardware / 连接硬件`。
4. 选择 ESP32 设备。
5. 页面串口日志出现 `hardware connected at 115200 baud` 即连接成功。

## 3. 串口协议

ESP32 发给网页：

```text
READY
NOTE:C
NOTE:D
NOTE:E
NOTE:F
NOTE:G
NOTE:A
NOTE:B
REC
GENERATE
PONG
```

网页发给 ESP32：

```text
LED:NOTE:C
LED:NOTE:D
LED:NOTE:E
LED:NOTE:F
LED:NOTE:G
LED:NOTE:A
LED:NOTE:B
LED:REC
LED:GENERATE
LED:PLAY
LED:RAINBOW
LED:OFF
BRIGHTNESS:32
PING
```

行为映射：

| 消息 | 方向 | 作用 |
|---|---|---|
| `NOTE:C` 到 `NOTE:B` | ESP32 -> Web | 网页播放对应音阶，同时追加动机 |
| `REC` | ESP32 -> Web | 触发网页录音 |
| `GENERATE` | ESP32 -> Web | 触发网页生成/演奏旋律 |
| `LED:NOTE:*` | Web -> ESP32 | 灯环显示对应音符颜色 |
| `LED:REC` | Web -> ESP32 | 灯环显示录音状态 |
| `LED:GENERATE` | Web -> ESP32 | 灯环显示生成状态 |
| `LED:PLAY` | Web -> ESP32 | 灯环显示演奏状态 |
| `LED:RAINBOW` | Web -> ESP32 | 灯环显示彩虹状态 |
| `LED:OFF` | Web -> ESP32 | 灯环关闭 |
| `BRIGHTNESS:*` | Web -> ESP32 | 设置灯环亮度，建议 `24-48` |
| `PING` / `PONG` | 双向测试 | 串口连通性测试 |

## 4. 当前实际硬件接线

### 4.1 灯环

灯环仍然使用真实电源脚，不参与按钮直插方案。

| 灯环 IN 端 | ESP32-S3 |
|---|---|
| `VCC` / 红线 | `5V` / `VBUS` |
| `GND` / 黑线 | `GND` |
| `DIN` / 信号线 | `IO14` / `GPIO14` |
| `OUT` | 不接 |

原因：原本计划用 `GPIO11`，但实际接线时 `GPIO14` 更容易插，且固件已改为 `LED_PIN = 14`。

### 4.2 按钮颜色

| 按钮颜色 | 数量 | 功能 |
|---|---:|---|
| 黄色 | 7 | `C/D/E/F/G/A/B` 音阶 |
| 红色 | 1 | `REC` 录音 |
| 绿色 | 1 | `GENERATE` 生成/演奏 |

### 4.3 三连直插按钮线序

DFRobot Gravity 线常见颜色定义：

| 线色 | 含义 |
|---|---|
| 绿线 | `SIG` |
| 红线 | `VCC` |
| 黑线 | `GND` |

当前固件把每个按钮对应的 3 个 ESP32 GPIO 临时配置成：

- `SIG`：输入脚，`INPUT_PULLDOWN`
- `VCC`：输出高电平，临时给按钮供电
- `GND`：输出低电平，临时作为按钮地

这是因为当晚没有公公杜邦线，按钮只有三连母头，无法走常规 `VCC/GND/SIG` 分线。

### 4.4 三连直插表

每个按钮三连头都按下面表格直接套 ESP32 连续 3 个针脚。插之前必须断开 USB。

| 按钮 | 颜色 | 绿线 `SIG` | 红线 `VCC` | 黑线 `GND` | 发送消息 |
|---|---|---:|---:|---:|---|
| Do / C | 黄色 | `IO4` | `IO5` | `IO6` | `NOTE:C` |
| Re / D | 黄色 | `IO7` | `IO15` | `IO16` | `NOTE:D` |
| Mi / E | 黄色 | `IO17` | `IO18` | `IO8` | `NOTE:E` |
| Fa / F | 黄色 | `IO3` | `IO46` | `IO9` | `NOTE:F` |
| Sol / G | 黄色 | `IO10` | `IO11` | `IO12` | `NOTE:G` |
| La / A | 黄色 | `IO1` | `IO2` | `IO42` | `NOTE:A` |
| Si / B | 黄色 | `IO41` | `IO40` | `IO39` | `NOTE:B` |
| Record | 红色 | `IO38` | `IO37` | `IO36` | `REC` |
| Generate | 绿色 | `IO48` | `IO47` | `IO21` | `GENERATE` |

注意：

- 这不是标准正式接法，是今晚为了不剪线、不买公公线的救急方案。
- 不要把灯环接成这种三连直插方式。
- 如果有发热、异味、ESP32 重启，立刻拔 USB。
- 后续买到公公杜邦线后，建议恢复到常规供电方案。

## 5. 今天改过的代码与原因

### 5.1 `firmware/esp32-s3-controller/src/main.cpp`

#### 改动 1：灯环从 `GPIO11` 改到 `GPIO14`

代码：

```cpp
constexpr uint8_t LED_PIN = 14;
```

原因：

- 实际板子上 `GPIO11` 不方便插线。
- `GPIO14` 更容易接到灯环 `DIN`。
- 固件、网页提示和文档已同步到 `GPIO14`。

#### 改动 2：按钮从普通输入脚改成三脚定义

原来结构：

```cpp
struct ButtonDef {
  uint8_t pin;
  const char* message;
  ...
};
```

现在结构：

```cpp
struct ButtonDef {
  uint8_t vccPin;
  uint8_t gndPin;
  uint8_t signalPin;
  const char* message;
  ...
};
```

原因：

- 原方案需要所有按钮共用 `3V3/GND`，但现场没有公公线，面包板无法作为分线器使用。
- 按钮线是三连母头，最简单稳定的物理接法是直接套 ESP32 连续三个针脚。
- 因此固件把某些 GPIO 临时设成 `OUTPUT HIGH` 和 `OUTPUT LOW`，分别模拟按钮的 `VCC/GND`。

#### 改动 3：按钮输入脚使用 `INPUT_PULLDOWN`

代码：

```cpp
pinMode(button.signalPin, INPUT_PULLDOWN);
```

原因：

- 三连直插方案中，未按下时信号脚需要稳定为低电平。
- 防止空脚漂浮导致误触发。

#### 改动 4：当前按钮定义表

代码里的实际表：

```cpp
ButtonDef buttons[] = {
  {5, 6, 4, "NOTE:C", LOW, LOW, 0},
  {15, 16, 7, "NOTE:D", LOW, LOW, 0},
  {18, 8, 17, "NOTE:E", LOW, LOW, 0},
  {46, 9, 3, "NOTE:F", LOW, LOW, 0},
  {11, 12, 10, "NOTE:G", LOW, LOW, 0},
  {2, 42, 1, "NOTE:A", LOW, LOW, 0},
  {40, 39, 41, "NOTE:B", LOW, LOW, 0},
  {37, 36, 38, "REC", LOW, LOW, 0},
  {47, 21, 48, "GENERATE", LOW, LOW, 0},
};
```

每行格式是：

```cpp
{vccPin, gndPin, signalPin, message, ...}
```

### 5.2 `desktop-app/src/App.tsx`

#### 改动 1：修复 TypeScript 构建兼容

原来使用：

```ts
selectedSoundPresetIds.at(-1)
```

改为：

```ts
selectedSoundPresetIds[selectedSoundPresetIds.length - 1]
```

原因：

- 项目 `tsconfig` 使用 `ES2021`。
- `Array.prototype.at()` 需要更高版本 lib，导致 `npm run build` 报错。
- 改成普通数组下标后不改变功能，并能通过构建。

#### 改动 2：硬件面板显示 GPIO 信息

新增显示：

```text
Note GPIO4-10
Rec  GPIO12
Gen  GPIO13
Led  GPIO14
```

原因：

- 新 UI 原本只显示 `Note/Rec/Gen/Led`，对现场接线不够明确。
- 加上 GPIO 后方便现场调试。
- 注意：页面显示的是常规逻辑概念；今晚实际按钮直插表以本文档第 4.4 节为准。

#### 改动 3：修复“新增声音 / 神秘嘉宾”录音弹窗跳掉

新增：

```ts
const handleGuestOverlayClick = useCallback(() => {
  if (guestRecording || guestConverting) return;
  closeGuestModal();
}, [closeGuestModal, guestConverting, guestRecording]);
```

并让录制按钮区域阻止事件冒泡：

```tsx
<div
  className="guest-modal__rec-area"
  onClick={(e) => e.stopPropagation()}
  onMouseDown={(e) => e.stopPropagation()}
>
```

原因：

- 点击录制后弹窗可能被遮罩层关闭，看起来像“录制按了之后跳掉”。
- 录音/分析期间不允许点遮罩关闭弹窗，避免丢失状态。

### 5.3 `desktop-app/src/styles.css`

改动：

- 硬件面板 GPIO 标签变成两行显示。
- 给 `Note/Rec/Gen/Led` 下方加小号 GPIO 文本。

原因：

- 避免文字挤在胶囊按钮里。
- 方便现场接线时识别硬件区域。

### 5.4 `docs/HARDWARE_WIRING.md`

改动：

- `WS2812B DIN` 从 `GPIO11` 改为 `GPIO14`。

原因：

- 和当前实际接线、固件 `LED_PIN = 14` 保持一致。

## 6. 正式版建议

今晚版本是可交付演示版，但不是最规范的电气方案。后续建议补买：

```text
公公杜邦线
```

补齐线材后，建议恢复成标准接法：

```text
所有按钮 VCC -> ESP32 3V3
所有按钮 GND -> ESP32 GND
每个按钮 SIG -> 独立 GPIO
```

正式版按钮 GPIO 可恢复为：

| 功能 | SIG GPIO |
|---|---:|
| C | `GPIO4` |
| D | `GPIO5` |
| E | `GPIO6` |
| F | `GPIO7` |
| G | `GPIO8` |
| A | `GPIO9` |
| B | `GPIO10` |
| REC | `GPIO12` |
| GEN | `GPIO13` |

灯环继续使用：

```text
DIN -> GPIO14
VCC -> 5V
GND -> GND
```

## 7. 快速验收流程

1. 插 ESP32 到 Mac。
2. 打开 Chrome 页面 `http://127.0.0.1:5174/`。
3. 点击 `Connect Hardware / 连接硬件`。
4. 逐个按实体按钮，串口日志应显示：

   ```text
   IN NOTE:C
   IN NOTE:D
   IN NOTE:E
   IN NOTE:F
   IN NOTE:G
   IN NOTE:A
   IN NOTE:B
   IN REC
   IN GENERATE
   ```

5. 按网页音阶键，灯环应跟随亮色。
6. 点击 `神秘嘉宾 / 点击添加`，录制 1 秒左右单音，保存后应出现新增嘉宾音色。

## 8. 注意事项

- 两台 Mac 不能同时连接同一个 ESP32。
- 如果 Chrome 已连接串口，终端会显示 Google 占用串口，此时 PlatformIO/串口脚本无法打开设备。
- 如果网页打不开，多半是 Vite 服务停了，重新运行：

  ```bash
  cd "/Users/jack/work/ai builder/desktop-app"
  npm run dev -- --host 127.0.0.1 --port 5174
  ```

- 如果 ESP32 串口号变化，例如从 `/dev/cu.usbmodem1101` 变成 `/dev/cu.usbmodem11101`，这是正常现象。
- 当前救急固件已经刷进板子；换 Mac 只需要运行网页，不需要重新刷固件。
