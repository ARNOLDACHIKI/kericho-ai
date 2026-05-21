# Flutter Mobile App - Kericho Healthcare Assistant
## Complete Specification Prompt for Gemini AI

---

## PROJECT OVERVIEW

You are building a **Kericho Healthcare Educational Mobile Application** for Android using Flutter. This is a healthcare information assistant specifically designed for residents of Kericho County, Kenya.

**Key Purpose:**
- Provide healthcare education and information to users
- Serve as a bridge between healthcare knowledge and the community
- Enable emergency escalation when critical health issues are detected
- Support bilingual interface (English and Swahili with translation layers for local languages)

**Target Users:**
- Healthcare seekers in Kericho County, Kenya
- Age range: 12+ years old
- Primary language: English (with Swahili and local language support)

---

## CORE FEATURES & FUNCTIONALITY

### 1. **User Authentication & Profiles**
- **Registration Screen:**
  - Phone number (auto-formatted to Kenya format: +254xxx)
  - Name (optional)
  - Language preference (English, Swahili, Kalenjin, Kipsigis, Nandi)
  - Age group selection (optional)
  
- **Login Screen:**
  - Phone number + OTP-based verification (optional backend integration)
  - Session persistence using SharedPreferences/Secure Storage
  - Auto-login if session exists
  - Logout functionality

- **User Profile Management:**
  - View/edit basic information
  - Change language preference
  - View message history
  - Clear chat history option

### 2. **Chat Screen (Main Interface)**
This is the core functionality. The interface should match the clean, modern design of the web dashboard.

**Design Requirements:**
- **Top Header:**
  - "Kericho Healthcare Assistant" title
  - Connection status indicator (green dot = connected, gray = offline)
  - User profile icon (top right)
  - Settings icon

