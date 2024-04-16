# Adding new emails

0. You can view the currently available emails at `localhost:3020`
1. Add the actual email template. [Link](../../email/src/emails/master-data-release-notification.tsx) as an example.
2. Add the [types](../../email/src/types/master-data-release-notification.ts) for the template.
3. Add a new [internal function](../../api/data_ingestion/internal/email.py) in the `api` for your email template.

```
def send_master_data_release_notification()...

```

4. Add a new [schema](../../api/data_ingestion/schemas/email.py) which will be used to type check the request data received by the API
5. Add a templated endpoint in the [router](../../api/data_ingestion/routers/email.py). This will accept requests and then forward it to the hono server

6. Add endpoint in the [hono server](../../email/src/index.tsx) which exposes `react-emails` rendering services to the Ingestion Portal's API

```
// new endpoint
app.post(
  "/email/master-data-release-notification",
  zValidator("json", MasterDataReleaseNotificationProps),
  (ctx) => {
    // rest of function
  }
);
```

7. Test your email templates by either sending them via the `react-email UI` at `localhost:3030` or by calling an `/email` endpoint via the swagger at `localhost:8080`
