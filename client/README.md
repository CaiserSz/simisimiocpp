# EV Charging Station Simulator - Modern React Frontend

**Version:** 2.0.0  
**Created:** 2025-01-11  
**Framework:** React 18 + Vite + Tailwind CSS

---

## 🚀 Features

- ⚡ **Lightning Fast**: Vite for instant HMR
- 🎨 **Modern UI**: Tailwind CSS for beautiful, responsive design
- 📊 **Real-time**: Socket.IO integration for live updates
- 🔄 **State Management**: Zustand for simple, efficient state
- 📡 **API Integration**: React Query for server state management
- 🎯 **Type Safe**: ESLint for code quality

---

## 📦 Installation

```bash
cd client
npm install
```

---

## 🏃 Development

```bash
# Start development server
npm run dev

# Server will start at http://localhost:3000
```

**Note:** Backend API must be running on `http://localhost:3001`

---

## 🏗️ Build

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

---

## 📁 Project Structure

```
client/
├── src/
│   ├── components/      # Reusable components
│   ├── pages/           # Page components
│   ├── hooks/           # Custom React hooks
│   ├── store/           # Zustand stores
│   ├── utils/           # Utility functions
│   ├── App.jsx          # Main app component
│   ├── main.jsx         # Entry point
│   └── index.css        # Global styles
├── public/              # Static assets
├── index.html           # HTML template
├── vite.config.js       # Vite configuration
├── tailwind.config.js   # Tailwind configuration
└── package.json
```

---

## 🎨 Tech Stack

- **React 18** - UI framework
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **React Router** - Routing
- **Zustand** - State management
- **React Query** - Server state
- **Socket.IO Client** - Real-time updates
- **Axios** - HTTP client
- **Chart.js** - Data visualization
- **Lucide React** - Icons

---

## 🔧 Configuration

### Environment Variables

Create `.env` file:

```env
VITE_API_URL=http://localhost:3001/api
```

### Proxy Configuration

Vite proxy is configured in `vite.config.js` to proxy API requests to backend:

```javascript
proxy: {
  '/api': 'http://localhost:3001',
  '/socket.io': 'http://localhost:3001'
}
```

---

## 📚 Documentation

- [React](https://react.dev/)
- [Vite](https://vitejs.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [React Query](https://tanstack.com/query/latest)
- [Zustand](https://zustand-demo.pmnd.rs/)

---

## ✅ Status

**Current:** ✅ **Initial structure created**

**Next Steps:**
1. Implement remaining components
2. Add E2E tests
3. Build and deploy

---

**Created:** 2025-01-11  
**Team:** Development Team

