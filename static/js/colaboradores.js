document.addEventListener("DOMContentLoaded", () => {

// ================= NAVEGAÇÃO SIDEBAR =================

function setActiveView(viewId) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active-view'))
    document.querySelectorAll('.navItem').forEach(b => b.classList.remove('active'))
    document.getElementById(viewId).classList.add('active-view')
}

document.getElementById("btnContas").onclick = () => {
    setActiveView("contasView")
    document.getElementById("btnContas").classList.add("active")
}

document.getElementById("btnColaboradores").onclick = () => {
    setActiveView("colaboradoresView")
    document.getElementById("btnColaboradores").classList.add("active")
    carregarColaboradores()
}

document.getElementById("btnHistorico").onclick = () => {
    setActiveView("historicoView")
    document.getElementById("btnHistorico").classList.add("active")
    carregarHistorico()
}

setActiveView("contasView")
document.getElementById("btnContas").classList.add("active")

// ================= CRIAR COLABORADOR =================

const colaboradorForm = document.getElementById("colaboradorForm")
if (colaboradorForm) {
    colaboradorForm.addEventListener("submit", async (e) => {
        e.preventDefault()
        const nome   = document.getElementById("nomeColaborador").value
        const cpf    = document.getElementById("cpf").value
        const numero = document.getElementById("numeroColaborador").value
        const cargo  = document.getElementById("cargoColaborador").value
        const pix    = (document.getElementById("pixColaborador")?.value || "").trim()
        if (!nome || !cpf || !numero || !cargo) return
        await fetch("/api/colaboradores", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ nome, cpf, numero, cargo, pix })
        })
        e.target.reset()
        carregarColaboradores()
    })
}

// ================= MÁSCARAS =================

const cpfInput = document.getElementById("cpf")
if (cpfInput) {
    cpfInput.addEventListener("input", function () {
        let v = this.value.replace(/\D/g, "").slice(0, 11)
        if (v.length > 9)      v = v.replace(/(\d{3})(\d{3})(\d{3})(\d{1,2})/, "$1.$2.$3-$4")
        else if (v.length > 6) v = v.replace(/(\d{3})(\d{3})(\d+)/, "$1.$2.$3")
        else if (v.length > 3) v = v.replace(/(\d{3})(\d+)/, "$1.$2")
        this.value = v
    })
}

const numeroInput = document.getElementById("numeroColaborador")
if (numeroInput) {
    numeroInput.addEventListener("input", function () {
        let v = this.value.replace(/\D/g, "").slice(0, 11)
        if (v.length > 6)      v = v.replace(/(\d{2})(\d{5})(\d{0,4})/, "($1) $2-$3")
        else if (v.length > 2) v = v.replace(/(\d{2})(\d+)/, "($1) $2")
        else                   v = v.replace(/(\d*)/, "($1")
        this.value = v
    })
}

document.getElementById("tipoFicha").addEventListener("change", (e) => {
    if (_modalColabId !== null) renderFichaModal(e.target.value)
})

}) // fim DOMContentLoaded


// ======================================================
// ESTADO DO MODAL
// ======================================================

let _modalColab      = null
let _modalColabId    = null
let _fichaEditandoId = null


// ======================================================
// CAMPOS DAS FICHAS
// ======================================================

const CAMPOS_NORMAL = [
    { key: "mes_ref",           label: "Mês de Referência",  desc: "Competência",              desconta: false, soValor: false, soCaixa: false },
    { key: "caixa",             label: "Caixa",              desc: "Caixa gerado no mês",      desconta: false, soValor: true,  soCaixa: true  },
    { key: "valores_recebidos", label: "Salário",  desc: "Entradas do período",      desconta: false, soValor: true,  soCaixa: false },
    { key: "adiantamento",      label: "Adiantamento",       desc: "Descontado do total",      desconta: true,  soValor: true,  soCaixa: false },
    { key: "clt",               label: "CLT",                desc: "Salário base CLT",         desconta: false, soValor: true,  soCaixa: false },
    { key: "gratificacao",      label: "Gratificação",       desc: "Bônus / gratificação",     desconta: false, soValor: true,  soCaixa: false },
]

const CAMPOS_META = [
    { key: "fez_mes_passado",   label: "Fez mês passado",    desc: "Resultado anterior",       desconta: false, soValor: true,  soCaixa: true  },
    { key: "caixa_mes",         label: "Caixa deste mês",    desc: "Caixa gerado no mês",      desconta: false, soValor: true,  soCaixa: true  },
    { key: "clt",               label: "CLT",                desc: "Salário base CLT",         desconta: false, soValor: true,  soCaixa: false },
    { key: "gratificacao",      label: "Gratificação",       desc: "Bônus / gratificação",     desconta: false, soValor: true,  soCaixa: false },
    { key: "metas_recebidas",   label: "Metas recebidas",    desc: "Metas atingidas",          desconta: false, soValor: true,  soCaixa: false },
    { key: "total_metas",       label: "Total metas",        desc: "Soma das metas",           desconta: false, soValor: true,  soCaixa: false },
    { key: "adiantamento",      label: "Adiantamento",       desc: "Descontado do total",      desconta: true,  soValor: true,  soCaixa: false },
]

function getCampos(tipo) {
    return tipo === "meta" ? CAMPOS_META : CAMPOS_NORMAL
}


// ======================================================
// HELPERS
// ======================================================

