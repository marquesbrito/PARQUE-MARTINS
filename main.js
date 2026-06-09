import { initializeApp } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyAXQ3FhwX8KL-IQbj9j_5uQRK4qihgHvi0",
    authDomain: "aquejada-parque-martins.firebaseapp.com",
    projectId: "aquejada-parque-martins",
    storageBucket: "aquejada-parque-martins.firebasestorage.app",
    messagingSenderId: "806582025593",
    appId: "1:806582025593:web:d8764e8f399a74426c03a8"
};

let db = null;

try {
    const app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    console.log("✅ Firebase conectado");
} catch (e) {
    console.warn("Firebase erro:", e);
}

// CONFIGURAÇÃO DAS SENHAS
const CATEGORIAS_CONFIG = {
    Aspirante: {
        nome: "ASPIRANTE",
        valores: { Antecipada: 150, NoDia: 200 },
        faixas: { Sexta: { inicio: 1, fim: 150 }, Sabado: { inicio: 151, fim: 300 } }
    },
    Profissional: {
        nome: "PROFISSIONAL",
        valores: { Antecipada: 200, NoDia: 250 },
        faixas: { Sexta: { inicio: 501, fim: 650 }, Sabado: { inicio: 651, fim: 800 } }
    },
    Master: {
        nome: "MASTER",
        valores: { Antecipada: 100, NoDia: 150 },
        faixas: { Sexta: { inicio: 1001, fim: 1100 } }
    },
    FemininoJovem: {
        nome: "FEMININO/JOVEM",
        valores: { Antecipada: 100, NoDia: 150 },
        faixas: { Sexta: { inicio: 1500, fim: 1600 } }
    }
};

let senhasOcupadas = new Set();
let limiteVaqueiro = new Map();

async function carregarSenhasOcupadas() {
    senhasOcupadas.clear();
    limiteVaqueiro.clear();
    
    if (db) {
        try {
            const snapshot = await getDocs(collection(db, "senhas_registradas_2026"));
            snapshot.forEach((doc) => {
                const data = doc.data();
                if (data.categoria && data.senha && data.dia) {
                    senhasOcupadas.add(`${data.categoria}|${data.dia}|${data.senha}`);
                }
                if (data.vaqueiro) {
                    limiteVaqueiro.set(data.vaqueiro, (limiteVaqueiro.get(data.vaqueiro) || 0) + 1);
                }
            });
            console.log(`📊 ${senhasOcupadas.size} senhas ocupadas`);
        } catch (e) {
            console.error("Erro:", e);
        }
    }
}

function isSenhaOcupada(categoria, dia, senha) {
    return senhasOcupadas.has(`${categoria}|${dia}|${senha}`);
}

function getSenhasDisponiveis(categoria, dia) {
    const config = CATEGORIAS_CONFIG[categoria];
    if (!config) return [];
    
    // Se não tem a faixa para o dia, tenta pegar a primeira disponível (Sexta)
    let faixa = config.faixas[dia];
    if (!faixa) {
        // Para Master e FemininoJovem, usa Sexta como padrão
        faixa = config.faixas["Sexta"];
    }
    
    if (!faixa) return [];
    
    const { inicio, fim } = faixa;
    const disponiveis = [];
    for (let i = inicio; i <= fim; i++) {
        const numero = i.toString().padStart(3, '0');
        if (!isSenhaOcupada(categoria, dia, numero)) {
            disponiveis.push(numero);
        }
    }
    return disponiveis;
}

function atualizarSelectSenha() {
    const categoria = document.getElementById("categoria").value;
    let dia = document.getElementById("dia").value;
    const select = document.getElementById("senha");
    const boxSenha = document.getElementById("boxSenha");
    
    if (!categoria) {
        select.innerHTML = '<option value="">Selecione a senha</option>';
        select.disabled = true;
        boxSenha.classList.add("hidden");
        return;
    }
    
    // Se for Master ou FemininoJovem, força dia = Sexta
    if (categoria === "Master" || categoria === "FemininoJovem") {
        dia = "Sexta";
    }
    
    if (!dia) {
        select.innerHTML = '<option value="">Selecione o dia primeiro</option>';
        select.disabled = true;
        boxSenha.classList.add("hidden");
        return;
    }
    
    const disponiveis = getSenhasDisponiveis(categoria, dia);
    
    select.innerHTML = '<option value="">Selecione a senha</option>';
    
    if (disponiveis.length === 0) {
        const option = document.createElement("option");
        option.value = "";
        option.textContent = "❌ SEM SENHAS DISPONÍVEIS";
        option.disabled = true;
        select.appendChild(option);
        select.disabled = true;
    } else {
        select.disabled = false;
        disponiveis.forEach(num => {
            const option = document.createElement("option");
            option.value = num;
            option.textContent = num;
            select.appendChild(option);
        });
    }
    
    boxSenha.classList.remove("hidden");
    atualizarContador(categoria, dia, disponiveis.length);
    atualizarValorTotal();
}

