import type { PresetMelody } from '../types';

export const PRESET_MELODIES: PresetMelody[] = [
  {
    id: 'opening-hop',
    name: 'Opening Hop',
    description: 'Short upbeat demo phrase for the first stage presentation.',
    style: 'bright',
    events: [
      { note: 'C', durationMs: 240, velocity: 0.95 },
      { note: 'E', durationMs: 240, velocity: 0.9 },
      { note: 'G', durationMs: 360, velocity: 1 },
      { note: 'E', durationMs: 240, velocity: 0.86 },
      { note: 'F', durationMs: 240, velocity: 0.92 },
      { note: 'A', durationMs: 360, velocity: 1 },
      { note: 'G', durationMs: 480, velocity: 0.9 },
      { note: 'C', durationMs: 520, velocity: 1 }
    ]
  },
  {
    id: 'soft-call',
    name: 'Soft Call',
    description: 'Gentle call-and-response preset for softer voice samples.',
    style: 'soft',
    events: [
      { note: 'C', durationMs: 480, velocity: 0.7 },
      { note: 'D', durationMs: 480, velocity: 0.72 },
      { note: 'E', durationMs: 720, velocity: 0.8 },
      { note: 'G', durationMs: 480, velocity: 0.76 },
      { note: 'E', durationMs: 480, velocity: 0.68 },
      { note: 'D', durationMs: 720, velocity: 0.7 },
      { note: 'C', durationMs: 900, velocity: 0.82 }
    ]
  },
  {
    id: 'button-dance',
    name: 'Button Dance',
    description: 'Fast rhythmic preset for LED sync testing.',
    style: 'electro',
    events: [
      { note: 'C', durationMs: 150, velocity: 1 },
      { note: 'G', durationMs: 150, velocity: 0.92 },
      { note: 'C', durationMs: 150, velocity: 0.9 },
      { note: 'A', durationMs: 300, velocity: 1 },
      { note: 'F', durationMs: 150, velocity: 0.9 },
      { note: 'E', durationMs: 150, velocity: 0.88 },
      { note: 'D', durationMs: 150, velocity: 0.86 },
      { note: 'G', durationMs: 300, velocity: 1 },
      { note: 'C', durationMs: 450, velocity: 1 }
    ]
  },
  {
    id: 'mermaid-bay-vocal',
    name: '人鱼湾 正谱',
    description: '洛克王国人鱼湾BGM正谱（笛小笛制），1=F 4/4，60BPM，舒缓抒情，每音充分共鸣。',
    style: 'soft',
    root: 'F',
    events: [
      // ════════════════════════════════════════════
      // 行1 · 第1小节（弱起）：0 0 0  [0 1 2]
      // 60BPM：十六分=250ms  八分=500ms  附点八分=750ms  四分=1000ms  附点四分=1500ms  二分=2000ms
      // ════════════════════════════════════════════
      { note: 'C', durationMs: 250, velocity: 0.76 }, // 1（十六分pickup）
      { note: 'D', durationMs: 250, velocity: 0.78 }, // 2

      // ════════════════════════════════════════════
      // 行1 · 第2小节：[3̲3̲]  [3̲·3̲2̲3̲]  4  -
      // ════════════════════════════════════════════
      { note: 'E', durationMs: 500, velocity: 0.88 }, // 3（八分）
      { note: 'E', durationMs: 500, velocity: 0.88 }, // 3
      { note: 'E', durationMs: 750, velocity: 0.90 }, // 3·（附点八分）
      { note: 'E', durationMs: 250, velocity: 0.86 }, // 3（十六分）
      { note: 'D', durationMs: 250, velocity: 0.84 }, // 2
      { note: 'E', durationMs: 250, velocity: 0.86 }, // 3
      { note: 'F', durationMs: 2000, velocity: 0.90 }, // 4–（二分，含延音）

      // ════════════════════════════════════════════
      // 行1 · 第3小节：[5̲5̲]  [2̲4̲]  3  [2̲3̲]
      // ════════════════════════════════════════════
      { note: 'G', durationMs: 500, velocity: 0.88 }, // 5（八分）
      { note: 'G', durationMs: 500, velocity: 0.88 }, // 5
      { note: 'D', durationMs: 500, velocity: 0.86 }, // 2（八分）
      { note: 'F', durationMs: 500, velocity: 0.88 }, // 4
      { note: 'E', durationMs: 1000, velocity: 0.90 }, // 3（四分）
      { note: 'D', durationMs: 500, velocity: 0.86 }, // 2（八分）
      { note: 'E', durationMs: 500, velocity: 0.88 }, // 3

      // ════════════════════════════════════════════
      // 行2 · 第4小节：1  [1̲6̲·1̲]  2·  3
      // ════════════════════════════════════════════
      { note: 'C', durationMs: 1000, velocity: 0.88 }, // 1（四分）
      { note: 'C', durationMs: 500, velocity: 0.86 },  // 1（八分）
      { note: 'A', durationMs: 750, velocity: 0.90 },  // 6·（附点八分）
      { note: 'C', durationMs: 250, velocity: 0.86 },  // 1（十六分）
      { note: 'D', durationMs: 1500, velocity: 0.90 }, // 2·（附点四分）
      { note: 'E', durationMs: 1000, velocity: 0.92 }, // 3（四分）

      // ════════════════════════════════════════════
      // 行2 · 第5小节：[1̲3̲]  [4̲5̲]  2·  [3̲·4̲]
      // ════════════════════════════════════════════
      { note: 'C', durationMs: 500, velocity: 0.88 },  // 1（八分）
      { note: 'E', durationMs: 500, velocity: 0.90 },  // 3
      { note: 'F', durationMs: 500, velocity: 0.92 },  // 4（八分）
      { note: 'G', durationMs: 500, velocity: 0.92 },  // 5
      { note: 'D', durationMs: 1500, velocity: 0.90 }, // 2·（附点四分）
      { note: 'E', durationMs: 750, velocity: 0.92 },  // 3·（附点八分）
      { note: 'F', durationMs: 250, velocity: 0.88 },  // 4（十六分）

      // ════════════════════════════════════════════
      // 行2 · 第6小节：[5̲5̲]  [5̲6̲·7̲]  5·  [6̲·7̲]
      // ════════════════════════════════════════════
      { note: 'G', durationMs: 500, velocity: 0.92 },  // 5（八分）
      { note: 'G', durationMs: 500, velocity: 0.92 },  // 5
      { note: 'G', durationMs: 500, velocity: 0.92 },  // 5（八分）
      { note: 'A', durationMs: 750, velocity: 0.94 },  // 6·（附点八分）
      { note: 'B', durationMs: 250, velocity: 0.90 },  // 7（十六分）
      { note: 'G', durationMs: 1500, velocity: 0.92 }, // 5·（附点四分）
      { note: 'A', durationMs: 750, velocity: 0.90 },  // 6·（附点八分）
      { note: 'B', durationMs: 250, velocity: 0.88 },  // 7（十六分）

      // ════════════════════════════════════════════
      // 行3 · 第7小节：[i̲5̲]  [5̲4̲]  3  [5̲2̲]
      // ════════════════════════════════════════════
      { note: 'C', durationMs: 500, velocity: 0.94 },  // i（高C，八分）
      { note: 'G', durationMs: 500, velocity: 0.92 },  // 5
      { note: 'G', durationMs: 500, velocity: 0.90 },  // 5（八分）
      { note: 'F', durationMs: 500, velocity: 0.88 },  // 4
      { note: 'E', durationMs: 1000, velocity: 0.92 }, // 3（四分）
      { note: 'G', durationMs: 500, velocity: 0.90 },  // 5（八分）
      { note: 'D', durationMs: 500, velocity: 0.88 },  // 2

      // ════════════════════════════════════════════
      // 行3 · 第8小节：[i̲i̲]  [7̲·i̲]  6  2̇
      // ════════════════════════════════════════════
      { note: 'C', durationMs: 500, velocity: 0.94 },  // i（八分）
      { note: 'C', durationMs: 500, velocity: 0.94 },  // i
      { note: 'B', durationMs: 750, velocity: 0.92 },  // 7·（附点八分）
      { note: 'C', durationMs: 250, velocity: 0.90 },  // i（十六分）
      { note: 'A', durationMs: 1000, velocity: 0.92 }, // 6（四分）
      { note: 'D', durationMs: 1000, velocity: 0.94 }, // 2̇（高八度D，四分）

      // ════════════════════════════════════════════
      // 行3 · 第9小节：[i̲7̲]  [6̲7̲]  i  -  ‖
      // ════════════════════════════════════════════
      { note: 'C', durationMs: 500, velocity: 0.96 },  // i（八分）
      { note: 'B', durationMs: 500, velocity: 0.94 },  // 7
      { note: 'A', durationMs: 500, velocity: 0.92 },  // 6（八分）
      { note: 'B', durationMs: 500, velocity: 0.94 },  // 7
      { note: 'C', durationMs: 2000, velocity: 1.00 }, // i–（二分，终止）
    ]
  },
  {
    id: 'peter-avenue-vocal',
    name: '彼得大道 Vocal',
    description: '洛克王国彼得大道/商店街BGM主旋律手录简谱，欢快跳跃，C大调。',
    style: 'bright',
    root: 'C',
    events: [
      // ── 前奏：5 6 | 1· 2· 3· 5· | 6· - - - ──
      { note: 'G', durationMs: 200, velocity: 0.82 },
      { note: 'A', durationMs: 200, velocity: 0.85 },
      { note: 'C', durationMs: 200, velocity: 0.9  },
      { note: 'D', durationMs: 200, velocity: 0.9  },
      { note: 'E', durationMs: 200, velocity: 0.92 },
      { note: 'G', durationMs: 200, velocity: 0.92 },
      { note: 'A', durationMs: 800, velocity: 0.88 },

      // ── 第一段 Line 1：1· 2· | 3· 5· 3· 1· | 2· 3· 2· 1· | 6 1· 6 5 | 3 – ──
      { note: 'C', durationMs: 200, velocity: 0.92 },
      { note: 'D', durationMs: 200, velocity: 0.92 },
      { note: 'E', durationMs: 200, velocity: 0.96 },
      { note: 'G', durationMs: 200, velocity: 0.96 },
      { note: 'E', durationMs: 200, velocity: 0.92 },
      { note: 'C', durationMs: 200, velocity: 0.9  },
      { note: 'D', durationMs: 200, velocity: 0.9  },
      { note: 'E', durationMs: 200, velocity: 0.92 },
      { note: 'D', durationMs: 200, velocity: 0.88 },
      { note: 'C', durationMs: 200, velocity: 0.88 },
      { note: 'A', durationMs: 200, velocity: 0.86 },
      { note: 'C', durationMs: 200, velocity: 0.9  },
      { note: 'A', durationMs: 200, velocity: 0.86 },
      { note: 'G', durationMs: 200, velocity: 0.84 },
      { note: 'E', durationMs: 600, velocity: 0.9  },

      // ── 第一段 Line 2：1· 2· | 3· 5· 3· 1· | 2· 3· 5· 3· | 2· – ──
      { note: 'C', durationMs: 200, velocity: 0.92 },
      { note: 'D', durationMs: 200, velocity: 0.92 },
      { note: 'E', durationMs: 200, velocity: 0.96 },
      { note: 'G', durationMs: 200, velocity: 0.96 },
      { note: 'E', durationMs: 200, velocity: 0.92 },
      { note: 'C', durationMs: 200, velocity: 0.9  },
      { note: 'D', durationMs: 200, velocity: 0.9  },
      { note: 'E', durationMs: 200, velocity: 0.92 },
      { note: 'G', durationMs: 200, velocity: 0.94 },
      { note: 'E', durationMs: 200, velocity: 0.88 },
      { note: 'D', durationMs: 800, velocity: 0.86 },

      // ── 第二段 Line 1：1· 2· | 3· 5· 3· 1· | 2· 3· 2· 1· | 6 1· 6 5 | 2 – ──
      { note: 'C', durationMs: 200, velocity: 0.94 },
      { note: 'D', durationMs: 200, velocity: 0.94 },
      { note: 'E', durationMs: 200, velocity: 0.98 },
      { note: 'G', durationMs: 200, velocity: 0.98 },
      { note: 'E', durationMs: 200, velocity: 0.94 },
      { note: 'C', durationMs: 200, velocity: 0.92 },
      { note: 'D', durationMs: 200, velocity: 0.92 },
      { note: 'E', durationMs: 200, velocity: 0.94 },
      { note: 'D', durationMs: 200, velocity: 0.9  },
      { note: 'C', durationMs: 200, velocity: 0.9  },
      { note: 'A', durationMs: 200, velocity: 0.88 },
      { note: 'C', durationMs: 200, velocity: 0.92 },
      { note: 'A', durationMs: 200, velocity: 0.88 },
      { note: 'G', durationMs: 200, velocity: 0.86 },
      { note: 'D', durationMs: 600, velocity: 0.9  },

      // ── 第二段 Line 2：5 6 | 1· 6 1· 2· | 3· 2· 3· 5· | 1· - - - | 1· – ──
      { note: 'G', durationMs: 200, velocity: 0.88 },
      { note: 'A', durationMs: 200, velocity: 0.9  },
      { note: 'C', durationMs: 200, velocity: 0.94 },
      { note: 'A', durationMs: 200, velocity: 0.9  },
      { note: 'C', durationMs: 200, velocity: 0.94 },
      { note: 'D', durationMs: 200, velocity: 0.94 },
      { note: 'E', durationMs: 200, velocity: 0.96 },
      { note: 'D', durationMs: 200, velocity: 0.92 },
      { note: 'E', durationMs: 200, velocity: 0.94 },
      { note: 'G', durationMs: 200, velocity: 0.98 },
      { note: 'C', durationMs: 800, velocity: 1.0  }
    ]
  }
,
  {
    id: 'mixue-theme',
    name: '蜜雪冰城',
    // 1=D，♩=100（四分=600ms）
    // 八分=300ms  附点八分=450ms  十六分=150ms  四分=600ms  附点四分=900ms  二分=1200ms
    // 音级映射（root:'D'）：1→C  2→D  3→E  4→F  5→G  6→A  7→B
    description: '蜜雪冰城主题曲，1=D 大调，100BPM，欢快活泼。AABA 结构，附点节奏律动。',
    style: 'bright',
    root: 'D',
    events: [
      // ══════════════════════════════════════════════════════
      // 行1 A段（第一遍）小节1：3̲ 5̲  5̲·6̲̲  5̲3̲  1̲1̲    （4/4=2400ms）
      //   你  爱  我(melisma)   我  爱  你  蜜
      // ══════════════════════════════════════════════════════
      { note: 'E', durationMs: 300, velocity: 0.85 }, // 3̲ 你
      { note: 'G', durationMs: 300, velocity: 0.85 }, // 5̲ 爱
      { note: 'G', durationMs: 450, velocity: 0.88 }, // 5̲· 我（附点八分）
      { note: 'A', durationMs: 150, velocity: 0.82 }, // 6̲̲ 我（十六分，滑音尾）
      { note: 'G', durationMs: 300, velocity: 0.85 }, // 5̲ 我
      { note: 'E', durationMs: 300, velocity: 0.82 }, // 3̲ 爱
      { note: 'C', durationMs: 300, velocity: 0.80 }, // 1̲ 你
      { note: 'C', durationMs: 300, velocity: 0.78 }, // 1̲ 蜜

      // 行1 A段（第一遍）小节2：2̲  3̲3̲  2̲1̲  2̲-      （2400ms）
      //   雪  冰  城  甜  蜜  蜜～
      { note: 'D', durationMs: 300, velocity: 0.80 }, // 2̲ 雪
      { note: 'E', durationMs: 300, velocity: 0.83 }, // 3̲ 冰
      { note: 'E', durationMs: 300, velocity: 0.83 }, // 3̲ 城
      { note: 'D', durationMs: 300, velocity: 0.80 }, // 2̲ 甜
      { note: 'C', durationMs: 300, velocity: 0.78 }, // 1̲ 蜜
      { note: 'D', durationMs: 900, velocity: 0.75 }, // 2̲- 蜜～（附点四分）

      // ══════════════════════════════════════════════════════
      // 行2 A段（第二遍）小节3：同小节1      （2400ms）
      //   你  爱  我(melisma)   我  爱  你  蜜
      // ══════════════════════════════════════════════════════
      { note: 'E', durationMs: 300, velocity: 0.85 }, // 3̲ 你
      { note: 'G', durationMs: 300, velocity: 0.85 }, // 5̲ 爱
      { note: 'G', durationMs: 450, velocity: 0.88 }, // 5̲· 我
      { note: 'A', durationMs: 150, velocity: 0.82 }, // 6̲̲ 我
      { note: 'G', durationMs: 300, velocity: 0.85 }, // 5̲ 我
      { note: 'E', durationMs: 300, velocity: 0.82 }, // 3̲ 爱
      { note: 'C', durationMs: 300, velocity: 0.80 }, // 1̲ 你
      { note: 'C', durationMs: 300, velocity: 0.78 }, // 1̲ 蜜

      // 行2 A段（第二遍）小节4：2̲  3̲3̲  2̲2̲  1̲-      （2400ms）
      //   雪  冰  城  甜  蜜  蜜～  ← 结尾改落主音 1
      { note: 'D', durationMs: 300, velocity: 0.80 }, // 2̲ 雪
      { note: 'E', durationMs: 300, velocity: 0.83 }, // 3̲ 冰
      { note: 'E', durationMs: 300, velocity: 0.83 }, // 3̲ 城
      { note: 'D', durationMs: 300, velocity: 0.80 }, // 2̲ 甜
      { note: 'D', durationMs: 300, velocity: 0.78 }, // 2̲ 蜜
      { note: 'C', durationMs: 900, velocity: 0.85 }, // 1̲- 蜜～（附点四分，落主音）

      // ══════════════════════════════════════════════════════
      // 行3 B段 小节5：4  4  4̲  6·          （2400ms）
      //   你  爱  我  呀～～
      // ══════════════════════════════════════════════════════
      { note: 'F', durationMs: 600, velocity: 0.88 }, // 4  你（四分）
      { note: 'F', durationMs: 600, velocity: 0.88 }, // 4  爱（四分）
      { note: 'F', durationMs: 300, velocity: 0.85 }, // 4̲ 我（八分）
      { note: 'A', durationMs: 900, velocity: 0.90 }, // 6· 呀～（附点四分）

      // 行3 B段 小节6：5  5̲3̲  2-            （2400ms）
      //   我  爱  你  你～
      { note: 'G', durationMs: 600, velocity: 0.90 }, // 5  我（四分）
      { note: 'G', durationMs: 300, velocity: 0.87 }, // 5̲ 爱（八分）
      { note: 'E', durationMs: 300, velocity: 0.84 }, // 3̲ 你（八分）
      { note: 'D', durationMs: 1200, velocity: 0.82 }, // 2- 你～（二分）

      // ══════════════════════════════════════════════════════
      // 行4 A段（第三遍）小节7：同小节1      （2400ms）
      //   你  爱  我(melisma)   我  爱  你  蜜
      // ══════════════════════════════════════════════════════
      { note: 'E', durationMs: 300, velocity: 0.88 }, // 3̲ 你
      { note: 'G', durationMs: 300, velocity: 0.88 }, // 5̲ 爱
      { note: 'G', durationMs: 450, velocity: 0.90 }, // 5̲· 我
      { note: 'A', durationMs: 150, velocity: 0.85 }, // 6̲̲ 我
      { note: 'G', durationMs: 300, velocity: 0.88 }, // 5̲ 我
      { note: 'E', durationMs: 300, velocity: 0.85 }, // 3̲ 爱
      { note: 'C', durationMs: 300, velocity: 0.83 }, // 1̲ 你
      { note: 'C', durationMs: 300, velocity: 0.80 }, // 1̲ 蜜

      // 行4 A段（第三遍）小节8：2̲  3̲3̲  2̲2̲  1̲-      （结尾拉长）
      //   雪  冰  城  甜  蜜  蜜～～～
      { note: 'D', durationMs: 300, velocity: 0.83 }, // 2̲ 雪
      { note: 'E', durationMs: 300, velocity: 0.85 }, // 3̲ 冰
      { note: 'E', durationMs: 300, velocity: 0.85 }, // 3̲ 城
      { note: 'D', durationMs: 300, velocity: 0.83 }, // 2̲ 甜
      { note: 'D', durationMs: 300, velocity: 0.80 }, // 2̲ 蜜
      { note: 'C', durationMs: 1500, velocity: 0.92 }, // 1̲- 蜜～～（结尾拉长收音）
    ]
  },
  {
    id: 'find-a-friend',
    name: '找朋友',
    // 1=C，2/4拍，♩=120（四分=500ms，八分=250ms）
    // 有底部横线=八分(250ms)，无底部横线=四分(500ms)
    // i（高音1）= 高八度 C，引擎会自动按音高方向选八度
    // 音级：1=C  2=D  3=E  4=F  5=G  6=A  7=B  i→C(高)
    description: '找朋友，1=C 大调，2/4拍 120BPM，经典儿歌，共8小节循环。',
    style: 'bright',
    events: [
      // ── 行1 小节1：5̲ 6̲ 5̲ 6̲  (找啊找啊)  4×250=1000ms ──
      { note: 'G', durationMs: 250, velocity: 0.85 }, // 5̲ 找
      { note: 'A', durationMs: 250, velocity: 0.82 }, // 6̲ 啊
      { note: 'G', durationMs: 250, velocity: 0.85 }, // 5̲ 找
      { note: 'A', durationMs: 250, velocity: 0.82 }, // 6̲ 啊

      // ── 行1 小节2：5̲ 6̲ 5  (找朋友)  250+250+500=1000ms ──
      { note: 'G', durationMs: 250, velocity: 0.85 }, // 5̲ 找
      { note: 'A', durationMs: 250, velocity: 0.82 }, // 6̲ 朋
      { note: 'G', durationMs: 500, velocity: 0.88 }, // 5  友（四分）

      // ── 行1 小节3：5̲ i̲ 7̲ 6̲  (找到一个)  4×250=1000ms ──
      { note: 'G', durationMs: 250, velocity: 0.85 }, // 5̲ 找
      { note: 'C', durationMs: 250, velocity: 0.90 }, // i̲ 到（高音1，高八度C）
      { note: 'B', durationMs: 250, velocity: 0.87 }, // 7̲ 一
      { note: 'A', durationMs: 250, velocity: 0.84 }, // 6̲ 个

      // ── 行1 小节4：5̲ 5̲ 3  (好朋友)  250+250+500=1000ms ──
      { note: 'G', durationMs: 250, velocity: 0.85 }, // 5̲ 好
      { note: 'G', durationMs: 250, velocity: 0.83 }, // 5̲ 朋
      { note: 'E', durationMs: 500, velocity: 0.88 }, // 3  友（四分）

      // ── 行2 小节5：5̲ 5̲ 3̲ 3̲  (敬个礼呀)  4×250=1000ms ──
      { note: 'G', durationMs: 250, velocity: 0.85 }, // 5̲ 敬
      { note: 'G', durationMs: 250, velocity: 0.83 }, // 5̲ 个
      { note: 'E', durationMs: 250, velocity: 0.82 }, // 3̲ 礼
      { note: 'E', durationMs: 250, velocity: 0.80 }, // 3̲ 呀

      // ── 行2 小节6：5̲ 5̲ 3  (握握手)  250+250+500=1000ms ──
      { note: 'G', durationMs: 250, velocity: 0.85 }, // 5̲ 握
      { note: 'G', durationMs: 250, velocity: 0.83 }, // 5̲ 握
      { note: 'E', durationMs: 500, velocity: 0.88 }, // 3  手（四分）

      // ── 行2 小节7：2̲ 4̲ 3̲ 2̲  (你是我的)  4×250=1000ms ──
      { note: 'D', durationMs: 250, velocity: 0.83 }, // 2̲ 你
      { note: 'F', durationMs: 250, velocity: 0.85 }, // 4̲ 是
      { note: 'E', durationMs: 250, velocity: 0.83 }, // 3̲ 我
      { note: 'D', durationMs: 250, velocity: 0.80 }, // 2̲ 的

      // ── 行2 小节8：1̲ 2̲ 1  (好朋友)  250+250+500=1000ms ──
      { note: 'C', durationMs: 250, velocity: 0.83 }, // 1̲ 好
      { note: 'D', durationMs: 250, velocity: 0.80 }, // 2̲ 朋
      { note: 'C', durationMs: 750, velocity: 0.92 }, // 1  友（结尾稍拉长）
    ]
  }
,
  {
    id: 'nuannuan',
    name: '暖暖',
    // 1=C，4/4拍，♩≈80BPM
    // 四分=750ms  八分=375ms  附点四分=1125ms  附点八分=562ms  十六分=187ms  二分=1500ms  全音符=3000ms
    // 音级：1=C  2=D  3=E  4=F  5=G  6=A  7=B  i=C(高)
    description: '暖暖，1=C 大调，4/4拍 80BPM，温柔抒情，梁静茹经典情歌主歌+副歌。',
    style: 'soft',
    root: 'C',
    events: [
      // ══════════════════════════════════════════════════════
      // 行1 主歌A段（第一遍）
      // 小节1：2̲3̲3̲  2̲3̲3̲  (随便的 你说的)
      // ══════════════════════════════════════════════════════
      { note: 'D', durationMs: 375, velocity: 0.82 }, // 2̲ 随
      { note: 'E', durationMs: 375, velocity: 0.84 }, // 3̲ 便
      { note: 'E', durationMs: 375, velocity: 0.84 }, // 3̲ 的
      { note: 'D', durationMs: 375, velocity: 0.82 }, // 2̲ 你
      { note: 'E', durationMs: 375, velocity: 0.84 }, // 3̲ 说
      { note: 'E', durationMs: 375, velocity: 0.84 }, // 3̲ 的

      // 小节2：2̲3̲5̲3̲1̲  1̲5̲  (我都愿意去 小火)
      { note: 'D', durationMs: 375, velocity: 0.82 }, // 2̲
      { note: 'E', durationMs: 375, velocity: 0.84 }, // 3̲
      { note: 'G', durationMs: 375, velocity: 0.86 }, // 5̲
      { note: 'E', durationMs: 375, velocity: 0.84 }, // 3̲
      { note: 'C', durationMs: 375, velocity: 0.82 }, // 1̲
      { note: 'C', durationMs: 375, velocity: 0.82 }, // 1̲ 小
      { note: 'G', durationMs: 375, velocity: 0.86 }, // 5̲ 火

      // 小节3：6̣·  3̲2̲  1̲2̲  (车 摆动的 旋律)  — 低音La（6̣=A3）
      { note: 'A', durationMs: 1125, velocity: 0.90, octave: -1 }, // 6̣· 车（附点四分，低八度）
      { note: 'E', durationMs: 375, velocity: 0.84 }, // 3̲ 摆
      { note: 'D', durationMs: 375, velocity: 0.82 }, // 2̲ 动
      { note: 'C', durationMs: 375, velocity: 0.82 }, // 1̲ 的
      { note: 'D', durationMs: 375, velocity: 0.82 }, // 2̲ 旋

      // 小节4：3 -  0̲5̲1̲2̲  (律 都可以)
      { note: 'E', durationMs: 1500, velocity: 0.88 }, // 3- 律（二分）
      // 0 休止（省略，直接接下行 pickup）
      { note: 'G', durationMs: 375, velocity: 0.80 }, // 5̲ 都
      { note: 'C', durationMs: 375, velocity: 0.82 }, // 1̲ 可
      { note: 'D', durationMs: 375, velocity: 0.82 }, // 2̲ 以

      // ══════════════════════════════════════════════════════
      // 行2 主歌A段（第二遍）
      // 小节5：2̲3̲3̲  2̲3̲3̲  (是真的 你说的)
      // ══════════════════════════════════════════════════════
      { note: 'D', durationMs: 375, velocity: 0.84 }, // 2̲
      { note: 'E', durationMs: 375, velocity: 0.86 }, // 3̲
      { note: 'E', durationMs: 375, velocity: 0.86 }, // 3̲
      { note: 'D', durationMs: 375, velocity: 0.84 }, // 2̲
      { note: 'E', durationMs: 375, velocity: 0.86 }, // 3̲
      { note: 'E', durationMs: 375, velocity: 0.86 }, // 3̲

      // 小节6：2̲3̲5̲3̲1̲  1̲7̣̲  (我都会相信 因为) — 末尾低音Si（7̣=B3）
      { note: 'D', durationMs: 375, velocity: 0.84 }, // 2̲
      { note: 'E', durationMs: 375, velocity: 0.86 }, // 3̲
      { note: 'G', durationMs: 375, velocity: 0.88 }, // 5̲
      { note: 'E', durationMs: 375, velocity: 0.86 }, // 3̲
      { note: 'C', durationMs: 375, velocity: 0.84 }, // 1̲
      { note: 'C', durationMs: 375, velocity: 0.84 }, // 1̲
      { note: 'B', durationMs: 375, velocity: 0.86, octave: -1 }, // 7̣̲ 低音Si

      // 小节7：6̣·  3̲2̲  1̲2̲  (我 完全 信任) — 低音La
      { note: 'A', durationMs: 1125, velocity: 0.90, octave: -1 }, // 6̣·（低八度）
      { note: 'E', durationMs: 375, velocity: 0.84 }, // 3̲
      { note: 'D', durationMs: 375, velocity: 0.82 }, // 2̲
      { note: 'C', durationMs: 375, velocity: 0.82 }, // 1̲
      { note: 'D', durationMs: 375, velocity: 0.82 }, // 2̲

      // 小节8：1 - -  1̲7̣̲  + 小节9：6̣̲1̲2̲1̲2̲  (你 细腻的喜欢) — 低音Si、低音La
      { note: 'C', durationMs: 2250, velocity: 0.88 }, // 1--- 你（三拍延音）
      { note: 'C', durationMs: 375, velocity: 0.82 }, // 1̲
      { note: 'B', durationMs: 375, velocity: 0.84, octave: -1 }, // 7̣̲ 低音Si
      { note: 'A', durationMs: 375, velocity: 0.84, octave: -1 }, // 6̣̲ 低音La
      { note: 'C', durationMs: 375, velocity: 0.86 }, // 1̲
      { note: 'D', durationMs: 375, velocity: 0.86 }, // 2̲
      { note: 'C', durationMs: 375, velocity: 0.84 }, // 1̲
      { note: 'D', durationMs: 375, velocity: 0.84 }, // 2̲

      // ══════════════════════════════════════════════════════
      // 行3 主歌B段（低音La/Si 均低八度）
      // 小节10：3̲5̲2̲3̲1̲  1̲7̣̲  (般的厚重感 晒过)
      // ══════════════════════════════════════════════════════
      { note: 'E', durationMs: 375, velocity: 0.86 }, // 3̲
      { note: 'G', durationMs: 375, velocity: 0.88 }, // 5̲
      { note: 'D', durationMs: 375, velocity: 0.84 }, // 2̲
      { note: 'E', durationMs: 375, velocity: 0.86 }, // 3̲
      { note: 'C', durationMs: 375, velocity: 0.84 }, // 1̲
      { note: 'C', durationMs: 375, velocity: 0.84 }, // 1̲
      { note: 'B', durationMs: 375, velocity: 0.86, octave: -1 }, // 7̣̲ 低音Si

      // 小节11：6̣̲  1̲  2̲3̲2̲1̲2̲  (太 阳 熟悉的安全感) — 低音La
      { note: 'A', durationMs: 750, velocity: 0.88, octave: -1 }, // 6̣̲ 太（低八度四分）
      { note: 'C', durationMs: 750, velocity: 0.88 }, // 1̲ 阳
      { note: 'D', durationMs: 375, velocity: 0.86 }, // 2̲
      { note: 'E', durationMs: 375, velocity: 0.88 }, // 3̲
      { note: 'D', durationMs: 375, velocity: 0.86 }, // 2̲
      { note: 'C', durationMs: 375, velocity: 0.84 }, // 1̲
      { note: 'D', durationMs: 375, velocity: 0.84 }, // 2̲

      // 小节12：3 - -  1̲7̣̲  (感 分享) — 低音Si
      { note: 'E', durationMs: 2250, velocity: 0.90 }, // 3---
      { note: 'C', durationMs: 375, velocity: 0.82 }, // 1̲
      { note: 'B', durationMs: 375, velocity: 0.84, octave: -1 }, // 7̣̲ 低音Si

      // 小节13：6̣̲  1̲  2̲3̲2̲1̲2̲  (热 汤 我们两支) — 低音La
      { note: 'A', durationMs: 750, velocity: 0.88, octave: -1 }, // 6̣̲（低八度）
      { note: 'C', durationMs: 750, velocity: 0.88 }, // 1̲
      { note: 'D', durationMs: 375, velocity: 0.86 }, // 2̲
      { note: 'E', durationMs: 375, velocity: 0.88 }, // 3̲
      { note: 'D', durationMs: 375, velocity: 0.86 }, // 2̲
      { note: 'C', durationMs: 375, velocity: 0.84 }, // 1̲
      { note: 'D', durationMs: 375, velocity: 0.84 }, // 2̲

      // ══════════════════════════════════════════════════════
      // 行4 主歌C段
      // 小节14：3̲5̲5̲3̲6̲  3̲2̲  (汤匙一个碗 左心)
      // ══════════════════════════════════════════════════════
      { note: 'E', durationMs: 375, velocity: 0.88 }, // 3̲
      { note: 'G', durationMs: 375, velocity: 0.90 }, // 5̲
      { note: 'G', durationMs: 375, velocity: 0.90 }, // 5̲
      { note: 'E', durationMs: 375, velocity: 0.88 }, // 3̲
      { note: 'A', durationMs: 375, velocity: 0.90 }, // 6̲
      { note: 'E', durationMs: 375, velocity: 0.88 }, // 3̲
      { note: 'D', durationMs: 375, velocity: 0.86 }, // 2̲

      // 小节15：1·  3̲2̲2̲1̲2̲  (房 暖暖的好饱满)
      { note: 'C', durationMs: 1125, velocity: 0.92 }, // 1· 房（附点四分）
      { note: 'E', durationMs: 375, velocity: 0.86 }, // 3̲
      { note: 'D', durationMs: 375, velocity: 0.84 }, // 2̲
      { note: 'D', durationMs: 375, velocity: 0.84 }, // 2̲
      { note: 'C', durationMs: 375, velocity: 0.84 }, // 1̲
      { note: 'D', durationMs: 375, velocity: 0.84 }, // 2̲

      // 小节16：1 - 0̲1̲3̲4̲  (满 我想说)
      { note: 'C', durationMs: 1500, velocity: 0.90 }, // 1-
      { note: 'C', durationMs: 375, velocity: 0.80 }, // 1̲
      { note: 'E', durationMs: 375, velocity: 0.82 }, // 3̲
      { note: 'F', durationMs: 375, velocity: 0.84 }, // 4̲

      // 小节17：5̲1̲3̲4̲5̲  6̲7̲  (其实你很好 你自)
      { note: 'G', durationMs: 375, velocity: 0.88 }, // 5̲
      { note: 'C', durationMs: 375, velocity: 0.86 }, // 1̲
      { note: 'E', durationMs: 375, velocity: 0.88 }, // 3̲
      { note: 'F', durationMs: 375, velocity: 0.90 }, // 4̲
      { note: 'G', durationMs: 375, velocity: 0.90 }, // 5̲
      { note: 'A', durationMs: 375, velocity: 0.90 }, // 6̲
      { note: 'B', durationMs: 375, velocity: 0.90 }, // 7̲

      // ══════════════════════════════════════════════════════
      // 行5 副歌
      // 小节18：i̲3̲3̲4̲5̲ -  (己却不知道)
      // ══════════════════════════════════════════════════════
      { note: 'C', durationMs: 375, velocity: 0.94 }, // i̲ 己（高C）
      { note: 'E', durationMs: 375, velocity: 0.90 }, // 3̲
      { note: 'E', durationMs: 375, velocity: 0.90 }, // 3̲
      { note: 'F', durationMs: 375, velocity: 0.92 }, // 4̲
      { note: 'G', durationMs: 375, velocity: 0.92 }, // 5̲
      { note: 'G', durationMs: 1125, velocity: 0.90 }, // 5-（附点四分延音）

      // 小节19：6̲  5̲4̲5̲i̲i̲  (真 心的对我好)
      { note: 'A', durationMs: 750, velocity: 0.90 }, // 6̲
      { note: 'G', durationMs: 375, velocity: 0.88 }, // 5̲
      { note: 'F', durationMs: 375, velocity: 0.88 }, // 4̲
      { note: 'G', durationMs: 375, velocity: 0.90 }, // 5̲
      { note: 'C', durationMs: 375, velocity: 0.94 }, // i̲（高C）
      { note: 'C', durationMs: 375, velocity: 0.94 }, // i̲

      // 小节20：6̲  6̲7̲i̲7̲  (不 要求回报)
      { note: 'A', durationMs: 750, velocity: 0.90 }, // 6̲
      { note: 'A', durationMs: 375, velocity: 0.88 }, // 6̲
      { note: 'B', durationMs: 375, velocity: 0.90 }, // 7̲
      { note: 'C', durationMs: 375, velocity: 0.94 }, // i̲
      { note: 'B', durationMs: 375, velocity: 0.90 }, // 7̲

      // 小节21：5̲  3̲4̲5̲  6̲7̲  (爱 一个人 希望)
      { note: 'G', durationMs: 750, velocity: 0.90 }, // 5̲
      { note: 'E', durationMs: 375, velocity: 0.88 }, // 3̲
      { note: 'F', durationMs: 375, velocity: 0.90 }, // 4̲
      { note: 'G', durationMs: 375, velocity: 0.92 }, // 5̲
      { note: 'A', durationMs: 375, velocity: 0.92 }, // 6̲
      { note: 'B', durationMs: 375, velocity: 0.92 }, // 7̲

      // ══════════════════════════════════════════════════════
      // 行6 副歌（续）
      // 小节22：i̲  7̲6̲5̲ -  (他 过更好)
      // ══════════════════════════════════════════════════════
      { note: 'C', durationMs: 750, velocity: 0.94 }, // i̲
      { note: 'B', durationMs: 375, velocity: 0.90 }, // 7̲
      { note: 'A', durationMs: 375, velocity: 0.88 }, // 6̲
      { note: 'G', durationMs: 375, velocity: 0.86 }, // 5̲
      { note: 'G', durationMs: 1125, velocity: 0.84 }, // 5- 延音

      // 小节23：4̲5̲6̲4̲5̲i̲i̲  (打从心里暖暖的)
      { note: 'F', durationMs: 375, velocity: 0.86 }, // 4̲
      { note: 'G', durationMs: 375, velocity: 0.88 }, // 5̲
      { note: 'A', durationMs: 375, velocity: 0.90 }, // 6̲
      { note: 'F', durationMs: 375, velocity: 0.88 }, // 4̲
      { note: 'G', durationMs: 375, velocity: 0.90 }, // 5̲
      { note: 'C', durationMs: 375, velocity: 0.94 }, // i̲
      { note: 'C', durationMs: 375, velocity: 0.94 }, // i̲

      // 小节24：i̲7̲5̲1̲3̲2̲  (你比自己更重)
      { note: 'C', durationMs: 375, velocity: 0.94 }, // i̲
      { note: 'B', durationMs: 375, velocity: 0.90 }, // 7̲
      { note: 'G', durationMs: 375, velocity: 0.88 }, // 5̲
      { note: 'C', durationMs: 375, velocity: 0.88 }, // 1̲
      { note: 'E', durationMs: 375, velocity: 0.90 }, // 3̲
      { note: 'D', durationMs: 375, velocity: 0.88 }, // 2̲

      // 小节25：1（终止）
      { note: 'C', durationMs: 3000, velocity: 0.96 }, // 1 要（终止，充分延音）
    ]
  }
];
