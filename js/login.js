async function entrar() {
    const email = document.getElementById('email').value.trim();
    const senha = document.getElementById('senha').value;
    const cpf = document.getElementById('cpf').value.trim();
    const msg = document.getElementById('msg');

    try {
        const contas = await supabaseQuery('contas', 'GET');

        const contaPorEmail = contas.find(c => c.email === email);
        if (!contaPorEmail) {
            msg.textContent = 'Email não encontrado';
            return;
        }

        const contaPorCPF = contas.find(c => c.cpf === cpf);
        if (!contaPorCPF) {
            msg.textContent = 'CPF não encontrado';
            return;
        }

        if (contaPorEmail.senha !== senha) {
            msg.textContent = 'Senha incorreta';
            return;
        }

        if (contaPorEmail.id !== contaPorCPF.id) {
            msg.textContent = 'Email e CPF não correspondem';
            return;
        }

        sessionStorage.setItem('contaLogada', JSON.stringify(contaPorEmail));
        window.location.href = 'conta.html';

    } catch (erro) {
        msg.textContent = 'Erro: ' + erro.message;
    }
}