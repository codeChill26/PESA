# English Speaking Practice — Product Description

*\*\*Document:\*\* `PRODUCT\_DESCRIPTION.md`*

*\*\*Version:\*\* 1.0*

*\*\*Status:\*\* MVP Specification*

*\*\*Product type:\*\* Internal family learning application*

*\*\*Primary goal:\*\* Help family members practice English speaking through listen → speak → evaluate → retry loops.*

---

## 1. Product Overview

### 1.1 Product name

\*\*English Speaking Practice\*\* (working title)

### 1.2 Product purpose

This is a small internal application built for the user's family to practice English speaking.

The application provides a simple speaking loop:

1. Read an English sentence.

2. Listen to a reference pronunciation using Text-to-Speech (TTS).

3. Repeat the sentence aloud.

4. Record the learner's voice.

5. Convert the recording to text and/or analyze pronunciation.

6. Compare the learner's speech with the target sentence.

7. Show understandable feedback.

8. Allow the learner to try again.

9. Track progress over time.

The product is \*\*not intended to be a commercial English-learning platform in the MVP\*\*.

### 1.3 Core philosophy

The product should prioritize:

* Simplicity
* Low/no operating cost
* Fast feedback
* Practical spoken English
* Repetition
* Progress tracking
* Privacy
* Local-first operation where practical

The application should avoid unnecessary complexity, expensive APIs, and model training during the MVP.

---

# 2. Problem

Many learners know English vocabulary and grammar but struggle to speak naturally because they do not practice pronunciation and speaking frequently.

Typical problems:

* They do not know what sentence to practice.
* They cannot easily hear a good reference pronunciation.
* They are unsure whether their pronunciation is understandable.
* They practice without receiving feedback.
* They do not know which words or sounds need improvement.
* They have little motivation to repeat the same sentence multiple times.
* Family members may have different English levels.

The application solves this by turning a sentence into a short interactive speaking exercise.

---

# 3. Target Users

## 3.1 Primary users

Family members who want to improve spoken English.

Examples:

* Beginner learners
* Intermediate learners
* Users preparing for daily English communication
* Users who want to improve pronunciation
* Users who prefer short daily practice

## 3.2 User characteristics

Users may have:

* Different English levels
* Different pronunciation problems
* Different vocabulary
* Different speaking speeds
* Different confidence levels

Therefore, feedback must be understandable to non-technical users.

---

# 4. Product Goals

## 4.1 MVP goals

The MVP should allow a user to:

* Select or receive an English sentence.
* Listen to the sentence.
* Record themselves speaking.
* Submit the recording.
* See whether their spoken content matches the target.
* Receive a basic score.
* See incorrect or problematic words.
* Retry the sentence.
* Review previous results.

## 4.2 Long-term goals

Potential future goals:

* Personalized learning paths
* Difficulty adaptation
* Pronunciation analysis at phoneme level
* Sentence-level fluency scoring
* Family leaderboard
* Daily challenges
* Vocabulary learning
* Conversation practice
* AI-generated exercises
* Progress analytics
* Custom learning topics

---

# 5. Non-Goals

The MVP is explicitly \*\*not\*\* intended to:

* Become a commercial SaaS.
* Compete with Duolingo, ELSA Speak, Cambly, or similar products.
* Train a proprietary speech model.
* Build a proprietary LLM.
* Provide professional language certification.
* Replace a professional English teacher.
* Provide scientifically validated IELTS/TOEFL scores.
* Support millions of users.
* Require cloud infrastructure.

The MVP should remain small and maintainable.

---

# 6. Core User Experience

The primary interaction is:

Choose Sentence

↓

Listen

↓

Speak

↓

Record

↓

Analyze

↓

Receive Feedback

↓

Retry

↓

Improve

This loop is the heart of the product.

---

# 7. Main User Flow

## 7.1 Start practice

The user opens the application.

The home screen displays:

* Current learner
* Daily progress
* Recommended practice
* Recent score
* Start Practice button

Example:

Good evening, Phúc 👋

Today's Practice

5 sentences · ~10 minutes

