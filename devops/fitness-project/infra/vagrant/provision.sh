#!/usr/bin/env bash
set -e #exit immediately if any command returns a non-zero (error) code.
VM_HOSTNAME=$(hostname) # Get the hostname of the VM
DOMAIN="${VM_HOSTNAME}.lrk.si" # Construct the domain name using the hostname
echo "Using domain: $DOMAIN" # Print the domain being used
export DEBIAN_FRONTEND=noninteractive # prevent some packages from prompting for user input during installation

echo "=== Updating system ==="
apt-get update -y # Update package lists
apt-get upgrade -y # upgrade installed packages to latest versions

# ------------------------------------
# Install core packages
# ------------------------------------
echo "=== Installing core packages ==="
apt-get install -y curl git nginx postgresql ufw build-essential # Core packages installation

# ------------------------------------
# Install Node.js 20 LTS
# ------------------------------------
echo "=== Installing Node.js 20 ==="
curl -fsSL https://deb.nodesource.com/setup_20.x | bash - # Add NodeSource APT repository for Node.js 20
apt-get install -y nodejs # Install Node.js

# ------------------------------------
# Clone project into /opt
# ------------------------------------
echo "=== Cloning project repo ==="
rm -rf /opt/fitness-project # Remove existing project directory if it exists
git clone https://github.com/ACodes3/fitness-project.git /opt/fitness-project # Clone the project repository

# Permissions: allow vagrant + postgres to read files
chown -R vagrant:vagrant /opt/fitness-project # Change ownership to vagrant user to allow npm installs
chmod -R 755 /opt/fitness-project # Set directory permissions to allow read and execute access

# ------------------------------------
# Create system user for backend service
# ------------------------------------
# Create a dedicated system user 'fitness' for running the backend service
echo "=== Creating fitness system user ==="
if ! id -u fitness >/dev/null 2>&1; then
    useradd --system --shell /usr/sbin/nologin fitness || true # Create system user 'fitness' without login shell
fi
usermod -aG vagrant fitness || true # Add 'fitness' user to 'vagrant' group for file access

# ------------------------------------
# Configure PostgreSQL for app
# ------------------------------------
echo "=== Setting up PostgreSQL ===" # PostgreSQL setup for the application
sudo -u postgres psql <<EOF
CREATE USER fitness WITH PASSWORD 'fitness123';
CREATE DATABASE fitnessdb;
GRANT ALL PRIVILEGES ON DATABASE fitnessdb TO fitness;
EOF

# Apply SQL schema
echo "=== Applying SQL schema ==="
sudo -u postgres psql -d fitnessdb -f /opt/fitness-project/server/schema.sql # Load the database schema

# Fix permissions after schema load
echo "=== Granting DB permissions to fitness user ===" # Ensure 'fitness' user has necessary permissions
sudo -u postgres psql -d fitnessdb <<EOF
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO fitness;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO fitness;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO fitness;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO fitness;
EOF

###############################################################################
#                               INSTALL REDIS
###############################################################################
echo "=== Installing Redis ==="
apt-get install -y redis-server # Install Redis server

echo "=== Configuring Redis ==="
sed -i 's/^supervised .*/supervised systemd/' /etc/redis/redis.conf # Configure Redis to use systemd supervision
sed -i 's/^# maxmemory <bytes>/maxmemory 256mb/' /etc/redis/redis.conf # Set max memory to 256MB
sed -i 's/^# maxmemory-policy .*/maxmemory-policy allkeys-lru/' /etc/redis/redis.conf # Set eviction policy to allkeys-lru

systemctl enable redis-server # Enable Redis to start on boot
systemctl restart redis-server # Restart Redis to apply configuration changes

echo "=== Redis installed and running ==="

# ------------------------------------
# Install backend dependencies
# ------------------------------------
echo "=== Installing backend dependencies ==="
sudo -u vagrant -H bash -lc "cd /opt/fitness-project/server && npm install" # Install backend Node.js dependencies

# ------------------------------------
# Build frontend
# ------------------------------------
echo "=== Setting frontend environment ===" # Create frontend .env.production file

# Create frontend .env.production file with API URL
cat >/opt/fitness-project/client/.env.production <<'EOF'
VITE_API_URL=/api
EOF

# Set ownership and permissions for frontend .env file
chown vagrant:vagrant /opt/fitness-project/client/.env.production # Set ownership for frontend .env file
chmod 644 /opt/fitness-project/client/.env.production # Set permissions for frontend .env file

echo "=== Building frontend ===" 
sudo -u vagrant -H bash -lc "cd /opt/fitness-project/client && npm install && npm run build" # Install frontend dependencies and build the project