function atualizarContador(categoria, dia, total) {
    const div = document.getElementById("contadorDinamico");
    const config = CATEGORIAS_CONFIG[categoria];
    
    // Pega a faixa correta (usa Sexta como padrão se não encontrar o dia)
    let faixa = config?.faixas[dia];
    if (!faixa && config) {
        faixa = config.faixas["Sexta"];
    }
    
    if (faixa) {
        div.innerHTML = `
            📍 Faixa: ${faixa.inicio.toString().padStart(3,'0')} a ${faixa.fim.toString().padStart(3,'0')}<br>
            ✅ Disponíveis: ${total}
        `;
    } else {
        div.innerHTML = "Selecione categoria e dia";
    }
}

function atualizarValorTotal() {
    const categoria = document.getElementById("categoria").value;
    const tipo = document.getElementById("tipoInscricao").value;
    const boitv = document.getElementById("boitv").value;
    const span = document.getElementById("valorTotal");
    
    if (!categoria || !tipo) {
        span.textContent = "R$ 0,00";
        return;
    }
    
    let total = CATEGORIAS_CONFIG[categoria]?.valores[tipo] || 0;
    if (tipo === "NoDia" && boitv === "Sim") total += 70;
    span.textContent = `R$ ${total},00`;
}

function verificarLimite(nome) {
    if ((limiteVaqueiro.get(nome) || 0) >= 4) {
        alert(`❌ ${nome} já atingiu o limite de 4 senhas!`);
        return false;
    }
    return true;
}

function limparFormulario() {
    document.getElementById("formMatricula").reset();
    document.getElementById("boxDia").classList.add("hidden");
    document.getElementById("boxBoitv").classList.add("hidden");
    document.getElementById("boxSenha").classList.add("hidden");
    document.getElementById("contadorDinamico").innerHTML = "Selecione a categoria e o dia";
    document.getElementById("valorTotal").textContent = "R$ 0,00";
    document.getElementById("senha").innerHTML = '<option value="">Selecione a senha</option>';
}

