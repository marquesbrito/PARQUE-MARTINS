import { initializeApp } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-app.js";
import { getFirestore, collection, addDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyCeYrKyiLwgAsPKwcLkqINp_Ar2TGhaC2E",
    authDomain: "senhas-929b9.firebaseapp.com",
    projectId: "senhas-929b9",
    storageBucket: "senhas-929b9.firebasestorage.app",
    messagingSenderId: "682593159280",
    appId: "1:682593159280:web:d115d51036fdf3ae684cb5",
    measurementId: "G-9G466KSNBM"
};

let db = null;
let senhasOcupadasGlobais = [];

try {
    if (firebaseConfig.apiKey) {
        const app = initializeApp(firebaseConfig);
        db = getFirestore(app);
        console.log("🔥 Firebase inicializado com sucesso!");

        const senhasRef = collection(db, "senhas_registradas");
        onSnapshot(senhasRef, (snapshot) => {
            senhasOcupadasGlobais = [];
            snapshot.forEach((doc) => {
                senhasOcupadasGlobais.push(doc.data().senha);
            });
            console.log("📊 Senhas ocupadas no Firebase:", senhasOcupadasGlobais);
            atualizarSenhasDisponiveis();
        });
    } else {
        console.warn("⚠️ Firebase não configurado.");
    }
} catch (e) {
    console.error("Erro ao inicializar Firebase", e);
}

window.senhasOcupadasGlobais = senhasOcupadasGlobais;
window.db = db;

// Obtém os elementos dos selects
const selectAspirante = document.getElementById("senhaAspirante");
const selectAberta = document.getElementById("senhaAberta");
const selectFemininoJovem = document.getElementById("senhaFemininoJovem");

// Obtém as boxes das categorias
const boxAspirante = document.getElementById("boxAspirante");
const boxAberta = document.getElementById("boxAberta");
const boxFemininoJovem = document.getElementById("boxFemininoJovem");

// ===== FUNÇÃO PARA GERAR NÚMEROS =====
function gerarNumeros(select, inicio, fim) {
    console.log(`🔄 Gerando números de ${inicio} a ${fim} para`, select.id);
    
    // Limpa o select mantendo apenas a primeira opção (placeholder)
    select.innerHTML = '';
    
    // Adiciona a opção padrão
    const placeholder = document.createElement("option");
    placeholder.value = "";
    placeholder.textContent = "Selecione";
    select.appendChild(placeholder);
    
    let count = 0;
    for (let i = inicio; i <= fim; i++) {
        // Formata com 3 dígitos (001, 002, 003...)
        const numeroFormatado = i.toString().padStart(3, '0');

        // Se a senha estiver ocupada no banco, pula
        if (senhasOcupadasGlobais.includes(numeroFormatado)) {
            console.log(`⛔ Senha ${numeroFormatado} está ocupada, pulando...`);
            continue;
        }

        const option = document.createElement("option");
        option.value = numeroFormatado;
        option.textContent = numeroFormatado;
        select.appendChild(option);
        count++;
    }
    console.log(`✅ ${count} senhas disponíveis para ${select.id}`);
}

// ===== ATUALIZA TODOS OS SELECTS =====
function atualizarSenhasDisponiveis() {
    console.log("🔄 Atualizando todos os selects...");
    
    // Guarda os valores selecionados atuais
    const aspValor = selectAspirante.value;
    const abeValor = selectAberta.value;
    const femValor = selectFemininoJovem.value;

    // ===== ASPIRANTE: 001 a 200 =====
    gerarNumeros(selectAspirante, 1, 200);
    if (aspValor && Array.from(selectAspirante.options).find(o => o.value === aspValor)) {
        selectAspirante.value = aspValor;
    } else if (aspValor) {
        alert("⚠️ A senha Aspirante " + aspValor + " acabou de ser reservada por outra pessoa!");
    }

    // ===== ABERTA: 500 a 700 =====
    gerarNumeros(selectAberta, 500, 700);
    if (abeValor && Array.from(selectAberta.options).find(o => o.value === abeValor)) {
        selectAberta.value = abeValor;
    } else if (abeValor) {
        alert("⚠️ A senha Aberta " + abeValor + " acabou de ser reservada por outra pessoa!");
    }

    // ===== FEMININO/JOVEM: 300 a 400 (CORRIGIDO) =====
    gerarNumeros(selectFemininoJovem, 300, 400);
    if (femValor && Array.from(selectFemininoJovem.options).find(o => o.value === femValor)) {
        selectFemininoJovem.value = femValor;
    } else if (femValor) {
        alert("⚠️ A senha Feminino/Jovem " + femValor + " acabou de ser reservada por outra pessoa!");
    }
    
    // Força a exibição da box correta se já tiver uma categoria selecionada
    const categoriaAtual = document.getElementById("categoria").value;
    if (categoriaAtual) {
        mostrarBoxCategoria(categoriaAtual);
    }
}

