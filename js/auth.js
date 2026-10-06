const Auth = (function () {
  const USUARIO = "responsavel";
  const SENHA = "ifpb123";
  const CHAVE = "almocoIFPBLogado";

  function entrar(usuario, senha) {
    if (usuario.trim() === USUARIO && senha === SENHA) {
      sessionStorage.setItem(CHAVE, "sim");
      return true;
    }
    return false;
  }

  function estaLogado() {
    return sessionStorage.getItem(CHAVE) === "sim";
  }

  function sair() {
    sessionStorage.removeItem(CHAVE);
    window.location.href = "index.html";
  }

  function exigirLogin() {
    if (!estaLogado()) window.location.href = "index.html";
  }

  return { entrar: entrar, estaLogado: estaLogado, sair: sair, exigirLogin: exigirLogin };
})();