function parseMoeda(str) {
    if (!str) return 0
    const n = parseFloat(String(str).replace(/[R$\s.]/g, '').replace(',', '.'))
    return isNaN(n) ? 0 : n
}

function fmtMoeda(v) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)
}

function popup(msg) {
    if (typeof mostrarPopup === "function") mostrarPopup(msg)
    else alert(msg)
}

function preencherHeaderModal(colaborador) {
    const elNome  = document.getElementById("fichaHeaderNome")
    const elCargo = document.getElementById("fichaHeaderCargo")
    if (elNome)  elNome.textContent  = colaborador.nome  || ""
    if (elCargo) elCargo.textContent = colaborador.cargo?.toUpperCase() || ""
}

function copiarPix(pix) {
    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(pix)
    } else {
        copiarPixFallback(pix)
    }
}

function copiarPixFallback(pix) {
    const el = document.createElement("textarea")
    el.value = pix
    document.body.appendChild(el)
    el.select()
    document.execCommand("copy")
    document.body.removeChild(el)
}


// ======================================================
// MODAL: ABRIR / FECHAR
// ======================================================

function abrirModalFicha(colaborador) {
    document.body.style.overflow = "hidden"
    _modalColab      = colaborador
    _modalColabId    = colaborador.id
    _fichaEditandoId = null

    preencherHeaderModal(colaborador)

    const elMes = document.getElementById("mesFicha")
    elMes.value    = ""
    elMes.disabled = !IS_ADMIN

    const elTipo = document.getElementById("tipoFicha")
    elTipo.innerHTML = ""
    elTipo.appendChild(new Option("Ficha Normal", "normal"))
    if (colaborador.cargo?.toLowerCase().trim() === "consultor") {
        elTipo.appendChild(new Option("Ficha de Meta", "meta"))
    }
    elTipo.disabled = !IS_ADMIN

    renderFichaModal("normal")
    document.getElementById("modalFicha").classList.remove("hidden")
}

function fecharModalFicha() {
    document.body.style.overflow = "auto"
    document.getElementById("modalFicha").classList.add("hidden")
    _modalColab      = null
    _modalColabId    = null
    _fichaEditandoId = null
}


// ======================================================
// RENDER DA FICHA COMPLETA
// ======================================================

function renderFichaModal(tipo, dadosIniciais = null) {
    const campos = getCampos(tipo)
    const corpo  = document.getElementById("conteudoFicha")
    corpo.innerHTML = ""

    const dados    = dadosIniciais ? { ...dadosIniciais } : {}
    const riscados = dados["__riscados__"] || {}
    const extras   = dados["__outros__"]   || []
    delete dados["__riscados__"]
    delete dados["__outros__"]

    const resumo = document.createElement("div")
    resumo.className = "ficha-resumo"
    resumo.innerHTML = `
        <div class="ficha-resumo-card">
            <span class="ficha-resumo-label">Caixa gerado</span>
            <span class="ficha-resumo-valor" id="resumoCaixa">R$ 0,00</span>
        </div>
        <div class="ficha-resumo-card ficha-resumo-card--green">
            <span class="ficha-resumo-label" style="color:#15803d">Salário Líquido</span>
            <span class="ficha-resumo-valor ficha-resumo-valor--green" id="resumoLiquido">R$ 0,00</span>
        </div>
    `
    corpo.appendChild(resumo)

    const listHeader = document.createElement("div")
    listHeader.className = "ficha-lista-header"
    listHeader.innerHTML = `
        <span>Itens da Folha</span>
        ${IS_ADMIN ? `<span class="ficha-lista-hint">Clique no quadrado para riscar</span>` : ''}
    `
    corpo.appendChild(listHeader)

    const lista = document.createElement("div")
    lista.className = "ficha-lista"
    lista.id = "listaFixa"
    corpo.appendChild(lista)

    campos.forEach((campo, idx) => {
        const valorSalvo  = dados[campo.key] ?? ""
        const estaRiscado = riscados[campo.key] === true
        lista.appendChild(criarItemFolha(campo, valorSalvo, estaRiscado, idx === campos.length - 1, campos))
    })

    const outrosWrap = document.createElement("div")
    outrosWrap.id = "outrosWrap"
    outrosWrap.style.cssText = "margin-top:10px;"
    corpo.appendChild(outrosWrap)

    const outrosHeader = document.createElement("div")
    outrosHeader.style.cssText = `
        display:flex; align-items:center; justify-content:space-between;
        padding: 0 2px; margin-bottom:6px;
    `
    outrosHeader.innerHTML = `
        <span style="font-family:'Barlow Condensed',sans-serif;font-size:0.75rem;
            font-weight:700;letter-spacing:0.14em;text-transform:uppercase;
            color:var(--texto-suave);">Outros</span>
    `
    outrosWrap.appendChild(outrosHeader)

    const outrosList = document.createElement("div")
    outrosList.className = "ficha-lista"
    outrosList.id = "outrosList"
    outrosWrap.appendChild(outrosList)

    extras.forEach(extra => {
        adicionarItemOutros(extra.label || "", extra.valor || "", extra.riscado === true)
    })

    atualizarPlaceholderOutros()

    if (IS_ADMIN) {
        const btnAdd = document.createElement("button")
        btnAdd.className = "ficha-btn-add-linha"
        btnAdd.innerHTML = `
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Adicionar item
        `
        btnAdd.onclick = () => {
            adicionarItemOutros("", "", false)
            atualizarPlaceholderOutros()
        }
        outrosWrap.appendChild(btnAdd)
    }

    recalcularTudo(campos)
}


