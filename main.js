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
        valores: { Antecipada: 250, NoDia: 250 },
        faixas: { inicio: 1, fim: 200 }
    },
    Aberta: {
        nome: "ABERTA",
        valores: { Antecipada: 200, NoDia: 200 },
        faixas: { inicio: 500, fim: 700 }
    },
    FemininoJovem: {
        nome: "FEMININO/JOVEM",
        valores: { Antecipada: 100, NoDia: 100 },
        faixas: { inicio: 300, fim: 400 }
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
                if (data.categoria && data.senha) {
                    const chave = `${data.categoria}|${data.senha}`;
                    senhasOcupadas.add(chave);
                    console.log(`🔒 Carregada senha ocupada: ${chave}`);
                }
                if (data.vaqueiro) {
                    limiteVaqueiro.set(data.vaqueiro, (limiteVaqueiro.get(data.vaqueiro) || 0) + 1);
                }
            });
            console.log(`📊 Total de senhas ocupadas carregadas: ${senhasOcupadas.size}`);
        } catch (e) {
            console.error("Erro ao carregar:", e);
        }
    }
}

function isSenhaOcupada(categoriaKey, senha) {
    const categoriaNome = CATEGORIAS_CONFIG[categoriaKey]?.nome || categoriaKey;
    const chave = `${categoriaNome}|${senha}`;
    const ocupada = senhasOcupadas.has(chave);
    if (ocupada) {
        console.log(`🚫 Senha ocupada: ${chave}`);
    }
    return ocupada;
}

function getSenhasDisponiveis(categoriaKey) {
    const config = CATEGORIAS_CONFIG[categoriaKey];
    if (!config) return [];
    
    const { inicio, fim } = config.faixas;
    const disponiveis = [];
    for (let i = inicio; i <= fim; i++) {
        const numero = i.toString().padStart(3, '0');
        if (!isSenhaOcupada(categoriaKey, numero)) {
            disponiveis.push(numero);
        }
    }
    return disponiveis;
}

function atualizarSelectSenha() {
    const categoriaKey = document.getElementById("categoria").value;
    const select = document.getElementById("senha");
    const boxSenha = document.getElementById("boxSenha");
    
    console.log(`🔄 Atualizando select - Categoria: ${categoriaKey}`);
    
    if (!categoriaKey) {
        select.innerHTML = '<option value="">Selecione a senha</option>';
        select.disabled = true;
        boxSenha.classList.add("hidden");
        return;
    }
    
    const disponiveis = getSenhasDisponiveis(categoriaKey);
    console.log(`📋 Senhas disponíveis para ${categoriaKey}: ${disponiveis.length}`);
    
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
    atualizarContador(categoriaKey, disponiveis.length);
    atualizarValorTotal();
}

function atualizarContador(categoriaKey, total) {
    const div = document.getElementById("contadorDinamico");
    const config = CATEGORIAS_CONFIG[categoriaKey];
    
    if (config) {
        const { inicio, fim } = config.faixas;
        div.innerHTML = `
            📍 Faixa: ${inicio.toString().padStart(3,'0')} a ${fim.toString().padStart(3,'0')}<br>
            ✅ Disponíveis: ${total}
        `;
    } else {
        div.innerHTML = "Selecione a categoria";
    }
}

// ===== ATUALIZA VALOR TOTAL COM BOI TV (PARA AMBAS OPÇÕES) =====
function atualizarValorTotal() {
    const categoriaKey = document.getElementById("categoria").value;
    const tipo = document.getElementById("tipoInscricao").value;
    const boitv = document.getElementById("boitv").value;
    const span = document.getElementById("valorTotal");
    
    if (!categoriaKey || !tipo || !boitv) {
        span.textContent = "R$ 0,00";
        return;
    }
    
    let total = CATEGORIAS_CONFIG[categoriaKey]?.valores[tipo] || 0;
    
    // Adiciona Boi TV para AMBAS as opções
    if (boitv === "Antecipado") {
        total += 20;
    } else if (boitv === "NaHora") {
        total += 50;
    }
    // Se for "Nao" não adiciona nada
    
    span.textContent = `R$ ${total},00`;
}

function verificarLimite(nome) {
    const quantidade = limiteVaqueiro.get(nome) || 0;
    if (quantidade >= 4) {
        alert(`❌ ${nome} já atingiu o limite de 4 senhas! (${quantidade}/4)`);
        return false;
    }
    return true;
}

function limparFormulario() {
    document.getElementById("formMatricula").reset();
    document.getElementById("boxSenha").classList.add("hidden");
    document.getElementById("contadorDinamico").innerHTML = "Selecione a categoria";
    document.getElementById("valorTotal").textContent = "R$ 0,00";
    // Força o select do Boi TV a ficar vazio
    document.getElementById("boitv").value = "";
}

