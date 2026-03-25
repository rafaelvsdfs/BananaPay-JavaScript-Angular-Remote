async function cadastrar() {
    const email = document.getElementById('email').value.trim();
    const senha = document.getElementById('senha').value;
    const nome = document.getElementById('nome').value.trim();
    const cpf = document.getElementById('cpf').value.trim();
    const saldo = parseFloat(document.getElementById('saldo').value) || 0;
    const limite = parseFloat(document.getElementById('limite').value) || 0;

    const msg = document.getElementById('msg');

    if (!email || !senha || !nome || !cpf) {
        msg.textContent = 'Preencha todos os campos';
        return;
    }

    try {
        const contas = await supabaseQuery('contas', 'GET');

        let jaExisteEmail = false;
        let jaExisteCPF = false;

        for (let i = 0; i < contas.length; i++) {
            if (contas[i].email === email) {
                jaExisteEmail = true;
                break;
            }
        }

        for (let i = 0; i < contas.length; i++) {
            if (contas[i].cpf === cpf) {
                jaExisteCPF = true;
                break;
            }
        }

        if (jaExisteEmail) {
            msg.textContent = 'Email já cadastrado';
            return;
        }

        if (jaExisteCPF) {
            msg.textContent = 'CPF já cadastrado';
            return;
        }

        const resultado = await supabaseQuery('contas', 'POST', {
            email: email,
            senha: senha,
            nome: nome,
            cpf: cpf,
            saldo: saldo,
            limite: limite,
            limite_original: limite
        });

        if (resultado.length > 0) {
            msg.style.color = 'green';
            msg.textContent = 'Cadastrado com sucesso! Vá para o login';
        } else {
            msg.textContent = 'Erro ao cadastrar';
        }

    } catch (erro) {
        msg.textContent = 'Erro: ' + erro.message;
    }
}