// ======================================================
// ADICIONAR ITEM NA SEÇÃO OUTROS
// ======================================================

function adicionarItemOutros(labelInicial, valorInicial, estaRiscado) {
    const lista  = document.getElementById("outrosList")
    const campos = getCampos(document.getElementById("tipoFicha").value)

    const item = document.createElement("div")
    item.className = "ficha-item ficha-item--outro"
    item.dataset.riscado = estaRiscado ? "1" : "0"
    item.style.borderBottom = "1px solid var(--cinza-borda)"

    const check = document.createElement("div")
    check.className = "ficha-check-box"
    check.style.cssText = `
        width:20px; height:20px; flex-shrink:0;
        border:2px solid var(--cinza-borda); border-radius:5px;
        display:flex; align-items:center; justify-content:center;
        cursor:${IS_ADMIN ? 'pointer' : 'default'};
        transition:all 0.15s; background:#fff;
    `
    if (IS_ADMIN) {
        check.onclick = () => {
            const jaRiscado = item.dataset.riscado === "1"
            item.dataset.riscado = jaRiscado ? "0" : "1"
            aplicarEstadoRiscadoOutro(item, !jaRiscado, campos)
            autoSalvarFicha()
        }
    }

    const infoWrap = document.createElement("div")
    infoWrap.className = "ficha-item-info"

    let labelEl, valorEl

    if (IS_ADMIN) {
        labelEl = document.createElement("input")
        labelEl.type        = "text"
        labelEl.value       = labelInicial
        labelEl.placeholder = "Descrição (ex: Vale transporte)"
        labelEl.className   = "ficha-item-desc"
        labelEl.addEventListener("input", () => recalcularTudo(campos))

        valorEl = document.createElement("input")
        valorEl.type        = "text"
        valorEl.value       = valorInicial
        valorEl.placeholder = "R$ 0,00"
        valorEl.className   = "ficha-item-valor ficha-valor--neg"
        valorEl.style.color = "#c0392b"
        valorEl.addEventListener("input", () => recalcularTudo(campos))
    } else {
        labelEl = document.createElement("p")
        labelEl.className   = "ficha-item-desc"
        labelEl.textContent = labelInicial || "—"
        labelEl.style.pointerEvents = "none"

        valorEl = document.createElement("span")
        valorEl.className   = "ficha-item-valor ficha-valor--neg"
        valorEl.style.color = "#c0392b"
        valorEl.textContent = valorInicial ? fmtMoeda(parseMoeda(valorInicial)) : "—"
    }

    infoWrap.appendChild(labelEl)
    item.appendChild(check)
    item.appendChild(infoWrap)
    item.appendChild(valorEl)

    if (IS_ADMIN) {
        const btnRem = document.createElement("button")
        btnRem.className = "ficha-btn-remover"
        btnRem.style.opacity = "0"
        btnRem.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" stroke-width="2.5">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
        </svg>`
        btnRem.onclick = () => {
            item.remove()
            atualizarPlaceholderOutros()
            recalcularTudo(campos)
            autoSalvarFicha()
        }
        item.addEventListener("mouseenter", () => btnRem.style.opacity = "1")
        item.addEventListener("mouseleave", () => btnRem.style.opacity = "0")
        item.appendChild(btnRem)
    }

    if (estaRiscado) {
        item.dataset.riscado = "1"
        aplicarEstadoRiscadoOutro(item, true, campos)
    }

    lista.appendChild(item)
    recalcularTudo(campos)
}


// ======================================================
// PLACEHOLDER QUANDO SEÇÃO OUTROS ESTÁ VAZIA
// ======================================================

function atualizarPlaceholderOutros() {
    const lista = document.getElementById("outrosList")
    if (!lista) return
    const existente = lista.querySelector(".outros-placeholder")
    const temItens  = lista.querySelectorAll(".ficha-item--outro").length > 0

    if (temItens && existente) {
        existente.remove()
    } else if (!temItens && !existente) {
        const ph = document.createElement("div")
        ph.className = "outros-placeholder"
        ph.style.cssText = `
            padding:14px 16px;
            font-size:0.82rem;
            color:#c5cdd8;
            font-style:italic;
            text-align:center;
        `
        ph.textContent = IS_ADMIN
            ? "Nenhum item adicionado. Clique em + Adicionar item."
            : "Nenhum item adicional."
        lista.appendChild(ph)
    }
}


// ======================================================
// APLICA / REMOVE ESTADO RISCADO — CAMPOS FIXOS
// ======================================================

function aplicarEstadoRiscado(item, riscado, campos) {
    const check   = item.querySelector(".ficha-check-box")
    const desc    = item.querySelector(".ficha-item-desc")
    const subdesc = item.querySelector(".ficha-item-subdesc")
    const valor   = item.querySelector("input.ficha-item-valor, span.ficha-item-valor")

    if (riscado) {
        item.style.opacity    = "0.45"
        item.style.background = "#f5f5f7"
        if (desc)    { desc.style.textDecoration    = "line-through"; desc.style.color    = "#aab2c0" }
        if (subdesc) { subdesc.style.textDecoration = "line-through"; subdesc.style.color = "#c5cdd8" }
        if (valor)   { valor.style.textDecoration   = "line-through"; valor.style.color   = "#aab2c0" }
        check.style.background  = "#c5cdd8"
        check.style.borderColor = "#c5cdd8"
        check.innerHTML = `<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
        </svg>`
    } else {
        item.style.opacity    = ""
        item.style.background = ""
        if (desc)    { desc.style.textDecoration    = ""; desc.style.color    = "" }
        if (subdesc) { subdesc.style.textDecoration = ""; subdesc.style.color = "" }
        if (valor)   {
            valor.style.textDecoration = ""
            valor.style.color = item.dataset.desconta === "1" ? '#c0392b' : 'var(--azul-claro)'
        }
        check.style.background  = "#fff"
        check.style.borderColor = "var(--cinza-borda)"
        check.innerHTML = ""
    }
    recalcularTudo(campos)
}


// ======================================================
// APLICA / REMOVE ESTADO RISCADO — ITENS OUTROS
// ======================================================

function aplicarEstadoRiscadoOutro(item, riscado, campos) {
    const check = item.querySelector(".ficha-check-box")
    const desc  = item.querySelector(".ficha-item-desc")
    const valor = item.querySelector("input.ficha-item-valor, span.ficha-item-valor")

    if (riscado) {
        item.style.opacity    = "0.45"
        item.style.background = "#f5f5f7"
        if (desc)  { desc.style.textDecoration  = "line-through"; desc.style.color  = "#aab2c0" }
        if (valor) { valor.style.textDecoration = "line-through"; valor.style.color = "#aab2c0" }
        check.style.background  = "#c5cdd8"
        check.style.borderColor = "#c5cdd8"
        check.innerHTML = `<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
        </svg>`
    } else {
        item.style.opacity    = ""
        item.style.background = ""
        if (desc)  { desc.style.textDecoration  = ""; desc.style.color  = "" }
        if (valor) { valor.style.textDecoration = ""; valor.style.color = "#c0392b" }
        check.style.background  = "#fff"
        check.style.borderColor = "var(--cinza-borda)"
        check.innerHTML = ""
    }
    recalcularTudo(campos)
}


// ======================================================
// RECALCULAR TUDO
// ======================================================

function recalcularTudo(campos) {
    const corpo = document.getElementById("conteudoFicha")
    if (!corpo) return

    let caixa = 0, entradas = 0, descontos = 0

    campos.forEach(c => {
        if (!c.soValor) return
        const item = corpo.querySelector(`#listaFixa [data-campo-key="${c.key}"]`)
        if (!item || item.dataset.riscado === "1") return
        const input = item.querySelector("input")
        const span  = item.querySelector("span.ficha-item-valor")
        const v     = parseMoeda(input?.value || span?.textContent || "0")
        if      (c.soCaixa)  caixa     += v
        else if (c.desconta) descontos += v
        else                 entradas  += v
    })

    const outrosItens = corpo.querySelectorAll("#outrosList .ficha-item--outro")
    outrosItens.forEach(item => {
        if (item.dataset.riscado === "1") return
        const input = item.querySelector("input.ficha-item-valor")
        const span  = item.querySelector("span.ficha-item-valor")
        const v     = parseMoeda(input?.value || span?.textContent || "0")
        descontos += v
    })

    const liquido = entradas - descontos
    const elC = document.getElementById("resumoCaixa")
    const elL = document.getElementById("resumoLiquido")
    if (elC) elC.textContent = fmtMoeda(caixa)
    if (elL) {
        elL.textContent = fmtMoeda(liquido)
        elL.style.color = liquido < 0 ? "#c0392b" : "#15803d"
    }
}


