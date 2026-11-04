# maritime-surveillance-software
system for Maritime Surveillance Software

## Production deploy (single VM, Docker)

Runs the whole stack (Postgres, Kafka, the 3 services, and the web UI behind nginx on port 80):

```bash
# from your machine: copy the repo (no node_modules / local .env files)
rsync -az --exclude node_modules --exclude '.env' --exclude .git --exclude venv-AI --exclude AI ./ ubuntu@<host>:~/serenguard/

# on the server, first time only: cp .env.prod.example .env and fill in DB_PASSWORD, JWT_SECRET, AIS_STREAM_IO_API_KEY
cd ~/serenguard
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build

# first time only: seed roles/users/permissions, then CHANGE the seeded passwords
docker compose -f docker-compose.yml -f docker-compose.prod.yml exec meta-service sh -c "npm run db:seed && npm run db:seed-permissions"
```

meta-service runs migrations on every start. analytic-service needs `META_SERVICE_TOKEN`, a
long-lived JWT signed with the server's `JWT_SECRET` (`signToken(payload, { expiresIn: '3650d' })`
from `meta-service/src/utils/jwtHelper.js`). Postgres and Kafka are not published to the host in prod.
