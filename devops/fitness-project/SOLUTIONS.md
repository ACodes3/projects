**Project Overview**

**Purpose:** The Fitness Project is a full-stack web application for tracking steps, workouts, and user settings. It includes a Vite + React client (`client/`) and an Express-based Node server (`server/`) with a PostgreSQL-compatible schema and Redis support for caching/session functionality. The app provides user authentication, profile management, workout tracking, and simple analytics.

**Key Features:**
- **Authentication:** User registration and login with JWT.
- **Steps & Workouts:** Add, edit, delete, and view steps and workout entries.
- **Profile & Settings:** User profile pages and configurable settings.
- **Caching:** Redis integration for performance.

**Repository Layout (important paths)**
- **`client/`**: React + Vite front-end.
- **`server/`**: Node + Express back-end.
- **`server/schema.sql`**: Database schema to create tables (PostgreSQL).
- **`server/redis.js`**: Redis connection helper.
- **`server/routes/`**: All API route handlers (`dashboard.js`, `profile.js`, `settings.js`, `steps.js`, `users.js`, `workouts.js`).

**System Requirements**
- Node.js (v18+ recommended)
- npm (or yarn)
- PostgreSQL server (or compatible DB)
- Redis server (for caching/session), optional but recommended

**Setup and Deployment**

***Vagrant setup***

1. Go to the devops teleport web gui (its the best if you are in the root admin: `sudo -i`).

2. Install `sudo apt install virtualbox virtualbox-dkms linux-headers-generic-hwe-22.04`, and `wget -O- https://apt.releases.hashicorp.com/gpg | gpg --dearmor | sudo tee /usr/share/keyrings/hashicorp-archive-keyring.gpg echo "deb [signed-by=/usr/share/keyrings/hashicorp-archive-keyring.gpg] https://apt.releases.hashicorp.com $(lsb_release -cs) main" | sudo tee /etc/apt/sources.list.d/hashicorp.list sudo apt update && sudo apt install vagrant`

3. You will also need git: `sudo apt update` then `sudo apt install git -y`

4. Clone the repo `git clone https://github.com/ACodes3/fitness-project.git`.

5. Go inside the folder:`cd fitness-project/infra/vagrant`

6. Run the vagrant setup : `vagrant up`

7. Wait until the deployment is finished.

8. You will be then able to visit the deployed link.

 Link to the deployment video: [Video of deployment logs/output.](https://drive.google.com/file/d/1BrEpeRqYZeISf-I7-LidWV-EW6P73NAm/view?usp=sharing)

**Useful Vagrant commands**

| Command | Purpose |
|---|---|
| `vagrant up` | Create and provision the VM defined by the `Vagrantfile`. |
| `vagrant ssh` | SSH into the running VM. |
| `vagrant halt` | Stop the VM gracefully. |
| `vagrant destroy -f` | Destroy the VM and remove its resources. |
| `vagrant provision` | Re-run the provisioner scripts without recreating the VM. |
| `vagrant reload --provision` | Restart the VM and re-run provisioning. |
| `vagrant status` | Show the current status of the VM. |

***Cloud-init setup***

Skip the first x steps if you already tested the vagrant setup from above.
1. Go to the devops teleport web gui (its the best if you are in the root admin: `sudo -i`).

2. Install `sudo apt install virtualbox virtualbox-dkms linux-headers-generic-hwe-22.04`, and `wget -O- https://apt.releases.hashicorp.com/gpg | gpg --dearmor | sudo tee /usr/share/keyrings/hashicorp-archive-keyring.gpg echo "deb [signed-by=/usr/share/keyrings/hashicorp-archive-keyring.gpg] https://apt.releases.hashicorp.com $(lsb_release -cs) main" | sudo tee /etc/apt/sources.list.d/hashicorp.list sudo apt update && sudo apt install vagrant`

3. You will also need git: `sudo apt update` then `sudo apt install git -y`

4. Clone the repo `git clone https://github.com/ACodes3/fitness-project.git`.

5. Install snap: `sudo apt install snapd`, then enable and start it: `sudo systemctl enable --now snapd.socket`

6. Now install LXD : `sudo snap install lxd` and initialize it: `lxd init --minimal`.

7. Go to the cloud-init dir: `fitness-project/infra/cloud-init`

8. Run: `cmod +x deploy.sh` and then also run `./deploy.sh`

9. Wait until you get the deployment link.

10. You will be then able to visit the link.


**Cloud-init (LXD / LXC) — debugging & useful commands**

If you run cloud-init inside LXD containers, these commands help inspect cloud-init progress, re-run provisioning, check networking, and debug services.

Basic status & logs

```bash
# Check cloud-init/high-level status
lxc exec fitness-vm -- sudo cloud-init status --long

# View logs produced by cloud-init inside the container
lxc exec fitness-vm -- sudo tail -n 200 /var/log/cloud-init.log
lxc exec fitness-vm -- sudo tail -n 200 /var/log/cloud-init-output.log

# Inspect systemd unit logs for cloud-init
lxc exec fitness-vm -- sudo journalctl -u cloud-init --no-pager -n 200
```

Re-run / reapply cloud-config

```bash
# Clean previous runs, then re-init and run modules
lxc exec fitness-vm -- sudo cloud-init clean
lxc exec fitness-vm -- sudo cloud-init init
lxc exec fitness-vm -- sudo cloud-init modules --mode=config
lxc exec fitness-vm -- sudo cloud-init modules --mode=final

# Alternative: push updated cloud-config and re-run the sequence
lxc file push infra/cloud-init/cloud-config.yaml fitness-vm/root/cloud-config.yaml
lxc exec fitness-vm -- sudo cloud-init clean && sudo cloud-init init && sudo cloud-init modules --mode=config && sudo cloud-init modules --mode=final
```

Network, service, and process checks

```bash
# Container network interfaces
lxc exec fitness-vm -- ip addr show

# Listening sockets (verify server port)
lxc exec fitness-vm -- ss -tuln

# Check backend service (assuming systemd service name from provisioner)
lxc exec fitness-vm -- sudo systemctl status fitness-backend
lxc exec fitness-vm -- sudo journalctl -u fitness-backend --no-pager -n 200

# Quick HTTP check from inside the container
lxc exec fitness-vm -- curl -sS http://localhost:5000/health || curl -sS http://127.0.0.1:5000/
```

Container management helpers

```bash
# List containers and IP addresses
lxc list

# Detailed info for a container
lxc info fitness-vm

# Execute an interactive shell in the container
lxc exec fitness-vm -- /bin/bash

# Show files copied into container (e.g., pushed cloud-config)
lxc exec fitness-vm -- ls -la /root
lxc exec fitness-vm -- sudo cat /root/cloud-config.yaml
```

Notes:
- If cloud-init does not run, check the container image supports cloud-init (official Ubuntu cloud images do) and inspect logs above.
- Networking behavior can differ depending on LXD profile/network mode (bridged vs NAT). Use `lxc network list` and `lxc network show <name>` to inspect LXD networking.

 Link to the deployment video: [Video of deployment logs/output.](https://drive.google.com/file/d/1vh1GSYElgMJmIwu_oSOv25Q7G0H51uVA/view?usp=sharing)