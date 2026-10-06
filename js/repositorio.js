const Repo = (function () {
  const CHAVE = "almocoIFPB";

  function ler() {
    try {
      return JSON.parse(localStorage.getItem(CHAVE)) || {};
    } catch (e) {
      return {};
    }
  }

  function gravar(dados) {
    localStorage.setItem(CHAVE, JSON.stringify(dados));
  }

  function hoje() {
    const d = new Date();
    const mes = String(d.getMonth() + 1).padStart(2, "0");
    const dia = String(d.getDate()).padStart(2, "0");
    return d.getFullYear() + "-" + mes + "-" + dia;
  }

  function horaAgora() {
    return new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  }

  function obterDia(data) {
    return ler()[data] || null;
  }

  function salvarLista(data, alunos) {
    const dados = ler();
    const atual = dados[data] || { registros: {}, encerrada: false, extras: [] };
    atual.alunos = alunos;

    const matriculas = new Set(alunos.map((a) => a.matricula));
    Object.keys(atual.registros).forEach((m) => {
      if (!matriculas.has(m)) delete atual.registros[m];
    });
    dados[data] = atual;
    gravar(dados);
  }

  function marcarEntrega(data, matricula) {
    const dados = ler();
    const dia = dados[data];
    if (!dia) return { ok: false, motivo: "Não há lista para esta data." };
    if (dia.encerrada) return { ok: false, motivo: "A entrega desta lista já foi encerrada." };
    if (!dia.alunos.some((a) => a.matricula === matricula)) {
      return { ok: false, motivo: "Aluno não está na lista." };
    }
    if (dia.registros[matricula]) {
      return { ok: false, motivo: "Este aluno já recebeu o almoço às " + dia.registros[matricula] + "." };
    }
    dia.registros[matricula] = horaAgora();
    gravar(dados);
    return { ok: true };
  }

  function desmarcarEntrega(data, matricula) {
    const dados = ler();
    const dia = dados[data];
    if (!dia) return { ok: false, motivo: "Não há lista para esta data." };
    if (dia.encerrada) return { ok: false, motivo: "A entrega já foi encerrada, não dá mais para desfazer." };
    if (!dia.registros[matricula]) return { ok: false, motivo: "Este aluno não está marcado." };
    delete dia.registros[matricula];
    gravar(dados);
    return { ok: true };
  }

  function encerrarEntrega(data) {
    const dados = ler();
    if (!dados[data]) return;
    dados[data].encerrada = true;
    gravar(dados);
  }

  function sobraram(dia) {
    if (!dia) return 0;
    const entregues = Object.keys(dia.registros).length;
    const ausentes = dia.alunos.length - entregues;
    return Math.max(ausentes - dia.extras.length, 0);
  }

  function registrarExtra(data, matricula, nome, curso) {
    const dados = ler();
    const dia = dados[data];
    if (!dia) return { ok: false, motivo: "Não há lista para esta data." };
    if (!dia.encerrada) return { ok: false, motivo: "Encerre a entrega da lista antes de atender alunos extras." };
    if (sobraram(dia) <= 0) return { ok: false, motivo: "Não há almoço sobrando." };
    if (dia.alunos.some((a) => a.matricula === matricula)) {
      return { ok: false, motivo: "Este aluno está na lista do dia. Use a marcação normal." };
    }
    if (dia.extras.some((e) => e.matricula === matricula)) {
      return { ok: false, motivo: "Este aluno já recebeu o almoço como extra hoje." };
    }
        dia.extras.push({ matricula: matricula, nome: nome, curso: curso || "", hora: horaAgora() });
    gravar(dados);
    return { ok: true };
  }

  return {
    hoje: hoje,
    obterDia: obterDia,
    salvarLista: salvarLista,
    marcarEntrega: marcarEntrega,
    desmarcarEntrega: desmarcarEntrega,
    encerrarEntrega: encerrarEntrega,
    registrarExtra: registrarExtra,
    sobraram: sobraram,
  };
})();