// ===== MOSTRA A BOX CORRETA =====
function mostrarBoxCategoria(categoria) {
    boxAspirante.classList.add("hidden");
    boxAberta.classList.add("hidden");
    boxFemininoJovem.classList.add("hidden");

    if (categoria === "Aspirante") {
        boxAspirante.classList.remove("hidden");
        if (selectAspirante.options.length <= 1) {
            gerarNumeros(selectAspirante, 1, 200);
        }
        console.log("📦 Mostrando box Aspirante");
    }
    if (categoria === "Aberta") {
        boxAberta.classList.remove("hidden");
        if (selectAberta.options.length <= 1) {
            gerarNumeros(selectAberta, 500, 700);
        }
        console.log("📦 Mostrando box Aberta");
    }
    if (categoria === "FemininoJovem") {
        boxFemininoJovem.classList.remove("hidden");
        if (selectFemininoJovem.options.length <= 1) {
            gerarNumeros(selectFemininoJovem, 300, 400);
        }
        console.log("📦 Mostrando box Feminino/Jovem");
    }
}

// ===== INICIALIZA OS SELECTS NA PRIMEIRA CARGA =====
setTimeout(() => {
    console.log("🚀 Inicializando selects...");
    atualizarSenhasDisponiveis();
}, 500);

// ===== EVENTO DE MUDANÇA DA CATEGORIA =====
document.getElementById("categoria").addEventListener("change", function () {
    const categoria = this.value;
    console.log("📌 Categoria selecionada:", categoria);
    mostrarBoxCategoria(categoria);
});

// ===== FUNÇÃO PARA REMOVER O NÚMERO ESCOLHIDO =====
function removerNumeroEscolhido(select) {
    const valor = select.value;
    if (!valor) return;

    const option = Array.from(select.options).find(o => o.value === valor);
    if (option) {
        option.remove();
        console.log("🗑️ Senha " + valor + " removida do select " + select.id);
    }
    select.value = "";
}

// ===== CONTROLE DE SENHAS POR VAQUEIRO (LIMITE 4) =====
let senhasUtilizadas = {};

