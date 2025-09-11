// Importa módulos do Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, collection, getDocs, query, where } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// ======================
// CONFIGS DOS PROJETOS (AJUSTADO)
// ======================
const projetos = [
    {
        id: "app1",
        container: "container-horas-app1",
        titulo: "HORAS ELÉTRICA",
        funcionarios: ["Rafael", "Fernando", "Marcos", "Alisson", "Eduardo", "Matheus", "Gregory", "Vinicius", "Simei", "Jonathan", "Cleiton", "Phelipe"],
        jornadaDiariaEmMinutos: 7 * 60 + 20, // 7h20min
        config: {
            apiKey: "AIzaSyDdbz1Uuy1vniu3yQUK2JKk7qlYi1qc-_A",
            authDomain: "controle-de-servicos-420f4.firebaseapp.com",
            projectId: "controle-de-servicos-420f4",
            storageBucket: "controle-de-servicos-420f4.firebasestorage.app",
            messagingSenderId: "1096927390065",
            appId: "1:1096927390065:web:6b464e8c69ff3d5166eed0",
            measurementId: "G-VNKBGDEZYE"
        }
    },
    {
        id: "app2",
        container: "container-horas-app2",
        titulo: "HORAS MECÂNICA",
        funcionarios: ["Valdinei", "Wanner", "Sandro", "Victor", "Ericky", "André Bacceto", "Guilherme", "Abib", "Diogo", "Luiz Felipe", "Fabiano", "Leigmar", "Vitor Reis", "Gabriel", "Allison"],
        jornadaDiariaEmMinutos: 7 * 60 + 20, // 7h20min
        config: {
            apiKey: "AIzaSyAN_UVg8c9Cdcvok9-WHXJiZYnOdcmpMjI",
            authDomain: "repositoriomacanica.firebaseapp.com",
            projectId: "repositoriomacanica",
            storageBucket: "repositoriomacanica.firebasestorage.app",
            messagingSenderId: "10549769581",
            appId: "1:10549769581:web:80cbf33ee9d3af31ac9664",
            measurementId: "G-JLTGTXC8MD"
        }
    },
    {
        id: "app3",
        container: "container-horas-app3",
        titulo: "HORAS CIVIL",
        funcionarios: ["Jessé", "Nilson", "Donizete"],
        jornadaDiariaEmMinutos: 8 * 60 + 48, // 8h48min
        config: {
            apiKey: "AIzaSyAoesrrpyqlawtApVMd8IzUoJ3Ac12Wxng",
            authDomain: "atacivil-8927c.firebaseapp.com",
            projectId: "atacivil-8927c",
            storageBucket: "atacivil-8927c.firebasestorage.app",
            messagingSenderId: "828906936427",
            appId: "1:828906936427:web:115a64687217eca983b92e",
            measurementId: "G-HLL7HSBLRS"
        }
    },
    {
        id: "app4",
        container: "container-horas-app4",
        titulo: "HORAS MONTAGEM",
        funcionarios: ["Bruno", "Flavinei", "Rafael", "Ramon", "Otavio", "Gerson"],
        jornadaDiariaEmMinutos: 8 * 60 + 48, // 8h48min
        config: {
            apiKey: "AIzaSyByjUULyrcBrvd-55ATL_kJGp53S8CUrB8",
            authDomain: "repositoriomontagem.firebaseapp.com",
            projectId: "repositoriomontagem",
            storageBucket: "repositoriomontagem.firebasestorage.app",
            messagingSenderId: "253875422029",
            appId: "1:253875422029:web:4c855fcd3ec2d2b5216d04",
            measurementId: "G-6XJZJBVXRB"
        }
    }
];

// Inicializa os apps dinamicamente
const firebaseApps = projetos.map(p => initializeApp(p.config, p.id));
const auths = firebaseApps.map(app => getAuth(app));
const dbs = firebaseApps.map(app => getFirestore(app));

// ======================
// FUNÇÕES DE APOIO
// ======================
function calcularDiferencaEmMinutos(horaInicio, horaTermino) {
    const [hInicio, mInicio] = horaInicio.split(':').map(Number);
    const [hTermino, mTermino] = horaTermino.split(':').map(Number);

    const totalMinutosInicio = hInicio * 60 + mInicio;
    let totalMinutosTermino = hTermino * 60 + mTermino;

    if (totalMinutosTermino < totalMinutosInicio) {
        totalMinutosTermino += 1440;
    }

    return totalMinutosTermino - totalMinutosInicio;
}

