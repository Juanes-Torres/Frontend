// =========================================================
// Corre las pruebas con cobertura y envía el análisis a SonarQube.
//   PowerShell:  $env:SONAR_TOKEN="tu-token"; npm run sonar
//   Git Bash:    SONAR_TOKEN=tu-token npm run sonar
//
// Variables:
//   SONAR_TOKEN     (obligatoria) token generado en SonarQube
//   SONAR_HOST_URL  (opcional) por defecto el SonarQube local en Docker
// =========================================================
import { spawnSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";

const token = process.env.SONAR_TOKEN;
// El scanner corre en un contenedor: "localhost" sería el propio contenedor,
// host.docker.internal es tu computadora
const servidor = process.env.SONAR_HOST_URL || "http://host.docker.internal:9000";

if (!token) {
  console.error('Falta SONAR_TOKEN. En PowerShell: $env:SONAR_TOKEN="tu-token"; npm run sonar');
  process.exit(1);
}

function ejecutar(comando, args) {
  const r = spawnSync(comando, args, { stdio: "inherit", shell: process.platform === "win32" });
  if (r.status !== 0) process.exit(r.status ?? 1);
}

// 1. Pruebas + cobertura (falla si baja de 80%)
ejecutar("npm", ["run", "test:coverage"]);

// 2. En Windows el reporte guarda rutas como src\App.tsx; el scanner (Linux)
//    solo las reconoce con "/"
const lcov = "coverage/lcov.info";
writeFileSync(lcov, readFileSync(lcov, "utf8").replace(/^SF:.*$/gm, (linea) => linea.replaceAll("\\", "/")));

// 3. Análisis con el scanner oficial en Docker (lee sonar-project.properties)
ejecutar("docker", [
  "run", "--rm",
  "-e", `SONAR_HOST_URL=${servidor}`,
  "-e", `SONAR_TOKEN=${token}`,
  "-v", `${process.cwd()}:/usr/src`,
  "sonarsource/sonar-scanner-cli:latest",
]);

console.log(`\nListo: abre ${servidor.replace("host.docker.internal", "localhost")}/dashboard?id=kairos-frontend`);
