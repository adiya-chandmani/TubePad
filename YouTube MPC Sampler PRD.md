# YouTube MPC Sampler 웹사이트 PRD

## 1. 프로젝트 개요

### 프로젝트명
**TubePad** *(가칭)*

### 한 줄 설명
**YouTube 영상의 원하는 구간을 16개의 패드에 저장하고, 키보드로 MPC처럼 연주할 수 있는 웹 기반 샘플러**

### 핵심 컨셉

사용자는 YouTube 링크를 입력한 뒤 영상에서 원하는 구간을 선택한다.

선택한 구간을 16개의 패드 중 하나에 저장하고, 키보드를 눌러 해당 구간을 즉시 재생한다.

각 패드에는 별도의 **Playback Rate**를 설정할 수 있어 같은 영상을 느리게 또는 빠르게 재생할 수 있다.

```text
YouTube 링크 입력
        ↓
영상 재생
        ↓
원하는 구간 Start / End 지정
        ↓
16 Pad 중 하나에 저장
        ↓
Playback Rate 설정
        ↓
키보드로 연주
```

---

# 2. 프로젝트 목표

기존 YouTube 플레이어는 영상을 보는 용도에 집중되어 있다.

TubePad는 YouTube 영상을 하나의 **연주 가능한 재료**로 바꾸는 것을 목표로 한다.

### 핵심 경험

**Paste → Chop → Assign → Play**

1. YouTube 링크를 붙여넣는다.
2. 영상에서 원하는 구간을 자른다.
3. 해당 구간을 Pad에 저장한다.
4. 키보드로 Pad를 연주한다.

사용자가 음악 제작 프로그램을 몰라도 몇 초 안에 사용할 수 있어야 한다.

---

# 3. 타깃 사용자

### 1차 타깃

- 음악을 좋아하는 일반 사용자
- MPC / SP-404 / Sampling에 관심 있는 사용자
- 힙합 / Lo-fi / Remix 제작에 관심 있는 사용자
- YouTube 영상의 대사나 소리를 가지고 놀고 싶은 사용자

### 2차 타깃

- Beat Maker
- DJ
- 콘텐츠 크리에이터
- Meme / Remix 제작자
- 음악 제작을 처음 접하는 사용자

---

# 4. 핵심 차별점

일반 Sampler는 먼저 MP3나 WAV 파일을 준비해야 한다.

TubePad는 사용자가 평소 사용하는 **YouTube를 Sample 탐색 인터페이스로 사용한다.**

```text
기존 Sampler

Audio File
↓
Import
↓
Trim
↓
Pad Assign
↓
Play


TubePad

YouTube
↓
원하는 순간 발견
↓
I / O
↓
Pad
↓
Play
```

파일을 먼저 준비해야 하는 과정을 최소화한다.

---

# 5. 핵심 기능

## 5.1 YouTube URL 입력

화면 상단에 URL 입력창을 제공한다.

```text
Paste YouTube URL

[ https://youtube.com/watch?v=xxxxxxxx ]

                         [ LOAD ]
```

### 기능

- YouTube URL 입력
- Video ID 자동 추출
- YouTube Player 로드
- 영상 제목 표시
- 현재 재생 시간 표시
- 전체 영상 길이 표시

---

# 6. YouTube Player

YouTube IFrame Player API를 사용한다.

### 기본 기능

- Play
- Pause
- Seek
- Volume
- Playback Rate
- Current Time 표시

예:

```text
┌──────────────────────────────┐
│                              │
│        YouTube Video         │
│                              │
│                              │
└──────────────────────────────┘

01:13.240                03:42

━━━━━━━━━━━━●━━━━━━━━━━━━━━
```

---

# 7. Sample 구간 지정

사용자가 영상의 원하는 부분을 선택한다.

### Start 지정

키보드:

```text
I
```

또는 UI:

```text
SET START
```

현재 시간을 Sample Start로 저장한다.

예:

```text
START

01:13.240
```

---

### End 지정

키보드:

```text
O
```

또는:

```text
SET END
```

현재 시간을 Sample End로 저장한다.

예:

```text
END

01:15.820
```

---

### Sample 구간

```text
01:13.240
     ↓

━━━━━━━━━━━━━━━━━━━

                ↑
            01:15.820
```

Sample Duration:

```text
2.580 sec
```

---

# 8. 16 Pad

