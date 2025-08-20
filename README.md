# AidGPT (llama-pc-agent)

> An AI-powered personal computer assistant built with **Ollama Llama 3.2**.  
> AidGPT can **create, read, update, and delete files**, manage folders, and even suggest commands — all through **natural language prompts**.
>

---

## Features
-  Create, read, update, and delete files & folders  
-  List directory contents dynamically  
-  Intelligent file path resolution (no need to copy-paste full paths)  
-  Powered by [Ollama](https://ollama.ai/) and **Llama 3.2**  
-  MERN-stack ready (Node.js backend + React frontend)  
-  Secure sandbox for file operations  

---

##  Tech Stack
- **Backend** → Node.js (Express)  
- **Frontend** → React (Vite)  
- **AI Model** → Ollama Llama 3.2  
- **File System Layer** → Custom safe executor (`fileUtils`)  

---

##  Getting Started

### 1️ Clone the repo
```bash
git clone https://github.com/shamimakhonzada/AidGPT-llama-pc-agent-.git
cd AidGPT-llama-pc-agent

# Install backend
cd backend
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