// ======================================================
// SERIALIZAR FICHA COMPLETA
// ======================================================

function serializarFicha(campos) {
    const corpo    = document.getElementById("conteudoFicha")
    const dados    = {}
    const riscados = {}

    campos.forEach(c => {
        const item  = corpo.querySelector(`#listaFixa [data-campo-key="${c.key}"]`)
        const input = item?.querySelector("input")
        dados[c.key] = input?.value || ""
        if (item?.dataset.riscado === "1") riscados[c.key] = true
    })

    if (Object.keys(riscados).length > 0) dados["__riscados__"] = riscados

    const outrosItens = corpo.querySelectorAll("#outrosList .ficha-item--outro")
    const extras = []
    outrosItens.forEach(item => {
        const labelInput = item.querySelector("input.ficha-item-desc, p.ficha-item-desc")
        const valorInput = item.querySelector("input.ficha-item-valor, span.ficha-item-valor")
        const label = labelInput?.value ?? labelInput?.textContent ?? ""
        const valor = valorInput?.value ?? valorInput?.textContent ?? ""
        if (label || valor) {
            extras.push({
                label:   label.trim(),
                valor:   valor.trim(),
                riscado: item.dataset.riscado === "1"
            })
        }
    })

    if (extras.length > 0) dados["__outros__"] = extras

    return dados
}


// ======================================================
// CRIAR ITEM FOLHA (campos fixos)
// ======================================================

