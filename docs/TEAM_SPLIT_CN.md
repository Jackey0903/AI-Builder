# MVP 分工说明

## 当前框架已经分好的部分

我们把 MVP 拆成两条线：

1. **实现线**：电脑端页面、录音、7 音阶播放、旋律生成、ESP32 串口、按键、灯光。
2. **内容线**：精灵/角色声音库、预设旋律、声音文件参数。

内容线不需要改硬件固件，也不需要改串口协议。

## 同学可以先做的部分

### 1. 声音文件

放到这个目录：

```text
desktop-app/public/sounds/
```

推荐格式：

| 项 | 要求 |
|---|---|
| 首选格式 | `.wav` |
| 可接受格式 | `.mp3`、`.webm`、`.ogg` |
| 采样率 | 44.1kHz 或 48kHz |
| 声道 | 单声道优先，双声道也可以 |
| 长度 | 0.3-1.2 秒最好，最多不要超过 3 秒 |
| 命名 | 小写英文加短横线，例如 `cat-meow-c4.wav`；程序里登记的路径尽量用英文文件名 |

先不要放未经授权的官方游戏音频或扒出来的素材。可以用自己录的声音、授权音效、原创拟声。

如果要做一个“圆号鱼音色”，优先录多个短的单音节采样，例如低音层、中音层、高音层。这样电脑端弹奏时会先选最接近目标音高的采样，再做小幅变调，比拿一个长样本硬拉全音阶更干净。

### 2. 声音库参数

声音文件加进去以后，到这里登记：

```text
desktop-app/src/content/soundLibrary.ts
```

示例：

```ts
{
  id: 'cat-meow',
  name: 'Cat Meow',
  description: 'Team-recorded short cat voice.',
  file: '/sounds/cat-meow-c4.wav',
  baseNote: 'C',
  trimStartMs: 20,
  trimEndMs: 780,
  gain: 0.85,
  enabled: true,
  credit: 'Team recording',
  tags: ['animal', 'bright']
}
```

如果同一个角色有几条干净的单音节采样，可以登记成多采样版本。当前圆号鱼先只保留同学反馈更稳定的 `发音5低音` 和 `发音2`：

```ts
{
  id: 'yuanhaoyu-multisample',
  name: '圆号鱼双采样',
  description: 'Current main demo timbre using 发音5低音 and 发音2.',
  samples: [
    {
      id: 'low',
      name: '发音5低音',
      file: '/sounds/yuanhaoyu-voice-low.wav',
      baseNote: 'A',
      baseSemitoneOffset: -3,
      trimStartMs: 0,
      trimEndMs: 235,
      gain: 1.18,
      role: 'low'
    },
    {
      id: 'mid',
      name: '发音2',
      file: '/sounds/yuanhaoyu-voice-mid.wav',
      baseNote: 'F',
      baseSemitoneOffset: 5,
      trimStartMs: 0,
      trimEndMs: 277,
      gain: 1.12,
      role: 'mid'
    }
  ],
  enabled: true,
  credit: 'Team recording',
  tags: ['character', 'dual-sample', 'recommended']
}
```

参数口径：

| 参数 | 怎么填 |
|---|---|
| `id` | 小写唯一 ID |
| `name` | 页面显示名 |
| `file` | `/sounds/文件名.wav` |
| `baseNote` | 原始声音大概对应哪个音，未知就填 `C` |
| `baseSemitoneOffset` | 可选；相对 C4 的半音位置，例如 A3 填 `-3`，F4 填 `5` |
| `trimStartMs` | 从第几毫秒开始截 |
| `trimEndMs` | 到第几毫秒结束 |
| `gain` | 音量倍率，通常 `0.6-1.1` |
| `samples` | 多采样数组；有低/中/高采样时优先用它，不用再填顶层 `file` |
| `enabled` | 文件确认存在后改成 `true` |
| `credit` | 来源说明 |

现在页面里有 `Key Root`，可以在硬件没到之前直接切 C/D/E/F/G/A/B，对比哪个调听起来最贴合这组发音。

### 3. 预设旋律

编辑这个文件：

```text
desktop-app/src/content/presetMelodies.ts
```

旋律只用这 7 个音：

```text
C D E F G A B
```

事件格式：

```ts
{ note: 'C', durationMs: 240, velocity: 0.95 }
```

参数口径：

| 参数 | 怎么填 |
|---|---|
| `note` | `C/D/E/F/G/A/B` |
| `durationMs` | 这个音持续多少毫秒 |
| `velocity` | 力度/音量，`0-1` |

如果旋律是从 BGM 里抽出来的，可以在预设旋律顶层加 `root: 'F'` 这类字段。页面播放预设时会用这个局部 Key Root，但不会改掉手动弹奏的全局 Key Root。

也可以给预设加背景垫音：

```ts
backingFile: '/sounds/人鱼湾伴奏.wav',
backingGain: 0.14,
backingLoop: true
```

背景垫音会在预设旋律开始时同步播放，旋律结束后淡出停止。

建议每条预设旋律 5-15 秒，适合现场展示。

## 我们这边继续做的部分

- 完成电脑端 MVP 页面。
- 完成 ESP32-S3 按键和灯环固件。
- 保持 Web Serial 协议稳定。
- 做录音采样、音高映射、生成旋律、灯光联动。
- 保证没有声音库时也能用 fallback tone 演示。

## 对接原则

同学只要按 `sounds/` + `soundLibrary.ts` + `presetMelodies.ts` 这三个位置做内容，我们这边程序就能接。需要新参数时先改这个文档，避免双方命名不一致。