document.addEventListener("DOMContentLoaded", async function() {
    await carregarSenhasOcupadas();
    
    const categoriaSelect = document.getElementById("categoria");
    const diaSelect = document.getElementById("dia");
    const tipoSelect = document.getElementById("tipoInscricao");
    const boitvSelect = document.getElementById("boitv");
    const boxDia = document.getElementById("boxDia");
    const boxBoitv = document.getElementById("boxBoitv");
    
    categoriaSelect.addEventListener("change", function() {
        const cat = this.value;
        const showDia = (cat === "Aspirante" || cat === "Profissional");
        
        if (showDia) {
            boxDia.classList.remove("hidden");
            diaSelect.required = true;
            diaSelect.value = "";
        } else {
            boxDia.classList.add("hidden");
            diaSelect.required = false;
            // Para Master e FemininoJovem, define dia como Sexta automaticamente
            diaSelect.value = "Sexta";
        }
        
        // Atualiza as senhas disponíveis
        atualizarSelectSenha();
    });
    
    diaSelect.addEventListener("change", () => atualizarSelectSenha());
    
    tipoSelect.addEventListener("change", () => {
        const tipo = tipoSelect.value;
        if (tipo === "NoDia") {
            boxBoitv.classList.remove("hidden");
        } else {
            boxBoitv.classList.add("hidden");
            boitvSelect.value = "Não";
        }
        atualizarValorTotal();
    });
    
    boitvSelect.addEventListener("change", () => atualizarValorTotal());
    
    document.getElementById("enviar").addEventListener("click", async function() {
        const nome = document.getElementById("nomeVaqueiro").value.trim();
        const esteira = document.getElementById("nomeEsteira").value.trim();
        const representacao = document.getElementById("representacao").value.trim();
        const categoria = categoriaSelect.value;
        const tipo = tipoSelect.value;
        const boitv = boitvSelect.value;
        const raboGata = document.getElementById("raboGata").value;
        const senha = document.getElementById("senha").value;
        
        let dia = diaSelect.value;
        
        if (!nome) return alert("⚠️ Nome do Vaqueiro é obrigatório!");
        if (!esteira) return alert("⚠️ Nome do Esteira é obrigatório!");
        if (!categoria) return alert("⚠️ Selecione a categoria!");
        if (!tipo) return alert("⚠️ Selecione o tipo de inscrição!");
        
        // Para Master e FemininoJovem, força dia = Sexta
        if (categoria === "Master" || categoria === "FemininoJovem") {
            dia = "Sexta";
        } else {
            if (!dia) return alert("⚠️ Selecione o dia da corrida!");
        }
        
        if (!senha) return alert("⚠️ Selecione o número da senha!");
        if (!verificarLimite(nome)) return;
        
        // Verifica se senha já está ocupada
        if (isSenhaOcupada(categoria, dia, senha)) {
            alert("❌ Esta senha já foi usada!");
            atualizarSelectSenha();
            return;
        }
        
        const config = CATEGORIAS_CONFIG[categoria];
        let valorTotal = config.valores[tipo];
        let boitvTexto = "NÃO";
        
        if (tipo === "NoDia" && boitv === "Sim") {
            valorTotal += 70;
            boitvTexto = "SIM (+R$70)";
        } else if (tipo === "Antecipada") {
            boitvTexto = "INCLUSO";
        }
        
        let mensagem = `🏇 VAQUEJADA TRIUNFO 2026 🏇\n`;
        mensagem += `━━━━━━━━━━━━━━━━━━━━\n`;
        mensagem += `👤 Vaqueiro: ${nome}\n`;
        mensagem += `🐎 Esteira: ${esteira}\n`;
        if (representacao) mensagem += `🏷️ Representação: ${representacao}\n`;
        mensagem += `🏆 Categoria: ${config.nome}\n`;
        if (categoria === "Aspirante" || categoria === "Profissional") {
            mensagem += `📅 Dia: ${dia === "Sexta" ? "Sexta-feira" : "Sábado"}\n`;
        }
        mensagem += `💰 Tipo: ${tipo === "Antecipada" ? "Antecipada" : "No Dia"}\n`;
        mensagem += `🔢 Senha: ${senha}\n`;
        mensagem += `📺 Boi de TV: ${boitvTexto}\n`;
        mensagem += `🐎 Rabo da Gata: ${raboGata === "Sim" ? "SIM (+1 boi)" : "NÃO"}\n`;
        mensagem += `💵 Total: R$ ${valorTotal},00\n`;
        mensagem += `━━━━━━━━━━━━━━━━━━━━\n`;
        mensagem += `✅ Inscrição confirmada! Boa sorte!`;
        
        const whatsappUrl = `https://wa.me/5583999587010?text=${encodeURIComponent(mensagem)}`;
        
        // Marcar senha como ocupada LOCALMENTE
        senhasOcupadas.add(`${categoria}|${dia}|${senha}`);
        limiteVaqueiro.set(nome, (limiteVaqueiro.get(nome) || 0) + 1);
        
        // Abrir WhatsApp imediatamente
        const link = document.createElement('a');
        link.href = whatsappUrl;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Salvar no Firebase
        if (db) {
            try {
                await addDoc(collection(db, "senhas_registradas_2026"), {
                    vaqueiro: nome,
                    esteira: esteira,
                    representacao: representacao || "",
                    categoria: config.nome,
                    dia: dia,
                    tipoInscricao: tipo,
                    senha: senha,
                    boitv: boitv === "Sim" ? "SIM" : "NÃO",
                    raboGata: raboGata === "Sim" ? "SIM" : "NÃO",
                    valorTotal: valorTotal,
                    dataRegistro: new Date()
                });
                console.log("✅ Salvo no Firebase");
            } catch (e) {
                console.error("Erro ao salvar:", e);
            }
        }
        
        // Atualiza o select (a senha escolhida some)
        atualizarSelectSenha();
        limparFormulario();
        alert(`✅ Inscrição confirmada!\n📝 Senha ${senha} - ${config.nome}\n💰 Total: R$ ${valorTotal},00\n\n📱 WhatsApp aberto!`);
    });
});