function criarItemFolha(campo, valorInicial, estaRiscado, isLast, camposRef) {
    const item = document.createElement("div")
    item.className = "ficha-item"
    item.dataset.campoKey = campo.key
    item.dataset.desconta = campo.desconta ? "1" : "0"
    item.dataset.soCaixa  = campo.soCaixa  ? "1" : "0"
    item.dataset.riscado  = "0"
    if (isLast) item.style.borderBottom = "none"

    const check = document.createElement("div")
    check.className = "ficha-check-box"
    check.style.cssText = `
        width:20px; height:20px; flex-shrink:0;
        border:2px solid var(--cinza-borda); border-radius:5px;
        display:flex; align-items:center; justify-content:center;
        cursor:${IS_ADMIN ? 'pointer' : 'default'};
        transition:all 0.15s; background:#fff;
    `
    if (IS_ADMIN) {
        check.onclick = () => {
            const jaRiscado = item.dataset.riscado === "1"
            item.dataset.riscado = jaRiscado ? "0" : "1"
            aplicarEstadoRiscado(item, !jaRiscado, camposRef)
            autoSalvarFicha()
        }
    }

    const info = document.createElement("div")
    info.className = "ficha-item-info"
    info.innerHTML = `
        <p class="ficha-item-desc" style="pointer-events:none">${campo.label}</p>
        <p class="ficha-item-subdesc">${campo.desc}</p>
    `

    const corValor = campo.desconta ? '#c0392b' : 'var(--azul-claro)'
    let valorEl

    if (IS_ADMIN) {
        valorEl = document.createElement("input")
        valorEl.type        = "text"
        valorEl.value       = valorInicial
        valorEl.placeholder = campo.soValor ? "R$ 0,00" : "Ex: Março 2024"
        valorEl.className   = "ficha-item-valor " + (campo.desconta ? "ficha-valor--neg" : "ficha-valor--pos")
        valorEl.style.color = corValor
        if (campo.soValor) {
            valorEl.addEventListener("input", () => recalcularTudo(camposRef))
        }
    } else {
        valorEl = document.createElement("span")
        valorEl.className   = "ficha-item-valor " + (campo.desconta ? "ficha-valor--neg" : "ficha-valor--pos")
        valorEl.style.color = corValor
        valorEl.textContent = valorInicial
            ? (campo.soValor ? fmtMoeda(parseMoeda(valorInicial)) : valorInicial)
            : "—"
    }

    item.appendChild(check)
    item.appendChild(info)
    item.appendChild(valorEl)

    if (estaRiscado) {
        item.dataset.riscado = "1"
        aplicarEstadoRiscado(item, true, camposRef)
    }

    return item
}


// ======================================================
// AUTO-SAVE ao marcar checkbox
// ======================================================

async function autoSalvarFicha() {
    if (!IS_ADMIN) return
    const mes = document.getElementById("mesFicha").value.trim()
    if (!mes) return

    const tipo   = document.getElementById("tipoFicha").value
    const campos = getCampos(tipo)
    const dados  = serializarFicha(campos)

    if (_fichaEditandoId) {
        await fetch(`/api/fichas/${_fichaEditandoId}`, { method: "DELETE" })
    }

    const res = await fetch("/api/fichas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            colaborador_id: _modalColabId,
            nome_ficha: mes,
            tipo,
            conteudo: JSON.stringify(dados)
        })
    })

    if (res.ok) {
        const json = await res.json()
        _fichaEditandoId = json.id || null
        await carregarFichas(_modalColabId)
    }
}


// ======================================================
// SALVAR FICHA (botão manual)
// ======================================================

async function salvarFicha() {
    if (!IS_ADMIN) return

    const colabId = _modalColabId
    if (!colabId) { alert("Erro: colaborador não identificado."); return }

    const mes  = document.getElementById("mesFicha").value.trim()
    const tipo = document.getElementById("tipoFicha").value
    if (!mes) { alert("Informe o mês da ficha."); return }

    const campos = getCampos(tipo)
    const dados  = serializarFicha(campos)

    if (_fichaEditandoId) {
        await fetch(`/api/fichas/${_fichaEditandoId}`, { method: "DELETE" })
        _fichaEditandoId = null
    }

    const res = await fetch("/api/fichas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            colaborador_id: colabId,
            nome_ficha: mes,
            tipo,
            conteudo: JSON.stringify(dados)
        })
    })

    if (res.ok) {
        try {
            const json = await res.json()
            _fichaEditandoId = json.id || null
        } catch(e) { _fichaEditandoId = null }
        await carregarFichas(colabId)
        popup("Ficha salva com sucesso! ✅")
    } else {
        alert("Erro ao salvar ficha.")
    }
}


// ======================================================
// FICHAS SALVAS
// ======================================================

