Auth.exigirLogin();

(function () {
  const areaUpload = document.getElementById("area-upload");
  const inputArquivo = document.getElementById("arquivo");
  const nomeArquivo = document.getElementById("nome-arquivo");
  const inputData = document.getElementById("data-lista");
  const erro = document.getElementById("erro");
  const sucesso = document.getElementById("sucesso");
  const verLista = document.getElementById("ver-lista");

  let arquivoEscolhido = null;
  inputData.value = Repo.hoje();

  function normalizar(texto) {
    return String(texto).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/\s+/g, " ").trim();
  }

  function mostrarErro(mensagem) {
    sucesso.hidden = true;
    verLista.hidden = true;
    erro.textContent = mensagem;
    erro.hidden = false;
  }

  function escolher(arquivo) {
    if (!arquivo) return;
    arquivoEscolhido = arquivo;
    nomeArquivo.textContent = arquivo.name;
    nomeArquivo.hidden = false;
    erro.hidden = true;
    sucesso.hidden = true;
    verLista.hidden = true;
  }

  document.getElementById("btn-escolher").addEventListener("click", function () {
    inputArquivo.click();
  });
  inputArquivo.addEventListener("change", function () {
    escolher(inputArquivo.files[0]);
  });
  ["dragenter", "dragover"].forEach(function (nome) {
    areaUpload.addEventListener(nome, function (e) {
      e.preventDefault();
      areaUpload.classList.add("arrastando");
    });
  });
  ["dragleave", "drop"].forEach(function (nome) {
    areaUpload.addEventListener(nome, function (e) {
      e.preventDefault();
      areaUpload.classList.remove("arrastando");
    });
  });
  areaUpload.addEventListener("drop", function (e) {
    escolher(e.dataTransfer.files[0]);
  });

  function lerPlanilha(arquivo) {
    const ehCsv = arquivo.name.toLowerCase().endsWith(".csv");
    if (ehCsv) {
      return arquivo.text().then(function (texto) {
        return XLSX.read(texto, { type: "string" });
      });
    }
    return arquivo.arrayBuffer().then(function (buffer) {
      return XLSX.read(buffer, { type: "array" });
    });
  }

  function extrairAlunos(livro) {
    const planilha = livro.Sheets[livro.SheetNames[0]];
    const linhas = XLSX.utils.sheet_to_json(planilha, { defval: "", raw: false });
    if (linhas.length === 0) {
      return { erro: "A planilha está vazia." };
    }

    const colunas = Object.keys(linhas[0]);
    const colMatricula = colunas.find(function (c) {
      return normalizar(c) === "matricula";
    });
    const colNome = colunas.find(function (c) {
      const n = normalizar(c);
      return n === "nome completo" || n === "nome";
    });
    const colCurso = colunas.find(function (c) {
      return normalizar(c) === "curso";
    });

    if (!colMatricula) {
      return { erro: "Não encontramos a coluna Matrícula. Confira a planilha e tente de novo." };
    }
    if (!colNome) {
      return { erro: "Não encontramos a coluna Nome completo. Confira a planilha e tente de novo." };
    }

    const vistos = new Set();
    const alunos = [];
    let repetidos = 0;
    let vazios = 0;

    linhas.forEach(function (linha) {
      const matricula = String(linha[colMatricula]).trim();
      const nome = String(linha[colNome]).trim();
      const curso = colCurso ? String(linha[colCurso]).trim() : "";
      if (!matricula || !nome) {
        vazios++;
        return;
      }
      if (vistos.has(matricula)) {
        repetidos++;
        return;
      }
      vistos.add(matricula);
      alunos.push({ matricula: matricula, nome: nome, curso: curso });
    });

    return { alunos: alunos, repetidos: repetidos, vazios: vazios };
  }

  document.getElementById("btn-importar").addEventListener("click", function () {
    if (!arquivoEscolhido) {
      mostrarErro("Escolha a planilha antes de importar.");
      return;
    }
    if (!inputData.value) {
      mostrarErro("Informe a data da lista.");
      return;
    }

    lerPlanilha(arquivoEscolhido)
      .then(function (livro) {
        const resultado = extrairAlunos(livro);
        if (resultado.erro) {
          mostrarErro(resultado.erro);
          return;
        }
        if (resultado.alunos.length === 0) {
          mostrarErro("Nenhum aluno válido encontrado na planilha.");
          return;
        }

        Repo.salvarLista(inputData.value, resultado.alunos);

        let mensagem = "Lista importada: " + resultado.alunos.length + " alunos.";
        const avisos = [];
        if (resultado.repetidos) avisos.push(resultado.repetidos + " matrícula(s) repetida(s) ignorada(s)");
        if (resultado.vazios) avisos.push(resultado.vazios + " linha(s) incompleta(s) ignorada(s)");
        if (avisos.length) mensagem += " (" + avisos.join("; ") + ")";

        erro.hidden = true;
        sucesso.textContent = mensagem;
        sucesso.hidden = false;
        verLista.href = "lista.html?data=" + inputData.value;
        verLista.hidden = false;
      })
      .catch(function () {
        mostrarErro("Não foi possível ler o arquivo. Use uma planilha .csv ou .xlsx válida.");
      });
  });

  document.getElementById("btn-sair").addEventListener("click", Auth.sair);
})();
