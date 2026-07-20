import { initializeApp } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-app.js";
import { getFirestore, collection, onSnapshot, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";

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

const loginScreen = document.getElementById("loginScreen");
const painelScreen = document.getElementById("painelScreen");
const senhaAdminInput = document.getElementById("senhaAdmin");
const btnEntrar = document.getElementById("btnEntrar");
const btnSair = document.getElementById("btnSair");
const msgErro = document.getElementById("msgErro");

const SENHA_CORRETA = "admin123";

if (localStorage.getItem("adminLogado") === "true") {
    liberarPainel();
}

btnEntrar.addEventListener("click", () => {
    const senhaDigitada = senhaAdminInput.value;
    if (senhaDigitada === SENHA_CORRETA) {
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
        if (firebaseConfig.apiKey) {
            const app = initializeApp(firebaseConfig);
            db = getFirestore(app);
            console.log("🔥 Admin Firebase conectado");
            carregarTabela();
        } else {
            console.warn("⚠️ Firebase não configurado.");
            document.getElementById("tabelaSenhas").innerHTML = `<tr><td colspan="5" style="text-align: center; color:#ef4444;">Firebase não configurado.</td></tr>`;
        }
    } catch (e) {
        console.error("Erro ao conectar", e);
    }
}

function formatarData(timestamp) {
    if (!timestamp) return "-";
    const data = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return data.toLocaleString('pt-BR');
}

function carregarTabela() {
    const tabelaBody = document.getElementById("tabelaSenhas");
    const labelTotal = document.getElementById("totalSenhas");

    const senhasRef = collection(db, "senhas_registradas");

    onSnapshot(senhasRef, (snapshot) => {
        tabelaBody.innerHTML = "";
        let count = 0;

        if (snapshot.empty) {
            tabelaBody.innerHTML = `<tr><td colspan="5" style="text-align: center; padding: 20px;">Nenhuma senha registrada ainda.</td></tr>`;
            labelTotal.innerText = "0";
            return;
        }

        snapshot.forEach((docSnapshot) => {
            const dados = docSnapshot.data();
            const idDoc = docSnapshot.id;
            count++;

            const tr = document.createElement("tr");

            const categoriaLower = dados.categoria ? dados.categoria.toLowerCase() : '';
            let badgeClass = 'aspirante';
            if (categoriaLower === 'aberta') badgeClass = 'aberta';
            else if (categoriaLower === 'feminino/jovem') badgeClass = 'feminino';

            tr.innerHTML = `
                <td>${formatarData(dados.dataRegistro)}</td>
                <td><strong>${dados.vaqueiro}</strong><br><small style="color:rgba(255,255,255,0.6)">Est: ${dados.esteira}</small></td>
                <td><span class="badge-categoria ${badgeClass}" style="margin:0; padding:4px 10px; font-size:0.8rem; border-radius:12px; display:inline-block;">${dados.categoria}</span></td>
                <td><strong>${dados.senha}</strong></td>
                <td>
                    <button class="btn-delete" data-id="${idDoc}" title="Excluir do banco (Libera a senha)">
                        <i class="fas fa-trash-alt"></i> Excluir
                    </button>
                </td>
            `;

            tabelaBody.appendChild(tr);
        });

        labelTotal.innerText = count.toString();

        document.querySelectorAll(".btn-delete").forEach(button => {
            button.addEventListener("click", async function () {
                const docId = this.getAttribute("data-id");

                if (confirm("ATENÇÃO: Deseja realmente excluir essa inscrição? O número de senha dessa pessoa ficará disponível novamente.")) {
                    try {
                        await deleteDoc(doc(db, "senhas_registradas", docId));
                    } catch (error) {
                        alert("Erro ao tentar excluir " + error.message);
                    }
                }
            });
        });
    });
}