Progress

████████░░ 80%

[ Start Practice ]

---

## 7.2 Sentence screen

The application displays one target sentence.

Example:

*\*\*I want to improve my English speaking skills.\*\**

Available actions:

* Listen
* Record
* Replay recording
* Submit
* Try Again

Optional:

* Show translation
* Show vocabulary
* Slow audio
* Hide/show transcript

---

## 7.3 Reference pronunciation

The application uses TTS to read the sentence.

The user should be able to:

* Play audio
* Replay audio
* Adjust playback speed
* Select an English accent if supported

Possible accents:

* English (US)
* English (UK)

The MVP can start with one accent.

---

## 7.4 Recording

The user presses:

*🎙️ Record*

The browser/app records the user's voice.

The UI should clearly indicate:

Recording...

00:07

[ Stop ]

After recording:

Recording complete

[ ▶ Play ]

[ 🔄 Record Again ]

[ ✓ Check My Pronunciation ]

---

# 8. Speech Evaluation

This is the most important technical part of the application.

## 8.1 Basic evaluation

The first version should evaluate whether the user said approximately the correct sentence.

Example:

### Target

*I think this is a good idea.*

### User

*I tink this is a good idea.*

The system can identify that:

I ✓

think ⚠️

this ✓

is ✓

a ✓

good ✓

idea ✓

The system should avoid claiming that a user is definitely wrong when the speech recognition result is uncertain.

---

## 8.2 Pronunciation evaluation

Speech-to-text alone is not a complete pronunciation assessment.

For example:

Target:

think

Possible user pronunciation:

think

tink

sink

A transcription model may sometimes recognize all of these as the intended word because of context.

Therefore:

### Speech-to-text

Answers:

*"What did the learner probably say?"*

### Pronunciation analysis

Answers:

*"How closely did the learner pronounce the intended sounds?"*

These are separate concepts.

---

# 9. Evaluation Levels

The system should be designed in layers.

## Level 1 — Text Accuracy

Compare:

Target sentence

vs.

Recognized sentence

Measure:

* Word match
* Missing words
* Extra words
* Word order
* Completion

This is the easiest MVP feature.

---

## Level 2 — Word-level analysis

Identify problematic words.

Example:

I ✓

want ✓

to ✓

improve ⚠️

my ✓

English ✓

The user can click a problematic word to see feedback.

---

## Level 3 — Phoneme-level analysis

Future feature.

Analyze individual sounds such as:

* /θ/
* /ð/
* /r/
* /l/
* /v/
* /w/
* /ɪ/
* /iː/

Example:

Word: think

Potential issue:

Initial /θ/

Advice:

Place the tongue lightly between the teeth

and allow air to pass through.

This level should use an existing pronunciation/alignment model or service where practical.

\*\*Do not train a custom model for the MVP.\*\*

---

# 10. Scoring System

The MVP should use simple, understandable scores.

Suggested dimensions:

| Metric | Meaning |

|---|---|

| Accuracy | How closely the spoken words match the target |

| Completeness | How much of the target sentence was spoken |

| Fluency | Speaking rhythm, pauses, and continuity |

| Pronunciation | Quality of pronunciation when reliable analysis is available |

| Overall | Combined practice score |

Example:

Overall 84

Accuracy 92

Completeness 100

Fluency 78

Pronunciation 81

### Important

Scores should be treated as \*\*practice indicators\*\*, not official English proficiency scores.

---

# 11. Feedback Design

Feedback should be short and actionable.

Bad feedback:

*Pronunciation score: 73.*

Better feedback:

*Your sentence was mostly correct.*

*Focus on \*\*think\*\*. The initial sound may need more attention.*

*Try again and exaggerate the target sound slightly.*

Feedback should answer:

1. What was wrong?

2. Where was it wrong?

3. What should the learner do?

4. Can they immediately try again?

---

# 12. Retry Loop

After receiving feedback:

[ Try Again ]

The learner can immediately repeat the sentence.

The application stores the previous attempt.

Example:

Attempt 1 71

Attempt 2 78

