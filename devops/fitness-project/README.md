 # Fitness Project

A full-stack fitness tracking application that allows users to log workouts and daily steps, view a personal dashboard, and manage profile and settings.
The project consists of a React (Vite) single-page application and a Node.js (Express) backend API, backed by PostgreSQL and Redis.

This repository also demonstrates multiple deployment approaches:

- VM provisioning using Vagrant and Cloud-init 
- Containerized deployment using Docker Compose

---

## Key Features
- User authentication (JWT)
- Track workouts (create/list/get details)
- Log daily steps
- Per-user dashboard with aggregated data
- Profile and settings endpoints

---

## Tech Stack
- Frontend: React (Vite)
- Backend: Node.js (Express)
- Database: PostgreSQL
- Cache: Redis
- Reverse proxy: Nginx
- Containers: Docker, Docker Compose
- CI/CD: GitHub Actions
- TLS: Let’s Encrypt (Certbot)

---

## Repository layout

```
client/        # React frontend
server/        # Express backend API
nginx/         # Nginx reverse proxy configuration (for Docker)
infra/         # Vagrant & Cloud-init provisioning 
certbot/       # TLS certificates and ACME challenge data (for Docker)
```

---

## Database

- Schema: `server/schema.sql` contains the tables and example layout. Run it against your Postgres instance to create tables.
- Seed/sample data: no automated seed included. Add demo users directly or extend `server/` with a small seed script.

---

## Scripts

Client (`client/package.json`):

- `npm run dev` — start Vite dev server
- `npm run build` — build for production
- `npm run preview` — preview the production build
- `npm run lint` — run ESLint

Server (`server/package.json`):

- `npm run dev` — start server with `nodemon`
- `npm start` — start server with `node`

---

## API Overview (short)

Base URL: `http://localhost:5000/api`

Authentication: send header `Authorization: Bearer <token>` for protected routes.

Main endpoints (see `server/routes/`):

- `POST /api/users/login` — authenticate and receive `{ token, user }`
- `GET /api/users` — list users

- `GET /api/dashboard/:userId` — user dashboard data (protected)

- Workouts:
  - `GET /api/workouts/:userId`
  - `GET /api/workouts/details/:workoutId`
  - `POST /api/workouts` — create workout

- Steps:
  - `GET /api/steps/:userId`
  - `POST /api/steps` — create or update daily steps

- Profile & Settings (protected):
  - `GET /api/profile/:userId`, `PUT /api/profile/:userId`
  - `GET /api/settings/:userId`, `PUT /api/settings/:userId`

For full route details, inspect the files in `server/routes/`.

---

## License

This project is licensed under the MIT License — see the `LICENSE` file.

---

## Local development

### Prerequisites

- Node.js 18+ (LTS recommended)
- npm (comes with Node)
- PostgreSQL (local or hosted)
- (Optional) Redis if you want caching as provided in `server/redis.js`

Commands below assume Windows `cmd.exe`. For PowerShell or Unix shells the commands are similar but with different path separators.

1) Install dependencies

```bat
cd server
npm install

cd ..\client
npm install
```

2) Create environment file for backend:

```
nano server/.env
```

Example:

```
PORT=5000
DB_HOST=localhost
DB_PORT=5432
DB_USER=your_db_user
DB_PASS=your_db_password
DB_NAME=your_db_name
JWT_SECRET=replace_with_a_strong_secret
```

2) Start the backend 

```bat
cd server
npm run dev
```

This runs `nodemon server.js`. Production start is `npm start`.

3) Start the frontend (new terminal)

```
cd client
npm run dev
```

Vite will print the dev URL (commonly `http://localhost:5173`). API defaults to `http://localhost:5000`.

---

## Vagrant 

This section describes deployment using Vagrant on a Linux host (e.g. Ubuntu).

### Prerequisites

- Linux host (Ubuntu recommended)
- VirtualBox
- Vagrant
- Git

1. Install required packages:

```
sudo apt update
sudo apt install -y virtualbox git
sudo apt install -y vagrant
```

2. Clone the repo:

```
git clone https://github.com/ACodes3/fitness-project.git
cd fitness-project/infra/vagrant
```

3. Start the VM with vagrant:

```
vagrant up
```