메인 인터페이스에는 MPC 스타일의 4×4 Pad를 배치한다.

```text
┌──────┬──────┬──────┬──────┐
│  1   │  2   │  3   │  4   │
├──────┼──────┼──────┼──────┤
│  Q   │  W   │  E   │  R   │
├──────┼──────┼──────┼──────┤
│  A   │  S   │  D   │  F   │
├──────┼──────┼──────┼──────┤
│  Z   │  X   │  C   │  V   │
└──────┴──────┴──────┴──────┘
```

각 Pad에는 하나의 Sample 구간을 저장할 수 있다.

---

# 9. Pad Assign

Start / End 지정 후 사용자가 원하는 Pad를 누르면 해당 Sample이 저장된다.

예:

```text
START
01:13.240

END
01:15.820

↓

A

↓

PAD A 저장 완료
```

Pad 정보:

```text
PAD A

YouTube
01:13.240 → 01:15.820

Rate
0.75x
```

---

# 10. Pad Keyboard Mapping

키보드 입력을 최우선 인터페이스로 사용한다.

```text
1 2 3 4
Q W E R
A S D F
Z X C V
```

키보드 위치와 화면의 Pad 위치를 동일하게 만든다.

---

# 11. Pad 재생

사용자가 키를 누르면 해당 Pad에 지정된 YouTube 구간이 재생된다.

예:

```text
A 입력

↓

영상 위치
01:13.240

↓

Playback Rate
0.75x

↓

PLAY

↓

01:15.820 도달

↓

STOP
```

---

# 12. Playback Rate

Pitch / Filter / Reverb 기능은 제공하지 않는다.

대신 **Playback Rate**를 핵심 Sample 조절 기능으로 사용한다.

### UI

```text
PLAY RATE

0.25x   0.5x   0.75x   1.0x   1.25x   1.5x   2.0x

                       ●
```

Slider 형태로 제공한다.

### 기본값

```text
1.0x
```

### 권장 단계

```text
0.25x
0.5x
0.75x
1.0x
1.25x
1.5x
1.75x
2.0x
```

실제로는 현재 YouTube Player에서 지원되는 Playback Rate만 활성화한다.

---

# 13. Pad별 Playback Rate

Playback Rate는 전체 영상 설정이 아니라 **각 Pad마다 저장한다.**

예:

```text
PAD A

01:13 → 01:15
0.5x
```

```text
PAD S

00:31 → 00:32
1.5x
```

따라서 A를 누르면:

```text
Rate → 0.5x
Seek → 01:13
Play
```

S를 누르면:

```text
Rate → 1.5x
Seek → 00:31
Play
```

---

# 14. Playback Rate 조작

## Mouse

Slider Drag

```text
0.5x ━━━━━━●━━━━━━━━ 2.0x
```

---

## Keyboard

```text
[       Playback Rate Down

]       Playback Rate Up

\       Reset to 1.0x
```

---

# 15. Pad Mode

MVP에서는 두 가지 Mode를 제공한다.

## One Shot

Pad를 한번 누르면 Sample 끝까지 재생한다.

```text
A

↓

PLAY

↓

Sample End

↓

STOP
```

---

## Hold

Pad를 누르고 있는 동안만 재생한다.

```text
keydown

↓

PLAY

keyup

↓

STOP
```

---

# 16. Loop

Pad별 Loop 기능을 제공한다.

```text
LOOP

[ OFF ] [ ON ]
```

ON일 경우:

```text
START
↓

END
↓

START
↓

END
```

반복한다.

---

# 17. Volume

Pitch / Filter / Reverb 대신 Volume은 제공한다.

각 Pad:

```text
VOLUME

0 ━━━━━━━━━●━━ 100
```

그리고 전체 Master Volume을 별도로 제공한다.

```text
MAIN VOLUME

0 ━━━━━━━━━●━━ 100
```

---

# 18. Sample 이름

사용자가 Pad 이름을 수정할 수 있다.

예:

```text
PAD A

Name

[Vocal Chop]
```

Pad에는 다음처럼 표시한다.

```text
┌────────────┐
│ A          │
│            │
│ VOCAL CHOP │
│            │
│ 0.75x      │
└────────────┘
```

---

# 19. Pad 삭제

Pad 선택 후:

```text
BACKSPACE
```

또는:

```text
ERASE
```

버튼을 누르면 Pad 정보를 삭제한다.

