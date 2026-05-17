import { initializeApp } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";

// CONFIGURAÇÃO DO FIREBASE
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
    console.warn("Firebase não conectado:", e);
}

// CONFIGURAÇÃO DAS CATEGORIAS
const CATEGORIAS_CONFIG = {
    Aberto: { inicio: 1, fim: 300, selectId: "senhaAberto", nome: "ABERTO" },
    FemininoJovem: { inicio: 500, fim: 550, selectId: "senhaFemininoJovem", nome: "FEMININO & JOVEM" }
};

const STORAGE_KEY = "senhas_ocupadas_vaquejada";
let senhasOcupadas = new Set();

// CARREGAR SENHAS OCUPADAS DO FIREBASE
async function carregarSenhasOcupadas() {
    senhasOcupadas.clear();
    
    if (db) {
        try {
            const querySnapshot = await getDocs(collection(db, "senhas_registradas"));
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                if (data.categoria && data.senha) {
                    let categoriaKey = "";
                    if (data.categoria.includes("ABERTO")) categoriaKey = "Aberto";
                    if (data.categoria.includes("FEMININO")) categoriaKey = "FemininoJovem";
                    
                    if (categoriaKey) {
                        const chave = `${categoriaKey}|${data.senha}`;
                        senhasOcupadas.add(chave);
                    }
                }
            });
            console.log(`🔥 ${senhasOcupadas.size} senhas ocupadas carregadas`);
        } catch (e) {
            console.error("Erro ao carregar:", e);
        }
    }
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...senhasOcupadas]));
}

function isSenhaOcupada(categoria, senha) {
    return senhasOcupadas.has(`${categoria}|${senha}`);
}

function marcarSenhaComoOcupada(categoria, senha) {
    const chave = `${categoria}|${senha}`;
    if (!senhasOcupadas.has(chave)) {
        senhasOcupadas.add(chave);
        localStorage.setItem(STORAGE_KEY, JSON.stringify([...senhasOcupadas]));
        console.log(`🔒 Senha bloqueada: ${chave}`);
        return true;
    }
    return false;
}

function atualizarSelect(categoria) {
    const config = CATEGORIAS_CONFIG[categoria];
    if (!config) return;
    
    const select = document.getElementById(config.selectId);
    if (!select) return;
    
    const disponiveis = [];
    for (let i = config.inicio; i <= config.fim; i++) {
        const numero = i.toString().padStart(3, '0');
        if (!isSenhaOcupada(categoria, numero)) {
            disponiveis.push(numero);
        }
    }
    
    select.innerHTML = '<option value="">Selecione o número da senha</option>';
    
    if (disponiveis.length === 0) {
        const option = document.createElement("option");
        option.value = "";
        option.textContent = "❌ SEM SENHAS DISPONÍVEIS";
        option.disabled = true;
        select.appendChild(option);
        select.disabled = true;
    } else {
        select.disabled = false;
        disponiveis.forEach(numero => {
            const option = document.createElement("option");
            option.value = numero;
            option.textContent = numero;
            select.appendChild(option);
        });
    }
    
    atualizarContador();
}

function atualizarTodosSelects() {
    atualizarSelect("Aberto");
    atualizarSelect("FemininoJovem");
}

function atualizarContador() {
    let dispAberto = 0, dispFem = 0;
    
    for (let i = 1; i <= 300; i++) {
        const num = i.toString().padStart(3, '0');
        if (!isSenhaOcupada("Aberto", num)) dispAberto++;
    }
    
    for (let i = 500; i <= 550; i++) {
        const num = i.toString().padStart(3, '0');
        if (!isSenhaOcupada("FemininoJovem", num)) dispFem++;
    }
    
    const spanAberto = document.getElementById("dispAberto");
    const spanFem = document.getElementById("dispFeminino");
    
    if (spanAberto) spanAberto.textContent = dispAberto;
    if (spanFem) spanFem.textContent = dispFem;
}

