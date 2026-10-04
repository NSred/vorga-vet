# DevOps

Deployment manifests, infrastructure-as-code, and environment-specific operational
configuration will live in this directory.

GitHub Actions workflows remain in the repository-level `.github/workflows/`
directory so GitHub can discover and run them.

## Test environment on Render

The test environment runs on free plans with no payment card: the frontend and the API on
Render, the database on Neon. [render.yaml](render.yaml) describes both Render services. The
reasoning is in [the feature document](../docs/specs/2026-10-04-render-test-environment.md).

| Part | Where | Address |
|---|---|---|
| Frontend | Render static site `vorgavet` | `https://vorgavet.onrender.com` |
| API | Render web service `vorgavet-api` | `https://vorgavet-api.onrender.com` |
| Database | Neon project `vorgavet`, AWS Frankfurt | Neon dashboard |

Render picks a suffixed subdomain when the name is taken. If the API's address differs from the
table, change the `/api/*` rewrite destination in `render.yaml` to match.

### Setting it up

1. **Neon.** Create a project named `vorgavet` in AWS Europe Central (Frankfurt). Under
   *Connect*, turn connection pooling **off** and copy the host, database, user and password.
   Write them as one line:
   `Host=<host>;Database=<database>;Username=<user>;Password=<password>;SSL Mode=Require`
2. **Render.** New → Blueprint, connect the GitHub repository, set the Blueprint path to
   `devops/render.yaml`. When prompted, enter:
   - `ConnectionStrings__Database`: the line from step 1
   - `Clinic__VeterinarianEmails__0` and `__1`: the vets' email addresses

   Render generates `Jwt__Secret` itself. Nothing secret goes into the repository.
3. **First deploy.** Wait until both services are live. Open the frontend address and have both
   vets register **before** the address is shared with anyone else, because registration does
   not verify email ownership yet.
4. **Check.** Log in as a vet and as a client and click through the main screens. The API's
   *Logs* tab in Render shows every request.

### Keeping it awake (optional)

The free API sleeps after 15 minutes without traffic and needs about a minute to wake up. A free
monitor on UptimeRobot or cron-job.org that calls `https://vorgavet-api.onrender.com/health/live`
every 10 minutes keeps it awake. That endpoint does not touch the database, so Neon still
suspends when nobody is using the app. Do not point a monitor at `/health`, which queries the
database and would use up Neon's free compute hours.

### Deploying

Merging into `main` deploys. Render waits for the `Build` workflow to pass, then rebuilds only
the service whose folder changed (`backend/` or `frontend/`). Migrations run when the new API
container starts. A failed deploy keeps the previous version running. *Manual Deploy* in the
Render dashboard is the fallback.

### Things to know

- Uploaded images live on the container's disk and are lost on every deploy or restart.
- Neon keeps a six-hour restore window and no other backups.
- Changing `Jwt__Secret` logs everyone out.
- `Seeding__DemoData` adds the demo breeds, owners and patients only when they are missing, so it
  is safe on every start. Set it to `false` once real reference data is loaded.