삭제 전 별도 확인창은 MVP에서는 제공하지 않는다.

Undo 기능은 향후 추가한다.

---

# 20. YouTube 이동 단축키

YouTube 영상 탐색을 빠르게 하기 위해 단축키를 제공한다.

```text
SPACE

Play / Pause
```

```text
←

-5 seconds
```

```text
→

+5 seconds
```

```text
SHIFT + ←

-1 second
```

```text
SHIFT + →

+1 second
```

```text
I

Set Sample Start
```

```text
O

Set Sample End
```

---

# 21. Sample Preview

Start / End를 지정한 후 Pad에 넣기 전에 Sample을 미리 들어볼 수 있다.

버튼:

```text
▶ PREVIEW
```

동작:

```text
Seek Start
↓

Play
↓

End
↓

Stop
```

---

# 22. Pad 선택 상태

Pad를 클릭하면 Selected 상태가 된다.

예:

```text
PAD A
```

선택 시:

- Playback Rate
- Volume
- Mode
- Loop
- Sample Start
- Sample End
- Sample Name

등을 수정할 수 있다.

---

# 23. MPC 스타일 UI

전체적인 디자인은 **AKAI MPC Sample에서 영감을 받은 하드웨어 인터페이스**를 사용한다.

단, AKAI 로고나 제품명을 직접 복제하지 않고 자체 브랜드를 사용한다.

### 디자인 방향

```text
Hardware
Retro
Industrial
Sampler
Minimal
Physical controls
```

---

# 24. Color System

### Body

Warm Gray

```text
#D7D4CA
```

### Top Panel

```text
#1B1B19
```

### Pad

```text
#CBCBC7
```

### Pad Active

Blue Glow

### Record

Red

### FX / Special Button

Orange

### Screen

Dark Background

White / Blue / Yellow UI

---

# 25. 메인 화면 구조

```text
┌──────────────────────────────────────────────────────────────┐
│ TUBEPAD                                       MASTER          │
│                                                              │
│ ┌──────────────────────────────┐     MAIN VOLUME             │
│ │                              │         ◯                    │
│ │        YOUTUBE VIDEO         │                              │
│ │                              │     PLAY RATE               │
│ │                              │       ◯                     │
│ └──────────────────────────────┘                              │
│                                                              │
│  START 01:13.240            END 01:15.820                    │
│                                                              │
│ [SET START] [SET END] [PREVIEW] [ASSIGN]                     │
│                                                              │
│           ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐              │
│           │  1   │ │  2   │ │  3   │ │  4   │              │
│           │      │ │      │ │      │ │      │              │
│           └──────┘ └──────┘ └──────┘ └──────┘              │
│                                                              │
│           ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐              │
│           │  Q   │ │  W   │ │  E   │ │  R   │              │
│           └──────┘ └──────┘ └──────┘ └──────┘              │
│                                                              │
│           ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐              │
│           │  A   │ │  S   │ │  D   │ │  F   │              │
│           └──────┘ └──────┘ └──────┘ └──────┘              │
│                                                              │
│           ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐              │
│           │  Z   │ │  X   │ │  C   │ │  V   │              │
│           └──────┘ └──────┘ └──────┘ └──────┘              │
│                                                              │
│ ERASE                ● REC          ■ STOP        ▶ PLAY     │
└──────────────────────────────────────────────────────────────┘
```

---

# 26. MPC Knob 역할

MPC 스타일의 3개 Knob를 사용한다.

### K1

```text
SAMPLE START
```

선택된 Pad의 시작 시간을 미세 조정한다.

---

### K2

```text
SAMPLE END
```

선택된 Pad의 종료 시간을 미세 조정한다.

---

### K3

```text
PLAY RATE
```

선택된 Pad의 Playback Rate를 변경한다.

---

# 27. 왼쪽 Fader

Fader는 선택된 Pad의 Volume을 조절한다.

```text
100

 │
 █
 │
 │
 │

0
```

---

# 28. Built-in Sound Library

YouTube Sample 외에도 기본 Sound Library를 제공한다.

### 카테고리

```text
DRUMS

Kick
Snare
Hi-Hat
Clap
Perc
```

```text
FX

Impact
Noise
Vinyl
Sweep
```

```text
BASS
```

```text
VOCAL
```

초기 MVP에서는 약 30~50개의 기본 Sample을 제공한다.

---

# 29. Built-in Sample 사용