# Copy frontend build to Nginx directory
mkdir -p /var/www/fitness-client # Create directory for Nginx to serve frontend
cp -a /opt/fitness-project/client/dist/. /var/www/fitness-client/ # Copy built frontend files to Nginx directory
chown -R www-data:www-data /var/www/fitness-client # Set ownership for Nginx to access frontend files

# ------------------------------------
# Create backend .env file
# ------------------------------------
echo "=== Creating backend .env ===" # Create backend .env file with database and Redis configuration
cat >/opt/fitness-project/server/.env <<'EOF'
PORT=3001
DB_USER=fitness
DB_PASS=fitness123
DB_HOST=localhost
DB_NAME=fitnessdb
DB_PORT=5432

REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_ENABLED=true
EOF

chown fitness:vagrant /opt/fitness-project/server/.env # Set ownership for backend .env file
chmod 640 /opt/fitness-project/server/.env # Set permissions for backend .env file

# ------------------------------------
# Create systemd backend service
# ------------------------------------
echo "=== Creating systemd service ==="
# Create systemd service file for the fitness backend
# The service runs as the 'fitness' user and uses the .env file for configuration
# It will restart automatically if it crashes
# ------------------------------------ 
cat >/etc/systemd/system/fitness-backend.service <<'EOF'
[Unit]
Description=Fitness App Backend
After=network.target postgresql.service redis-server.service

[Service]
WorkingDirectory=/opt/fitness-project/server
ExecStart=/usr/bin/node server.js
EnvironmentFile=/opt/fitness-project/server/.env
User=fitness
Restart=always

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload # Reload systemd to recognize new service
systemctl enable fitness-backend # Enable backend service to start on boot
systemctl start fitness-backend # Start backend service

###############################################################################
#                             INSTALL LET'S ENCRYPT
###############################################################################

echo "=== Installing Certbot (Let's Encrypt) ==="
apt-get install -y certbot python3-certbot-nginx # Install Certbot and Nginx plugin

echo "=== Creating initial HTTP-only Nginx config ==="

rm -f /etc/nginx/sites-enabled/default # Remove default Nginx site