4. Wait until the provisioning is finished. You will be then able to visit the deployed link.

 Link to the deployment video: (https://drive.google.com/file/d/1BrEpeRqYZeISf-I7-LidWV-EW6P73NAm/view?usp=sharing)

---

## Cloud-init

This section describes automated VM provisioning using cloud-init and LXD on a Linux host.

### Prerequisites

- Linux host (Ubuntu recommended)
- Git
- snapd

1. Install required packages:

```
sudo apt update
sudo apt install -y git snapd
sudo systemctl enable --now snapd.socket
```

2. Install and initialize LXD:

```
sudo snap install lxd
lxd init --minimal
```

3. Clone the repo:

```
git clone https://github.com/ACodes3/fitness-project.git
cd fitness-project/infra/cloud-init
```

4. Run the deployment script:

```
chmod +x deploy.sh
./deploy.sh
```

5. Wait until the provisioning is finished. Once finished, the application URL will be printed in the output.

---

## Containerized deployment with Docker Compose

  This section describes the container-based deployment. The entire application stack is deployed using Docker Compose and consists of multiple services connected via an internal Docker network.

### Prerequisites

- Linux VM (or any host with Docker support)
- Docker
- Docker Compose plugin
- A domain pointing to this VM (example: devops-vm-30.lrk.si)
- Ports 80 and 443 reachable from the internet (opened in VM firewall / security group)

### Installation

#### Step 1: Install Docker

Docker is the containerization platform that runs our entire application stack. Follow these steps to install it:

##### 1.1 Ensure curl is installed

```bash
sudo apt update
sudo apt install -y curl
```

Curl is necessary for downloading the Docker installation script.

##### 1.2 Install Docker using the official convenience script

```bash
curl -fsSL https://get.docker.com/ | sh
```

This script automatically detects your Linux distribution and installs the appropriate Docker version. While this method is sometimes called "dirty" because it's less customizable, it's the fastest and most reliable way to get Docker up and running.

##### 1.3 Enable Docker without sudo (REQUIRED)

By default, Docker requires root privileges. To use Docker as a regular user, add yourself to the docker group:

```bash
sudo usermod -aG docker $USER
```

**IMPORTANT:** Group membership changes require a new login session. You must either:

- Log out and log back in, OR
- Reboot the system, OR
- Run the following command to activate the group in your current session:

```bash
newgrp docker
```

The `newgrp` command starts a new shell where your primary group is temporarily set to docker. This is necessary because group membership is loaded at login time, not dynamically updated.

##### 1.4 Verify Docker installation

Run the following command to check if Docker is properly installed:

```bash
docker version
```

You should see both Client and Server version information. If both appear, Docker is correctly installed and running.

Test that Docker works without sudo:

```bash
docker ps
```

If this command returns a list (even if empty) without permission errors, you're all set. If you see "Permission denied", run `newgrp docker` as mentioned in step 1.3.

#### Step 2: Clone the Repository

Now that Docker is installed, let's get the application code.

##### 2.1 Install Git (if not already installed)

```bash
sudo apt install -y git
```

Git is essential for version control and cloning repositories from GitHub.

### Deployment Steps

1. Clone repo 

```
git clone https://github.com/ACodes3/fitness-project.git
cd fitness-project
```

2. Set up Docker buildx for multi-architecture builds:

```
docker buildx create --name multiarch --use
docker buildx inspect --bootstrap
```

3. Create environment file on the VM 

```
nano .env
```

Example:

```
# Database
POSTGRES_USER=dev
POSTGRES_PASSWORD=change_me
POSTGRES_DB=fitnessdb

# Backend
DB_HOST=db
DB_PORT=5432
DB_USER=${POSTGRES_USER}
DB_PASS=${POSTGRES_PASSWORD}
DB_NAME=${POSTGRES_DB}

# Redis
REDIS_HOST=redis
REDIS_PORT=6379

# Security
JWT_SECRET=change_me_to_a_strong_secret
```

4. Run Docker Compose up (development/testing) (staging cert.)

```
docker compose run --rm certbot certonly \
  --staging \
  --webroot -w /var/www/certbot \
  -d YOUR_DOMAIN \
  --email YOUR_EMAIL \
  --agree-tos --no-eff-email
```

Run the same command without --staging for production certificate.

5. Reload ngix:

```
docker exec $(docker ps -qf name=proxy) nginx -s reload
```

---

Link to the deployment video: [Video of deployment logs/output.](https://drive.google.com/file/d/1wPJRGoT21q1EvEOf4DHR3E_7V7nCbXyJ/view?usp=sharing)

---

## Kubernetes Deployment (K8s)

This section describes the Kubernetes-based deployment of the Fitness Project. The entire application stack is deployed on a Kubernetes cluster using declarative YAML manifests and consists of multiple services connected via Kubernetes Services and exposed externally using an Ingress controller.

### How to Run the Project

#### Prerequisites

- Linux virtual machine (tested on Ubuntu)
- Docker
- kubectl
- Kubernetes cluster (MicroK8s, k3s, or managed)
- GitHub account (for Container Registry and CI/CD)

#### Cluster Requirements (One-Time)

The Kubernetes cluster must have the following components available:

- DNS (CoreDNS)
- Ingress controller (ingress-nginx)
- A default StorageClass (for PVCs)
- cert-manager (for TLS)
- MetalLB (if the cluster has no cloud LoadBalancer)

These components are considered cluster-level infrastructure and are not managed by this repository.

---

#### Example Cluster Setup (k3s on a Single VM)

This section shows one possible way to set up a compatible Kubernetes cluster.
If a cluster with the required components already exists, this step can be skipped.

Install k3s

```
curl -sfL https://get.k3s.io | sh -
```

Configure kubectl access:

```
mkdir -p ~/.kube
sudo cp /etc/rancher/k3s/k3s.yaml ~/.kube/config
sudo chown -R $USER:$USER ~/.kube
chmod 600 ~/.kube/config
```

Verify cluster:

```
kubectl get nodes
```

Disable default Traefik Ingress (This project uses NGINX Ingress instead of Traefik.)

```
sudo systemctl stop k3s
sudo nano /etc/systemd/system/k3s.service
```

Add the following flag to the ExecStart command:

```
--disable traefik
```

Restart k3s:

```
sudo systemctl daemon-reexec
sudo systemctl restart k3s
```

Install NGINX Ingress Controller

```
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/main/deploy/static/provider/cloud/deploy.yaml
```

Install cert-manager

```
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/latest/download/cert-manager.yaml
```

Install MetalLB (Bare-Metal Clusters)

```
kubectl apply -f https://raw.githubusercontent.com/metallb/metallb/v0.14.5/config/manifests/metallb-native.yaml
```

Apply the IP address pool configuration provided in this repository:

```
curl -sfL https://get.k3s.io | sh -
```

Verify Cluster Components

```
kubectl get pods -n kube-system
kubectl get pods -n ingress-nginx
kubectl get pods -n cert-manager
kubectl get pods -n metallb-system
kubectl get storageclass
```

#### 1. Deploy Kubernetes Resources

> **Note:** Before deploying, update `k8s/01-secrets.yaml` with valid database credentials and a JWT secret.  
> Placeholder values must be replaced.

All Kubernetes manifests are located in the k8s/ directory.

Apply the resources in logical order:

```
kubectl apply -f k8s/00-namespace.yaml
kubectl apply -f k8s/01-secrets.yaml
kubectl apply -f k8s/02-configmap-db-init.yaml
kubectl apply -f k8s/03-postgres.yaml
kubectl apply -f k8s/04-redis.yaml
kubectl apply -f k8s/05-backend.yaml
kubectl apply -f k8s/06-frontend.yaml
kubectl apply -f k8s/07-ingress.yaml
kubectl apply -f k8s/08-cert-manager-issuer.yaml
kubectl apply -f k8s/10-metallb-ip-pool.yaml
```

(Optional) Deploy blue/green frontend variant:

```
kubectl apply -f k8s/09-bluegreen-frontend.yaml
```

This deployment is used to demonstrate a blue/green deployment strategy by switching traffic at the Service level.

#### 2. Verify deployment:

```
kubectl get pods -n fitness
kubectl get svc -n fitness
kubectl get ingress -n fitness
```

Once all pods are in Running state and the TLS certificate is issued, the application is accessible at:

```
https://devops-vm-05.lrk.si
```

> The domain must point to the cluster’s external IP (Ingress / MetalLB).


### Screenshots / Demo

#### Infrastructure is Kubernetes (not Docker)
![Infrastructure is Kubernetes](images/K8s_not_docker.png)

#### App Exposed via Ingress + Public IP + TLS
![Ingress and TLS](images/ngnx_incress.png)

#### Minimum 3 Services + HA Replicas
![HA Replicas](images/3_processes_ha.png)

#### PersistentVolume Usage
![PersistentVolume](images/5gi.png)

#### Apply Manifests
![Apply manifests](images/Apply_manifests.png)

#### Rolling update
![Rolling update demo Terminal 1](images/BackendV2Terminal1.png)
![Rolling update demo Terminal 2](images/BackendV2Terminal2.png)

#### TLS Certificate
![TLS certificate](images/TLS_cert.png)

#### Rollout history
![kubectl rollout history](images/kubectl_rollout_history.png)
