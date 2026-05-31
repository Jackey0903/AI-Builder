# 内容线更新说明

**更新时间**：2026-05-31  
**负责人**：内容线（唐茹冰）  
**分支**：main

---

## 一、音色库重建（soundLibrary.ts）

将框架中的占位音色全部替换为真实精灵声音采样，现共 **6 个可用音色**，全部 `enabled: true`。

| 音色名 | 采样文件 | 基频 | baseSemitoneOffset |
|---|---|---|---|
| 圆号鱼 | `yuanhaoyu-voice-mid.wav` | F4 | 5 |
| 炫光迪迪 | `炫光迪迪.wav` | C4 | 0 |
| 猴麦仔 | `猴麦仔/猴麦仔采样.wav` | E4 | 4 |
| 里拉鳐 | `里拉鳐音节/里拉鳐音节1.wav` | A3 | -3 |
| 小夜 | `小夜/小夜.wav` | E4 | 4 |
| 恶魔叮 | `恶魔叮/恶魔叮战斗.wav` | D#6 | 27，trimStartMs=100 |

**新增音频文件**（`public/sounds/` 目录下）：
- `小夜/小夜.wav`、`小夜/小夜采样.wav`
- `恶魔叮/恶魔叮采样.wav`、`恶魔叮/恶魔叮采样2.wav`、`恶魔叮/恶魔叮战斗.wav`、`恶魔叮/恶魔叮2号采样.wav`
- `猴麦仔/猴麦仔采样.wav`
- `里拉鳐音节/里拉鳐音节1.wav`、`里拉鳐音节/里拉鳐2.wav`

---

## 二、预设旋律更新（presetMelodies.ts）

- 删除框架示例旋律（号儿鱼合唱序曲、里拉鳐独奏夜曲）
- 新增 **人鱼湾 正谱**（完整 9 小节）
  - 来源：洛克王国人鱼湾 BGM，笛小笛制谱
  - 调式：1=F，4/4 拍，90 BPM
  - `root: 'F'`，所有音符自动移调到 F 调

---

## 三、音频引擎 Bug 修复（audioEngine.ts）

### 3.1 修复跨 root 八度跳变问题
**根因**：`bestPlayableBaseSemitone` 动态选八度时，`targetSemitone = note.offset + root.offset` 可超出 12，导致不同音符跳到不同八度，音高忽高忽低。

**修复**：为所有单文件音色添加 `baseSemitoneOffset` 字段（绝对固定值），引擎检测到该字段后直接用固定值，完全绕过动态八度计算。

### 3.2 修复 trimEndMs=0 导致无声
**根因**：`cropBuffer` 中 `typeof 0 === 'number'` 为 true，`trimEndMs=0` 被误判为「裁到第 0 帧」，buffer 只剩 1 个采样，完全无声。

**修复**：改为 `trimEndMs != null && trimEndMs > 0` 才执行截尾，0 或 undefined 均视为「保留到末尾」。

### 3.3 移除 trimBuffer 自动静音裁切
移除了加载采样时自动裁剪头尾静音的 `trimBuffer` 步骤（阈值 0.005），改为原声直通。避免弱音头（如恶魔叮前段）被误识别为静音裁掉。

---

## 四、Legato 连奏模式（audioEngine.ts + App.tsx）

### 4.1 新增 playNoteLegato 方法
预设旋律播放时改用 legato 模式，与手动弹键的 `playNote` 分开：

- **attack 3ms**（原 12ms），去除弹拨感
- **crossfade 80ms**，相邻音符交叠过渡，消除断开感
- **granular synthesis 拉伸**：采样短于目标时长时，将采样稳定中段（20%~90%）切成 30% 重叠粒子填满时长，实现时间拉伸效果，不重复音头

### 4.2 App.tsx 连奏调度
- 预设旋律中相邻音符提前 **80ms** 启动（与 crossfade 对齐）
- `activeNote` 高亮动画仍按乐谱时值显示

---

## 五、playPresetMelody Bug 修复（App.tsx）

**根因**：`playPresetMelody` 中 `if (preset.root) setScaleRoot(preset.root)` 会在播完 F 调预设后把全局 Key Root 改成 F，导致手动弹键全部跑调。

**修复**：改用局部变量 `const presetRoot = preset.root ?? scaleRoot`，不再修改全局状态。

---

## 六、新增功能：BGM 解析旋律

- 新增 `audio/pitchDetector.ts`：浏览器端 YIN 音高检测算法
- 新增 `audio/bgmAnalyser.ts`：音高序列 → 量化音符乐谱
- UI 新增「解析 BGM 旋律」按钮，支持上传音频文件自动提取主旋律并演奏
- 支持进度条显示解析进度

---

## 七、人鱼湾伴奏垫音

- `人鱼湾 正谱` 现在会同步播放 `public/sounds/人鱼湾伴奏.wav` 作为低音量背景垫音。
- 新增预设字段：`backingFile`、`backingGain`、`backingStartMs`、`backingLoop`。
- 旋律结束后背景垫音会淡出停止，不影响手动弹奏。
