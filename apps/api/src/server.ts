import { app } from "./app";
import { env } from "./env";
import { demarrerJobClotureAutomatique } from "./jobs/clotureAutomatique";
import { configurerWebPush } from "./lib/webPush";

configurerWebPush();
demarrerJobClotureAutomatique();

app.listen(env.PORT, () => {
  console.log(`API DISPO-COURSIER démarrée sur http://localhost:${env.PORT}`);
});
