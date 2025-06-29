// instrument.ts
import * as Sentry from "@sentry/node";

Sentry.init({
  dsn: "https://be05e211e38f59ab053916600ef3d654@o4509583576006656.ingest.us.sentry.io/4509583588392960",
  sendDefaultPii: true,
});