- **Chat Area:**
  - Message bubbles for user messages (right-aligned, in accent color #0f766e or #d97706)
  - Message bubbles for bot responses (left-aligned, white/light background)
  - Timestamps for each message
  - Message appearing animations
  - Auto-scroll to latest message
  - Support for emoji and special characters

- **Input Area:**
  - Text input field with placeholder "Ask a health question..."
  - Send button (circular icon, accent color)
  - Typing indicator when bot is processing

- **Message Features:**
  - Support for long text responses (scrollable within bubble)
  - Display emergency warnings in highlighted red boxes
  - Display health tips with icons
  - Support for formatted text (bold, italics using markdown-like syntax)

### 3. **Health Knowledge Base Integration**
The app should have offline-first approach with embedded knowledge base.

**Topics (8 core topics):**
1. Malaria - Prevention & Symptoms
2. Maternal Health & Prenatal Care
3. HIV/AIDS Prevention & Testing
4. Balanced Diet & Nutrition
5. Mental Health & Stress Management
6. Waterborne Diseases (Cholera, Typhoid, Diarrhea)
7. Child Health & Immunization
8. Respiratory Infections & Cough Management

**Implementation:**
- Embed full knowledge base as JSON in app assets
- Implement full-text search across topics
- Support keyword matching (e.g., "fever", "malaria", "mosquito" all point to malaria content)
- Support bilingual content (English + Swahili)
- Optional: Local language variations (Kalenjin, Kipsigis, Nandi)

### 4. **Message Processing Pipeline**
When user sends a message, follow this priority order:

1. **Safety Check (Emergency Detection):**
   - Keywords: "chest pain", "can't breathe", "severe bleeding", "fainting", "sudden", "emergency", etc.
   - Response: Highlighted red emergency alert with "🚨 This appears to be an emergency. Please call 911 or visit the nearest health facility immediately."
   - Add emergency contact cards with local clinic numbers

2. **Knowledge Base Search:**
   - Full-text search across 8 health topics
   - Support partial keyword matching
   - Return matching content with source attribution
   - If found: Show response with "Knowledge Base" badge

3. **FAQ Database:**
   - Pre-written Q&A pairs
   - Cached for offline access
   - If found: Show response with "FAQ" badge

4. **Fallback Response:**
   - "I didn't understand that question. Please ask about health topics like malaria, pregnancy, nutrition, etc. Or visit your nearest health facility."

### 5. **Language & Translation Support**
- **UI Language:**
  - Full app interface in English, Swahili, Kalenjin, Kipsigis, Nandi
  - Language selector in settings
  - Persistent language preference

- **Content Translation:**
  - Health knowledge base in English + Swahili
  - Auto-detect user language and respond accordingly
  - Allow user to request translations of responses

### 6. **Emergency Response System**
When emergency keywords detected:
- Show prominent red banner at top of chat
- Display emergency contact information
- Show nearest health facilities (hardcoded list for Kericho)
- Option to share emergency alert with WhatsApp/phone contacts
- Option to call emergency number directly

**Emergency Keywords:**
- "chest pain", "can't breathe", "cannot breathe", "difficulty breathing"
- "severe bleeding", "bleeding heavily"
- "fainting", "fainted", "unconscious"
- "severe headache", "sudden headache"
- "severe stomach pain", "abdominal pain"
- "poisoning", "overdose"
- "severe burn", "severe injury"

### 7. **Chat History & Storage**
- Store chat messages locally using SQLite or Hive
- Each message record:
  - messageId (UUID)
  - userMessage (text)
  - assistantResponse (text)
  - topic (category)
  - source (knowledge-base, faq, emergency, etc.)
  - timestamp
  - language
  
- Features:
  - View past conversations
  - Search chat history
  - Delete individual messages or entire chat
  - Export chat as PDF (optional)

### 8. **Settings & Preferences**
- **Language Settings:** English, Swahili, Kalenjin, Kipsigis, Nandi
- **Notification Settings:** Enable/disable notifications (for future backend integration)
- **Offline Mode:** Indicator showing if app is offline
- **About Section:** Version, credits, terms of service
- **Help & FAQ:** Quick access to app usage help
- **Privacy & Data:** Show data usage policy, option to delete account data

### 9. **Home/Dashboard Screen (Optional)**
If including before chat:
- Quick health topics carousel (Malaria, Maternal Health, HIV, Nutrition, Mental Health, etc.)
- Quick tip cards (rotating health tips)
- Last message preview
- "Start Chat" button
- Statistics (optional): Total messages sent, Topics explored

### 10. **Offline Support**
- App works completely offline
- Knowledge base is embedded
- Messages are queued when offline
- Sync when connection restored
- Offline indicator in UI

### 11. **Backend Integration (Optional for Future)**
- API endpoint: http://localhost:3000 (or production URL)
- Health check: GET /api/health
- Message submission: POST /api/chat/message
- User registration: POST /api/auth/register
- User login: POST /api/auth/login
- Analytics: POST /api/analytics

---

## DESIGN & UI SPECIFICATIONS

### Color Scheme
Match the web dashboard exactly:

```
Primary Colors:
- Background: #f3efe6 (light beige)
- Background Alt: #e8efe9 (light green-tinted)
- Panel: rgba(255, 255, 255, 0.88) (semi-transparent white)
- Panel Strong: #ffffff (pure white)
- Text: #16302f (dark teal)
- Muted Text: #5a6a68 (gray-green)
- Border: rgba(22, 48, 47, 0.1) (light teal border)

Accent Colors:
- Primary Accent: #0f766e (teal) - used for buttons, links
- Secondary Accent: #d97706 (amber/orange)
- Danger: #b91c1c (red) - for emergencies
- Success: #166534 (green) - for success states

Radius Values:
- XL: 28px
- LG: 20px
- MD: 14px
- SM: 10px
```

### Typography
```
Font Family: Inter, Segoe UI, Roboto, Helvetica, Arial, sans-serif

Heading Sizes:
- H1: 2rem - 3.6rem (responsive)
- H2: 1.2rem
- H3: 1rem

Body Text:
- Default: 1rem
- Small: 0.92rem
- Tiny: 0.82rem

Font Weights:
- Regular: 400
- Medium: 500
- Semibold: 600
- Bold: 700
```

### Component Design

**Buttons:**
- Primary: Background #0f766e, white text, rounded 10px, padding 10-12px
- Secondary: Border #0f766e, text #0f766e, white background, rounded 10px
- Danger: Background #b91c1c, white text, rounded 10px
- Size: 48px minimum tap target

**Input Fields:**
- Border: 1px solid rgba(22, 48, 47, 0.1)
- Border-radius: 14px
- Padding: 12px 14px
- Focus: Border #0f766e, shadow effect
- Placeholder: muted gray

**Cards/Panels:**
- Background: rgba(255, 255, 255, 0.88)
- Border: 1px solid rgba(22, 48, 47, 0.1)
- Border-radius: 20px
- Padding: 22px
- Shadow: 0 18px 50px rgba(18, 43, 42, 0.12)

**Message Bubbles:**
- User: Background #0f766e, white text, right-aligned, 14px padding, max-width 80%
- Bot: Background #f3efe6, text #16302f, left-aligned, 14px padding, max-width 85%
- Both: Rounded 16px corners, margin 8px

---

## DATA STRUCTURE

### Health Knowledge Base (Embedded JSON)

```json
{
  "malaria": [
    {
      "id": "malaria-001",
      "title": "Malaria Prevention and Symptoms",
      "keywords": ["malaria", "mosquito", "fever", "chills", "disease", "bite"],
      "content": "I am not a doctor. To prevent malaria: ...",
      "contentSwahili": "Mimi si daktari. Ili kuzuia malaria: ...",
      "source": "Kenya Ministry of Health",
      "tags": ["prevention", "symptoms", "infectious-disease"]
    }
  ],
  "maternal_health": [...],
  "hiv_aids": [...],
  "nutrition": [...],
  "mental_health": [...],
  "waterborne_diseases": [...],
  "child_health": [...],
  "respiratory_health": [...]
}
```

### Chat Message Model
```json
{
  "messageId": "uuid",
  "userMessage": "What is malaria?",
  "assistantResponse": "I am not a doctor...",
  "topic": "malaria",
  "source": "knowledge-base|faq|emergency|fallback",
  "language": "en|sw|kln|kps|nd",
  "timestamp": "2024-05-07T10:30:00Z",
  "isEmergency": false
}
```

### User Profile Model
```json
{
  "userId": "uuid",
  "phoneNumber": "+254712345678",
  "name": "John Doe",
  "language": "en",
  "ageGroup": "18-25",
  "createdAt": "2024-05-07T10:30:00Z",
  "lastActivityAt": "2024-05-07T10:30:00Z"
}
```

---

## SCREEN LAYOUT SPECIFICATIONS

### Screen 1: Splash/Loading Screen
- App logo (if available, or "Kericho Healthcare" text)
- Loading indicator
- Duration: 2-3 seconds
- Then navigate to Login if no user, or Chat if user exists

### Screen 2: Login Screen
- Background: Same gradient as web (left teal glow, right amber glow)
- Card centered with 20px padding margin
- Title: "Healthcare Assistant Dashboard"
- Subtitle: "Sign in to access health education"
- Phone number input (with +254 prefix)
- Password/PIN input
- Login button (full width, accent color)
- Sign up link
- Error message area
- Loading state for button

### Screen 3: Registration Screen
- Phone number input (+254 format)
- Full name input (optional)
- Language preference dropdown (English, Swahili, Kalenjin, Kipsigis, Nandi)
- Age group selector (optional)
- Terms & conditions checkbox
- Register/Create Account button
- Already have account? Login link

### Screen 4: Chat Screen (Main)
- **Header:**
  - Left: Logo/title "Kericho Healthcare"
  - Center: Connection status pill (green online, gray offline)
  - Right: Settings icon, Menu icon
  - Height: 56px

- **Message List:**
  - ScrollView with message bubbles
  - User messages: right-aligned, accent background, white text
  - Bot messages: left-aligned, light background, dark text
  - Timestamps visible (optional, on hover/long-press)
  - Empty state: "No messages yet. Ask a health question to get started"

- **Input Area (Bottom):**
  - TextInput with placeholder "Ask a health question..."
  - Send button (circular icon, right of input)
  - Input background: white, border: light gray
  - Fixed at bottom, above keyboard

- **Emergency Alert (Top Alert, if triggered):**
  - Background: #b91c1c (red)
  - Text: white
  - Icon: warning/alert icon
  - Close button
  - Height: 60px
  - Content: "🚨 This appears to be an emergency..."

### Screen 5: Settings Screen
- **Settings sections:**
  1. Language Settings
     - Radio buttons: English, Swahili, Kalenjin, Kipsigis, Nandi
  2. Notification Settings
     - Toggle: Enable/disable
  3. Offline Mode
     - Info: "App works offline. Data will sync when connected."
  4. Data & Privacy
     - Button: Delete local data
     - Button: Clear chat history
  5. Help & Support
     - FAQ link
     - Contact support
     - Report issue
  6. About
     - App version
     - Build number
     - Terms of Service link
     - Privacy Policy link

### Screen 6: Chat History Screen
- List of past conversations
- Each item shows:
  - First message preview
  - Timestamp
  - Topic category
  - Delete button (swipe or long-press)
- Search bar to filter
- Sort by date (newest first)
- Empty state: "No chat history"

### Screen 7: User Profile Screen
- Display: Name, Phone Number
- Edit button (if editable)
- Language preference display
- Last activity timestamp
- Logout button
- Delete account button (with confirmation)

---

## TECHNICAL SPECIFICATIONS

### Technology Stack
- **Language:** Dart 3.0+
- **Framework:** Flutter 3.10+
- **Database:** SQLite (via sqflite) or Hive
- **State Management:** Provider, Riverpod, or BLoC
- **API Client:** Dio or http package
- **Local Storage:** SharedPreferences (for simple data), SQLite (for complex queries)
- **JSON Serialization:** json_serializable
- **Networking:** Connectivity_plus (for offline detection)
- **UI Components:** Custom widgets matching design

### Project Structure
```
lib/
├── main.dart
├── models/
│   ├── user.dart
│   ├── message.dart
│   ├── health_topic.dart
│   └── chat_session.dart
├── screens/
│   ├── splash_screen.dart
│   ├── login_screen.dart
│   ├── registration_screen.dart
│   ├── chat_screen.dart (MAIN)
│   ├── settings_screen.dart
│   ├── chat_history_screen.dart
│   ├── profile_screen.dart
│   └── emergency_alert_screen.dart
├── services/
│   ├── auth_service.dart (user auth)
│   ├── chat_service.dart (message processing)
│   ├── knowledge_base_service.dart (search KB)
│   ├── database_service.dart (SQLite/Hive)
│   ├── api_service.dart (backend communication)
│   ├── language_service.dart (translations)
│   └── emergency_service.dart (emergency detection)
├── providers/
│   ├── auth_provider.dart
│   ├── chat_provider.dart
│   ├── settings_provider.dart
│   ├── language_provider.dart
│   └── connectivity_provider.dart
├── widgets/
│   ├── message_bubble.dart
│   ├── emergency_alert.dart
│   ├── loading_indicator.dart
│   ├── connection_status_pill.dart
│   ├── custom_button.dart
│   ├── custom_input_field.dart
│   └── common_widgets.dart
├── utils/
│   ├── constants.dart
│   ├── colors.dart
│   ├── text_styles.dart
│   ├── themes.dart
│   ├── validators.dart
│   ├── extensions.dart
│   └── logger.dart
├── data/
│   ├── health_knowledge_base.json (embedded)
│   ├── faq_database.json (embedded)
│   ├── emergency_contacts.json
│   └── translations.json
└── routes/
    └── app_routes.dart
```

### Dependencies (pubspec.yaml)
```yaml
dependencies:
  flutter:
    sdk: flutter
  
  # State Management
  provider: ^6.0.0
  # or
  # riverpod: ^2.4.0
  # flutter_riverpod: ^2.4.0
  
  # Networking
  dio: ^5.3.0
  # or
  # http: ^1.1.0
  
  # Storage
  sqflite: ^2.3.0
  # or
  # hive: ^2.2.3
  # hive_flutter: ^1.1.0
  
  shared_preferences: ^2.2.0
  
  # JSON Serialization
  json_annotation: ^4.8.0
  
  # Connectivity
  connectivity_plus: ^5.0.0
  
  # Utilities
  intl: ^0.18.0
  uuid: ^3.0.0
  logger: ^2.0.0
  
  # UI
  cached_network_image: ^3.3.0
  flutter_markdown: ^0.6.0
  
dev_dependencies:
  flutter_test:
    sdk: flutter
  build_runner: ^2.4.0
  json_serializable: ^6.7.0
```

### Android Configuration (AndroidManifest.xml)
```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
```

### Minimum Requirements
- **Minimum Android Version:** Android 7.0 (API 24)
- **Target Android Version:** Android 13+ (API 33+)
- **Minimum SDK Version:** 24
- **Target SDK Version:** 34

---

## FUNCTIONAL REQUIREMENTS

### Requirement 1: Message Processing
- User types question → Send button tapped
- Show typing indicator "Assistant thinking..."
- Search knowledge base (all topics)
- If match found: Display response with source badge
- If no match: Display fallback message
- Save to local database
- If emergency keywords: Highlight and show emergency alert
- Disable user input while processing

### Requirement 2: Search Algorithm
- Full-text search across knowledge base
- Keyword matching (fuzzy or exact)
- Case-insensitive matching
- Support partial word matching
- Return top 3 matches sorted by relevance
- Return content in selected language

### Requirement 3: Authentication
- Phone number validation (Kenya format)
- Store session token securely
- Auto-login if session valid
- Logout clears session
- Session timeout after 30 days (optional)

### Requirement 4: Language Support
- Dynamic language switching without restart
- Save preference to local storage
- Translate UI elements
- Serve KB content in selected language
- Support: English, Swahili, Kalenjin, Kipsigis, Nandi

### Requirement 5: Offline Functionality
- App works 100% offline
- KB embedded in app
- Messages cached locally
- Connection status displayed
- When online: Show sync message (if API sync implemented)

### Requirement 6: Emergency Detection
- Real-time keyword matching
- Display red alert banner
- Show emergency contacts
- Allow quick call to emergency number
- Log emergency for analytics

### Requirement 7: Chat History
- Persist every message locally
- Support search across messages
- Support delete message
- Support clear all history
- Show conversation threads
- Export history (PDF optional)

---

## DESIGN SPECIFICATIONS (DETAILED)

### Color Palette Details
```
Primary Brand Color: #0f766e (Teal - Used for buttons, primary actions)
Secondary Brand Color: #d97706 (Amber - For secondary elements)
Danger Color: #b91c1c (Red - For emergencies and errors)
Success Color: #166534 (Green - For success states)

Background Colors:
- Primary Background: #f3efe6 (Warm beige)
- Secondary Background: #e8efe9 (Cool light green)
- Surface/Card: rgba(255, 255, 255, 0.88) → solid #ffffff
- Elevated Surface: #ffffff

Text Colors:
- Primary Text: #16302f (Dark teal, for headings and important text)
- Secondary Text: #5a6a68 (Muted green-gray, for supporting text)
- Tertiary Text: #8a9a98 (Light muted, for disabled states)
- Inverse Text: #ffffff (White text on dark backgrounds)

Border & Dividers:
- Light Border: rgba(22, 48, 47, 0.1)
- Medium Border: rgba(22, 48, 47, 0.15)
- Strong Border: rgba(22, 48, 47, 0.3)

Shadow (for depth):
- Standard Shadow: 0 18px 50px rgba(18, 43, 42, 0.12)
- Elevated Shadow: 0 24px 60px rgba(18, 43, 42, 0.18)
- Light Shadow: 0 4px 12px rgba(18, 43, 42, 0.08)

Gradient Backgrounds (for hero areas):
- Left Gradient: radial-gradient at top-left with teal, 28% spread
- Right Gradient: radial-gradient at top-right with amber, 26% spread

Message Bubble Colors:
- User Bubble: #0f766e (teal) background, #ffffff text
- Bot Bubble: #f3efe6 background, #16302f text
- Emergency Bubble: #b91c1c background, #ffffff text with alert icon
```

### Icon Specifications
Use Material Design Icons (via flutter/material_design_icons_flutter package)

```
Icons needed:
- Chat bubble (for chat icon)
- Send (for send button)
- Settings (for settings/gear icon)
- Menu (hamburger menu)
- Arrow back (for navigation)
- Phone (for emergency calls)
- Location (for health facilities)
- Alert/Warning (for emergencies)
- Check/Checkmark (for success)
- More options (three dots)
- Close (X icon)
- Search (magnifying glass)
- Delete (trash bin)
- Edit (pencil)
- Logout (exit/door icon)
- User Profile (person circle)
- Connection (wifi or signal)
- Offline (warning, wifi off)
```

### Spacing & Layout
```
Spacing Scale:
- xs: 4px
- sm: 8px
- md: 12px
- lg: 16px
- xl: 20px
- 2xl: 24px
- 3xl: 28px
- 4xl: 32px

Border Radius Scale:
- sm: 10px (for input fields, small buttons)
- md: 14px (for medium elements)
- lg: 20px (for cards, panels)
- xl: 28px (for hero sections)
- full: 999px (for pill buttons, circular elements)

Standard Margins:
- Screen edge: 16px - 20px
- Between major sections: 24px
- Between cards: 18px
- Between list items: 12px

Standard Padding:
- Card/Panel interior: 22px
- Button interior: 10-12px vertical, 14-16px horizontal
- Input field: 12px vertical, 14px horizontal
```

### Typography Specifications
```
Font Family: Inter (primary), Segoe UI, Roboto, Helvetica, Arial, Sans-serif

Heading Styles:
- H1: size 36px, weight 700 (bold), line-height 1.05, letter-spacing -0.04em
- H2: size 28px, weight 700 (bold), line-height 1.1
- H3: size 20px, weight 700 (bold), line-height 1.2
- H4: size 16px, weight 700 (bold), line-height 1.3

Body Text Styles:
- Body Large: size 16px, weight 400, line-height 1.6
- Body: size 14px, weight 400, line-height 1.5
- Body Small: size 12px, weight 400, line-height 1.5
- Caption: size 12px, weight 500, line-height 1.4

Label Styles:
- Label Large: size 14px, weight 500
- Label: size 12px, weight 500
- Label Small: size 11px, weight 500, text-transform uppercase, letter-spacing 0.08em

Code/Monospace:
- Font: SFMono-Regular, Consolas, Liberation Mono, Menlo, monospace
- Size: 12px
- Weight: 400
```

### Component States
```
Button States:
- Default: Background #0f766e, text white, cursor pointer
- Hover: Background #0d5d56 (darker teal)
- Active/Pressed: Background #094c45 (much darker teal)
- Disabled: Background #d0d0d0, text #a0a0a0, cursor not-allowed
- Focus: Outline 2px solid #0f766e

Input Field States:
- Default: Border #ddd, background white
- Focus: Border #0f766e (2px), outline none
- Error: Border #b91c1c, background rgba(185, 28, 28, 0.05)
- Disabled: Background #f5f5f5, border #ddd, cursor not-allowed
- Filled: Border #0f766e (1px)

Status Pills:
- Online (green): Background rgba(22, 101, 52, 0.1), text #166534, border 1px #22652c
- Offline (gray): Background rgba(107, 114, 128, 0.1), text #5a6a68, border 1px #9ca3af
- Emergency (red): Background rgba(185, 28, 28, 0.12), text #b91c1c, border 1px rgba(185, 28, 28, 0.3)
```

---

## KNOWLEDGE BASE CONTENT

Ensure the following 8 health topics are fully accessible with keyword matching:

1. **Malaria:** Keywords include fever, chills, mosquito, bite, disease, malaria, etc.
2. **Maternal Health:** Keywords include pregnant, pregnancy, antenatal, mother, baby, etc.
3. **HIV/AIDS:** Keywords include hiv, aids, test, arv, pep, prep, sexual health, etc.
4. **Nutrition:** Keywords include nutrition, diet, food, vitamins, balanced, etc.
5. **Mental Health:** Keywords include stress, depression, anxiety, mental, hopeless, worried, sleep, etc.
6. **Waterborne Diseases:** Keywords include water, diarrhea, cholera, typhoid, sanitation, hygiene, etc.
7. **Child Health:** Keywords include child, baby, vaccine, immunization, infant, pediatric, etc.
8. **Respiratory Health:** Keywords include cough, cold, flu, respiratory, pneumonia, breathing, etc.

For each topic, provide:
- Detailed educational content
- Prevention tips
- When to seek medical help
- Recommended actions
- Always include disclaimer: "I am not a doctor..."
- Bilingual content (English + Swahili)

---

## EMERGENCY CONTACTS & FACILITIES

Configure the following for Kericho County, Kenya:

```
Emergency Number: +254-719-950-000 (or local equivalent)
General Emergency: 911 or 999

Health Facilities (Kericho):
1. Kericho County Hospital - Main facility
   Address: [Get actual address]
   Phone: [Get phone]
   
2. Kericho Teaching & Referral Hospital
3. Ainamoi Health Center
4. Nearby clinics and dispensaries

Pharmacy/Drug Store contacts
```

---

## IMPLEMENTATION PRIORITIES

**Phase 1 (Must Have):**
1. ✓ Login/Registration screen
2. ✓ Chat screen with message bubbles
3. ✓ Knowledge base search (8 topics)
4. ✓ Local database storage
5. ✓ Emergency detection
6. ✓ Language support (English + Swahili)
7. ✓ Offline functionality
8. ✓ User profile

**Phase 2 (Should Have):**
1. Chat history screen
2. Settings screen (language, notifications, etc.)
3. Advanced search (filter by topic)
4. Export chat history
5. Better animations

**Phase 3 (Nice to Have):**
1. Backend API integration
2. User analytics tracking
3. Share chat feature
4. Voice input
5. Notification system

---

## TESTING REQUIREMENTS

**Unit Tests:**
- Search algorithm accuracy
- Emergency keyword detection
- Language translation switching
- Message parsing and formatting
- Date/time formatting

**Widget Tests:**
- Chat bubble rendering
- Input field behavior
- Button states
- Message list scrolling
- Emergency alert display

**Integration Tests:**
- Full chat flow
- Database persistence
- Language switching
- Emergency workflow
- Offline mode

**Manual Testing:**
- Test on physical Android devices (real phones)
- Test offline scenarios
- Test emergency detection with various keywords
- Test language switching mid-conversation
- Test message history persistence

---

## PERFORMANCE REQUIREMENTS

- App launch time: < 3 seconds
- Message processing: < 500ms
- Database queries: < 200ms
- UI frame rate: 60 FPS
- Memory usage: < 150MB
- Storage footprint: < 100MB (including knowledge base)

---

## SECURITY & PRIVACY

- Store auth tokens securely (use flutter_secure_storage)
- Don't store sensitive data in SharedPreferences
- Sanitize user input before display
- Implement rate limiting on message submissions
- Clear sensitive data on logout
- Privacy policy: Only store necessary user data
- No analytics tracking without consent

---

## DEPLOYMENT

- Build for Android 7.0 minimum (API 24)
- Target Android 13+ (API 33+)
- Sign release APK with keystore
- Create app bundle for Google Play Store
- Prepare app store listing with screenshots
- Version format: 1.0.0

---

## ADDITIONAL NOTES

1. **Design System:** Follow Material Design 3 principles
2. **Accessibility:** Ensure WCAG 2.1 AA compliance
3. **Localization:** Support multiple languages from day one
4. **Responsive:** Adapt layout for different screen sizes (phones to tablets)
5. **Dark Mode:** Consider dark theme support (optional phase 2)
6. **Backend:** When ready, API can be integrated at api_service.dart
7. **Analytics:** Track: messages sent, topics searched, emergency alerts, language used
8. **Monitoring:** Add error logging for production debugging
9. **Updates:** Plan for OTA updates or app store updates for KB changes

---

## CODE QUALITY STANDARDS

- Follow Dart style guide (effective Dart)
- Use linting: `flutter analyze` with rules
- Document all public methods with comments
- Use meaningful variable and function names
- Keep files under 500 lines
- Use constants for magic values
- Mock external dependencies in tests
- Maintain 80%+ test coverage

---

## FINAL CHECKS BEFORE SUBMISSION

- [ ] All 8 health topics accessible
- [ ] Search works for all keywords
- [ ] Emergency detection working
- [ ] Language switching works smoothly
- [ ] Offline mode functions correctly
- [ ] UI matches design specifications exactly
- [ ] All screens implemented
- [ ] Chat history persists
- [ ] No console errors/warnings
- [ ] App tested on real Android devices
- [ ] Performance metrics met
- [ ] Security best practices implemented
- [ ] Accessibility requirements met

---

END OF SPECIFICATION

**Total Estimated Development Time:** 4-6 weeks (for one experienced Flutter developer)

**Key Success Criteria:**
1. ✅ App looks and feels exactly like the web dashboard (design fidelity)
2. ✅ All 8 health topics fully searchable with keyword matching
3. ✅ Emergency detection works reliably
4. ✅ Complete offline functionality
5. ✅ Smooth user experience with no lag
6. ✅ Thorough testing on real Android devices
