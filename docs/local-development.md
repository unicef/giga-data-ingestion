# Local Environment Setup Guide - Giga Sync

This guide will help you set up the local development environment for the Giga Data Ingestion Portal project.

## Prerequisites

Make sure you have installed:

- **Docker Desktop** (with Docker Compose)
- **Task** - Task runner ([https://taskfile.dev](https://taskfile.dev))
- **Node.js** v18+ and npm
- **Python** 3.11+ (optional, for local development without Docker)
- **Poetry** (optional, for local development without Docker)

### Installing Task (macOS)

```bash
brew install go-task/tap/go-task
```

## Configuration

### 1. Clone the repository

```bash
git clone <repository-url>
cd giga-data-ingestion
```

### 2. Configure environment variables

#### 2.1 API Environment (`api/.env`)

Create the `api/.env` file based on `api/.env.example`:

```bash
cp api/.env.example api/.env
```

Configure the following **required** variables:

```env
# === DATABASE ===
POSTGRESQL_USERNAME=postgres
POSTGRESQL_PASSWORD=postgres
POSTGRESQL_DATABASE=giga_sync

# === SECURITY ===
SECRET_KEY=your-secret-key-here

# === AZURE AD B2C (get from team or Azure Portal) ===
AZURE_CLIENT_ID=<your-client-id>
AZURE_CLIENT_SECRET=<your-client-secret>
AZURE_TENANT_ID=<your-tenant-id>
AZURE_TENANT_NAME=<your-tenant-name>          # e.g.: "giga" (without .onmicrosoft.com)
AZURE_SUSI_AUTH_POLICY_NAME=<your-policy>     # e.g.: "B2C_1_signupsignin"
AZURE_REDIRECT_URI=http://localhost:8080/api/auth/callback
WEB_APP_REDIRECT_URI=http://localhost:3000

# === AZURE STORAGE ===
AZURE_SAS_TOKEN=<your-sas-token>
AZURE_BLOB_CONTAINER_NAME=<container-name>
AZURE_STORAGE_ACCOUNT_NAME=<storage-account>

# === EMAIL (can use dummy values for development) ===
MAILJET_API_KEY=dummy
MAILJET_API_URL=https://api.mailjet.com/v3.1/send
MAILJET_SECRET_KEY=dummy
SENDER_EMAIL=noreply@example.com
EMAIL_RENDERER_BEARER_TOKEN=dummy
EMAIL_RENDERER_SERVICE_URL=http://email-api:8000

# === TRINO ===
TRINO_USERNAME=trino
TRINO_PASSWORD=trino

# === REDIS ===
REDIS_PASSWORD=redis

# === ENVIRONMENT ===
PYTHON_ENV=local
```

#### 2.2 UI Environment (`ui/.env`)

Create the `ui/.env` file:

```bash
cp ui/.env.example ui/.env
```

Configure the following variables:

```env
NODE_ENV=development

# === AZURE AD B2C (must match api/.env values) ===
VITE_AZURE_CLIENT_ID=<same-value-as-AZURE_CLIENT_ID>
VITE_AZURE_TENANT_ID=<same-value-as-AZURE_TENANT_ID>
VITE_AZURE_TENANT_NAME=<same-value-as-AZURE_TENANT_NAME>
VITE_AZURE_SUSI_AUTH_POLICY_NAME=<same-value-as-AZURE_SUSI_AUTH_POLICY_NAME>
VITE_AZURE_EDIT_PROFILE_AUTH_POLICY_NAME=B2C_1_edit_profile
VITE_AZURE_PASSWORD_RESET_AUTH_POLICY_NAME=B2C_1_password_reset
VITE_REDIRECT_URL=http://localhost:3000
```

> **IMPORTANT**: Azure values (CLIENT_ID, TENANT_NAME, TENANT_ID, SUSI_AUTH_POLICY_NAME) **MUST BE IDENTICAL** in both `.env` files.

### 3. Verify Azure B2C configuration

Before continuing, verify that your Azure B2C configuration is correct by opening this URL in your browser:

```
https://<AZURE_TENANT_NAME>.b2clogin.com/<AZURE_TENANT_NAME>.onmicrosoft.com/<AZURE_SUSI_AUTH_POLICY_NAME>/v2.0/.well-known/openid-configuration
```

If it returns a JSON response, the configuration is correct. If you get a 404 error, review your values.

## Starting the environment

### Initial setup (first time only)

```bash
task setup
```

This will install all necessary dependencies.

### Start the services

```bash
# Export variables needed for DB healthcheck (use same values from api/.env)
export POSTGRESQL_USERNAME=postgres
export POSTGRESQL_DATABASE=giga_sync

# Start all services
task
```

### Stop the services

```bash
task stop
```

### View logs

```bash
# All services
docker compose --project-name giga-dataops-platform_ingestion-portal logs -f

# API only
docker logs -f giga-dataops-platform_ingestion-portal-api-1

# UI only
docker logs -f giga-dataops-platform_ingestion-portal-ui-1
```

## Accessing the application

Once all services are running:

| Service | URL |
|---------|-----|
| **UI (Frontend)** | http://localhost:3000 |
| **API (Backend)** | http://localhost:8080 |
| **API Docs (Swagger)** | http://localhost:8080/docs |
| **Flower (Celery Monitor)** | http://localhost:5555 |

## Verify everything works

1. Open http://localhost:3000
2. You should see the login page
3. Click on "Sign In"
4. You'll be redirected to Azure AD B2C for authentication
5. After login, you'll return to the application

## Granting Admin Permissions to a User

After signing up your first user, you'll need to manually grant admin permissions through the database. Follow these steps:

### Step 1: Find your user in the database

Replace `your-email@example.com` with your actual email:

```bash
# Connect to the database and find your user
docker exec -e PGPASSWORD=postgres \
  giga-dataops-platform_ingestion-portal-db-1 \
  psql -U postgres -d giga_sync \
  -c "SELECT id, email, given_name FROM users WHERE email = 'your-email@example.com';"
```

You should see output like:
```
                  id                  |        email         | given_name 
--------------------------------------+----------------------+------------
 abc12345-1234-5678-90ab-cdef12345678 | your-email@example.com | John
```

**Copy the `id` value** - you'll need it in Step 3.

### Step 2: Find the Admin role ID

```bash
# Get the Admin role ID
docker exec -e PGPASSWORD=postgres \
  giga-dataops-platform_ingestion-portal-db-1 \
  psql -U postgres -d giga_sync \
  -c "SELECT id, name FROM roles WHERE name = 'Admin';"
```

You should see:
```
                  id                  | name  
--------------------------------------+-------
 92933bc1-f64c-4dec-a782-9d952115af67 | Admin
```

**Copy the `id` value** - you'll need it in Step 3.

### Step 3: Assign the Admin role to your user

Replace `<USER_ID>` and `<ROLE_ID>` with the values from Steps 1 and 2:

```bash
# Assign Admin role to the user
docker exec -e PGPASSWORD=postgres \
  giga-dataops-platform_ingestion-portal-db-1 \
  psql -U postgres -d giga_sync \
  -c "INSERT INTO user_role_association_table (id, user_id, role_id) 
      VALUES (gen_random_uuid()::text, '<USER_ID>', '<ROLE_ID>');"
```

### Step 4: Verify the role was assigned

```bash
# Check that your user now has the Admin role
docker exec -e PGPASSWORD=postgres \
  giga-dataops-platform_ingestion-portal-db-1 \
  psql -U postgres -d giga_sync \
  -c "SELECT u.email, r.name as role 
      FROM users u 
      JOIN user_role_association_table ura ON u.id = ura.user_id 
      JOIN roles r ON ura.role_id = r.id 
      WHERE u.email = 'your-email@example.com';"
```

You should see:
```
        email         | role  
----------------------+-------
 your-email@example.com | Admin
```

### Quick one-liner (if you know your email)

For convenience, here's a combined command that does everything in one go. Just replace `your-email@example.com`:

```bash
# One-liner to grant Admin role to a user by email
docker exec -e PGPASSWORD=postgres \
  giga-dataops-platform_ingestion-portal-db-1 \
  psql -U postgres -d giga_sync \
  -c "INSERT INTO user_role_association_table (id, user_id, role_id) 
      SELECT gen_random_uuid()::text, u.id, r.id 
      FROM users u, roles r 
      WHERE u.email = 'your-email@example.com' AND r.name = 'Admin'
      ON CONFLICT DO NOTHING;"
```

> **Important**: After assigning the role, **log out and log back in** to refresh your session with the new permissions.

### Available roles

To see all available roles in the system:

```bash
docker exec -e PGPASSWORD=postgres \
  giga-dataops-platform_ingestion-portal-db-1 \
  psql -U postgres -d giga_sync \
  -c "SELECT id, name FROM roles ORDER BY name;"
```

## Troubleshooting common issues

### Error: "port is already allocated"

If you see errors like `Bind for 0.0.0.0:5001 failed: port is already allocated`:

```bash
# Identify what's using the port
lsof -i :5001

# Or stop all containers and restart
task stop
docker system prune -f
task
```

**Note**: On macOS, port 5001 is often used by AirPlay Receiver. You can disable it in System Preferences → General → AirDrop & Handoff.

### Error: "Container db is unhealthy"

Make sure to export PostgreSQL variables before running `task`:

```bash
export POSTGRESQL_USERNAME=postgres
export POSTGRESQL_DATABASE=giga_sync
task
```

### Error: "404 Not Found" for OpenID configuration

The API cannot connect to Azure B2C. Verify:
1. `AZURE_TENANT_NAME` is correct
2. `AZURE_SUSI_AUTH_POLICY_NAME` is correct
3. The verification URL (section 3) returns JSON

### Error: "no_account_error" in browser

This is **expected** if you haven't signed in yet. Click "Sign In" to authenticate.

### API not responding or returns 500

```bash
# View API logs
docker logs giga-dataops-platform_ingestion-portal-api-1

# Restart only the API
docker compose --project-name giga-dataops-platform_ingestion-portal restart api
```

### UI shows blank page

1. Open browser console (F12)
2. Look for MSAL or configuration errors
3. Verify that `VITE_AZURE_*` variables are correct in `ui/.env`


## Obtaining Azure credentials

If you don't have Azure B2C credentials, request from your team:

1. **AZURE_CLIENT_ID** - Application (client) ID from App Registration
2. **AZURE_CLIENT_SECRET** - Client secret from App Registration
3. **AZURE_TENANT_ID** - Directory (tenant) ID
4. **AZURE_TENANT_NAME** - B2C tenant name (without .onmicrosoft.com)
5. **AZURE_SUSI_AUTH_POLICY_NAME** - Sign-up/Sign-in policy name

Also make sure that `http://localhost:3000` is configured as a **Redirect URI** in the Azure App Registration.

---

## Support

If you have issues:
1. Check Docker logs
2. Verify environment variables
3. Consult with the development team
