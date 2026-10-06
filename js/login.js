(function () {
  if (Auth.estaLogado()) {
    window.location.href = "lista.html";
    return;
  }

  const usuario = document.getElementById("usuario");
  const senha = document.getElementById("senha");
  const erro = document.getElementById("erro");

  function tentarEntrar() {
    if (Auth.entrar(usuario.value, senha.value)) {
      window.location.href = "lista.html";
    } else {
      erro.hidden = false;
      senha.value = "";
      senha.focus();
    }
  }

  document.getElementById("btn-entrar").addEventListener("click", tentarEntrar);
  [usuario, senha].forEach(function (campo) {
    campo.addEventListener("keydown", function (e) {
      if (e.key === "Enter") tentarEntrar();
    });
  });
})();