Attempt 3 86

This makes improvement visible.

---

# 13. Progress Tracking

The application should track:

* Total practice sessions
* Total sentences
* Attempts
* Scores
* Average score
* Best score
* Daily streak
* Frequently problematic words
* Frequently problematic sounds

Example:

This Week

Sentences practiced 32

Average score 84

Best score 96

Practice days 5

Current streak 4 days

---

# 14. Family Support

Because this is an internal family application, multiple family members should be supported.

Example:

Family

Phúc

Average: 86

Streak: 7 days

Mom

Average: 74

Streak: 4 days

Dad

Average: 69

Streak: 2 days

The application should encourage practice rather than create excessive competition.

A leaderboard can remain optional.

---

# 15. Sentence System

Sentences are the core learning content.

Each sentence should contain:

id

text

difficulty

topic

translation

target\_language

audio settings

vocabulary

Example:

{

"id": "sentence\_001",

"text": "I want to improve my English speaking skills.",

"difficulty": "A2",

"topic": "daily\_life",

"translation": "Tôi muốn cải thiện kỹ năng nói tiếng Anh của mình."

}

---

# 16. Sentence Categories

Suggested initial categories:

* Daily Life
* Family
* School
* Work
* Shopping
* Travel
* Food
* Health
* Technology
* Social Conversation
* Opinions
* Small Talk

Future categories can be added without changing the core architecture.

---

# 17. Difficulty

Suggested levels:

A1

A2

B1

B2

C1

The MVP can initially use:

* Beginner
* Intermediate
* Advanced

CEFR labels can be added later if sentence difficulty is validated.

---

# 18. Technical Architecture

## 18.1 Recommended MVP architecture

┌─────────────────────────────┐

│ Frontend │

│ │

│ React / Next.js │

│ │

│ - Practice UI │

│ - Recording │

│ - Results │

│ - Progress │

└──────────────┬──────────────┘

│

│ HTTP

▼

┌─────────────────────────────┐

│ Backend │

│ │

│ FastAPI │

│ │

│ - Practice API │

│ - Audio processing │

│ - Evaluation │

│ - Progress │

└──────────────┬──────────────┘

│

┌───────┼────────┐

▼ ▼ ▼

SQLite Whisper TTS

---

# 19. Recommended Technology

## Frontend

Possible choice:

* React
* Next.js
* TypeScript

Responsibilities:

* UI
* Audio playback
* Recording
* Practice flow
* Results visualization
* Progress dashboard

---

## Backend

Recommended:

* Python
* FastAPI

Responsibilities:

* API
* Audio processing
* Speech recognition
* Evaluation logic
* Database access

---

## Database

MVP:

\*\*SQLite\*\*

Reason:

* Zero infrastructure
* Easy backup
* Easy development
* Enough for a family application

Possible future:

* PostgreSQL

There is no reason to introduce PostgreSQL in the MVP unless another requirement appears.

---

# 20. Speech-to-Text

A local Whisper implementation can be used for speech recognition.

Possible flow:

Browser

↓

WAV/WebM audio

↓

FastAPI

↓

Whisper

↓

Transcript

Example:

Target:

I think this is a good idea.

Transcript:

I think this is a good idea.

The application then compares the two.

---

# 21. Text-to-Speech

The application needs a reference voice.

Possible implementation options:

### MVP

Use a browser/device TTS engine if its quality is acceptable.

Advantages:

* No API cost
* Very simple
* No server required

### Later

Use a local or external high-quality TTS engine.

The architecture should keep TTS behind an abstraction so the implementation can be changed later.

Example:

class TTSProvider:

def synthesize(self, text: str, voice: str):

...

---

# 22. Pronunciation Analysis

This should be treated as an independent module.

PronunciationAnalyzer

│

├── Word alignment

├── Phoneme alignment

├── Timing

├── Stress

└── Confidence

The MVP should not attempt to create a new speech model.

Use existing models/tools where available.

---

# 23. AI / LLM Usage

An LLM is \*\*optional\*\*.

The core product should work without an LLM.

