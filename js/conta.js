let conta = JSON.parse(sessionStorage.getItem('contaLogada'));

if (!conta) {
    alert('Faça login primeiro');
    window.location.href = 'index.html';
}

document.getElementById('nome').textContent = conta.nome;
document.getElementById('saldo').textContent = parseFloat(conta.saldo).toFixed(2);
document.getElementById('limite').textContent = parseFloat(conta.limite).toFixed(2);

atualizarSaldo();

async function atualizarSaldo() {
    document.getElementById('saldo').textContent = parseFloat(conta.saldo).toFixed(2);
    document.getElementById('limite').textContent = parseFloat(conta.limite).toFixed(2);
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
    const saldo = parseFloat(conta.saldo);
    const limite = parseFloat(conta.limite);
    const limiteOriginal = parseFloat(conta.limite_original);

    if (!valor || valor <= 0) {
        msg.style.color = 'red';
        msg.textContent = 'Valor inválido';
        return;
    }

    if (valor > 1000000) {
        msg.style.color = 'red';
        msg.textContent = 'Valor máximo por depósito é de R$ 1.000.000,00';
        return;
    }

    if (saldo >= 10000000) {
        msg.style.color = 'red';
        msg.textContent = 'Saldo máximo é de R$ 10.000.000,00';
        return;
    }

    let novoSaldo = saldo;
    let novoLimite = limite;

    const limiteFaltando = limiteOriginal - limite;

    if (limiteFaltando > 0) {
        if (valor >= limiteFaltando) {
            novoLimite = limiteOriginal;
            novoSaldo = saldo + (valor - limiteFaltando);
        } else {
            novoLimite = limite + valor;
            novoSaldo = saldo;
        }
    } else {
        novoSaldo = saldo + valor;
    }

    try {
        await supabaseQuery('contas', 'PATCH', { saldo: novoSaldo, limite: novoLimite }, conta.id);

        await supabaseQuery('transacoes', 'POST', {
            conta_id: conta.id,
            tipo: 'deposito',
            valor: valor
        });

        msg.style.color = 'green';
        msg.textContent = 'Depósito: R$ ' + valor.toFixed(2);
        input.value = '';

        atualizarSaldo();
        window.location.href = '../web/conta.html';

    } catch (erro) {
        msg.style.color = 'red';
        msg.textContent = 'Erro no depósito';
    }
}

async function sacar() {
    const input = document.getElementById('valorSaq');
    const valor = parseFloat(input.value);
    const msg = document.getElementById('msgSaq');
    const saldo = parseFloat(conta.saldo);
    const limite = parseFloat(conta.limite);

    if (!valor || valor <= 0) {
        msg.style.color = 'red';
        msg.textContent = 'Valor inválido';
        return;
    }

    if (valor > saldo + limite) {
        msg.style.color = 'red';
        msg.textContent = 'Saldo insuficiente';
        return;
    }

    let novoSaldo = saldo;
    let novoLimite = limite;

    if (saldo >= valor) {
        novoSaldo = saldo - valor;
    } else {
        const resto = valor - saldo;
        novoSaldo = 0;
        novoLimite = limite - resto;
    }

    try {
        await supabaseQuery('contas', 'PATCH', { saldo: novoSaldo, limite: novoLimite }, conta.id);

        await supabaseQuery('transacoes', 'POST', {
            conta_id: conta.id,
            tipo: 'saque',
            valor: valor
        });

        msg.style.color = 'green';
        msg.textContent = 'Saque: R$ ' + valor.toFixed(2);
        input.value = '';

        atualizarSaldo();
        window.location.href = '../web/conta.html';

    } catch (erro) {
        msg.style.color = 'red';
        msg.textContent = 'Erro no saque';
    }
}