async function carregarFichas(colaboradorId) {
    const res    = await fetch(`/api/fichas/${colaboradorId}`)
    const fichas = await res.json()

    const miniCard = document.getElementById(`fichas-${colaboradorId}`)
    if (!miniCard) return
    miniCard.innerHTML = ""

    if (fichas.length === 0) {
        miniCard.innerHTML = `<p style="font-size:0.8rem;color:#aab2c0;">Nenhuma ficha salva.</p>`
        return
    }

    fichas.forEach(f => {
        const row = document.createElement("div")
        row.className = "border p-2 rounded bg-gray-50 flex justify-between items-center hover:bg-gray-100 cursor-pointer"

        let autorLabel = ""
        if (f.ultimaAlteracao) {
            const dt = new Date(f.ultimaAlteracao)
            const hh = dt.getHours().toString().padStart(2, "0")
            const mm = dt.getMinutes().toString().padStart(2, "0")
            const primeiroNome = f.alteradoPor ? f.alteradoPor.trim().split(" ")[0] : ""
            autorLabel = `<span style="font-size:0.68rem;color:#aab2c0;display:block;margin-top:2px;">
                Salvo às ${hh}:${mm}${primeiroNome ? " por " + primeiroNome : ""}
            </span>`
        }

        const btnExcluir = IS_ADMIN
            ? `<button class="text-red-500"
                onclick="event.stopPropagation(); excluirFicha(${f.id}, ${colaboradorId})">
                Excluir</button>`
            : ''

        row.innerHTML = `
            <div style="display:flex;flex-direction:column;flex:1;min-width:0;">
                <span style="font-size:0.85rem;font-weight:600;">📄 ${f.nome_ficha}
                    <span style="font-size:0.72rem;color:#aab2c0;font-weight:400;">
                        ${f.tipo === 'meta' ? ' · Metas' : ' · Normal'}
                    </span>
                </span>
                ${autorLabel}
            </div>
            <div class="flex gap-3" style="flex-shrink:0;">
                <button class="text-blue-600"
                    onclick="event.stopPropagation(); baixarPDF(${f.id})">PDF</button>
                ${btnExcluir}
            </div>
        `

        row.addEventListener("click", () => {
            const cardPai = document.querySelector(`[data-colab-id="${colaboradorId}"]`)
            const colaborador = cardPai
                ? JSON.parse(cardPai.dataset.colabJson)
                : { id: colaboradorId, nome: "—", cargo: "" }
            abrirFicha(f, colaborador)
        })

        miniCard.appendChild(row)
    })
} // ← fecha carregarFichas


// ======================================================
// ABRIR FICHA EXISTENTE — ESCOPO GLOBAL
// ======================================================

function abrirFicha(ficha, colaborador) {
    document.body.style.overflow = "hidden"
    _modalColab      = colaborador
    _modalColabId    = colaborador.id
    _fichaEditandoId = ficha.id

    preencherHeaderModal(colaborador)

    const elMes = document.getElementById("mesFicha")
    elMes.value    = ficha.nome_ficha
    elMes.disabled = !IS_ADMIN

    const elTipo = document.getElementById("tipoFicha")
    elTipo.innerHTML = ""
    elTipo.appendChild(new Option("Ficha Normal", "normal"))
    if (colaborador.cargo?.toLowerCase().trim() === "consultor") {
        elTipo.appendChild(new Option("Ficha de Meta", "meta"))
    }
    if (![...elTipo.options].some(o => o.value === ficha.tipo)) {
        elTipo.appendChild(new Option(
            ficha.tipo === "meta" ? "Ficha de Meta" : "Ficha Normal",
            ficha.tipo
        ))
    }
    elTipo.value    = ficha.tipo
    elTipo.disabled = !IS_ADMIN

    let dados = null
    try {
        dados = JSON.parse(ficha.conteudo)
        if (Array.isArray(dados)) dados = null
    } catch(e) {}

    renderFichaModal(ficha.tipo, dados)
    document.getElementById("modalFicha").classList.remove("hidden")
}


// ======================================================
// EXCLUIR FICHA — ESCOPO GLOBAL
// ======================================================

async function excluirFicha(fichaId, colaboradorId) {
    if (!IS_ADMIN) return
    if (!confirm("Deseja excluir essa ficha?")) return
    await fetch(`/api/fichas/${fichaId}`, { method: "DELETE" })
    await carregarFichas(colaboradorId)
    popup("Ficha excluída.")
}


// ======================================================
// BAIXAR PDF — ESCOPO GLOBAL
// ======================================================

function baixarPDF(id) {
    window.open(`/api/fichas/pdf/${id}`, "_blank")
}


// ======================================================
// LISTAR COLABORADORES
// ======================================================

