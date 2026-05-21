# QUICK START: How to Use This Prompt with Gemini

## 📌 What You Have

A complete **7,000+ word specification document** for rebuilding your Kericho Healthcare app as a **Flutter mobile app for Android**.

**File Location:** `/home/lod/Documents/kericho_ai/FLUTTER_GEMINI_PROMPT.md`

---

## 🚀 Step-by-Step: Using the Prompt with Gemini

### Step 1: Copy the Full Prompt
1. Open the file: `FLUTTER_GEMINI_PROMPT.md`
2. Select all text (Ctrl+A)
3. Copy it (Ctrl+C)

### Step 2: Go to Gemini
1. Open Google Gemini: https://gemini.google.com
2. Start a new conversation

### Step 3: Paste & Submit
1. Paste the entire prompt into the chat
2. Hit Enter/Send

### Step 4: Wait for Response
Gemini will provide:
- Complete project structure
- Dart code for all screens
- Color scheme implementation
- Database setup code
- State management code
- All necessary widgets

---

## 📋 What's Included in the Prompt

### ✅ PROJECT OVERVIEW (25 lines)
- Clear explanation of what to build
- Target users and purpose
- Language support requirements

### ✅ 11 CORE FEATURES (400 lines)
1. **User Authentication & Profiles** - Login, registration, sessions
2. **Chat Screen (Main)** - Message bubbles, animations, responsive layout
3. **Health Knowledge Base** - 8 topics, keyword search, bilingual
4. **Message Processing Pipeline** - Emergency detection, knowledge base search, fallback
5. **Language & Translation Support** - English, Swahili, and local languages
6. **Emergency Response System** - Red alerts, emergency contacts
7. **Chat History & Storage** - SQLite persistence, search, export
8. **Settings & Preferences** - Language, notifications, data management
9. **Home/Dashboard Screen** - Health topics carousel, quick tips
10. **Offline Support** - 100% offline functionality
11. **Backend Integration** - Optional API endpoints for future

### ✅ DETAILED DESIGN SPECIFICATIONS (500+ lines)

**Color Scheme:**
```
Primary: #0f766e (Teal)
Secondary: #d97706 (Amber/Orange)
Danger: #b91c1c (Red - for emergencies)
Success: #166534 (Green)
Background: #f3efe6
Text: #16302f
Muted: #5a6a68
```

**Typography:**
- Font: Inter, Segoe UI, Roboto
- H1: 36px × 700 weight
- Body: 14px × 400 weight
- All sizes and line-heights specified

**Components:**
- Button states (default, hover, active, disabled, focus)
- Input field states
- Status pills
- Message bubbles
- Cards and panels
- All with exact specifications

**Layout:**
- Spacing scale (4px to 32px)
- Border radius scale
- Margins and padding standards
- Responsive breakpoints

### ✅ DATA STRUCTURES (100 lines)
- Health Knowledge Base (JSON format with all 8 topics)
- Chat Message Model
- User Profile Model

### ✅ SCREEN LAYOUTS (150 lines)
1. Splash/Loading Screen
2. Login Screen
3. Registration Screen
4. Chat Screen (MAIN)
5. Settings Screen
6. Chat History Screen
7. User Profile Screen

With exact layout, positioning, and component specifications.

### ✅ TECHNICAL STACK (200 lines)
- Dart 3.0+ with Flutter 3.10+
- State Management options (Provider, Riverpod, BLoC)
- Database: SQLite or Hive
- Networking: Dio or http
- All with exact versions and configuration

### ✅ PROJECT STRUCTURE (100 lines)
Detailed folder structure with all files:
```
lib/
├── main.dart
├── models/
├── screens/
├── services/
├── providers/
├── widgets/
├── utils/
├── data/
└── routes/
```

### ✅ DEPENDENCIES (50 lines)
Complete `pubspec.yaml` with all required packages:
- provider (or riverpod)
- dio
- sqflite
- shared_preferences
- connectivity_plus
- json_annotation
- And 15+ more

