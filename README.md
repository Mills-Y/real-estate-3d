# 🏠 Real Estate 3D Scanner

A full-stack web application for interactive 3D property visualization, built with React, Three.js, and Node.js. Features an AI-powered property assistant, voice input, and cloud file storage — deployed live at [realestate3d-demo.com](https://realestate3d-demo.com).

![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat&logo=javascript&logoColor=black)
![React](https://img.shields.io/badge/React-20232A?style=flat&logo=react&logoColor=61DAFB)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat&logo=nodedotjs&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=flat&logo=mongodb&logoColor=white)
![Cloudflare](https://img.shields.io/badge/Cloudflare-F38020?style=flat&logo=cloudflare&logoColor=white)

---

## ✨ Features

- **Interactive 3D Viewer** — Upload and explore property models in-browser using Three.js with orbit controls, lighting, and zoom
- **AI Property Assistant** — Claude-powered chatbot answers questions about properties using the Anthropic API
- **Voice Input** — Web Speech API integration lets users speak queries to the AI assistant
- **Tap-to-Measure** — Three.js raycasting enables click-based distance measurements on 3D models
- **Cloud Storage** — 3D model files stored in Cloudflare R2 via AWS SDK
- **Persistent Data** — Property metadata stored in MongoDB Atlas, solving ephemeral storage limitations
- **User Authentication** — Secure login/register system with Cloudflare Turnstile bot protection

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React, Three.js, Web Speech API |
| Backend | Node.js, Express |
| Database | MongoDB Atlas |
| File Storage | Cloudflare R2 (AWS SDK) |
| AI | Anthropic Claude API |
| Hosting | Cloudflare Pages (frontend), Render (backend) |
| Auth/Security | Cloudflare Turnstile |

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- MongoDB Atlas account
- Cloudflare R2 bucket
- Anthropic API key

### Installation

```bash
# Clone the repo
git clone https://github.com/Crawv01/real-estate-3d.git
cd real-estate-3d

# Install frontend dependencies
npm install

# Install backend dependencies
cd backend
npm install
```

### Environment Variables

Create a `.env` file in the `backend` directory:

```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
CLOUDFLARE_R2_BUCKET=your_bucket_name
CLOUDFLARE_R2_ENDPOINT=your_r2_endpoint
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
ANTHROPIC_API_KEY=your_anthropic_key
```

### Running Locally

```bash
# Start backend
cd backend
npm run dev

# Start frontend (new terminal)
cd ..
npm start
```

Frontend runs at `http://localhost:3000`, backend at `http://localhost:5000`.

---

## 📁 Project Structure

```
real-estate-3d/
├── src/
│   ├── components/
│   │   ├── ModelViewer.js       # Three.js 3D viewer component
│   │   ├── AIAssistant.js       # Claude-powered chat with voice input
│   │   └── MeasureTool.js       # Raycasting tap-to-measure feature
│   ├── pages/
│   │   ├── Home.js              # Property listings
│   │   └── PropertyDetail.js    # Individual property with 3D viewer
│   └── App.js
├── backend/
│   ├── server.js                # Express server
│   ├── routes/
│   │   ├── upload.js            # File upload to Cloudflare R2
│   │   ├── models.js            # Property CRUD operations
│   │   └── ai.js                # Anthropic API integration
│   └── middleware/
│       └── multerConfig.js      # File upload config
└── README.md
```

---

## 🌐 Live Demo

**[realestate3d-demo.com](https://realestate3d-demo.com)**

---

## 📸 Key Implementation Details

**MongoDB Atlas Integration** — Migrated from JSON file storage to MongoDB Atlas to solve Render's ephemeral filesystem problem. Property metadata persists across deployments.

**Cloudflare R2 Storage** — 3D model files (GLB, GLTF, OBJ, PLY, FBX) are uploaded directly to R2 using the AWS SDK S3-compatible API, keeping large binary files out of the database.

**AI Assistant** — Uses the Anthropic API with property context injected into the system prompt, so Claude can answer specific questions about square footage, price, and features for each listing.

**Voice Input** — Web Speech API transcribes spoken queries and sends them to the AI assistant, enabling hands-free property exploration.

---

## 📄 License

MIT
