# NSU Audit System - Quick Start

## One-Click Start

Double-click `start.bat` to run everything!

Or run this in terminal:
```bash
cd D:\Opencode\Project 1\project 2
start.bat
```

---

## Manual Start

### 1. Start MongoDB
```bash
net start MongoDB
```

### 2. Start Backend
```bash
cd D:\Opencode\Project 1\project 2
npm start
```

### 3. Start Frontend (new terminal)
```bash
cd D:\Opencode\Project 1\project 2\frontend
npm run dev
```

---

## Access

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000

---

## First Time Setup

1. Install backend dependencies:
   ```bash
   cd D:\Opencode\Project 1\project 2
   npm install
   ```

2. Seed database:
   ```bash
   npm run seed
   ```

3. Install frontend dependencies:
   ```bash
   cd frontend
   npm install
   ```

---

## Troubleshooting

- **MongoDB not starting**: Make sure MongoDB is installed
- **Port already in use**: Close other applications using ports 3000 or 5173
- **Login not working**: Ensure you're using @northsouth.edu email
