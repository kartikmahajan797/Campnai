# Campnai - AI-Powered Influencer Marketing Platform

<div align="center">
  <img src="https://img.shields.io/badge/React-18.3.1-blue" alt="React"/>
  <img src="https://img.shields.io/badge/TypeScript-5.8.3-blue" alt="TypeScript"/>
  <img src="https://img.shields.io/badge/Vite-5.4.19-yellow" alt="Vite"/>
  <img src="https://img.shields.io/badge/Firebase-12.7.0-orange" alt="Firebase"/>
  <img src="https://img.shields.io/badge/Tailwind-3.4.17-cyan" alt="Tailwind"/>
</div>

## 🚀 Overview

**Campnai** is a cutting-edge AI-powered influencer marketing platform designed specifically for Indian SMBs and agencies. It automates the entire influencer marketing workflow—from discovery and outreach to negotiations and campaign tracking—using advanced AI technology to deliver smarter, faster results.

### ✨ Key Features

- 🤖 **AI-Powered Influencer Discovery** - Natural language search for influencers
- 💬 **Conversational AI Assistant** - Chat with Neo, your AI marketing partner
- 📊 **Campaign Management** - End-to-end campaign tracking and analytics
- 🎯 **Automated Outreach** - Intelligent messaging and negotiation
- 📈 **Performance Analytics** - Real-time campaign insights
- 🔒 **Secure & Scalable** - Enterprise-grade security with Firebase

## 🏗️ Architecture

```
Campnai/
├── 🎨 Frontend (React + TypeScript)
│   ├── Dashboard & Campaign Management
│   ├── AI Chat Interface (Phi-3 Integration)
│   └── Influencer Database UI
├── 🤖 AI Layer (Phi-3 instruct Q5)
│   ├── Natural Language Processing
│   ├── Intent Recognition
│   └── Response Generation
├── ☁️ Backend (Firebase)
│   ├── Authentication (Firebase Auth)
│   ├── Database (Firestore)
│   └── File Storage (Firebase Storage)
└── 📱 Mobile Responsive Design
```

## 🛠️ Tech Stack

### Frontend
- **React 18** - Modern React with hooks and concurrent features
- **TypeScript** - Type-safe development
- **Vite** - Lightning-fast build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **Shadcn/UI** - High-quality component library
- **React Router** - Client-side routing
- **React Query** - Powerful data fetching and caching

### AI & ML
- **Phi-3 instruct Q5** - Local AI model for natural language processing
- **ONNX Runtime** - High-performance ML inference
- **Transformers.js** - Hugging Face integration for web

### Backend & Infrastructure
- **Firebase** - Comprehensive backend-as-a-service
  - Authentication with email/password and social logins
  - Firestore for real-time database
  - Cloud Storage for file uploads
- **Zod** - Runtime type validation
- **React Hook Form** - Performant forms with validation

### Development Tools
- **ESLint** - Code linting and formatting
- **TypeScript Compiler** - Advanced type checking
- **Vite** - Development server and build optimization
- **Tailwind CSS** - Responsive design system

## 🚀 Quick Start

### Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher) - [Download here](https://nodejs.org/)
- **npm** or **bun** package manager
- **Git** for version control

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Campnai
   ```

2. **Install dependencies**
   ```bash
   # Using npm
   npm install

   # Or using bun (recommended for faster installs)
   bun install
   ```

3. **Environment Setup**

   Create a `.env` file in the root directory:
   ```env
   # Firebase Configuration
   VITE_FIREBASE_API_KEY=your_firebase_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=your_app_id

   # AI Model Configuration
   VITE_PHI3_MODEL_PATH=/models/phi3-instruct-q5.gguf
   VITE_AI_TEMPERATURE=0.7
   VITE_AI_MAX_TOKENS=512
   ```

4. **Firebase Setup**

   - Create a new Firebase project at [Firebase Console](https://console.firebase.google.com/)
   - Enable Authentication with Email/Password provider
   - Create a Firestore database
   - Copy your Firebase config to the `.env` file

5. **AI Model Setup**

   - Download the Phi-3 instruct Q5 model file
   - Place it in the `public/models/` directory
   - Update the model path in your environment variables

### Development

Start the development server:

```bash
# Using npm
npm run dev

# Or using bun
bun run dev
```

The application will be available at `http://localhost:8080`

### Build for Production

```bash
# Using npm
npm run build

# Or using bun
bun run build
```

## 📖 Usage Guide

### For New Users

