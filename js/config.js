// CONFIGURAÇÃO DO SUPABASE - COLOQUE SEUS DADOS AQUI
const SUPABASE_URL = 'https://jtxoxbrflsruqulokzxn.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp0eG94YnJmbHNydXF1bG9renhuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyNzM4NTYsImV4cCI6MjA4OTg0OTg1Nn0.gUDO90pXNMHjs14qxKG5pmrF3f9kVPHBQxNkDWrWfIA';

async function supabaseQuery(tabela, metodo, dados = null, id = null) {
    let url = `${SUPABASE_URL}/rest/v1/${tabela}`;
    if (id) url += `?id=eq.${id}`;

    const options = {
        method: metodo,
        headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
        }
    };

    if (dados) {
        options.body = JSON.stringify(dados);
    }

    try {
        const resposta = await fetch(url, options);
        const resultado = await resposta.json();

        if (Array.isArray(resultado)) {
            return resultado;
        } else if (resultado && typeof resultado === 'object') {
            return [resultado];
        } else {
            return [];
        }

    } catch (erro) {
        console.error('Erro na requisição:', erro);
        return [];
    }
}