For example, deterministic code can generate:

Missing word: "to"

Extra word: "really"

Target word not recognized: "think"

An LLM can later convert technical analysis into friendly feedback.

Example:

Technical result

↓

LLM

↓

Friendly explanation

For an internal application, a local model such as Ollama can be considered if the computer has sufficient hardware.

---

# 24. Cost Strategy

The target is \*\*near-zero recurring cost\*\*.

### Preferred architecture

Local frontend

+

Local backend

+

Local speech recognition

+

Local database

+

Local/browser TTS

Potential cost:

\*\*$0/month\*\*

excluding electricity/hardware.

External APIs may be added later if their quality provides a meaningful benefit.

---

# 25. Privacy

Because the application processes family members' voices, privacy is important.

Preferred behavior:

* Store recordings locally.
* Do not upload audio by default.
* Do not send recordings to external AI services unless explicitly configured.
* Allow recordings to be deleted.
* Keep family data inside the local application.

If cloud APIs are later introduced, the UI should clearly indicate when audio leaves the local machine.

---

# 26. Data Model

Suggested entities:

## User

User

├── id

├── name

├── avatar

├── created\_at

└── settings

## Sentence

Sentence

├── id

├── text

├── translation

├── difficulty

├── topic

└── metadata

## PracticeSession

PracticeSession

├── id

├── user\_id

├── started\_at

├── completed\_at

└── score

## Attempt

Attempt

├── id

├── session\_id

├── sentence\_id

├── audio\_path

├── transcript

├── accuracy

├── completeness

├── fluency

├── pronunciation

├── overall

└── created\_at

## WordResult

WordResult

├── id

├── attempt\_id

├── word

├── status

├── confidence

└── feedback

---

# 27. API Design

Example endpoints:

GET /api/users

POST /api/users

GET /api/sentences

GET /api/sentences/{id}

POST /api/tts

POST /api/speech/transcribe

POST /api/speech/evaluate

GET /api/users/{id}/progress

GET /api/users/{id}/history

The exact API design can change during implementation.

---

# 28. Frontend Pages

## Home

Home

├── Current user

├── Daily progress

├── Streak

├── Recent performance

└── Start Practice

## Practice

Practice

├── Sentence

├── Listen

├── Record

├── Recording timer

└── Submit

## Result

Result

├── Overall score

├── Transcript

├── Word analysis

├── Feedback

├── Retry

└── Next sentence

## Progress

Progress

├── Average score

├── Practice history

├── Streak

├── Improvement

└── Common mistakes

## Family

Family

├── Family members

├── Individual progress

└── Optional leaderboard

---

# 29. MVP Feature Priority

## P0 — Required

These features must work before the MVP is considered usable.

* User selection
* Sentence selection
* Display sentence
* TTS playback
* Microphone recording
* Audio submission
* Speech-to-text
* Target vs transcript comparison
* Basic score
* Word-level result
* Retry
* Save practice history

## P1 — Important

* Daily practice
* Progress dashboard
* Multiple family members
* Streak
* Sentence categories
* Difficulty levels
* Basic fluency measurement

## P2 — Future

* Phoneme-level pronunciation
* Detailed articulation feedback
* Personalized difficulty
* AI-generated sentences
* Conversation mode
* Family leaderboard
* Advanced analytics

---

# 30. MVP Definition of Done

The MVP is complete when a family member can perform this entire workflow:

1. Open application

2. Select their profile

3. Start practice

4. See an English sentence

5. Listen to the reference pronunciation

6. Record their voice

7. Submit recording

8. Wait for analysis

9. See transcript

10. See basic score

11. See problematic words

12. Read feedback

13. Retry

14. Complete the sentence

15. See their progress later

If these steps work reliably, additional features are optional.

---

# 31. Product Principles

### Principle 1 — Practice over complexity

The application exists to make speaking practice easier.

Do not add features simply because they use AI.

### Principle 2 — Feedback must be actionable

Every error should ideally answer:

*What should I do differently?*

### Principle 3 — Fast feedback

The learner should not wait unnecessarily long for results.

