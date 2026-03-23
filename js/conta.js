let conta = JSON.parse(sessionStorage.getItem('contaLogada'));

if (!conta) {
    alert('Faça login primeiro');
    window.location.href = 'index.html';
}

document.getElementById('nome').textContent = conta.nome;
document.getElementById('email').textContent = conta.email;
atualizarSaldo();

async function atualizarSaldo() {
    try {
        const contas = await supabaseQuery('contas', 'GET');

        let contaAtualizada = null;
        for (let i = 0; i < contas.length; i++) {
            if (contas[i].id === conta.id) {
                contaAtualizada = contas[i];
                break;
            }
        }

        if (contaAtualizada) {
            conta = contaAtualizada;
            sessionStorage.setItem('contaLogada', JSON.stringify(conta));
            document.getElementById('saldo').textContent = parseFloat(conta.saldo).toFixed(2);
        }

        carregarHistorico();

    } catch (erro) {
        console.error('Erro ao atualizar:', erro);
    }
}

async function depositar() {
    const input = document.getElementById('valorDep');
    const valor = parseFloat(input.value);
    const msg = document.getElementById('msgDep');

    if (!valor || valor <= 0) {
        msg.style.color = 'red';
        msg.textContent = 'Valor inválido';
        return;
    }

    try {
        const novoSaldo = parseFloat(conta.saldo) + valor;

        await supabaseQuery('contas', 'PATCH', { saldo: novoSaldo }, conta.id);

        await supabaseQuery('transacoes', 'POST', {
            conta_id: conta.id,
            tipo: 'deposito',
            valor: valor
        });

        msg.style.color = 'green';
        msg.textContent = 'Depósito: R$ ' + valor.toFixed(2);
        input.value = '';

        atualizarSaldo();

    } catch (erro) {
        msg.style.color = 'red';
        msg.textContent = 'Erro no depósito';
    }
}

async function sacar() {
    const input = document.getElementById('valorSaq');
    const valor = parseFloat(input.value);
    const msg = document.getElementById('msgSaq');

    if (!valor || valor <= 0) {
        msg.textContent = 'Valor inválido';
        return;
    }

    if (valor > conta.saldo) {
        msg.textContent = 'Saldo insuficiente';
        return;
    }

    try {
        const novoSaldo = parseFloat(conta.saldo) - valor;

        await supabaseQuery('contas', 'PATCH', { saldo: novoSaldo }, conta.id);

        await supabaseQuery('transacoes', 'POST', {
            conta_id: conta.id,
            tipo: 'saque',
            valor: valor
        });

        msg.textContent = 'Saque: R$ ' + valor.toFixed(2);
        input.value = '';

        atualizarSaldo();

    } catch (erro) {
        msg.textContent = 'Erro no saque';
    }
}

async function carregarHistorico() {
    try {
        const transacoes = await supabaseQuery('transacoes', 'GET');

        const minhas = [];
        for (let i = 0; i < transacoes.length; i++) {
            if (transacoes[i].conta_id === conta.id) {
                minhas.push(transacoes[i]);
            }
        }

        const div = document.getElementById('historico');

        if (minhas.length === 0) {
            div.innerHTML = '<p>Sem movimentações</p>';
            return;
        }

        minhas.sort(function (a, b) {
            return new Date(b.data) - new Date(a.data);
        });

        let html = '';
        for (let i = 0; i < minhas.length; i++) {
            const t = minhas[i];
            html += '<p>' +
                t.tipo.toUpperCase() + ' - ' +
                'R$ ' + parseFloat(t.valor).toFixed(2) + ' - ' +
                new Date(t.data).toLocaleString('pt-BR') +
                '</p>';
        }

        div.innerHTML = html;

    } catch (erro) {
        console.error('Erro no histórico:', erro);
    }
}

function sair() {
    sessionStorage.removeItem('contaLogada');
    window.location.href = 'index.html';
}

setInterval(atualizarSaldo, 5000);