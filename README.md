# AidGPT (llama-pc-agent)

> 🚀 An AI-powered personal computer assistant built with **Ollama Llama 3.2**.  
> AidGPT can **create, read, update, and delete files**, manage folders, and even suggest commands — all through **natural language prompts**.

---

## ✨ Features
- 📝 Create, read, update, and delete files & folders  
- 📂 List directory contents dynamically  
- ⚡ Intelligent file path resolution (no need to copy-paste full paths)  
- 🤖 Powered by [Ollama](https://ollama.ai/) and **Llama 3.2**  
- 🛠️ MERN-stack ready (Node.js backend + React frontend)  
- 🔐 Secure sandbox for file operations  

---

## 📦 Tech Stack
- **Backend** → Node.js (Express)  
- **Frontend** → React (Vite)  
- **AI Model** → Ollama Llama 3.2  
- **File System Layer** → Custom safe executor (`fileUtils`)  

---

## 🚀 Getting Started

### 1️⃣ Clone the repo
```bash
git clone https://github.com/your-username/llama-pc-agent.git
cd llama-pc-agent

# Install backend
cd server
npm install

# Install frontend
cd ../client
npm install


ollama pull llama:3.2
ollama run llama:3.2


cd server
npm run dev

cd client
npm run dev

You can interact with AidGPT using natural language commands:

{ "prompt": "create a folder named 'project' on Desktop with a file main.py inside it" }





<img width="1920" height="1200" alt="Screenshot from 2025-08-20 10-57-48" src="https://github.com/user-attachments/assets/ba4488db-58f8-48a5-8095-191c1b7b1ada" />