async function transferir() {
    const cpfDestinatario = document.getElementById('cpfDestinatario').value;
    const valor = parseFloat(document.getElementById('valorTransferencia').value);
    const msg = document.getElementById('msgtransferencia');

    if (!cpfDestinatario) {
        msg.style.color = 'red';
        msg.textContent = 'CPF do destinatário é obrigatório';
        return;
    }

    if (cpfDestinatario === conta.cpf) {
        msg.style.color = 'red';
        msg.textContent = 'Não é possível transferir para si mesmo';
        return;
    }

    if (!valor || valor <= 0) {
        msg.style.color = 'red';
        msg.textContent = 'Valor inválido';
        return;
    }

    if (valor > parseFloat(conta.saldo) + parseFloat(conta.limite)) {
        msg.style.color = 'red';
        msg.textContent = 'Saldo insuficiente';
        return;
    }

    try {
        // 1. Busca todas as contas e acha o destinatário
        const contas = await supabaseQuery('contas', 'GET');
        const destinatario = contas.find(c => normalizarCPF(c.cpf) === normalizarCPF(cpfDestinatario));

        if (!destinatario) {
            msg.style.color = 'red';
            msg.textContent = 'Destinatário não encontrado';
            return;
        }

        // 2. Calcula novo estado do remetente (logica do sacar)
        const saldoRemetente = parseFloat(conta.saldo);
        const limiteRemetente = parseFloat(conta.limite);

        let novoSaldoRemetente, novoLimiteRemetente;
        if (saldoRemetente >= valor) {
            novoSaldoRemetente = saldoRemetente - valor;
            novoLimiteRemetente = limiteRemetente;
        } else {
            const resto = valor - saldoRemetente;
            novoSaldoRemetente = 0;
            novoLimiteRemetente = limiteRemetente - resto;
        }

        // 3. Calcula novo estado do destinatário (logica do depositar)
        const saldoDest = parseFloat(destinatario.saldo);
        const limiteDest = parseFloat(destinatario.limite);
        const limiteOriginalDest = parseFloat(destinatario.limite_original);
        const limiteFaltando = limiteOriginalDest - limiteDest;

        let novoSaldoDest, novoLimiteDest;
        if (limiteFaltando > 0) {
            if (valor >= limiteFaltando) {
                novoLimiteDest = limiteOriginalDest;
                novoSaldoDest = saldoDest + (valor - limiteFaltando);
            } else {
                novoLimiteDest = limiteDest + valor;
                novoSaldoDest = saldoDest;
            }
        } else {
            novoSaldoDest = saldoDest + valor;
            novoLimiteDest = limiteDest;
        }

        // 4. Atualiza os dois no banco
        await supabaseQuery('contas', 'PATCH', { saldo: novoSaldoRemetente, limite: novoLimiteRemetente }, conta.id);
        await supabaseQuery('contas', 'PATCH', { saldo: novoSaldoDest, limite: novoLimiteDest }, destinatario.id);

        // 5. Registra a transação
        await supabaseQuery('transacoes', 'POST', {
            conta_id: conta.id,
            conta_destino_id: destinatario.id,
            tipo: 'transferencia',
            valor: valor
        });

        msg.style.color = 'green';
        msg.textContent = 'Transferência de R$ ' + valor.toFixed(2) + ' realizada!';
        atualizarSaldo();
        window.location.href = '../web/conta.html';

    } catch (erro) {
        console.error(erro);
        msg.style.color = 'red';
        msg.textContent = 'Erro ao transferir';
    }
}

async function carregarHistorico() {
    try {
        const transacoes = await supabaseQuery('transacoes', 'GET');
        const contas = await supabaseQuery('contas', 'GET');

        const minhas = [];
        for (let i = 0; i < transacoes.length; i++) {
            if (transacoes[i].conta_id === conta.id) {
                minhas.push(transacoes[i]);
            }
        }

        const div = document.getElementById('historico');

        if (!div) return;

        if (minhas.length === 0) {
            div.innerHTML = '<p>Sem movimentações</p>';
            return;
        }

        minhas.sort(function (a, b) {
            return new Date(b.data) - new Date(a.data);
        });

        let html = '<table><tr><th>Tipo</th><th>Valor</th><th>Quem</th><th>Data</th></tr>';
        for (let i = 0; i < minhas.length; i++) {
            const t = minhas[i];

            let quem = '-';
            if (t.tipo === 'transferencia') {
                for (let j = 0; j < contas.length; j++) {
                    if (contas[j].id === t.conta_destino_id) {
                        quem = contas[j].nome;
                        break;
                    }
                }
            }

            html += '<tr class="' + t.tipo + '">' +
                '<td>' + t.tipo.toUpperCase() + '</td>' +
                '<td>R$ ' + parseFloat(t.valor).toFixed(2) + '</td>' +
                '<td>' + quem + '</td>' +
                '<td>' + new Date(t.data).toLocaleString('pt-BR') + '</td>' +
                '</tr>';
        }
        html += '</table>';

        div.innerHTML = html;

    } catch (erro) {
        console.error('Erro no histórico:', erro);
    }
}

function normalizarCPF(cpf) {
    return cpf.replace(/[.\-]/g, '').trim();
}

function sair() {
    sessionStorage.removeItem('contaLogada');
    window.location.href = 'index.html';
}

setInterval(atualizarSaldo, 5000);