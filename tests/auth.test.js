describe("Login", () => {
  beforeEach(() => { sessionStorage.removeItem("almocoIFPBLogado"); });

  test("Deve entrar com usuário e senha corretos", () => {
    const usuario = "responsavel";
    const senha = "ifpb123";
   
    const entrou = Auth.entrar(usuario, senha);
    
    expect(entrou).toBe(true);
    expect(Auth.estaLogado()).toBe(true);
  });

  test("Deve verificar erro quando a senha está errada", () => {
    const senhaErrada = "errada";
    
    const entrou = Auth.entrar("responsavel", senhaErrada);
    
    expect(entrou).toBe(false);
    expect(Auth.estaLogado()).toBe(false);
  });

  test("Deve verificar erro quando o usuário está errado", () => {
    const usuarioErrado = "outro";

    const entrou = Auth.entrar(usuarioErrado, "ifpb123");

    expect(entrou).toBe(false);
  });

  test("Deve verificar erro quando usuário e senha estão vazios", () => {
    const entrou = Auth.entrar("", "");
    
    expect(entrou).toBe(false);
  });

  test("Deve ignorar espaços antes e depois do usuário", () => {
    const usuarioComEspacos = "  responsavel  ";
    
    const entrou = Auth.entrar(usuarioComEspacos, "ifpb123");
    
    expect(entrou).toBe(true);
  });

  test("Deve diferenciar maiúsculas e minúsculas na senha", () => {
    const senhaEmMaiusculas = "IFPB123";
    
    const entrou = Auth.entrar("responsavel", senhaEmMaiusculas);
    
    expect(entrou).toBe(false);
  });

  test("Deve começar sem ninguém logado", () => {
    const logado = Auth.estaLogado();
    
    expect(logado).toBe(false);
  });
});
