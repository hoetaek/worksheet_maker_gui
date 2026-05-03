# 활동지 Best Practice 조사 보고서

조사일: 2026-05-03  
대상: 초등 어휘 학습 자료 제작 도구의 `낱말 찾기`, `단어 활동지`, `단어 깜빡이`, `도블 카드` 출력물과 제작 UI

## 핵심 결론

좋은 활동지는 꾸며진 종이가 아니라 학생이 바로 수행할 수 있는 과제 표면이다. 학생은 3초 안에 “무엇을 하면 되는지”, “어디에 표시하거나 쓰면 되는지”, “언제 끝나는지”를 알 수 있어야 한다.

교사용 제작 UI와 학생용 출력물은 분리해야 한다. 단어 수, 사진 준비 상태, 카드 생성 가능 여부, 출력 버튼, 설정값 같은 제작 정보는 교사에게만 의미가 있다. 학생용 출력물에는 학습 행동을 바꾸는 정보만 남겨야 한다.

## 조사 근거 요약

- IES What Works Clearinghouse의 학습 조직화 가이드는 간격을 둔 학습, worked example과 문제 풀이의 교대, 그림과 언어 설명의 결합, 퀴즈를 통한 재노출과 인출 연습을 권장한다. 어휘 활동지는 단순 노출보다 반복, 회상, 적용이 들어가야 한다. [IES WWC: Organizing Instruction and Study](https://ies.ed.gov/ncee/WWC/PracticeGuide/1)
- IES의 영어 학습자 가이드는 K-8 영어 학습자에게 학업 어휘를 여러 날에 걸쳐 다양한 활동으로 집중적으로 가르치는 것을 강한 근거의 추천으로 제시한다. 우리 서비스의 그림 기반 단어 자료는 “한 번 보고 끝”보다 여러 활동에서 같은 단어를 다시 쓰게 하는 쪽이 맞다. [IES WWC: Teaching Academic Content and Literacy to English Learners](https://ies.ed.gov/ncee/wwc/PracticeGuide/19/WhatWeDo)
- TILT와 여러 대학 교수학습센터 자료는 좋은 과제가 `목적`, `할 일`, `성공 기준`을 명확히 해야 한다고 정리한다. 초등 활동지에서는 이 구조를 길게 노출하기보다 제목, 한 줄 지시문, 완료 기준으로 압축하는 것이 적절하다. [UVM CTL: Transparent Assignment Design](https://www.uvm.edu/ctl/transparent-assignments/), [Ohio State: Designing Assessments of Student Learning](https://teaching.resources.osu.edu/teaching-topics/designing-assessments-student), [MIT Teaching + Learning Lab: Transparency & Purpose](https://tll.mit.edu/teaching-resources/course-design/checklist-transparency-purpose/)
- 인지부하 이론 자료는 불필요한 정보, 불명확한 설명, 산만한 레이아웃이 학습과 무관한 부담을 만든다고 설명한다. 활동지에서는 장식, 중복 정보, 제작 상태, 먼 위치의 힌트를 줄이고 핵심 과제와 반응 영역을 붙여야 한다. [RIT: Cognitive Load, Memory, and Instruction](https://www.rit.edu/teaching/cognitive-load-memory-and-instruction), [UC San Diego: Multimedia Learning Principles](https://multimedia.ucsd.edu/best-practices/multimedia-learning.html)
- UDL은 학습자가 정보를 받아들이고 표현하는 방식을 다양하게 열어두라고 제안한다. 사진, 단어, 따라 쓰기, 찾기, 게임 카드처럼 여러 양식을 지원하는 것은 좋지만, 한 화면이나 한 장에서 모든 양식을 동시에 밀어 넣으면 역효과가 날 수 있다. [CAST UDL Guidelines 3.0](https://udlguidelines.cast.org)
- 접근성 문서 디자인 자료는 제목 구조, 목록, 충분한 글자 크기, 대비, 색에만 의존하지 않는 정보 표현, 불필요한 빈 줄 제거를 권장한다. 인쇄 활동지도 최소 12pt 수준의 본문, 명확한 대비, 의미 있는 여백, 논리적 구조가 필요하다. [Illinois CITL: Accessible Document Design Fundamentals](https://citl.illinois.edu/accessible-document-design-fundamentals), [Northeastern: Document Accessibility Checklist](https://digital-accessibility.northeastern.edu/document-accessibility-checklist-microsoft-word/)

## Best Practice 원칙

### 1. 한 장에는 하나의 주 활동만 둔다

활동지의 첫 화면이나 첫 장은 “이 자료의 대표 행동”을 중심으로 구성해야 한다. `낱말 찾기`라면 찾기, `단어 활동지`라면 보고 쓰기, `도블 카드`라면 카드 놀이가 중심이다. 보조 정보는 주 활동을 돕는 경우에만 남긴다.

적용 기준:

- 제목은 활동 이름을 바로 말한다.
- 설명은 한 줄 지시문으로 충분해야 한다.
- 설정값, 생성 규칙, 내부 상태는 학생 출력물에서 제외한다.

### 2. 목적-할 일-완료 기준을 압축해서 보여준다

초등 활동지에서 `목적`, `할 일`, `성공 기준`을 문서처럼 길게 적으면 오히려 읽기 부담이 커진다. 대신 학생이 볼 수 있는 형태로 압축한다.

권장 구조:

- 제목: `낱말 찾기`
- 지시문: `그림을 보고 낱말을 찾아 동그라미 하세요.`
- 완료 기준: 찾을 낱말 목록이 모두 체크되거나, 빈칸이 모두 채워지는 구조

교사용 UI에서는 목적과 설정을 더 자세히 보여줄 수 있지만, 학생용 출력물은 수행 지시 중심이어야 한다.

### 3. 힌트와 답하는 공간은 가까이 둔다

그림 힌트, 단어 목록, 쓰기 칸, 퍼즐 영역이 멀리 떨어지면 학생은 시선을 계속 이동해야 한다. 이는 불필요한 인지부하를 만든다.

적용 기준:

- 그림과 단어는 같은 카드나 같은 행 안에서 묶는다.
- 쓰기 칸은 해당 그림/단어 바로 옆이나 아래에 둔다.
- 낱말 찾기의 찾을 낱말 목록은 퍼즐과 같은 시야 안에 둔다.

### 4. 반복은 하되, 같은 방식만 반복하지 않는다

어휘 학습은 여러 번의 노출과 인출이 필요하다. 다만 같은 단어를 같은 형태로만 반복하면 학생이 의미를 떠올리기보다 위치나 패턴을 외울 수 있다.

적용 기준:

- 사진 보기, 단어 읽기, 사진+단어 확인, 찾기, 쓰기, 게임을 서로 연결한다.
- `단어 깜빡이`는 한 단어를 연속 변형하기보다 여러 단어를 한 순환으로 지나가게 하고, 다음 순환에서 표현 방식을 바꾸는 편이 자연스럽다.
- `단어 활동지`는 보고 쓰기만 반복하기보다 그림-단어 매칭, 따라 쓰기, 빈칸 쓰기처럼 단계가 나뉘면 좋다.

### 5. 난이도는 조용히 조절하고, 학생에게는 과제만 보여준다

난이도 설정은 교사에게 필요하지만 학생 출력물에 `쉬움`, `15 x 15`, `카드당 4개 단어` 같은 제작 정보가 그대로 보일 필요는 없다.

적용 기준:

- 교사용 UI: 난이도, 단어 수, 카드 수, 출력 가능 상태를 보여준다.
- 학생용 출력물: 실제 문제, 힌트, 답하는 공간만 보여준다.
- 상태 문구는 다음 행동을 바꿀 때만 표시한다. 예: `단어 4개 더 넣으면 카드 13장 가능`은 오류가 아니라 선택적 개선 기회다.

### 6. 시각 자료는 장식이 아니라 의미 전달이어야 한다

사진 기반 활동지의 사진은 학생이 단어 의미를 추론하거나 확인하는 핵심 자료다. 작거나 겹치거나 방향이 이상하면 장식보다 못한 방해 요소가 된다.

적용 기준:

- 사진은 실제 인쇄 크기에서 식별 가능해야 한다.
- 사진과 단어가 함께 쓰일 때는 서로 붙어 있어야 한다.
- 도블처럼 원형 카드에 배치되는 그림은 가능한 한 안쪽 또는 읽는 방향을 향하게 한다.
- 무작위 회전은 놀이감과 자연스러움에는 도움이 되지만, 식별성과 겹침 방지가 우선이다.

### 7. 접근성은 인쇄물에서도 기본값이어야 한다

활동지는 종이에 출력되더라도 접근성 원칙이 필요하다. 작은 글자, 낮은 대비, 색으로만 구분되는 상태, 과도한 빈칸은 학생의 수행을 어렵게 한다.

적용 기준:

- 본문은 최소 12pt 수준을 기본으로 한다.
- 흐린 회색 텍스트나 낮은 대비의 선은 피한다.
- 색은 보조 신호로만 사용하고, 텍스트나 형태로도 의미가 전달되게 한다.
- 표는 레이아웃 장식이 아니라 실제 행/열 구조가 있는 경우에만 쓴다.
- 출력물에는 불필요한 빈 줄과 큰 하단 여백을 만들지 않는다.

## 우리 서비스에 적용할 원칙

### 공통

- 학생용 출력물에는 제작 UI의 상태 문구를 넣지 않는다.
- `학급 정보`는 실제 출력물에서 학생 식별에 필요할 때만 사용한다. 도블 카드처럼 게임 카드 자체가 결과물인 경우에는 제외한다.
- 교사용 화면의 자연스러운 순서는 `단어 준비 -> 활동 설정 -> 미리보기 확인 -> 인쇄/다운로드`다.
- 최종 행동인 인쇄와 다운로드는 미리보기 영역에 붙어 있어야 한다. 단, 학생용 출력물에는 버튼이나 액션 정보가 보이면 안 된다.
- `compact first approach`를 기본으로 한다. 첫 화면에는 결과를 판단하는 데 필요한 핵심 상태와 미리보기가 함께 보여야 한다.

### 낱말 찾기

학생 출력물에 필요한 정보:

- 제목
- 학년/반/이름/날짜, 교사가 실제로 쓰는 경우
- 한 줄 지시문
- 퍼즐
- 찾을 낱말 또는 그림 힌트

제외할 정보:

- 바로 출력 가능
- 퍼즐 크기나 내부 생성 설정
- 사진 준비 상태
- 단어 개수 요약
- 인쇄/다운로드 버튼

설정 개선 방향:

- 교사용 설정은 `찾기 난이도`, `힌트 표시`, `정답지 포함`처럼 결과가 바로 상상되는 이름을 쓴다.
- 한글 자료에서는 `음절 표시`처럼 의미가 약한 옵션을 숨기거나 다른 목적의 옵션으로 바꾼다.

### 단어 활동지

학생 출력물에 필요한 정보:

- 제목
- 학년/반/이름/날짜
- 한 줄 지시문
- 그림/단어/쓰기 공간이 가까이 붙은 반복 구조

개선 방향:

- `사진`과 `힌트`는 학생 입장에서는 분리된 개념이 아니므로 하나의 단어 카드 안에서 통합한다.
- 한 행 또는 한 카드 안에 `그림 -> 단어 -> 쓰기` 흐름이 자연스럽게 이어져야 한다.
- 빈칸은 충분히 크되, 하단에 의미 없는 큰 여백이 생기지 않게 페이지 전체를 활용한다.

### 단어 깜빡이

학생 보기용 자료에 필요한 정보:

- 단어 또는 사진 자체
- 필요하다면 아주 짧은 학급/활동 제목

제외할 정보:

- 단어 수
- 사진 준비 상태
- 생성 방식
- 교사용 설정 요약

개선 방향:

- 한 단어가 연속으로 여러 형태로 나오기보다, 여러 단어가 한 바퀴 지나간 뒤 다음 표현 방식으로 넘어가게 한다.
- 사진, 단어, 사진+단어 모드는 학습 목표에 맞게 순환하되 화면에는 학생이 볼 대상만 크게 둔다.

### 도블 카드

학생 출력물에 필요한 정보:

- 카드 자체

제외할 정보:

- 학급 정보
- 단어 수
- 사진 준비 상태
- 완전 세트/축소 세트 설명
- 사용 단어 목록

개선 방향:

- 교사용 UI에서는 `현재 단어로 바로 만들기`, `단어 N개 더 넣으면 카드가 더 많아짐`처럼 결과 중심 문구를 쓴다.
- 출력 카드에서는 이미지 크기, 방향, 겹침 방지가 핵심 품질이다.
- 카드 안 그림은 바깥쪽을 향하기보다 중앙/읽는 방향을 향하도록 배치한다.

## 제작 UI 체크리스트

- 첫 화면에서 미리보기가 보이는가?
- 핵심 상태가 한 줄 안에서 이해되는가?
- 같은 사실이 제목, 칩, 설명, 상세 영역에 반복되지 않는가?
- 상태 문구가 사용자의 다음 행동을 바꾸는가?
- 최종 행동은 설정을 마친 뒤 자연스럽게 도달하는 위치에 있는가?
- 아이콘만 쓰는 버튼은 인쇄/다운로드처럼 충분히 익숙하고, 접근 가능한 이름이 있는가?
- `설정`, `단어 수정`처럼 의미가 넓은 진입점은 텍스트 라벨이 있는가?

## 학생 출력물 체크리스트

- 학생이 3초 안에 할 일을 말할 수 있는가?
- 제목, 지시문, 과제 영역, 답하는 공간만 남아 있는가?
- 제작 상태, 내부 카운트, 버튼, 설정값이 빠져 있는가?
- 그림과 단어가 실제 인쇄 크기에서 충분히 큰가?
- 힌트와 답하는 공간이 가까운가?
- 흑백 출력에서도 의미가 유지되는가?
- 하단에 불필요한 큰 여백이 없는가?
- 교사가 수업 중 나눠줬을 때 추가 설명 없이 시작할 수 있는가?

## 추천 설계 원칙 문장

앞으로 활동지 관련 결정을 할 때는 아래 문장을 기준으로 삼는다.

> 학생 출력물에는 학생의 행동을 바꾸는 정보만 남긴다. 교사용 상태와 설정은 제작 UI에 머물러야 한다.

> 첫 화면은 작게 시작한다. 핵심 설정, 핵심 상태, 미리보기가 한 번에 보여야 하며, 자세한 설명은 필요할 때만 열리게 한다.

> 사진 기반 자료에서 사진은 장식이 아니라 답을 찾는 단서다. 충분히 크고, 겹치지 않고, 읽는 방향에 맞아야 한다.

## 참고 자료

- IES What Works Clearinghouse. [Organizing Instruction and Study to Improve Student Learning](https://ies.ed.gov/ncee/WWC/PracticeGuide/1).
- IES What Works Clearinghouse. [Teaching Academic Content and Literacy to English Learners in Elementary and Middle School](https://ies.ed.gov/ncee/wwc/PracticeGuide/19/WhatWeDo).
- CAST. [Universal Design for Learning Guidelines 3.0](https://udlguidelines.cast.org).
- University of Vermont Center for Teaching and Learning. [Transparent Assignment Design (TILT)](https://www.uvm.edu/ctl/transparent-assignments/).
- Ohio State Teaching and Learning Resource Center. [Designing Assessments of Student Learning](https://teaching.resources.osu.edu/teaching-topics/designing-assessments-student).
- MIT Teaching + Learning Lab. [Transparency & Purpose](https://tll.mit.edu/teaching-resources/course-design/checklist-transparency-purpose/).
- Rochester Institute of Technology Center for Teaching and Learning. [Cognitive Load, Memory, and Instruction](https://www.rit.edu/teaching/cognitive-load-memory-and-instruction).
- UC San Diego Multimedia Services. [Multimedia Learning Principles](https://multimedia.ucsd.edu/best-practices/multimedia-learning.html).
- University of Illinois Center for Innovation in Teaching & Learning. [Accessible Document Design Fundamentals](https://citl.illinois.edu/accessible-document-design-fundamentals).
- Northeastern University Digital Accessibility. [Document Accessibility Checklist - Microsoft Word](https://digital-accessibility.northeastern.edu/document-accessibility-checklist-microsoft-word/).