1. **Sign Up**: Create your account with email and password
2. **Complete Profile**: Add your business information
3. **Upload Influencer Data**: Import your influencer database via CSV
4. **Start Chatting**: Use Neo to discover and manage influencers

### Key Workflows

#### 🔍 Finding Influencers
```
User: "Find tech influencers in Mumbai with 50k+ followers on Instagram"
Neo: "I found 3 tech influencers in Mumbai! Here's what I discovered..."
```

#### 📊 Campaign Management
- Create campaigns through natural language
- Track performance in real-time
- Generate automated reports

#### 💬 AI Assistant Features
- Natural language queries
- Contextual conversations
- Smart recommendations
- Automated follow-ups

### Dashboard Features

- **Campaign Overview**: Real-time campaign metrics
- **Influencer Database**: Search and filter influencers
- **AI Chat Interface**: Conversational AI assistant
- **Analytics Dashboard**: Performance insights and reports

## 🔧 Configuration

### Environment Variables

| Variable                    | Description                      | Required |
| --------------------------- | -------------------------------- | -------- |
| `VITE_FIREBASE_API_KEY`     | Firebase API key                 | Yes      |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase auth domain             | Yes      |
| `VITE_FIREBASE_PROJECT_ID`  | Firebase project ID              | Yes      |
| `VITE_PHI3_MODEL_PATH`      | Path to Phi-3 model file         | Yes      |
| `VITE_AI_TEMPERATURE`       | AI response creativity (0.0-1.0) | No       |

### Firebase Security Rules

Ensure your Firestore security rules allow authenticated access:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## 🧪 Testing

Run the test suite:

```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run E2E tests
npm run test:e2e
```

## 🚀 Deployment

### Vercel (Recommended)

1. Connect your GitHub repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy automatically on every push

### Netlify

1. Build command: `npm run build`
2. Publish directory: `dist`
3. Add environment variables in build settings

### Firebase Hosting

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Initialize Firebase
firebase init hosting

# Deploy
firebase deploy
```

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. **Fork** the repository
2. **Create** a feature branch: `git checkout -b feature/amazing-feature`
3. **Commit** your changes: `git commit -m 'Add amazing feature'`
4. **Push** to the branch: `git push origin feature/amazing-feature`
5. **Open** a Pull Request

### Development Guidelines

- Follow the existing code style
- Write meaningful commit messages
- Add tests for new features
- Update documentation as needed
- Ensure all tests pass

## 📚 API Reference

### AI Chat Endpoints

```typescript
// Send a message to the AI assistant
POST /api/chat
{
  "message": "Find fashion influencers in Delhi",
  "context": "campaign-planning"
}

// Get chat history
GET /api/chat/history

// Clear chat history
DELETE /api/chat/history
```

### Influencer Management

```typescript
// Search influencers
GET /api/influencers/search?query=tech&mumbai&minFollowers=50000

// Upload influencer CSV
POST /api/influencers/upload
Content-Type: multipart/form-data

// Get influencer details
GET /api/influencers/:id
```

## 🐛 Troubleshooting

### Common Issues

**AI Model Not Loading**
- Ensure the model file is in the correct path
- Check browser console for WebAssembly errors
- Verify model file integrity

**Firebase Connection Issues**
- Verify environment variables are set correctly
- Check Firebase project configuration
- Ensure Firestore security rules allow access

**Build Errors**
- Clear node_modules and reinstall: `rm -rf node_modules && npm install`
- Check TypeScript compilation errors
- Verify all dependencies are compatible

### Performance Tips

- Use the latest version of Chrome for best AI performance
- Ensure stable internet connection for Firebase operations
- Clear browser cache if experiencing issues

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Microsoft** for the Phi-3 model
- **Hugging Face** for the Transformers.js library
- **Firebase** for the robust backend infrastructure
- **Vercel** for the excellent hosting platform

## 📞 Support

Need help? Here's how to get support:

- 📧 **Email**: support@campnai.com
- 💬 **Discord**: [Join our community](https://discord.gg/campnai)
- 📖 **Documentation**: [Full docs](https://docs.campnai.com)
- 🐛 **Bug Reports**: [GitHub Issues](https://github.com/campnai/campnai/issues)

---

<div align="center">

**Built with ❤️ for Indian SMBs and agencies**

*Transforming influencer marketing with the power of AI*

[🌐 Website](https://campnai.com) • [📧 Contact](mailto:hello@campnai.com) • [🐙 GitHub](https://github.com/campnai/campnai)

</div>