# Create Nginx site configuration for the fitness app
# It serves the frontend and proxies API requests to the backend
# It also includes a placeholder for Guacamole configuration
cat >/etc/nginx/sites-available/fitness <<EOF
server {
    listen 80;
    server_name $DOMAIN;

    # Serve frontend files
    root /var/www/fitness-client;
    index index.html;

    # Required for Let's Encrypt HTTP challenge
    location /.well-known/acme-challenge/ {
        root /var/www/fitness-client;
    }

    # API backend
    location /api/ {
        proxy_pass http://127.0.0.1:3001/api/;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    }

    # SPA frontend
    location / {
        try_files \$uri /index.html;
    }

    # GUACAMOLE BLOCK WILL BE INSERTED HERE
}
EOF

# Enable the new Nginx site
# Create symbolic link to enable the site
# Test Nginx configuration and reload if successful
ln -sf /etc/nginx/sites-available/fitness /etc/nginx/sites-enabled/fitness
nginx -t && systemctl reload nginx

###############################################################################
#                       IMPROVED CERTBOT WITH STAGING FALLBACK
###############################################################################

echo "=== Requesting Let's Encrypt SSL certificate ==="
# Try to obtain a real SSL certificate from Let's Encrypt
# If rate limited, fall back to staging certificates
# Set Certbot email
# Used for important account notifications
CERTBOT_EMAIL="admin@${DOMAIN}"

# Try requesting REAL certificate first
if certbot --nginx \
    -d "$DOMAIN" \
    --non-interactive \
    --agree-tos \
    -m "$CERTBOT_EMAIL"; then

    echo "=== Production certificate installed successfully ==="

else
    echo "=== Production certificate FAILED ==="

    # Check for rate limit
    # If rate limit detected, switch to STAGING certificates
    # Check Certbot log for rate limit message
    # If found, request staging certificates
    if grep -q "too many certificates" /var/log/letsencrypt/letsencrypt.log 2>/dev/null; then
        echo "=== Let's Encrypt RATE LIMIT detected — switching to STAGING certificates ==="

        certbot --nginx \
            --test-cert \
            -d "$DOMAIN" \
            --non-interactive \
            --agree-tos \
            -m "$CERTBOT_EMAIL" || echo "=== Staging certificate FAILED as well ==="

    else
        echo "=== Certbot failed for a non-rate-limit reason. Continuing deployment. ==="
    fi
fi

echo "=== Setting up Certbot auto-renew ==="
# Enable and start Certbot timer for automatic certificate renewal
# This will check for expiring certificates twice daily
systemctl enable certbot.timer
systemctl start certbot.timer

# ------------------------------------
# Firewall
# ------------------------------------
echo "=== Configuring UFW firewall ==="
ufw allow OpenSSH # Allow SSH
ufw allow 80 # Allow HTTP
ufw allow 443 # Allow HTTPS
ufw --force enable # Enable UFW firewall

echo "=== Core app provisioning complete with Let's Encrypt HTTPS! ==="


###############################################################################
#                             APACHE GUACAMOLE                                 
###############################################################################

echo "=== Installing Apache Guacamole ==="
apt-get update -y # Update package lists
apt-get install -y tomcat9 # Install Tomcat9 for Guacamole web app

apt-get install -y libcairo2-dev libjpeg-turbo8-dev libpng-dev \
    libtool-bin libossp-uuid-dev freerdp2-dev libpango1.0-dev \
    libssh2-1-dev libtelnet-dev libvncserver-dev libpulse-dev \
    libssl-dev libvorbis-dev libwebp-dev # Install Guacamole dependencies

echo "=== Installing guacd backend ==="
cd /usr/src # Change to source directory
curl -L -O https://archive.apache.org/dist/guacamole/1.5.5/source/guacamole-server-1.5.5.tar.gz # Download Guacamole server source
tar -xzf guacamole-server-1.5.5.tar.gz # Extract source archive
cd guacamole-server-1.5.5 # Change to Guacamole server source directory
./configure --with-init-dir=/etc/init.d # Configure build with init script directory
make -j$(nproc) # Build Guacamole server
make install # Install Guacamole server
ldconfig # Update shared library cache
systemctl enable guacd # Enable guacd service
systemctl start guacd # Start guacd service

echo "=== Installing Guacamole web app ==="
mkdir -p /etc/guacamole # Create Guacamole configuration directory
curl -L -o /etc/guacamole/guacamole.war \
  https://archive.apache.org/dist/guacamole/1.5.5/binary/guacamole-1.5.5.war # Download Guacamole web application
ln -sf /etc/guacamole/guacamole.war /var/lib/tomcat9/webapps/guacamole.war # Link Guacamole web app to Tomcat webapps directory

echo "=== Writing guacamole.properties ==="
# Create Guacamole properties file for PostgreSQL authentication
# It configures guacd connection and PostgreSQL database details
cat >/etc/guacamole/guacamole.properties <<'EOF'
guacd-hostname: localhost
guacd-port: 4822

auth-provider: net.sourceforge.guacamole.net.auth.postgresql.PostgreSQLAuthenticationProvider
postgresql-hostname: localhost
postgresql-port: 5432
postgresql-database: guacdb
postgresql-username: guacuser
postgresql-password: guacpass
EOF

echo "=== Setting up Guacamole PostgreSQL database ==="
# Create Guacamole database user and database
# Grant all privileges on the database to the user
# This user will be used by Guacamole to connect to the database
sudo -u postgres psql <<EOF
CREATE USER guacuser WITH PASSWORD 'guacpass';
CREATE DATABASE guacdb;
GRANT ALL PRIVILEGES ON DATABASE guacdb TO guacuser;
EOF

cd /usr/src # Change to source directory

echo "=== Downloading Guacamole JDBC authentication extension ==="
# Download Guacamole JDBC authentication extension for PostgreSQL
curl -L -O https://archive.apache.org/dist/guacamole/1.5.5/binary/guacamole-auth-jdbc-1.5.5.tar.gz

echo "=== Extracting JDBC authentication package ==="
# Extract the JDBC authentication extension package
tar -xzf guacamole-auth-jdbc-1.5.5.tar.gz

echo "=== Importing Guacamole SQL schema ==="
# Import Guacamole database schema and create default admin user
# This sets up the necessary tables and an initial admin account
# in the Guacamole database
# The default admin username is 'guacadmin' with password 'guacadmin'
# These should be changed after first login
# for security reasons
sudo -u postgres psql -d guacdb -f /usr/src/guacamole-auth-jdbc-1.5.5/postgresql/schema/001-create-schema.sql
sudo -u postgres psql -d guacdb -f /usr/src/guacamole-auth-jdbc-1.5.5/postgresql/schema/002-create-admin-user.sql

echo "=== Fixing Guacamole PostgreSQL permissions for guacuser ==="
# Ensure 'guacuser' has necessary permissions on Guacamole database objects
# This allows Guacamole to function properly with the database
sudo -u postgres psql -d guacdb <<EOF
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO guacuser;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO guacuser;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO guacuser;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO guacuser;
EOF

###############################################################################
#                       ADD DEFAULT RDP CONNECTION                           
###############################################################################

echo "=== Adding default RDP connection to Guacamole ===" # Insert default RDP connection for localhost into Guacamole database
# This allows users to connect to the local desktop via Guacamole
# The connection is named 'Desktop' and uses RDP protocol
# It connects to 'localhost' on port 3389
# The default admin user 'guacadmin' is granted READ permission on this connection
sudo -u postgres psql -d guacdb <<EOF
INSERT INTO guacamole_connection (connection_name, protocol)
VALUES ('Desktop', 'rdp');

INSERT INTO guacamole_connection_parameter (connection_id, parameter_name, parameter_value)
VALUES ((SELECT connection_id FROM guacamole_connection WHERE connection_name='Desktop'),
        'hostname', 'localhost');

INSERT INTO guacamole_connection_parameter (connection_id, parameter_name, parameter_value)
VALUES ((SELECT connection_id FROM guacamole_connection WHERE connection_name='Desktop'),
        'port', '3389');

INSERT INTO guacamole_connection_permission (entity_id, connection_id, permission)
VALUES (
    (SELECT entity_id FROM guacamole_entity WHERE name='guacadmin'),
    (SELECT connection_id FROM guacamole_connection WHERE connection_name='Desktop'),
    'READ'
);
EOF

mkdir -p /etc/guacamole/extensions # Create Guacamole extensions directory
# Copy JDBC authentication extension to Guacamole extensions directory
cp /usr/src/guacamole-auth-jdbc-1.5.5/postgresql/guacamole-auth-jdbc-postgresql-1.5.5.jar \
   /etc/guacamole/extensions/

echo "=== Installing PostgreSQL JDBC Driver ==="
apt-get install -y libpostgresql-jdbc-java # Install PostgreSQL JDBC driver

echo "=== Copying JDBC driver to Guacamole lib directory ==="
mkdir -p /etc/guacamole/lib # Create Guacamole lib directory
cp /usr/share/java/postgresql.jar /etc/guacamole/lib/ # Copy PostgreSQL JDBC driver to Guacamole lib directory

echo "=== Fixing permissions for Guacamole ==="
chown -R tomcat:tomcat /etc/guacamole # Change ownership to tomcat user and group
chmod -R 755 /etc/guacamole # Set permissions to 755

echo "=== Restarting Tomcat ==="
systemctl restart tomcat9 # Restart Tomcat to apply Guacamole configuration

###############################################################################
#                             INSTALL GUI + XRDP                              
###############################################################################

echo "=== Installing XFCE Desktop & XRDP ==="
apt-get install -y xfce4 xfce4-goodies xrdp # Install XFCE desktop environment and XRDP
systemctl enable xrdp # Enable XRDP to start on boot
systemctl restart xrdp # Restart XRDP to apply changes

# Make XRDP use XFCE by default
echo xfce4-session > /home/vagrant/.xsession # Set XFCE as the default session for XRDP
chown vagrant:vagrant /home/vagrant/.xsession # Change ownership to vagrant user and group

###############################################################################
#              INSERT GUACAMOLE NGINX BLOCK IN CORRECT POSITION               #
###############################################################################

echo "=== Inserting Guacamole block into nginx ===" # Insert Guacamole location block into Nginx configuration

# Insert Guacamole location block before the closing brace in the Nginx site configuration
# The block proxies /guacamole/ requests to the Guacamole web application
# It sets necessary headers for proper operation
# This allows access to Guacamole via Nginx at /guacamole/
# e.g. https://yourdomain/guacamole/
# The block is inserted at the placeholder comment in the configuration file
sed -i '/# GUACAMOLE BLOCK WILL BE INSERTED HERE/a \
    location /guacamole/ {\n\
        proxy_pass http://127.0.0.1:8080/guacamole/;\n\
        proxy_set_header Host $host;\n\
        proxy_set_header X-Real-IP $remote_addr;\n\
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;\n\
        proxy_set_header Upgrade $http_upgrade;\n\
        proxy_set_header Connection $http_connection;\n\
        proxy_http_version 1.1;\n\
        proxy_buffering off;\n\
        proxy_request_buffering off;\n\
    }\n' /etc/nginx/sites-available/fitness

nginx -t && systemctl reload nginx # Test Nginx configuration and reload if successful

echo "=== Guacamole installation complete ==="
echo "Visit: https://${DOMAIN}/guacamole" # Provide Guacamole access URL
echo "Login: guacadmin / guacadmin" # Provide Guacamole default login credentials
###############################################################################