document.addEventListener("DOMContentLoaded", async function() {
    console.log("🚀 Inicializando sistema...");
    await carregarSenhasOcupadas();
    
    const categoriaSelect = document.getElementById("categoria");
    const tipoSelect = document.getElementById("tipoInscricao");
    const boitvSelect = document.getElementById("boitv");
    
    categoriaSelect.addEventListener("change", function() {
        atualizarSelectSenha();
    });
    
    // ===== QUANDO TIPO DE INSCRIÇÃO MUDA =====
    tipoSelect.addEventListener("change", () => {
        atualizarValorTotal();
    });
    
    boitvSelect.addEventListener("change", () => atualizarValorTotal());
    
    document.getElementById("enviar").addEventListener("click", async function() {
        const nome = document.getElementById("nomeVaqueiro").value.trim();
        const esteira = document.getElementById("nomeEsteira").value.trim();
        const representacao = document.getElementById("representacao").value.trim();
        const categoriaKey = categoriaSelect.value;
        const tipo = tipoSelect.value;
        const boitv = boitvSelect.value;
        const senha = document.getElementById("senha").value;
        
        // Validações
        if (!nome) return alert("⚠️ Nome do Vaqueiro é obrigatório!");
        if (!esteira) return alert("⚠️ Nome do Esteira é obrigatório!");
        if (!categoriaKey) return alert("⚠️ Selecione a categoria!");
        if (!tipo) return alert("⚠️ Selecione o tipo de inscrição!");
        if (!boitv) return alert("⚠️ Selecione o Boi de TV!");
        if (!senha) return alert("⚠️ Selecione o número da senha!");
        if (!verificarLimite(nome)) return;
        
        // Verifica se senha já está ocupada
        if (isSenhaOcupada(categoriaKey, senha)) {
            alert("❌ Esta senha já foi usada! Recarregue a página e tente novamente.");
            await carregarSenhasOcupadas();
            atualizarSelectSenha();
            return;
        }
        
        const config = CATEGORIAS_CONFIG[categoriaKey];
        const categoriaNome = config.nome;
        
        let valorTotal = config.valores[tipo];
        let boitvTexto = "";
        
        // ===== LÓGICA DO BOI TV =====
        if (boitv === "Antecipado") {
            valorTotal += 20;
            boitvTexto = "Antecipado (R$ 20,00)";
        } else if (boitv === "NaHora") {
            valorTotal += 50;
            boitvTexto = "Na Hora (R$ 50,00)";
        } else {
            boitvTexto = "NÃO";
        }
        
        // Monta mensagem do WhatsApp
        let mensagem = `🏇 PARQUE HARAS BATISTA 🏇\n`;
        mensagem += `━━━━━━━━━━━━━━━━━━━━\n`;
        mensagem += `🏆 1° BOLÃO DE VAQUEJADA\n`;
        mensagem += `📅 07 a 09 de AGOSTO\n`;
        mensagem += `📍 Sítio Tapagem - Monteiro-PB\n`;
        mensagem += `💰 MAIS DE 6 MIL EM PRÊMIOS\n`;
        mensagem += `━━━━━━━━━━━━━━━━━━━━\n`;
        mensagem += `👤 Vaqueiro: ${nome}\n`;
        mensagem += `🐎 Esteira: ${esteira}\n`;
        if (representacao) mensagem += `🏷️ Representação: ${representacao}\n`;
        mensagem += `🏆 Categoria: ${categoriaNome}\n`;
        mensagem += `💰 Tipo: ${tipo === "Antecipada" ? "Antecipada" : "No Dia"}\n`;
        mensagem += `🔢 Senha: ${senha}\n`;
        mensagem += `📺 Boi de TV: ${boitvTexto}\n`;
        mensagem += `💵 Total: R$ ${valorTotal},00\n`;
        mensagem += `━━━━━━━━━━━━━━━━━━━━\n`;
        mensagem += `✅ Inscrição confirmada! Boa sorte!`;
        
        const whatsappUrl = `https://wa.me/5583999587010?text=${encodeURIComponent(mensagem)}`;
        
        // Marca senha como ocupada
        const chaveOcupada = `${categoriaNome}|${senha}`;
        senhasOcupadas.add(chaveOcupada);
        limiteVaqueiro.set(nome, (limiteVaqueiro.get(nome) || 0) + 1);
        console.log(`🔒 Senha marcada como ocupada: ${chaveOcupada}`);
        
        // Abrir WhatsApp
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
                    categoria: categoriaNome,
                    senha: senha,
                    tipoInscricao: tipo,
                    boitv: boitv,
                    valorTotal: valorTotal,
                    dataRegistro: new Date()
                });
                console.log("✅ Salvo no Firebase");
            } catch (e) {
                console.error("Erro ao salvar:", e);
            }
        }
        
        // Atualiza o select
        atualizarSelectSenha();
        limparFormulario();
        alert(`✅ Inscrição confirmada!\n📝 Senha ${senha} - ${categoriaNome}\n💰 Total: R$ ${valorTotal},00\n\n📱 WhatsApp aberto!`);
    });
});