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
let unsubscribe = null;

// Elementos
const loginScreen = document.getElementById("loginScreen");
const painelScreen = document.getElementById("painelScreen");
const senhaInput = document.getElementById("senhaAdmin");
const btnEntrar = document.getElementById("btnEntrar");
const btnSair = document.getElementById("btnSair");
const msgErro = document.getElementById("msgErro");
const statusFirebase = document.getElementById("statusFirebase");

const SENHA_CORRETA = "admin123";

// ===== VERIFICA LOGIN =====
if (localStorage.getItem("adminLogado") === "true") {
    liberarPainel();
}

// ===== EVENTO ENTRAR =====
btnEntrar.addEventListener("click", () => {
    if (senhaInput.value === SENHA_CORRETA) {
        localStorage.setItem("adminLogado", "true");
        liberarPainel();
    } else {
        msgErro.style.display = "block";
        setTimeout(() => { msgErro.style.display = "none"; }, 3000);
    }
});

// ===== EVENTO SAIR =====
btnSair.addEventListener("click", () => {
    localStorage.removeItem("adminLogado");
    if (unsubscribe) unsubscribe();
    painelScreen.classList.add("hidden");
    loginScreen.classList.remove("hidden");
    senhaInput.value = "";
    msgErro.style.display = "none";
    statusFirebase.innerHTML = '<i class="fas fa-circle"></i> Conectando...';
    statusFirebase.className = "status";
});

// ===== LIBERA PAINEL =====
function liberarPainel() {
    loginScreen.classList.add("hidden");
    painelScreen.classList.remove("hidden");
    iniciarFirebase();
}

// ===== INICIA FIREBASE =====
function iniciarFirebase() {
    if (db) return;

    try {
        const app = initializeApp(firebaseConfig);
        db = getFirestore(app);
        console.log("🔥 Admin Firebase conectado");

        statusFirebase.innerHTML = '<i class="fas fa-circle"></i> Conectado';
        statusFirebase.className = "status";

        carregarTabela();

        const btnLimpar = document.getElementById("btnLimparTudo");
        if (btnLimpar) {
            btnLimpar.addEventListener("click", limparTodasSenhas);
        }

    } catch (e) {
        console.error("Erro ao conectar Firebase:", e);
        statusFirebase.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Erro';
        statusFirebase.className = "status erro";
    }
}

// ===== FORMATA DATA =====
function formatarData(timestamp) {
    if (!timestamp) return "-";
    try {
        const data = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return data.toLocaleString('pt-BR');
    } catch (e) {
        return "-";
    }
}

// ===== LIMPAR TODAS SENHAS =====
async function limparTodasSenhas() {
    if (!confirm("⚠️ ATENÇÃO! Isso vai apagar TODAS as inscrições!")) return;
    if (prompt("Digite 'SIM' para confirmar") !== "SIM") return;

    try {
        const snapshot = await getDocs(collection(db, "senhas_registradas_2026"));
        let count = 0;

        for (const docSnap of snapshot.docs) {
            await deleteDoc(doc(db, "senhas_registradas_2026", docSnap.id));
            count++;
        }

        alert(`✅ ${count} inscrições removidas!`);
        location.reload();

    } catch (error) {
        console.error("Erro ao limpar:", error);
        alert("❌ Erro ao limpar: " + error.message);
    }
}

// ===== LIBERAR SENHA INDIVIDUAL =====
async function liberarSenha(id) {
    if (!confirm("Liberar esta senha?")) return;

    try {
        await deleteDoc(doc(db, "senhas_registradas_2026", id));
        alert("✅ Senha liberada!");
    } catch (error) {
        alert("❌ Erro: " + error.message);
    }
}

// ===== CARREGA TABELA =====
function carregarTabela() {
    const tbody = document.getElementById("tabelaSenhas");
    const totalSpan = document.getElementById("totalSenhas");

    unsubscribe = onSnapshot(
        collection(db, "senhas_registradas_2026"),
        (snapshot) => {
            tbody.innerHTML = "";
            let count = 0;

            if (snapshot.empty) {
                tbody.innerHTML = `<tr><td colspan="5" class="empty-message">📭 Nenhuma inscrição cadastrada</td></tr>`;
                totalSpan.innerText = "0";
                return;
            }

            // Ordena por data (mais recente primeiro)
            const docs = [];
            snapshot.forEach((doc) => {
                docs.push({ id: doc.id, data: doc.data() });
            });

            docs.sort((a, b) => {
                const dateA = a.data.dataRegistro?.toDate?.() || new Date(0);
                const dateB = b.data.dataRegistro?.toDate?.() || new Date(0);
                return dateB - dateA;
            });

            docs.forEach(({ id, data: d }) => {
                count++;

                // Define a classe do badge
                const categoria = d.categoria || '';
                let badgeClass = '';
                if (categoria.toLowerCase().includes('aspirante')) badgeClass = 'aspirante';
                else if (categoria.toLowerCase().includes('aberta')) badgeClass = 'aberta';
                else if (categoria.toLowerCase().includes('feminino')) badgeClass = 'feminino';

                const tr = document.createElement("tr");
                tr.innerHTML = `
                    <td>${formatarData(d.dataRegistro)}</td>
                    <td>
                        <strong>${d.vaqueiro || '-'}</strong>
                        <br><small>Esteira: ${d.esteira || '-'}</small>
                    </td>
                    <td><span class="badge-categoria ${badgeClass}">${categoria || '-'}</span></td>
                    <td><strong>${d.senha || '-'}</strong></td>
                    <td>
                        <button class="btn-delete" data-id="${id}">
                            <i class="fas fa-unlock-alt"></i> Liberar
                        </button>
                    </td>
                `;

                tbody.appendChild(tr);
            });

            totalSpan.innerText = count;

            // Adiciona eventos aos botões
            document.querySelectorAll(".btn-delete").forEach((btn) => {
                btn.addEventListener("click", () => {
                    liberarSenha(btn.getAttribute("data-id"));
                });
            });
        },
        (error) => {
            console.error("Erro no snapshot:", error);
            tbody.innerHTML = `<tr><td colspan="5" class="empty-message" style="color:#ef4444;">❌ Erro ao carregar dados</td></tr>`;
        }
    );
}

// ===== PERMITE ENTER NO LOGIN =====
senhaInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
        btnEntrar.click();
    }
});

console.log("🚀 Admin panel loaded successfully!");