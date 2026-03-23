async function cadastrar() {
    const email = document.getElementById('email').value.trim();
    const senha = document.getElementById('senha').value;
    const nome = document.getElementById('nome').value.trim();
    const msg = document.getElementById('msg');

    if (!email || !senha || !nome) {
        msg.textContent = 'Preencha todos os campos';
        return;
    }

    try {
        const contas = await supabaseQuery('contas', 'GET');

        let jaExiste = false;
        for (let i = 0; i < contas.length; i++) {
            if (contas[i].email === email) {
                jaExiste = true;
                break;
            }
        }

        if (jaExiste) {
            msg.textContent = 'Email já cadastrado';
            return;
        }

        const resultado = await supabaseQuery('contas', 'POST', {
            email: email,
            senha: senha,
            nome: nome,
            saldo: 0
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