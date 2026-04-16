# 🚀 Complyt: Autonomous Compliance Agent 

Complyt is an enterprise-grade AI-powered system that automates the extraction, validation, and generation of customs-compliant shipping documents. It relies on a horizontally scalable event-driven architecture with native idempotency and distributed workers.

## 🏗 System Architecture

```mermaid
flowchart TD
    User([User / Browser])
    React[Frontend: React/Vite]
    FastAPI[Backend: FastAPI]
    Redis[Queue Broker: Redis]
    Worker1[Celery Worker 1]
    Worker2[Celery Worker 2]
    Postgres[(Database: PostgreSQL)]
    LLM(OpenAI GPT-4o API)

    User -- "Upload Invoice" --> React
    React -- "POST /upload" --> FastAPI
    
    FastAPI -- "Checks Idempotency" --> Postgres
    FastAPI -- "Queues Task" --> Redis
    
    Redis -. "Pulls Task" .-> Worker1
    Redis -. "Pulls Task" .-> Worker2
    
    Worker1 -- "1. OCR (Vision)\n2. AI Extraction" --> LLM
    Worker2 -- "1. OCR (Vision)\n2. AI Extraction" --> LLM
    
    Worker1 -- "Writes Result" --> Postgres
    Worker2 -- "Writes Result" --> Postgres
    
    React -. "Polls Status" .-> FastAPI
    FastAPI -. "Fetches Result" .-> Postgres
```

### 🖼 Dashboards
![Dashboard Overview](./dashboard%201.png)
![Document History](./dashboard%202.png)
![Compliance Insights](./dashboard%203.png)

## ⭐ Core Features & Instructor Requirements
✅ **Event-Driven Architecture**: FastAPI hands off compute-heavy AI tasks to Celery via a message broker.  
✅ **Queueing System**: Uses `Redis` to hold, route, and atomically assign pending documents to workers.  
✅ **Parallelisation**: Ships with minimum 2 active workers concurrently picking jobs (`worker-1` and `worker-2`).  
✅ **Atomic Tasks**: Celery is heavily optimized (`task_acks_late=True` and `prefetch_multiplier=1`) to prevent data loss on node failure.  
✅ **Idempotency**: Document bytes are hashed in SHA-256. Duplicate uploads immediately return the cached historical result without running the pipeline twice.  
✅ **PII Security**: The backend masks personally identifiable information before transmitting to the frontend payload, while natively applying AES-encryption via Fernet to Database states.  

---

## 🛠 Local Setup Instructions (Docker)

All components run in a unified, discoverable Docker network. 

1. **Configure Environment:** Create an `.env` file at the root.
   ```env
    OPENAI_API_KEY="sk-..."
    JWT_SECRET_KEY="supersecret"
    PII_ENCRYPTION_KEY="<generate a base64 key>"
   ```
2. **Spin Up Environment:**
   Run the full stack (API, PGSQL, Redis, 2 Workers) with one command.
   ```bash
   docker-compose up --build -d
   ```
3. **Run Frontend UI:**
   In a separate terminal, bring up the user dashboard.
   ```bash
   cd frontend
   npm install && npm run dev
   ```

## ☸️ Minikube / Kubernetes Deployment

To deploy the stack into a local Minikube cluster:
```bash
minikube start

# Apply Configurations & Secrets
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/secret.yaml

# Create Broker & DB
kubectl apply -f k8s/redis.yaml
kubectl apply -f k8s/postgres.yaml

# Boot Distributed Network
kubectl apply -f k8s/api.yaml
kubectl apply -f k8s/workers.yaml
```
