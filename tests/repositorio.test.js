const DATA = "2026-10-05";
const ALUNOS = [
  { matricula: "1001", nome: "Ana Clara", curso: "ADS" },
  { matricula: "1002", nome: "Bruno Lima", curso: "Matemática" },
  { matricula: "1003", nome: "Carla Souza", curso: "Engenharia" },
  { matricula: "1004", nome: "Diego Alves", curso: "ADS" },
];

describe("Lista do dia", () => {
  beforeEach(() => { localStorage.removeItem("almocoIFPB"); });

  test("Deve devolver a data de hoje no formato AAAA-MM-DD", () => {
    
    const hoje = Repo.hoje();
    
    expect(hoje).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  test("Deve devolver null quando a data não tem lista importada", () => {
    const dataSemLista = "2030-01-01";
    
    const dia = Repo.obterDia(dataSemLista);
    
    expect(dia).toBeNull();
  });

  test("Deve salvar a lista com todos os alunos e nenhuma entrega", () => {
    Repo.salvarLista(DATA, ALUNOS);
    const dia = Repo.obterDia(DATA);
  
    expect(dia.alunos).toHaveLength(4);
    expect(Object.keys(dia.registros)).toHaveLength(0);
    expect(dia.encerrada).toBe(false);
    expect(dia.extras).toHaveLength(0);
  });

  test("Deve guardar o curso de cada aluno", () => {
    Repo.salvarLista(DATA, ALUNOS);

    expect(Repo.obterDia(DATA).alunos[1].curso).toBe("Matemática");
  });

  test("Deve manter separadas as listas de datas diferentes", () => {
    const outraData = "2026-10-06";

    Repo.salvarLista(DATA, ALUNOS);
    Repo.salvarLista(outraData, [ALUNOS[0]]);

    expect(Repo.obterDia(DATA).alunos).toHaveLength(4);
    expect(Repo.obterDia(outraData).alunos).toHaveLength(1);
  });

  test("Deve ignorar dados corrompidos no navegador sem quebrar", () => {
    localStorage.setItem("almocoIFPB", "{isso não é json");
    
    const dia = Repo.obterDia(DATA);
    
    expect(dia).toBeNull();
  });
});

describe("Marcar entrega (uso único)", () => {
  beforeEach(() => {
    localStorage.removeItem("almocoIFPB");
    Repo.salvarLista(DATA, ALUNOS);
  });

  test("Deve marcar a entrega de um aluno da lista e registrar a hora", () => {
    const matricula = "1001";
    
    const resultado = Repo.marcarEntrega(DATA, matricula);
    
    expect(resultado.ok).toBe(true);
    expect(Repo.obterDia(DATA).registros[matricula]).toMatch(/^\d{2}:\d{2}$/);
  });

  test("Deve impedir que o mesmo aluno receba o almoço duas vezes no dia", () => {
   
    Repo.marcarEntrega(DATA, "1001");
    
    const segunda = Repo.marcarEntrega(DATA, "1001");
    
    expect(segunda.ok).toBe(false);
    expect(segunda.motivo).toContain("já recebeu");
    expect(Object.keys(Repo.obterDia(DATA).registros)).toHaveLength(1);
  });

  test("Deve recusar matrícula que não está na lista", () => {
    const matriculaDeFora = "9999";
   
    const resultado = Repo.marcarEntrega(DATA, matriculaDeFora);
    
    expect(resultado.ok).toBe(false);
  });

  test("Deve recusar a marcação em data sem lista", () => {
    const dataSemLista = "2030-01-01";
    
    const resultado = Repo.marcarEntrega(dataSemLista, "1001");
    
    expect(resultado.ok).toBe(false);
  });

  test("Deve recusar a marcação depois que a entrega foi encerrada", () => {
    Repo.encerrarEntrega(DATA);
    
    const resultado = Repo.marcarEntrega(DATA, "1002");
    
    expect(resultado.ok).toBe(false);
  });

  test("Deve marcar só o aluno escolhido, sem afetar os outros", () => {
    Repo.marcarEntrega(DATA, "1001");
    
    expect(Repo.obterDia(DATA).registros["1002"]).toBeUndefined();
  });
});

describe("Encerrar entrega e sobras", () => {
  beforeEach(() => {
    localStorage.removeItem("almocoIFPB");
    Repo.salvarLista(DATA, ALUNOS);
  });

  test("Deve marcar a lista como encerrada", () => {
    Repo.encerrarEntrega(DATA);
    
    expect(Repo.obterDia(DATA).encerrada).toBe(true);
  });

  test("Deve ignorar o encerramento de uma data que não tem lista", () => {
    const dataSemLista = "2030-01-01";
    
    Repo.encerrarEntrega(dataSemLista);
    
    expect(Repo.obterDia(dataSemLista)).toBeNull();
  });

  test("Deve calcular as sobras como os alunos ausentes (4 previstos, 1 entregue = 3)", () => {
    Repo.marcarEntrega(DATA, "1001");
    
    const sobras = Repo.sobraram(Repo.obterDia(DATA));
    
    expect(sobras).toBe(3);
  });

  test("Deve devolver 0 sobras quando não há lista", () => {
    const sobras = Repo.sobraram(null);
    
    expect(sobras).toBe(0);
  });

  test("Deve devolver 0 sobras quando todos os alunos retiraram", () => {
    ALUNOS.forEach((a) => Repo.marcarEntrega(DATA, a.matricula));
    
    const sobras = Repo.sobraram(Repo.obterDia(DATA));
   
    expect(sobras).toBe(0);
  });
});

describe("Aluno extra", () => {
  beforeEach(() => {
    localStorage.removeItem("almocoIFPB");
    Repo.salvarLista(DATA, ALUNOS);
  });

  test("Deve recusar o extra antes de encerrar a entrega", () => {
    const resultado = Repo.registrarExtra(DATA, "5001", "Extra Um");
    
    expect(resultado.ok).toBe(false);
  });

  test("Deve aceitar o extra depois de encerrar quando há sobra", () => {
    Repo.encerrarEntrega(DATA);
    
    const resultado = Repo.registrarExtra(DATA, "5001", "Extra Um");
    
    expect(resultado.ok).toBe(true);
    expect(Repo.obterDia(DATA).extras).toHaveLength(1);
    expect(Repo.obterDia(DATA).extras[0].nome).toBe("Extra Um");
  });

  test("Deve diminuir as sobras em 1 a cada extra atendido", () => {
    Repo.encerrarEntrega(DATA);
    
    Repo.registrarExtra(DATA, "5001", "Extra Um");
    
    expect(Repo.sobraram(Repo.obterDia(DATA))).toBe(3);
  });

  test("Deve recusar como extra um aluno que já está na lista", () => {
    Repo.encerrarEntrega(DATA);
    
    const resultado = Repo.registrarExtra(DATA, "1001", "Ana Clara");
    
    expect(resultado.ok).toBe(false);
  });

  test("Deve recusar o mesmo extra duas vezes", () => {
    Repo.encerrarEntrega(DATA);
    Repo.registrarExtra(DATA, "5001", "Extra Um");

    const segunda = Repo.registrarExtra(DATA, "5001", "Extra Um");

    expect(segunda.ok).toBe(false);
  });

  test("Deve impedir extras além do número de almoços que sobraram", () => {
    ALUNOS.slice(0, 3).forEach((a) => Repo.marcarEntrega(DATA, a.matricula));
    Repo.encerrarEntrega(DATA); 
    Repo.registrarExtra(DATA, "5001", "Extra Um");

    const excedente = Repo.registrarExtra(DATA, "5002", "Extra Dois");

    expect(excedente.ok).toBe(false);
    expect(Repo.obterDia(DATA).extras).toHaveLength(1);
  });

  test("Deve recusar extra quando todos os alunos da lista retiraram", () => {
    ALUNOS.forEach((a) => Repo.marcarEntrega(DATA, a.matricula));
    Repo.encerrarEntrega(DATA);

    const resultado = Repo.registrarExtra(DATA, "5001", "Extra Um");

    expect(resultado.ok).toBe(false);
  });

  test("Deve recusar extra em data sem lista", () => {
    const dataSemLista = "2030-01-01";

    const resultado = Repo.registrarExtra(dataSemLista, "5001", "Extra Um");

    expect(resultado.ok).toBe(false);
  });
});

describe("Reimportar a lista", () => {
  beforeEach(() => {
    localStorage.removeItem("almocoIFPB");
    Repo.salvarLista(DATA, ALUNOS);
  });

  test("Deve manter a marcação de quem continua na lista", () => {
    Repo.marcarEntrega(DATA, "1001");

    Repo.salvarLista(DATA, ALUNOS);

    expect(Repo.obterDia(DATA).registros["1001"]).toBeTruthy();
  });

  test("Deve descartar a marcação de quem saiu da lista", () => {
    Repo.marcarEntrega(DATA, "1001");
    const listaSemAna = ALUNOS.slice(1);

    Repo.salvarLista(DATA, listaSemAna);

    expect(Repo.obterDia(DATA).registros["1001"]).toBeUndefined();
  });

  test("Deve manter a lista encerrada ao reimportar", () => {
    Repo.encerrarEntrega(DATA);

    Repo.salvarLista(DATA, ALUNOS);

    expect(Repo.obterDia(DATA).encerrada).toBe(true);
  });
});

describe("Curso do aluno extra", () => {
  beforeEach(() => {
    localStorage.removeItem("almocoIFPB");
    Repo.salvarLista(DATA, ALUNOS);
    Repo.encerrarEntrega(DATA);
  });

  test("Deve guardar o curso informado para o aluno extra", () => {

    const curso = "Engenharia de Controle e Automação";

    const resultado = Repo.registrarExtra(DATA, "5001", "Extra Um", curso);

    expect(resultado.ok).toBe(true);
    expect(Repo.obterDia(DATA).extras[0].curso).toBe(curso);
  });

  test("Deve guardar o curso vazio quando ele não for informado", () => {
    Repo.registrarExtra(DATA, "5001", "Extra Um");

    expect(Repo.obterDia(DATA).extras[0].curso).toBe("");
  });
});

describe("Desfazer marcação", () => {
  beforeEach(() => {
    localStorage.removeItem("almocoIFPB");
    Repo.salvarLista(DATA, ALUNOS);
  });

  test("Deve desfazer a marcação feita por engano", () => {
    Repo.marcarEntrega(DATA, "1001");

    const resultado = Repo.desmarcarEntrega(DATA, "1001");

    expect(resultado.ok).toBe(true);
    expect(Repo.obterDia(DATA).registros["1001"]).toBeUndefined();
  });

  test("Deve permitir marcar de novo o aluno depois de desfazer", () => {
    Repo.marcarEntrega(DATA, "1001");
    Repo.desmarcarEntrega(DATA, "1001");

    const resultado = Repo.marcarEntrega(DATA, "1001");

    expect(resultado.ok).toBe(true);
  });

  test("Deve desfazer só o aluno escolhido, sem afetar os outros", () => {
    Repo.marcarEntrega(DATA, "1001");
    Repo.marcarEntrega(DATA, "1002");

    Repo.desmarcarEntrega(DATA, "1001");

    expect(Repo.obterDia(DATA).registros["1002"]).toBeTruthy();
  });

  test("Deve recusar desfazer um aluno que não está marcado", () => {
    const resultado = Repo.desmarcarEntrega(DATA, "1001");
  
    expect(resultado.ok).toBe(false);
  });

  test("Deve recusar desfazer depois que a entrega foi encerrada", () => {
    Repo.marcarEntrega(DATA, "1001");
    Repo.encerrarEntrega(DATA);
    
    const resultado = Repo.desmarcarEntrega(DATA, "1001");
    
    expect(resultado.ok).toBe(false);
    expect(Repo.obterDia(DATA).registros["1001"]).toBeTruthy();
  });

  test("Deve recusar desfazer em data sem lista", () => {
    const dataSemLista = "2030-01-01";
    
    const resultado = Repo.desmarcarEntrega(dataSemLista, "1001");
    
    expect(resultado.ok).toBe(false);
  });
});
