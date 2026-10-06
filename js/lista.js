Auth.exigirLogin();

(function () {

  const params = new URLSearchParams(window.location.search);
  const data = params.get("data") || Repo.hoje();

  const el = {
    dataExtenso: document.getElementById("data-extenso"),
    aviso: document.getElementById("aviso-encerrada"),
    nPrevistos: document.getElementById("n-previstos"),
    nEntregues: document.getElementById("n-entregues"),
    nRestantes: document.getElementById("n-restantes"),
    rotuloRestantes: document.getElementById("rotulo-restantes"),
    busca: document.getElementById("busca"),
    btnExtra: document.getElementById("btn-extra"),
    btnEncerrar: document.getElementById("btn-encerrar"),
    linhas: document.getElementById("linhas"),
    blocoExtras: document.getElementById("bloco-extras"),
    linhasExtras: document.getElementById("linhas-extras"),
    nota: document.getElementById("nota"),
    modal: document.getElementById("modal-extra"),
    extraMatricula: document.getElementById("extra-matricula"),
    extraNome: document.getElementById("extra-nome"),
    extraCurso: document.getElementById("extra-curso"),
    resumoModal: document.getElementById("resumo-modal"),
    erroExtra: document.getElementById("erro-extra"),
  };

  function escapar(texto) {
    return String(texto)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function normalizar(texto) {
    return String(texto).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  }

  function textoAlmocos(n) {
    return n === 1 ? "1 almoço" : n + " almoços";
  }

  function linhaEntregue(hora) {
    return '<span class="entrega-feita">' + escapar(hora) + '<span class="caixa" aria-hidden="true">&#10003;</span></span>';
  }

  function render() {
    const dia = Repo.obterDia(data);
    el.dataExtenso.textContent = new Date(data + "T00:00:00").toLocaleDateString("pt-BR", {
      weekday: "long", day: "numeric", month: "long", year: "numeric",
    });

    if (!dia) {
      el.nPrevistos.textContent = 0;
      el.nEntregues.textContent = 0;
      el.nRestantes.textContent = 0;
      el.aviso.hidden = true;
      el.btnEncerrar.disabled = true;
      el.btnExtra.disabled = true;
      el.blocoExtras.hidden = true;
      el.linhas.innerHTML =
        '<div class="linha vazia">Nenhuma lista importada para esta data. Use "Importar lista" para enviar a planilha da CAEST.</div>';
      return;
    }

    const entregues = Object.keys(dia.registros).length;
    const sobraram = Repo.sobraram(dia);

    el.nPrevistos.textContent = dia.alunos.length;
    el.nEntregues.textContent = entregues;
    if (dia.encerrada) {
      el.rotuloRestantes.textContent = "Sobraram";
      el.nRestantes.textContent = sobraram;
    } else {
      el.rotuloRestantes.textContent = "Restantes";
      el.nRestantes.textContent = dia.alunos.length - entregues;
    }

    el.aviso.hidden = !dia.encerrada;
    if (dia.encerrada) {
      el.aviso.textContent =
        "Entrega da lista encerrada. Sobraram " + textoAlmocos(sobraram) + " para alunos fora da lista.";
    }
    el.btnEncerrar.disabled = dia.encerrada;
    el.btnExtra.disabled = !(dia.encerrada && sobraram > 0);
    el.nota.hidden = dia.encerrada && sobraram > 0;

    const termo = normalizar(el.busca.value.trim());
    const filtrados = dia.alunos.filter(function (a) {
      return !termo || normalizar(a.nome).includes(termo) || a.matricula.includes(termo);
    });

    if (filtrados.length === 0) {
      el.linhas.innerHTML = '<div class="linha vazia">Nenhum aluno encontrado.</div>';
    } else {
      el.linhas.innerHTML = filtrados
        .map(function (a) {
          const hora = dia.registros[a.matricula];
          let acao;
          if (hora) {
            if (dia.encerrada) {
              acao = linhaEntregue(hora);
            } else {
              acao =
                '<button class="entrega-feita desmarcar" type="button" data-desmarcar="' +
                escapar(a.matricula) + '" title="Clique para desmarcar">' +
                escapar(hora) + '<span class="caixa" aria-hidden="true">&#10003;</span></button>';
            }
          } else if (dia.encerrada) {
            acao = '<span class="marcar" style="cursor:default">Ausente</span>';
          } else {
            acao =
              '<button class="marcar" type="button" data-matricula="' + escapar(a.matricula) + '">' +
              'Marcar <span class="caixa"></span></button>';
          }
          return (
            '<div class="linha' + (hora ? " entregue" : "") + '">' +
            '<span class="matricula">' + escapar(a.matricula) + "</span>" +
            '<span class="nome">' + escapar(a.nome) + "</span>" +
            '<span class="curso">' + escapar(a.curso || "—") + "</span>" +
            '<span class="acao">' + acao + "</span></div>"
          );
        })
        .join("");
    }

    el.blocoExtras.hidden = dia.extras.length === 0;
    el.linhasExtras.innerHTML = dia.extras
      .map(function (x) {
        return (
          '<div class="linha entregue">' +
          '<span class="matricula">' + escapar(x.matricula) + "</span>" +
          '<span class="nome">' + escapar(x.nome) + "</span>" +
          '<span class="curso">' + escapar(x.curso || "—") + "</span>" +
          '<span class="acao">' + linhaEntregue(x.hora) + "</span></div>"
        );
      })
      .join("");
  }

  let matriculaParaDesmarcar = null;
  const modalDesmarcar = document.getElementById("modal-desmarcar");
  const textoDesmarcar = document.getElementById("texto-desmarcar");
  el.busca.addEventListener("input", render);

  el.linhas.addEventListener("click", function (e) {
    const botaoDesfazer = e.target.closest("button[data-desmarcar]");
    if (botaoDesfazer) {
      matriculaParaDesmarcar = botaoDesfazer.getAttribute("data-desmarcar");
      const aluno = Repo.obterDia(data).alunos.find(function (a) {
        return a.matricula === matriculaParaDesmarcar;
      });
      textoDesmarcar.textContent =
        "Tem certeza que deseja desmarcar a entrega de " + (aluno ? aluno.nome : "este aluno") + "?";
      modalDesmarcar.hidden = false;
      return;
    }
    const botao = e.target.closest("button[data-matricula]");
    if (!botao) return;
    const resultado = Repo.marcarEntrega(data, botao.getAttribute("data-matricula"));
    if (!resultado.ok) alert(resultado.motivo);
    render();
  });

  const modalEncerrar = document.getElementById("modal-encerrar");

  el.btnEncerrar.addEventListener("click", function () {
    const dia = Repo.obterDia(data);
    if (!dia) return;
    const ausentes = dia.alunos.length - Object.keys(dia.registros).length;
    document.getElementById("texto-encerrar").textContent =
      "Os " + ausentes + " alunos que não retiraram serão considerados ausentes e o almoço deles " +
      "poderá ser dado a alunos fora da lista. Isso não pode ser desfeito.";
    modalEncerrar.hidden = false;
  });

  document.getElementById("encerrar-cancelar").addEventListener("click", function () {
    modalEncerrar.hidden = true;
  });

  document.getElementById("encerrar-confirmar").addEventListener("click", function () {
    Repo.encerrarEntrega(data);
    modalEncerrar.hidden = true;
    render();
  });

  modalEncerrar.addEventListener("click", function (e) {
    if (e.target === modalEncerrar) modalEncerrar.hidden = true;
  });

  function abrirModal() {
    el.extraMatricula.value = "";
    el.extraNome.value = "";
    el.extraCurso.value = "";
    el.erroExtra.hidden = true;
    el.resumoModal.textContent = "Almoços sobrando: " + Repo.sobraram(Repo.obterDia(data));
    el.modal.hidden = false;
    el.extraMatricula.focus();
  }
  function fecharModal() {
    el.modal.hidden = true;
  }

  el.btnExtra.addEventListener("click", abrirModal);
  document.getElementById("extra-cancelar").addEventListener("click", fecharModal);
  el.modal.addEventListener("click", function (e) {
    if (e.target === el.modal) fecharModal();
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
      fecharModal();
      modalEncerrar.hidden = true;
    }
  });

  document.getElementById("extra-confirmar").addEventListener("click", function () {
    const matricula = el.extraMatricula.value.trim();
    const nome = el.extraNome.value.trim();
    const curso = el.extraCurso.value.trim();
    if (!matricula || !nome || !curso) {
      el.erroExtra.textContent = "Preencha a matrícula, o nome completo e o curso.";
      el.erroExtra.hidden = false;
      return;
    }
    const resultado = Repo.registrarExtra(data, matricula, nome, curso);
    if (!resultado.ok) {
      el.erroExtra.textContent = resultado.motivo;
      el.erroExtra.hidden = false;
      return;
    }
    fecharModal();
    render();
  });

  function fecharModalDesmarcar() {
    modalDesmarcar.hidden = true;
    matriculaParaDesmarcar = null;
  }
  document.getElementById("desmarcar-cancelar").addEventListener("click", fecharModalDesmarcar);
  modalDesmarcar.addEventListener("click", function (e) {
    if (e.target === modalDesmarcar) fecharModalDesmarcar();
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") fecharModalDesmarcar();
  });
  document.getElementById("desmarcar-confirmar").addEventListener("click", function () {
    const r = Repo.desmarcarEntrega(data, matriculaParaDesmarcar);
    fecharModalDesmarcar();
    if (!r.ok) alert(r.motivo);
    render();
  });

  document.getElementById("btn-sair").addEventListener("click", Auth.sair);

  render();
})();