사용자는 Library에서 소리를 선택해 Pad에 Drag & Drop할 수 있다.

```text
KICK 01

↓

Drag

↓

PAD A
```

Built-in Sound의 경우 YouTube와 달리 브라우저의 Web Audio API를 통해 즉시 재생한다.

---

# 30. 사용자 Audio Import

사용자가 자신의 Audio 파일을 가져올 수도 있다.

지원 형식:

```text
MP3
WAV
M4A
OGG
```

### 방법

Drag & Drop

```text
kick.wav

↓

PAD
```

또는:

```text
IMPORT SAMPLE
```

---

# 31. Pad Source Type

Pad는 세 가지 Source Type을 가진다.

```text
YOUTUBE
```

```text
BUILT-IN
```

```text
UPLOAD
```

Pad 상단에 작은 표시를 넣는다.

예:

```text
┌─────────────┐
│ YT          │
│             │
│ VOCAL       │
│             │
│ 0.75x       │
└─────────────┘
```

---

# 32. Project 저장

MVP에서는 로그인 없이 Browser에 프로젝트를 저장한다.

사용:

```text
IndexedDB
```

저장 정보:

- YouTube Video ID
- Sample Start
- Sample End
- Playback Rate
- Volume
- Loop
- Mode
- Pad Name
- Pad Source
- Uploaded Audio

---

# 33. Project 구조

```text
Project

Name
Video
Pads
Settings
```

예:

```json
{
  "name": "My Beat",
  "videoId": "abc123",
  "pads": {
    "A": {
      "type": "youtube",
      "start": 73.24,
      "end": 75.82,
      "playbackRate": 0.75,
      "volume": 1,
      "loop": false,
      "mode": "oneshot",
      "name": "Vocal"
    }
  }
}
```

---

# 34. 향후 Project 계정 기능

추후 Supabase를 사용해 로그인 기능을 추가한다.

사용자는:

```text
My Projects
```

에서 프로젝트를 확인할 수 있다.

예:

```text
My First Beat
Yesterday

Anime Sample
3 days ago

Jazz Chop
Aug 19
```

---

# 35. Record 기능

사용자가 Pad 연주를 기록할 수 있다.

```text
● RECORD
```

버튼 클릭 후:

```text
A
A
S
D
A
```

등의 Pad 입력을 Timestamp와 함께 기록한다.

예:

```json
[
  {
    "time": 0,
    "pad": "A"
  },
  {
    "time": 0.5,
    "pad": "A"
  },
  {
    "time": 1,
    "pad": "S"
  }
]
```

---

# 36. Sequence Playback

기록된 Pad Event를 다시 재생할 수 있다.

```text
▶ PLAY
```

```text
■ STOP
```

MVP 이후 기능으로 구현한다.

---

# 37. BPM

향후 Beat Sequencer를 위해 BPM 기능을 제공한다.

```text
BPM

90
```

조절:

```text
-
+
```

또는:

```text
TAP TEMPO
```

---

# 38. 16-Step Sequencer

MVP 이후 기능.

SEQ 버튼을 누르면 Pad 화면이 Sequencer 화면으로 전환된다.

```text
KICK

● ○ ○ ○ | ● ○ ○ ○ | ● ○ ○ ○ | ● ○ ○ ○

SNARE

○ ○ ○ ○ | ● ○ ○ ○ | ○ ○ ○ ○ | ● ○ ○ ○

HAT

● ○ ● ○ | ● ○ ● ○ | ● ○ ● ○ | ● ○ ● ○
```

---

# 39. 사용자 핵심 Flow

## Flow A — YouTube Sample 만들기

```text
사이트 접속
↓

YouTube URL 입력
↓

LOAD
↓

영상 재생
↓

I
↓

영상 재생
↓

O
↓

Preview
↓

Pad 선택
↓

Playback Rate 설정
↓

완료
```

---

# 40. 사용자 핵심 Flow — 연주

```text
Pad 준비 완료

↓

A
S
D
F
Z
X

↓

실시간 Sample Trigger
```

---

# 41. MVP 범위

## 반드시 구현

- YouTube URL 입력
- YouTube Player
- Play / Pause
- Seek
- Current Time
- Set Start
- Set End
- Preview
- 16 Pad
- Keyboard Mapping
- Pad Assign
- Pad Delete
- Playback Rate
- Pad별 Playback Rate 저장
- Volume
- One Shot
- Hold
- Loop
- 기본 Sound Library
- Audio File Import
- Browser Project 저장
- MPC Inspired UI