// ===== ENVIO DO FORMULÁRIO =====
document.getElementById("enviar").addEventListener("click", async function () {
    const nome = document.getElementById("nomeVaqueiro").value.trim();
    const esteira = document.getElementById("nomeEsteira").value.trim();
    const representacao = document.getElementById("representacao").value.trim();
    const categoria = document.getElementById("categoria").value;
    const boitv = document.getElementById("boitv").value;

    const senhaAsp = selectAspirante.value;
    const senhaAbe = selectAberta.value;
    const senhaFem = selectFemininoJovem.value;

    console.log("📝 Categoria selecionada:", categoria);
    console.log("🔢 Senha Aspirante:", senhaAsp);
    console.log("🔢 Senha Aberta:", senhaAbe);
    console.log("🔢 Senha Feminino/Jovem:", senhaFem);

    // ===== VALIDAÇÕES =====
    if (!nome || !esteira || !categoria || !boitv) {
        alert("❌ Preencha todos os campos obrigatórios!");
        return;
    }

    if (categoria === "Aspirante" && !senhaAsp) {
        alert("❌ Selecione o número da senha Aspirante!");
        return;
    }
    if (categoria === "Aberta" && !senhaAbe) {
        alert("❌ Selecione o número da senha Aberta!");
        return;
    }
    if (categoria === "FemininoJovem" && !senhaFem) {
        alert("❌ Selecione o número da senha Feminino/Jovem!");
        return;
    }

    // Verifica se a senha ainda está disponível
    if (senhasOcupadasGlobais.includes(senhaAsp) && categoria === "Aspirante") {
        alert("⚠️ A senha " + senhaAsp + " acabou de ser reservada por outra pessoa!");
        atualizarSenhasDisponiveis();
        return;
    }
    if (senhasOcupadasGlobais.includes(senhaAbe) && categoria === "Aberta") {
        alert("⚠️ A senha " + senhaAbe + " acabou de ser reservada por outra pessoa!");
        atualizarSenhasDisponiveis();
        return;
    }
    if (senhasOcupadasGlobais.includes(senhaFem) && categoria === "FemininoJovem") {
        alert("⚠️ A senha " + senhaFem + " acabou de ser reservada por outra pessoa!");
        atualizarSenhasDisponiveis();
        return;
    }

    // Verifica limite de 4 senhas por vaqueiro
    const chaveVaqueiro = nome.toLowerCase();
    if (!senhasUtilizadas[chaveVaqueiro]) {
        senhasUtilizadas[chaveVaqueiro] = 0;
    }

    if (senhasUtilizadas[chaveVaqueiro] >= 4) {
        alert("⚠️ Limite de 4 senhas por vaqueiro atingido!");
        return;
    }

    senhasUtilizadas[chaveVaqueiro]++;

    // ===== CONSTRÓI MENSAGEM DO WHATSAPP =====
    let mensagem = `🏇 *PARQUE HARAS BATISTA* 🏇%0A`;
    mensagem += `🏆 *1° BOLÃO DE VAQUEJADA*%0A`;
    mensagem += `📅 07 a 09 de AGOSTO%0A`;
    mensagem += `📍 Sítio Tapagem - Monteiro-PB%0A`;
    mensagem += `💰 MAIS DE 6 MIL EM PRÊMIOS%0A%0A`;
    mensagem += `👤 *Vaqueiro:* ${nome}%0A`;
    mensagem += `🐎 *Esteira:* ${esteira}%0A`;

    if (representacao) mensagem += `🏷 *Representação:* ${representacao}%0A`;

    // Categoria
    if (categoria === "Aspirante") {
        mensagem += `⭐ *Categoria:* ASPIRANTE (Casadinha)%0A`;
        mensagem += `🏍️ Moto ou R$ 3.000,00%0A`;
        mensagem += `🔢 *Senha:* ${senhaAsp}%0A`;
    }

    if (categoria === "Aberta") {
        mensagem += `🏆 *Categoria:* ABERTA (Solteira)%0A`;
        mensagem += `💰 R$ 3.000,00%0A`;
        mensagem += `🔢 *Senha:* ${senhaAbe}%0A`;
    }

    if (categoria === "FemininoJovem") {
        mensagem += `👧 *Categoria:* FEMININO / JOVEM%0A`;
        mensagem += `💰 40% da Premiação%0A`;
        mensagem += `🔢 *Senha:* ${senhaFem}%0A`;
    }

    // Boi TV
    if (boitv === 'Antecipado') {
        mensagem += `📺 *Boi TV:* Antecipado (R$ 20,00)%0A`;
    } else if (boitv === 'NaHora') {
        mensagem += `📺 *Boi TV:* Na Hora (R$ 50,00)%0A`;
    } else {
        mensagem += `📺 *Boi TV:* Não%0A`;
    }

    mensagem += `%0A`;
    mensagem += `🎯 *SENHA ANTECIPADA + SEXTA-FEIRA*%0A`;
    mensagem += `🔹 CORRE UM BOI A MENOS!%0A`;
    mensagem += `🔹 *Rabo da gata:* +1 boi%0A`;
    mensagem += `🔹 *Restam:* ${4 - senhasUtilizadas[chaveVaqueiro]} de 4 senhas%0A`;
    mensagem += `_Inscrição online_`;

    const telefone = "5583999587010";
    const btnEnvia = document.getElementById("enviar");
    const btnTextoOriginal = btnEnvia.innerHTML;

    // ===== SALVA NO FIRESTORE =====
    if (db) {
        try {
            btnEnvia.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Registrando...';
            btnEnvia.disabled = true;

            let senhaRegistrar = '';
            let categoriaRegistrar = '';

            if (categoria === "Aspirante" && senhaAsp) {
                senhaRegistrar = senhaAsp;
                categoriaRegistrar = "Aspirante";
            }
            if (categoria === "Aberta" && senhaAbe) {
                senhaRegistrar = senhaAbe;
                categoriaRegistrar = "Aberta";
            }
            if (categoria === "FemininoJovem" && senhaFem) {
                senhaRegistrar = senhaFem;
                categoriaRegistrar = "Feminino/Jovem";
            }

            await addDoc(collection(db, "senhas_registradas"), {
                vaqueiro: nome,
                esteira: esteira,
                categoria: categoriaRegistrar,
                senha: senhaRegistrar,
                dataRegistro: new Date()
            });
            console.log("✅ Senha " + senhaRegistrar + " registrada no Firebase");

            senhasOcupadasGlobais.push(senhaRegistrar);

        } catch (e) {
            console.error("Erro ao salvar no Firestore", e);
            alert("❌ Erro ao registrar no banco de dados. Verifique a conexão.");
            btnEnvia.innerHTML = btnTextoOriginal;
            btnEnvia.disabled = false;
            return;
        }
    }

    btnEnvia.innerHTML = btnTextoOriginal;
    btnEnvia.disabled = false;

    // ===== REMOVE AS SENHAS ESCOLHIDAS DOS SELECTS =====
    if (categoria === "Aspirante") {
        removerNumeroEscolhido(selectAspirante);
    }
    if (categoria === "Aberta") {
        removerNumeroEscolhido(selectAberta);
    }
    if (categoria === "FemininoJovem") {
        removerNumeroEscolhido(selectFemininoJovem);
    }

    alert(`✅ Inscrição enviada! Você usou ${senhasUtilizadas[chaveVaqueiro]} de 4 senhas.`);
    window.open(`https://wa.me/${telefone}?text=${mensagem}`, "_blank");
});