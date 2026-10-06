// Só para rodar no Jest de verdade (npm test): carrega o código do sistema como globais.
const fs = require("fs");
const path = require("path");
const ler = (arq) => fs.readFileSync(path.join(__dirname, "..", "js", arq), "utf8");
global.Auth = new Function(ler("auth.js") + "; return Auth;")();
global.Repo = new Function(ler("repositorio.js") + "; return Repo;")();