// INICIALIZAÇÃO
document.addEventListener("DOMContentLoaded", async function() {
    console.log("✅ DOM carregado");
    
    await carregarSenhasOcupadas();
    atualizarTodosSelects();
    
    const boxAberto = document.getElementById("boxAberto");
    const boxFemininoJovem = document.getElementById("boxFemininoJovem");
    const categoriaSelect = document.getElementById("categoria");
    const btnEnviar = document.getElementById("enviar");
    
    if (categoriaSelect) {
        categoriaSelect.addEventListener("change", function() {
            const categoria = this.value;
            boxAberto?.classList.add("hidden");
            boxFemininoJovem?.classList.add("hidden");
            
            if (categoria === "Aberto") {
                boxAberto?.classList.remove("hidden");
                atualizarSelect("Aberto");
            }
            if (categoria === "FemininoJovem") {
                boxFemininoJovem?.classList.remove("hidden");
                atualizarSelect("FemininoJovem");
            }
        });
    }
    
    function limparFormulario() {
        document.getElementById("formMatricula")?.reset();
        boxAberto?.classList.add("hidden");
        boxFemininoJovem?.classList.add("hidden");
        if (categoriaSelect) categoriaSelect.value = "";
    }
    
    async function enviarWhatsApp() {
        // Captura e validação (síncrono)
        const nome = document.getElementById("nomeVaqueiro")?.value.trim();
        const esteira = document.getElementById("nomeEsteira")?.value.trim();
        const representacao = document.getElementById("representacao")?.value.trim();
        const categoria = document.getElementById("categoria")?.value;
        const boitv = document.getElementById("boitv")?.value;
        
        if (!nome) return alert("⚠️ Nome do Vaqueiro é obrigatório!");
        if (!esteira) return alert("⚠️ Nome do Esteira é obrigatório!");
        if (!categoria) return alert("⚠️ Selecione uma categoria!");
        if (!boitv) return alert("⚠️ Selecione Boi de TV!");
        
        let senhaEscolhida = "";
        let categoriaNome = "";
        
        if (categoria === "Aberto") {
            senhaEscolhida = document.getElementById("senhaAberto")?.value;
            categoriaNome = "ABERTO";
            if (!senhaEscolhida) return alert("⚠️ Selecione a senha do ABERTO!");
            if (isSenhaOcupada("Aberto", senhaEscolhida)) {
                alert("❌ Esta senha já foi usada!");
                atualizarSelect("Aberto");
                return;
            }
        }
        
        if (categoria === "FemininoJovem") {
            senhaEscolhida = document.getElementById("senhaFemininoJovem")?.value;
            categoriaNome = "FEMININO & JOVEM";
            if (!senhaEscolhida) return alert("⚠️ Selecione a senha do FEMININO & JOVEM!");
            if (isSenhaOcupada("FemininoJovem", senhaEscolhida)) {
                alert("❌ Esta senha já foi usada!");
                atualizarSelect("FemininoJovem");
                return;
            }
        }
        
        // Monta a mensagem
        let mensagem = `🏇 *PARQUE MARTINS - VAQUEJADA* 🏇\n`;
        mensagem += `━━━━━━━━━━━━━━━━━━━━\n`;
        mensagem += `👤 *Vaqueiro:* ${nome}\n`;
        mensagem += `🐎 *Esteira:* ${esteira}\n`;
        if (representacao) mensagem += `🏷️ *Representação:* ${representacao}\n`;
        mensagem += `🏆 *Categoria:* ${categoriaNome}\n`;
        mensagem += `🔢 *Nº da Senha:* ${senhaEscolhida}\n`;
        mensagem += `📺 *Boi de TV:* ${boitv === "Sim" ? "SIM (+R$20)" : "NÃO"}\n`;
        mensagem += `━━━━━━━━━━━━━━━━━━━━\n`;
        mensagem += `✅ Inscrição confirmada!\n🍀 Boa sorte!`;
        
        const telefone = "5583999587010";
        const whatsappUrl = `https://wa.me/${telefone}?text=${encodeURIComponent(mensagem)}`;
        
        // Marca a senha como ocupada e atualiza o select localmente
        marcarSenhaComoOcupada(categoria, senhaEscolhida);
        atualizarSelect(categoria);
        
        // ----- ABRE O WHATSAPP IMEDIATAMENTE (antes de qualquer operação assíncrona) -----
        // Método robusto para iOS e Android: criar um link e simular clique
        const link = document.createElement('a');
        link.href = whatsappUrl;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        // -----------------------------------------------------------------------------
        
        // Salva no Firebase (em segundo plano, sem travar a abertura)
        if (db) {
            try {
                await addDoc(collection(db, "senhas_registradas"), {
                    vaqueiro: nome,
                    esteira: esteira,
                    representacao: representacao || "",
                    categoria: categoriaNome,
                    senha: senhaEscolhida,
                    boitv: boitv,
                    dataRegistro: new Date()
                });
                console.log("✅ Salvo no Firebase");
            } catch (e) {
                console.error("Erro ao salvar no Firebase:", e);
            }
        }
        
        // Limpa o formulário e exibe confirmação
        limparFormulario();
        alert(`✅ Inscrição confirmada!\n📝 Senha ${senhaEscolhida} - ${categoriaNome}\n\n📱 WhatsApp aberto!`);
    }
    
    if (btnEnviar) {
        const novoBtn = btnEnviar.cloneNode(true);
        btnEnviar.parentNode.replaceChild(novoBtn, btnEnviar);
        novoBtn.addEventListener("click", enviarWhatsApp);
        console.log("✅ Botão configurado");
    }
});