---

# 42. MVP에서 제외

초기 버전에서는 구현하지 않는다.

- Pitch
- Filter
- Reverb
- Delay
- Distortion
- Reverse
- AI Sample Generation
- Multiplayer
- Community Feed
- Mobile App
- Spotify Integration
- Apple Music Integration
- MIDI Export
- DAW Plugin
- Stem Separation
- YouTube Audio Download
- YouTube → MP3 변환

---

# 43. 중요한 기술적 제한

YouTube Audio를 직접 다운로드하거나 MP3로 변환하는 기능을 프로젝트 핵심 기능으로 사용하지 않는다.

YouTube Pad는 실제 Audio File이 아닌:

```text
Video ID
+
Start Time
+
End Time
+
Playback Rate
```

정보를 저장한다.

예:

```text
videoId: abc123

start: 73.24

end: 75.82

rate: 0.75
```

Pad Trigger 시 YouTube Player를 해당 위치로 이동시켜 재생한다.

---

# 44. 기술 스택

## Frontend

```text
Next.js
React
TypeScript
```

---

## UI

```text
Tailwind CSS
```

필요한 경우:

```text
Framer Motion
```

사용.

Pad Press, LED, Knob Animation 등에 활용한다.

---

## YouTube

```text
YouTube IFrame Player API
```

---

## Audio

Built-in / Uploaded Samples:

```text
Web Audio API
```

필요시:

```text
Tone.js
```

추가.

---

## Local Database

```text
IndexedDB
```

---

## 향후 Backend

```text
Supabase
```

사용.

### 기능

- Authentication
- Project Database
- User Settings

---

## Audio Storage

향후:

```text
Supabase Storage
```

또는:

```text
Cloudflare R2
```

---

# 45. 주요 컴포넌트

```text
App
│
├── MPCShell
│
├── YouTubePlayer
│
├── DisplayScreen
│
├── SampleEditor
│
├── PlaybackRateSlider
│
├── MainVolumeKnob
│
├── PadGrid
│   └── Pad
│
├── SampleLibrary
│
├── ImportSample
│
├── TransportControls
│
└── ProjectManager
```

---

# 46. Pad 데이터 모델

```ts
type PadSource =
  | "youtube"
  | "builtin"
  | "upload";

interface Pad {
  id: string;

  name: string;

  sourceType: PadSource;

  videoId?: string;

  audioUrl?: string;

  start: number;

  end: number;

  playbackRate: number;

  volume: number;

  loop: boolean;

  mode: "oneshot" | "hold";
}
```

---

# 47. YouTube Pad Trigger Logic

Pseudo Code:

```text
Pad Keydown
↓

Pad Data Load
↓

YouTube Player Playback Rate 설정
↓

SeekTo(Start)
↓

Play
↓

Current Time 체크
↓

Current Time >= End

↓

Loop ?

YES
→ SeekTo(Start)

NO
→ Pause
```

---

# 48. Pad Interaction

Pad를 누르면:

### Mouse

```text
mousedown
```

### Keyboard

```text
keydown
```

둘 다 동일한 Trigger Function을 사용한다.

```text
triggerPad(padId)
```

---

# 49. Keyboard 중복 입력 방지

브라우저 `keydown` event가 누르고 있을 때 반복 입력되는 문제를 막는다.

One Shot에서는:

```text
event.repeat === true
```

인 경우 무시한다.

Hold Mode에서는:

```text
keydown
→ start

keyup
→ stop
```

방식으로 처리한다.

---

# 50. Visual Feedback

Pad Trigger 시 즉각적인 시각 피드백을 제공한다.

```text
Normal

↓

Pressed

↓

Blue LED

↓

Release
```

Animation은 약:

```text
50~100ms
```

정도로 짧게 설정한다.

---

# 51. Display Screen

상단 작은 LCD 스타일 화면에는 현재 상태를 표시한다.

기본:

```text
PAD A

VOCAL CHOP

01:13.240 → 01:15.820

RATE       0.75x

MODE       ONE SHOT
```

Pad가 선택되지 않았을 경우:

```text
TUBEPAD

LOAD A VIDEO

or

SELECT A PAD
```

---

# 52. Empty Pad

비어 있는 Pad:

```text
┌─────────────┐
│ A           │
│             │
│      +      │
│             │
│ EMPTY       │
└─────────────┘
```

---

# 53. Assigned Pad

```text
┌─────────────┐
│ A       YT  │
│             │
│ VOCAL       │
│             │
│ 0.75x       │
└─────────────┘
```

---

# 54. Product Feel

TubePad는 일반적인 SaaS Dashboard처럼 보여서는 안 된다.

사용자가 사이트를 보는 순간:

> "웹사이트가 아니라 악기 같다."

라는 느낌을 받아야 한다.

따라서:

- 큰 버튼
- 실제 Knob
- 실제 Slider
- LED
- LCD Screen
- Physical Pad
- 최소한의 Menu

를 사용한다.

---

# 55. Desktop First

MVP는 **Desktop First**로 개발한다.

최소 권장 해상도:

```text
1280 × 720
```

키보드 입력이 핵심이기 때문에 Mobile은 우선순위가 낮다.

---

# 56. Responsive

작은 화면에서는 MPC 전체 Scale을 축소한다.

Tablet에서는 사용할 수 있지만 Mobile에서는 다음 안내를 표시할 수 있다.

```text
TubePad works best on desktop.

For the full MPC experience,
open this site on a computer.
```

---

# 57. 성능 목표

Pad 입력 후 시각적 반응:

```text
< 50ms
```

Built-in Audio Pad 재생:

```text
가능한 한 즉시
```

YouTube Pad는 API 특성상 Built-in Audio와 동일한 latency를 보장하지 않는다.

따라서 UI에서 YouTube Pad와 Audio Pad를 구분한다.

---

# 58. 성공 지표

MVP에서 가장 중요한 지표는 회원가입 수가 아니다.

### Activation

사용자가 사이트 접속 후:

```text
YouTube Load
+
Sample 생성
+
Pad Trigger
```

까지 성공하는 비율.

---

### Time to First Pad

사이트 접속 → 첫 Sample Pad 생성까지 걸리는 시간.

목표:

```text
60초 이하
```

---

### Time to First Performance

사이트 접속 → 2개 이상의 Pad를 연주하기까지 걸리는 시간.

목표:

```text
2분 이하
```

---

# 59. 개발 우선순위

## Phase 1

```text
YouTube
+
16 Pad
+
Keyboard
```

먼저 구현한다.

---

## Phase 2

```text
Sample Start / End
+
Playback Rate
+
Loop
+
Volume
```

---

## Phase 3

```text
Built-in Sound
+
Audio Upload
```

---

## Phase 4

```text
Project Save
```

---

## Phase 5

```text
Record
+
Sequencer
+
BPM
```

---

# 60. MVP 완료 기준

다음 시나리오가 모두 가능하면 MVP 완료로 판단한다.

1. 사용자가 YouTube 링크를 입력한다.
2. 영상이 정상적으로 로드된다.
3. 사용자가 `I`를 눌러 Start를 지정한다.
4. 사용자가 `O`를 눌러 End를 지정한다.
5. 사용자가 Pad A를 선택한다.
6. 구간이 Pad A에 저장된다.
7. 사용자가 Playback Rate를 0.75x로 변경한다.
8. 키보드 `A`를 누른다.
9. 지정된 YouTube 구간이 0.75x로 재생된다.
10. End 지점에서 재생이 종료된다.
11. 다른 Pad에 다른 구간을 저장할 수 있다.
12. 여러 Pad를 키보드로 연주할 수 있다.
13. 페이지를 새로고침해도 프로젝트가 유지된다.

---

# 61. 최종 제품 방향

TubePad의 목표는 완전한 DAW를 만드는 것이 아니다.

Ableton Live나 FL Studio를 웹에서 재현하려고 하지 않는다.

핵심은 단 하나다.

> **YouTube에서 발견한 순간을 바로 Pad에 넣고 연주한다.**

따라서 기능 추가 여부를 판단할 때 항상 다음 질문을 사용한다.

```text
이 기능이

"Find → Chop → Play"

과정을 더 빠르고 재미있게 만드는가?
```

YES라면 추가한다.

NO라면 제외한다.

---

## Product Statement

**TubePad turns YouTube moments into playable pads.**

### 핵심 UX

```text
PASTE
  ↓
CHOP
  ↓
ASSIGN
  ↓
PLAY
```

이 네 단계가 TubePad의 전체 제품 경험의 중심이 된다.