async function carregarColaboradores() {
    const res   = await fetch("/api/colaboradores")
    const lista = await res.json()

    const listaAtivos      = document.getElementById("listaColaboradores")
    const listaDesativados = document.getElementById("listaDesativados")
    listaAtivos.innerHTML      = ""
    listaDesativados.innerHTML = ""

    if (lista.filter(c => c.ativo).length === 0)
        listaAtivos.innerHTML = '<p class="text-gray-400 text-sm">Nenhum colaborador ativo.</p>'
    if (lista.filter(c => !c.ativo).length === 0)
        listaDesativados.innerHTML = '<p class="text-gray-400 text-sm">Nenhum colaborador desativado.</p>'

    lista.forEach(c => {
        const div = document.createElement("div")
        div.dataset.colabId   = c.id
        div.dataset.colabJson = JSON.stringify(c)
        div.style.cssText = `
            background: ${c.ativo ? "var(--branco)" : "#e8ecf2"};
            border: 1.5px solid var(--cinza-borda);
            border-radius: 12px;
            box-shadow: var(--sombra);
            overflow: hidden;
            transition: box-shadow 0.2s;
        `

        const header = document.createElement("div")
        header.style.cssText = `
            padding: 14px 16px;
            cursor: pointer;
            user-select: none;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 10px;
            transition: background 0.15s;
            border-left: 4px solid ${c.ativo ? "var(--azul-claro)" : "#8a95a3"};
        `
        header.onmouseenter = () => header.style.background = "var(--cinza-claro)"
        header.onmouseleave = () => header.style.background = ""

        const iniciais = c.nome.split(" ").slice(0, 2).map(p => p[0]).join("").toUpperCase()
        const avatar = document.createElement("div")
        avatar.style.cssText = `
            width:40px;height:40px;border-radius:10px;
            background:${c.ativo ? "var(--azul)" : "#8a95a3"};color:#fff;
            display:flex;align-items:center;justify-content:center;
            font-family:'Barlow Condensed',sans-serif;
            font-weight:800;font-size:1rem;flex-shrink:0;letter-spacing:0.04em;
        `
        avatar.textContent = iniciais

        const info = document.createElement("div")
        info.style.cssText = "flex:1;min-width:0;"
        const badge = !c.ativo ? `<span style="font-size:0.68rem;background:#fee2e2;color:#b91c1c;
            padding:1px 6px;border-radius:999px;margin-left:6px;font-weight:700;">INATIVO</span>` : ""
        info.innerHTML = `
            <p style="font-family:'Barlow Condensed',sans-serif;font-weight:700;font-size:1rem;
                color:var(--azul);line-height:1.2;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
                ${c.nome}${badge}
            </p>
            <p style="font-size:0.78rem;color:var(--texto-suave);margin-top:2px;">
                ${c.cargo} &nbsp;·&nbsp; ${c.numero}
            </p>
        `

        const seta = document.createElement("span")
        seta.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" stroke-width="2.5"
            style="color:var(--texto-suave);transition:transform 0.25s;flex-shrink:0;">
            <polyline points="6 9 12 15 18 9"/>
        </svg>`

        header.appendChild(avatar)
        header.appendChild(info)
        header.appendChild(seta)

        const body = document.createElement("div")
        body.style.cssText = `
            border-top:1px solid var(--cinza-borda);
            background:var(--cinza-claro);
            display:none;
            flex-direction:column;
            gap:10px;
            padding:14px 16px;
        `

        const detalhes = document.createElement("div")
        detalhes.style.cssText = `
            display:grid;grid-template-columns:1fr 1fr;gap:4px;
            font-size:0.82rem;color:var(--texto-suave);
            background:var(--branco);border-radius:8px;
            padding:10px 12px;border:1px solid var(--cinza-borda);
        `
        detalhes.innerHTML = `
            <span><strong style="color:var(--texto);">CPF:</strong> ${c.cpf}</span>
            <span><strong style="color:var(--texto);">Tel:</strong> ${c.numero}</span>
            <span><strong style="color:var(--texto);">Cargo:</strong> ${c.cargo}</span>
        `

        if (c.pix) {
            const linhaPix = document.createElement("span")
            linhaPix.style.cssText = "grid-column:span 2;display:flex;align-items:center;gap:6px;margin-top:4px;padding-top:6px;border-top:1px solid var(--cinza-borda);"

            const rotulo = document.createElement("strong")
            rotulo.style.cssText = "color:var(--texto);white-space:nowrap;"
            rotulo.textContent = "PIX:"

            const valorPix = document.createElement("span")
            valorPix.style.cssText = "flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;"
            valorPix.textContent = c.pix

            const btnCopiar = document.createElement("button")
            btnCopiar.textContent = "Copiar"
            btnCopiar.style.cssText = "background:var(--azul);color:#fff;border:none;border-radius:5px;padding:3px 10px;font-size:0.75rem;cursor:pointer;white-space:nowrap;font-family:'Barlow Condensed',sans-serif;font-weight:700;flex-shrink:0;"
            btnCopiar.onclick = () => copiarPix(c.pix)

            linhaPix.appendChild(rotulo)
            linhaPix.appendChild(valorPix)
            linhaPix.appendChild(btnCopiar)
            detalhes.appendChild(linhaPix)
        }

        body.appendChild(detalhes)

        const acoes = document.createElement("div")
        acoes.style.cssText = "display:flex;gap:8px;flex-wrap:wrap;"

        const btnFicha = document.createElement("button")
        btnFicha.textContent = IS_ADMIN ? "+ Nova Ficha" : "Ver Fichas"
        btnFicha.style.cssText = `
            background:var(--azul-claro);color:#fff;border:none;border-radius:6px;
            padding:6px 14px;font-family:'Barlow Condensed',sans-serif;
            font-weight:700;font-size:0.85rem;letter-spacing:0.05em;cursor:pointer;
        `
        btnFicha.onclick = (e) => { e.stopPropagation(); abrirModalFicha(c) }
        acoes.appendChild(btnFicha)

        if (IS_ADMIN) {
            const btnStatus = document.createElement("button")
            btnStatus.textContent = c.ativo ? "Desativar" : "Ativar"
            btnStatus.style.cssText = `
                background:${c.ativo ? "#e67e22" : "#1a7a4a"};color:#fff;border:none;
                border-radius:6px;padding:6px 14px;
                font-family:'Barlow Condensed',sans-serif;
                font-weight:700;font-size:0.85rem;cursor:pointer;
            `
            btnStatus.onclick = (e) => { e.stopPropagation(); alterarStatus(c.id) }
            acoes.appendChild(btnStatus)

            if (!c.ativo) {
                const btnDel = document.createElement("button")
                btnDel.textContent = "Excluir"
                btnDel.style.cssText = `
                    background:#c0392b;color:#fff;border:none;border-radius:6px;
                    padding:6px 14px;font-family:'Barlow Condensed',sans-serif;
                    font-weight:700;font-size:0.85rem;cursor:pointer;
                `
                btnDel.onclick = (e) => { e.stopPropagation(); excluirColaborador(c.id) }
                acoes.appendChild(btnDel)
            }
        }
        body.appendChild(acoes)

        const tituloFichas = document.createElement("p")
        tituloFichas.style.cssText = `
            font-family:'Barlow Condensed',sans-serif;font-size:0.72rem;font-weight:700;
            letter-spacing:0.12em;text-transform:uppercase;color:var(--texto-suave);
        `
        tituloFichas.textContent = "Fichas salvas"
        body.appendChild(tituloFichas)

        const fichasContainer = document.createElement("div")
        fichasContainer.id = `fichas-${c.id}`
        fichasContainer.style.cssText = "display:flex;flex-direction:column;gap:4px;"
        body.appendChild(fichasContainer)

        let carregou = false
        header.onclick = () => {
            const aberto = body.style.display === "flex"

            document.querySelectorAll("[data-colab-id]").forEach(card => {
                const b = card.querySelector(":scope > div:last-child")
                const s = card.querySelector(":scope > div:first-child > span svg")
                if (card !== div && b && b.style.display === "flex") {
                    b.style.display = "none"
                    if (s) s.style.transform = ""
                    card.style.boxShadow = "var(--sombra)"
                }
            })

            body.style.display  = aberto ? "none" : "flex"
            seta.querySelector("svg").style.transform = aberto ? "" : "rotate(180deg)"
            div.style.boxShadow = aberto ? "var(--sombra)" : "var(--sombra-forte)"

            if (!aberto && !carregou) {
                carregou = true
                carregarFichas(c.id)
            }
        }

        div.appendChild(header)
        div.appendChild(body)

        if (c.ativo) listaAtivos.appendChild(div)
        else         listaDesativados.appendChild(div)
    })
}


// ======================================================
// ALTERAR STATUS / EXCLUIR COLABORADOR
// ======================================================

async function alterarStatus(id) {
    if (!IS_ADMIN) return
    await fetch(`/api/colaboradores/${id}/status`, { method: "PUT" })
    carregarColaboradores()
}

async function excluirColaborador(id) {
    if (!IS_ADMIN) return
    if (!confirm("Tem certeza que deseja excluir este colaborador?")) return
    await fetch(`/api/colaboradores/${id}`, { method: "DELETE" })
    carregarColaboradores()
}


// ======================================================
// HISTÓRICO
// ======================================================

async function carregarHistorico() {
    const res    = await fetch("/api/historico")
    const contas = await res.json()
    const lista  = document.getElementById("historicoList")
    lista.innerHTML = ""

    if (contas.length === 0) {
        lista.innerHTML = `
            <div style="text-align:center;padding:3rem 1rem;color:var(--texto-suave);">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                    stroke-width="1.5" style="margin:0 auto 1rem;display:block;opacity:0.35">
                    <circle cx="12" cy="12" r="10"/>
                    <polyline points="12 6 12 12 16 14"/>
                </svg>
                <p style="font-family:'Barlow Condensed',sans-serif;font-size:1.1rem;font-weight:700;">
                    Nenhuma conta paga ainda
                </p>
            </div>`
        return
    }

    const grupos = {}
    contas.forEach(c => {
        const dt  = c.dataPagamento ? new Date(c.dataPagamento) : null
        const mes = dt
            ? dt.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })
            : "Sem data"
        if (!grupos[mes]) grupos[mes] = []
        grupos[mes].push(c)
    })

    Object.entries(grupos).forEach(([mes, itens]) => {
        const titulo = document.createElement("div")
        titulo.style.cssText = `
            font-family:'Barlow Condensed',sans-serif;font-size:0.8rem;font-weight:700;
            letter-spacing:0.12em;text-transform:uppercase;color:var(--texto-suave);
            margin:1.25rem 0 0.5rem;padding-bottom:0.4rem;border-bottom:2px solid var(--cinza-borda);
        `
        titulo.textContent = mes
        lista.appendChild(titulo)

        itens.forEach(c => {
            const card = document.createElement("div")
            card.style.cssText = `
                background:var(--branco);border:1.5px solid var(--cinza-borda);
                border-left:4px solid #1a7a4a;border-radius:10px;
                padding:12px 16px;display:flex;align-items:center;
                justify-content:space-between;gap:12px;margin-bottom:6px;box-shadow:var(--sombra);
            `
            const dtPag = c.dataPagamento
                ? new Date(c.dataPagamento).toLocaleDateString("pt-BR") : "—"
            const valor = new Intl.NumberFormat("pt-BR", {
                style: "currency", currency: "BRL"
            }).format(c.valor || 0)

            card.innerHTML = `
                <div style="flex:1;min-width:0;">
                    <p style="font-size:0.92rem;font-weight:600;color:var(--texto);
                        white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${c.descricao}</p>
                    <p style="font-size:0.75rem;color:var(--texto-suave);margin-top:2px;">
                        ${c.categoria} &nbsp;·&nbsp; Pago em ${dtPag}
                    </p>
                </div>
                <div style="display:flex;align-items:center;gap:10px;flex-shrink:0;">
                    <span style="font-family:'Barlow Condensed',sans-serif;font-size:1rem;
                        font-weight:700;color:#1a7a4a;">${valor}</span>
                    <span style="background:#dcfce7;color:#15803d;font-size:0.68rem;
                        font-weight:700;padding:2px 8px;border-radius:999px;
                        text-transform:uppercase;letter-spacing:0.06em;">PAGO</span>
                </div>
            `
            lista.appendChild(card)
        })
    })
}