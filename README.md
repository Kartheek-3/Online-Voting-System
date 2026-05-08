# 🗳️ SecureVote - Online Voting System

A full-stack Online Voting System built using:

- ⚛️ React Frontend
- 🐍 Flask Backend
- 🔥 Firebase Firestore
- 🐳 Docker
- ☸️ Kubernetes (Minikube)

---

# 🚀 Features

- User Authentication
- Secure Voting System
- Candidate Management
- Real-Time Results
- Firebase Integration
- Dockerized Application
- Kubernetes Deployment

---

# 📂 Project Structure

```bash
securevote/
│
├── backend/
├── frontend/
├── k8s/
├── Dockerfile.frontend
└── README.md

----

# Prerequisites
Install the following software before running the project:

Node.js

Python 3.10+

Docker Desktop

Minikube

kubectl

Git

🔥 Clone Repository
git clone https://github.com/Kartheek-3/Online-Voting-System.git

cd Online-Voting-System
🔥 Frontend Setup
Navigate to frontend
cd frontend
Install dependencies
npm install
Run frontend
npm run dev
Frontend runs on:

http://localhost:5173
🐍 Backend Setup
Navigate to backend
cd backend
Install dependencies
pip install -r requirements.txt
Run Flask server
python app.py
Backend runs on:

http://localhost:5000
🔥 Firebase Setup
Step 1
Open Firebase Console:

https://console.firebase.google.com

Step 2
Create Firebase Project

Step 3
Enable:

Firestore Database

Authentication

Step 4
Go to:

Project Settings → Service Accounts
Step 5
Click:

Generate New Private Key
Step 6
Download JSON file

Step 7
Place JSON file inside:

backend/config/serviceAccountKey.json
🐳 Docker Setup
Build Backend Docker Image
docker build -t my-election-backend:v1 ./backend
Build Frontend Docker Image
docker build -t my-election-frontend:v1 -f Dockerfile.frontend .
Verify Docker Images
docker images
Run Backend Container
docker run -p 5000:5000 my-election-backend:v1
Run Frontend Container
docker run -p 3000:80 my-election-frontend:v1
☸️ Kubernetes Setup (Minikube)
Start Minikube
minikube start
Connect Docker to Minikube
Windows PowerShell
& minikube -p minikube docker-env --shell powershell | Invoke-Expression
Build Docker Images Inside Minikube
Backend
docker build -t my-election-backend:v1 ./backend
Frontend
docker build -t my-election-frontend:v1 -f Dockerfile.frontend .
Apply Kubernetes Files
kubectl apply -f k8s/
Check Namespaces
kubectl get namespaces
Check Deployments
kubectl get deployments -n voting-app
Check Pods
kubectl get pods -n voting-app
Check Services
kubectl get svc -n voting-app
View Backend Logs
kubectl logs -l app=backend -n voting-app
View Frontend Logs
kubectl logs -l app=frontend -n voting-app
Describe Pods
kubectl describe pods -n voting-app
Open Frontend Application
minikube service frontend-service -n voting-app
Restart Backend Deployment
kubectl rollout restart deployment backend-deployment -n voting-app
Restart Frontend Deployment
kubectl rollout restart deployment frontend-deployment -n voting-app
Delete Kubernetes Resources
kubectl delete -f k8s/
🛠️ Troubleshooting
Check Pod Logs
kubectl logs <pod-name> -n voting-app
Check Docker Images
docker images
Fix ImagePullBackOff Error
Reconnect Docker to Minikube:

& minikube -p minikube docker-env --shell powershell | Invoke-Expression
Rebuild Images:

docker build -t my-election-backend:v1 ./backend

docker build -t my-election-frontend:v1 -f Dockerfile.frontend .


🔒 Security Notes
Do NOT upload Firebase service account JSON

Add secrets to .gitignore

Keep API keys private

📜 .gitignore Example
node_modules/
dist/

.env

backend/config/serviceAccountKey.json

__pycache__/
*.pyc
👨‍💻 Author
Kartheek Mudi

📜 License
This project is for educational purposes only.
