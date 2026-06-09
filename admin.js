import { initializeApp } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-app.js";
import { getFirestore, collection, onSnapshot, deleteDoc, doc, getDocs } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyAXQ3FhwX8KL-IQbj9j_5uQRK4qihgHvi0",
  authDomain: "aquejada-parque-martins.firebaseapp.com",
  projectId: "aquejada-parque-martins",
  storageBucket: "aquejada-parque-martins.firebasestorage.app",
  messagingSenderId: "806582025593",
  appId: "1:806582025593:web:d8764e8f399a74426c03a8"
};

let db = null;

// Elementos
const loginScreen = document.getElementById("loginScreen");
const painelScreen = document.getElementById("painelScreen");
const senhaAdminInput = document.getElementById("senhaAdmin");
const btnEntrar = document.getElementById("btnEntrar");
const btnSair = document.getElementById("btnSair");
const msgErro = document.getElementById("msgErro");

const SENHA_CORRETA = "admin123";

// Verificar login
if (localStorage.getItem("adminLogado") === "true") {
    liberarPainel();
}

btnEntrar.addEventListener("click", () => {
    if (senhaAdminInput.value === SENHA_CORRETA) {
        localStorage.setItem("adminLogado", "true");
        liberarPainel();
    } else {
        msgErro.style.display = "block";
    }
});

btnSair.addEventListener("click", () => {
    localStorage.removeItem("adminLogado");
    painelScreen.classList.add("hidden");
    loginScreen.classList.remove("hidden");
    senhaAdminInput.value = "";
    msgErro.style.display = "none";
});

function liberarPainel() {
    loginScreen.classList.add("hidden");
    painelScreen.classList.remove("hidden");
    iniciarFirebase();
}

function iniciarFirebase() {
    if (db) return;
    
    try {
        const app = initializeApp(firebaseConfig);
        db = getFirestore(app);
        console.log("🔥 Admin conectado");
        carregarTabela();
        
        const btnLimparTudo = document.getElementById("btnLimparTudo");
        if (btnLimparTudo) {
            btnLimparTudo.addEventListener("click", limparTodasSenhas);
        }
    } catch (e) {
        console.error("Erro:", e);
    }
}

function formatarData(timestamp) {
    if (!timestamp) return "-";
    const data = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return data.toLocaleString('pt-BR');
}

async function limparTodasSenhas() {
    if (!confirm("⚠️ ATENÇÃO! Isso vai apagar TODAS as inscrições.\n\nAs senhas voltarão a ficar disponíveis.\n\nTem certeza?")) {
        return;
    }
    
    const confirmacao = prompt("Digite 'SIM' para confirmar a exclusão de TODOS os registros:");
    if (confirmacao !== "SIM") {
        alert("❌ Operação cancelada.");
        return;
    }
    
    try {
        const querySnapshot = await getDocs(collection(db, "senhas_registradas"));
        let deletados = 0;
        
        for (const docSnapshot of querySnapshot.docs) {
            await deleteDoc(doc(db, "senhas_registradas", docSnapshot.id));
            deletados++;
        }
        
        localStorage.removeItem("senhas_ocupadas_vaquejada");
        localStorage.removeItem("senhas_ocupadas");
        
        alert(`✅ ${deletados} inscrições removidas!\n\nTodas as senhas estão disponíveis novamente.`);
        location.reload();
        
    } catch (error) {
        console.error("Erro:", error);
        alert("❌ Erro: " + error.message);
    }
}

async function liberarSenha(docId) {
    try {
        await deleteDoc(doc(db, "senhas_registradas", docId));
        alert("✅ Senha liberada com sucesso!");
    } catch (error) {
        alert("Erro: " + error.message);
    }
}

function carregarTabela() {
    const tabelaBody = document.getElementById("tabelaSenhas");
    const labelTotal = document.getElementById("totalSenhas");
    
    const senhasRef = collection(db, "senhas_registradas");
    
    onSnapshot(senhasRef, (snapshot) => {
        tabelaBody.innerHTML = "";
        let count = 0;
        
        if (snapshot.empty) {
            tabelaBody.innerHTML = `<tr><td colspan="5" style="text-align: center;">✅ Nenhuma inscrição cadastrada. Banco de dados limpo!</td></tr>`;
            labelTotal.innerText = "0";
            return;
        }
        
        snapshot.forEach((docSnapshot) => {
            const dados = docSnapshot.data();
            const idDoc = docSnapshot.id;
            count++;
            
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td>${formatarData(dados.dataRegistro)}</td>
                <td><strong>${dados.vaqueiro || '-'}</strong><br><small>Esteira: ${dados.esteira || '-'}</small></td>
                <td><span style="background:#fbbf24; color:#000; padding:2px 8px; border-radius:12px;">${dados.categoria || '-'}</span></td>
                <td><strong>${dados.senha || '-'}</strong></td>
                <td>
                    <button class="btn-delete" data-id="${idDoc}">
                        <i class="fas fa-unlock-alt"></i> Liberar
                    </button>
                </td>
            `;
            tabelaBody.appendChild(tr);
        });
        
        labelTotal.innerText = count;
        
        document.querySelectorAll(".btn-delete").forEach(button => {
            button.addEventListener("click", async function() {
                const docId = this.getAttribute("data-id");
                if (confirm("Liberar esta senha? Ela voltará a ficar disponível.")) {
                    await liberarSenha(docId);
                }
            });
        });
    });
}