### ✅ ANDROID CONFIGURATION (20 lines)
- AndroidManifest.xml permissions
- Min API 24 (Android 7.0)
- Target API 34 (Android 14)

### ✅ FUNCTIONAL REQUIREMENTS (100 lines)
Detailed specifications for:
- Message processing
- Search algorithm
- Authentication flow
- Language switching
- Offline mode
- Emergency detection
- Chat history management

### ✅ DESIGN SPECIFICATIONS - DETAILED (400 lines)
- Color palette with exact RGB values
- All states for all components
- Icon list (Material Design icons needed)
- Spacing and layout grid
- Typography with all font weights and sizes

### ✅ KNOWLEDGE BASE (100 lines)
All 8 health topics with:
- Malaria - Keywords, content, Swahili translation
- Maternal Health - Keywords, content, Swahili
- HIV/AIDS - Keywords, content, Swahili
- Nutrition - Keywords, content, Swahili
- Mental Health - Keywords, content, Swahili
- Waterborne Diseases - Keywords, content, Swahili
- Child Health - Keywords, content, Swahili
- Respiratory Health - Keywords, content, Swahili

### ✅ EMERGENCY CONTACTS (30 lines)
- Kericho County emergency numbers
- Health facility locations
- Pharmacy contacts

### ✅ IMPLEMENTATION PRIORITIES (30 lines)
Phased approach:
- **Phase 1 (Must Have):** 8 core features
- **Phase 2 (Should Have):** 5 advanced features
- **Phase 3 (Nice to Have):** 5 future features

### ✅ TESTING REQUIREMENTS (50 lines)
- Unit tests
- Widget tests
- Integration tests
- Manual testing checklist

### ✅ PERFORMANCE REQUIREMENTS (30 lines)
- Launch time: < 3 seconds
- Message processing: < 500ms
- Database queries: < 200ms
- Memory: < 150MB
- Storage: < 100MB

### ✅ SECURITY & PRIVACY (20 lines)
- Secure token storage
- Input sanitization
- Rate limiting
- Privacy policy template

### ✅ FINAL CHECKLIST (15 lines)
- 12-point pre-submission validation checklist

---

## 🎯 What Gemini Will Generate For You

After you paste this prompt, Gemini will provide:

### Code Files:
1. **main.dart** - App entry point
2. **models/** - Data models (user, message, health_topic)
3. **screens/** - All 7 UI screens (complete widgets)
4. **services/** - Authentication, chat, database, API services
5. **providers/** - State management (Provider/Riverpod setup)
6. **widgets/** - Reusable components (buttons, message bubbles, etc.)
7. **utils/** - Constants, colors, themes, validators

### Configuration Files:
1. **pubspec.yaml** - All dependencies
2. **AndroidManifest.xml** - Permissions and configuration
3. **Theme configuration** - Colors, typography, spacing

### Assets:
1. **JSON knowledge base** - All 8 health topics
2. **Translations** - English, Swahili, local languages
3. **Emergency contacts** - Kericho facilities

### Documentation:
1. Setup instructions
2. Build commands
3. Deployment guide
4. Testing guide

---

## ✨ Key Features Covered

✅ **Complete Chat Interface** - Message bubbles, animations, responsive  
✅ **Emergency Detection** - Keyword matching with red alerts  
✅ **Knowledge Base Search** - 8 health topics with keyword matching  
✅ **Language Support** - English, Swahili, Kalenjin, Kipsigis, Nandi  
✅ **Offline First** - 100% functional without internet  
✅ **Local Storage** - SQLite database for messages and history  
✅ **Authentication** - Phone-based login and registration  
✅ **Settings & Preferences** - Language, notifications, data management  
✅ **Design System** - Exact color codes, typography, components  
✅ **Responsive Layout** - Works on phones and tablets  
✅ **Security** - Secure storage, input validation  
✅ **Testing** - Comprehensive test strategy  

---

## 🎨 Design Notes

The prompt ensures the Flutter app will look **exactly** like your web dashboard:

- **Same color scheme** - Teal (#0f766e), Amber (#d97706), Red (#b91c1c)
- **Same typography** - Inter font with exact sizes and weights
- **Same layout** - Message bubbles, cards, panels, headers
- **Same animations** - Smooth transitions, appearing messages
- **Same components** - Buttons, input fields, status pills, alerts

The UI will be a pixel-perfect mobile adaptation of your web interface.

---

## 💡 Pro Tips for Gemini

1. **If Gemini Response is Too Long:**
   - Ask: "Can you continue with the screens/ code?"
   - Ask: "Show me the Chat Screen implementation"
   - Ask: "Generate the services layer"

2. **For More Specific Guidance:**
   - Ask: "How do I integrate the backend API?"
   - Ask: "How do I implement the search algorithm?"
   - Ask: "How do I handle offline mode?"

3. **For Testing:**
   - Ask: "Write unit tests for the search service"
   - Ask: "Write widget tests for the chat screen"
   - Ask: "How do I test the emergency detection?"

4. **For Deployment:**
   - Ask: "How do I build the release APK?"
   - Ask: "How do I publish to Google Play Store?"
   - Ask: "How do I sign the app?"

---

## 📱 Next Steps After Gemini Generation

1. **Create Flutter Project:** `flutter create kericho_healthcare`
2. **Copy Generated Files:** Paste Gemini's code into lib/ folder
3. **Install Dependencies:** `flutter pub get`
4. **Run on Emulator/Device:** `flutter run`
5. **Test on Physical Device:** Use Android Studio or ADB
6. **Iterate:** Ask Gemini for bug fixes and improvements
7. **Deploy:** Build release APK and submit to Google Play Store

---

## 🔧 Troubleshooting

**If Gemini says "I can't generate that much code:"**
- Ask for each component separately
- Ask: "Generate the main.dart and models first"
- Ask: "Then generate the chat screen"
- Build it piece by piece

**If you need clarification:**
- Ask: "Explain the message processing pipeline"
- Ask: "How should the search algorithm work?"
- Ask: "What does the knowledge base JSON look like?"

**If you get stuck:**
- Use the included specification as reference
- Ask Gemini: "What's the next step to implement?"
- Show Gemini any error messages

---

## 📊 Prompt Statistics

- **Total Words:** 7,200+
- **Code Sections:** 15+
- **Specification Sections:** 20+
- **Design Details:** 500+ lines
- **Features Documented:** 11 core + 10 supporting
- **Screens Specified:** 7 complete layouts
- **Files to Generate:** 20+ Dart/config files
- **Dependencies:** 20+ packages

---

## 🎁 What You Get

This is **production-ready specification** that will generate:

✅ Fully functional Flutter app  
✅ Complete UI matching your web design  
✅ All features implemented  
✅ Database persistence  
✅ Offline functionality  
✅ Emergency detection  
✅ Language support  
✅ Error handling  
✅ Security best practices  
✅ Well-organized code structure  

---

## 📄 How to Share This Prompt

You can:
1. **Copy the entire FLUTTER_GEMINI_PROMPT.md file** and paste into Gemini
2. **Share the file** via email, cloud storage, or version control
3. **Point Gemini to this file** - Ask it to reference the specification
4. **Use incrementally** - Paste sections one at a time for detailed responses

---

## 🚀 Ready?

**You have everything you need.** Just:

1. Open `FLUTTER_GEMINI_PROMPT.md`
2. Copy all text
3. Go to Gemini
4. Paste and send
5. Follow Gemini's instructions
6. Start building!

**Estimated Gemini Generation Time:** 5-10 minutes for complete response  
**Estimated Flutter App Development Time:** 2-4 weeks (with Gemini's help)

---

**Good luck building your Flutter app! 🚀**