function formatarMinutosParaHoras(min) {
    const h = Math.floor(min / 60);
    const m = min % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

// ======================
// FUNÇÃO PARA MOSTRAR TABELA (AJUSTADO)
// ======================
async function exibirHorasPorFuncionario(db, containerId, mesSelecionado, titulo, funcionariosProjeto, jornadaDiariaEmMinutos) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const [ano, mes] = mesSelecionado.split('-').map(Number);
    const dataInicioMes = new Date(ano, mes - 1, 1);
    const dataFimMes = new Date(ano, mes, 1);

    const servicosRef = collection(db, "servicos");
    const q = query(
        servicosRef,
        where("dataRegistro", ">=", dataInicioMes),
        where("dataRegistro", "<", dataFimMes)
    );

    const querySnapshot = await getDocs(q);

    const horasTrabalhadasPorFuncionario = {};
    const diasTrabalhadosPorFuncionario = {};

    funcionariosProjeto.forEach(f => {
        horasTrabalhadasPorFuncionario[f] = 0;
        diasTrabalhadosPorFuncionario[f] = new Set();
    });

    querySnapshot.forEach(doc => {
        const dados = doc.data();
        const { nomeFuncionario, horaInicio, horaTermino, dataRegistro } = dados;

        if (funcionariosProjeto.includes(nomeFuncionario)) {
            const minutos = calcularDiferencaEmMinutos(horaInicio, horaTermino);
            horasTrabalhadasPorFuncionario[nomeFuncionario] += minutos;
            const dataString = dataRegistro.toDate().toISOString().split("T")[0];
            diasTrabalhadosPorFuncionario[nomeFuncionario].add(dataString);
        }
    });

    let tabelaHTML = `
        <h2 style="text-align:center;">${titulo}</h2>
        <table>
            <thead>
                <tr>
                    <th>Funcionário</th>
                    <th>Horas Disponíveis</th>
                    <th>Horas Trabalhadas</th>
                    <th>Aproveitamento</th>
                    <th>Dias Trabalhados</th>
                </tr>
            </thead>
            <tbody>
    `;

    let totalDisp = 0, totalTrab = 0;

    funcionariosProjeto.forEach(f => {
        const dias = diasTrabalhadosPorFuncionario[f].size;
        const disp = dias * jornadaDiariaEmMinutos; // Usa a jornada correta
        const trab = horasTrabalhadasPorFuncionario[f];

        const aproveitamento = disp > 0 ? (trab / disp) * 100 : 0;
        const classe = aproveitamento > 100 ? "red-text" : (aproveitamento < 50 ? "yellow-text" : "");

        totalDisp += disp;
        totalTrab += trab;

        tabelaHTML += `
            <tr>
                <td>${f}</td>
                <td>${formatarMinutosParaHoras(disp)}</td>
                <td>${formatarMinutosParaHoras(trab)}</td>
                <td class="${classe}">${aproveitamento.toFixed(2)}%</td>
                <td>${dias}</td>
            </tr>
        `;
    });

    const aproveitamentoTotal = totalDisp > 0 ? (totalTrab / totalDisp) * 100 : 0;

    tabelaHTML += `
        <tr style="font-weight:bold; background:#f9f9f9;">
            <td>Total da Equipe</td>
            <td>${formatarMinutosParaHoras(totalDisp)}</td>
            <td>${formatarMinutosParaHoras(totalTrab)}</td>
            <td>${aproveitamentoTotal.toFixed(2)}%</td>
            <td></td>
        </tr>
    </tbody></table>`;

    container.innerHTML = tabelaHTML;
}

// ======================
// LOGIN EM TODOS PROJETOS (AJUSTADO)
// ======================
async function loginEmTodos(email, senha) {
    try {
        await Promise.all(auths.map(auth => signInWithEmailAndPassword(auth, email, senha)));

        console.log("Login ok em todos os projetos!");
        const mesSelecionado = document.getElementById("mesFiltro").value || new Date().toISOString().slice(0, 7);

        projetos.forEach((p, index) => {
            exibirHorasPorFuncionario(dbs[index], p.container, mesSelecionado, p.titulo, p.funcionarios, p.jornadaDiariaEmMinutos);
        });

    } catch (error) {
        alert("Erro no login: " + error.message);
    }
}

// ======================
// EVENTO DO BOTÃO LOGIN
// ======================
document.getElementById("btnLogin").addEventListener("click", () => {
    const email = document.getElementById("email").value;
    const senha = document.getElementById("senha").value;
    loginEmTodos(email, senha);
});