### Principle 4 — Local first

Prefer local processing when quality is sufficient.

### Principle 5 — No unnecessary training

Do not train custom AI models unless an actual product requirement justifies it.

### Principle 6 — Score is a tool, not the goal

The objective is improved speaking ability, not maximizing a number.

### Principle 7 — Build for real usage

A simple application that the family uses every day is more valuable than a technically sophisticated application that nobody uses.

---

# 32. Development Roadmap

## Phase 1 — Prototype

Goal: prove the interaction.

Sentence

↓

TTS

↓

Record

↓

Speech-to-text

↓

Text comparison

↓

Result

No authentication.

No complex analytics.

No advanced AI.

---

## Phase 2 — Usable MVP

Add:

* User profiles
* SQLite
* Practice history
* Progress
* Better scoring
* Word-level feedback
* Sentence categories
* Daily practice

---

## Phase 3 — Pronunciation

Add:

* Forced alignment
* Phoneme analysis
* Pronunciation scoring
* Timing
* Stress
* Common sound mistakes

---

## Phase 4 — Personalization

Add:

* Adaptive difficulty
* Weak-word detection
* Personalized exercises
* Review scheduling
* AI-generated feedback

---

## Phase 5 — Conversation

Potential future experience:

AI

↓

speaks naturally

↓

Learner responds

↓

speech recognition

↓

AI evaluates

↓

AI continues conversation

This can transform the application from sentence repetition into conversational speaking practice.

---

# 33. Example End-to-End Session

### Sentence

*I have been learning English for two years.*

### Step 1 — Listen

TTS plays the reference sentence.

### Step 2 — Speak

User records their response.

### Step 3 — Transcription

System produces:

*I have been learning English for two years.*

### Step 4 — Comparison

I ✓

have ✓

been ✓

learning ✓

English ✓

for ✓

two ✓

years ✓

### Step 5 — Score

Accuracy 96

Completeness 100

Fluency 82

Pronunciation 87

Overall 91

### Step 6 — Feedback

*Your sentence was complete and mostly accurate.*

*Focus on maintaining a smooth rhythm between words.*

### Step 7 — Retry

User repeats the sentence.

Attempt 1 → 91

Attempt 2 → 94

Attempt 3 → 97

The application records the improvement.

---

# 34. Important Technical Caveat

The system must distinguish between:

### Recognition

*"What did the learner say?"*

and:

### Pronunciation assessment

*"How well did the learner pronounce the intended sentence?"*

A speech-to-text model such as Whisper is excellent for recognition, but \*\*a transcription match alone must not be presented as proof of perfect pronunciation\*\*.

For the MVP, it is acceptable to label the result as:

* Speech match
* Word accuracy
* Basic speaking feedback

More advanced pronunciation claims should only be made when the underlying analysis supports them.

---

# 35. Recommended MVP Architecture

For the smallest practical implementation:

Frontend

React / Next.js

│

▼

Backend

FastAPI

│

├───────────────┐

▼ ▼

SQLite Whisper

│

▼

Practice History

TTS

└── Browser / Local TTS

Later:

┌── Whisper

│

Audio ──► Speech Layer ──┼── Forced Alignment

│

└── Pronunciation Model

│

▼

Evaluation Engine

│

┌──────┴──────┐

▼ ▼

Scores Feedback

│

Optional

▼

LLM

---

# 36. Final Product Definition

\*\*English Speaking Practice\*\* is a private family application designed to create a repeatable English speaking practice loop.

Its core experience is:

*\*\*Listen → Speak → Analyze → Understand the mistake → Repeat → Improve\*\**

The MVP should remain intentionally simple.

It should \*\*not\*\* require:

* Custom AI training
* Expensive cloud infrastructure
* Large databases
* Complex authentication
* Commercial-scale architecture
* Advanced AI agents

The first technical objective is simply to make this workflow reliable:

*\*\*English sentence → TTS → user's voice → speech analysis → useful feedback → retry\*\**

Once that loop is useful and enjoyable, more advanced pronunciation analysis and personalization can be added incrementally.