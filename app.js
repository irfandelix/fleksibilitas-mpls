const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzWg67MwADUTOlPvAdjJGJ3VMNnAavfyTtjeHPVLAdWyYa4phOCjl7z2wcZawrE9NC-eQ/exec"; 

let dataSiswa = [];
let kelasUnik = [];
let state = {
    currentScreen: 'kelas',
    selectedKelas: null,
    selectedSiswa: null
};

const el = {
    btnBack: document.getElementById('btn-back'),
    headerTitle: document.getElementById('header-title'),
    loadingBar: document.getElementById('loading-bar'),
    toast: document.getElementById('toast'),
    
    screens: {
        kelas: document.getElementById('screen-kelas'),
        siswa: document.getElementById('screen-siswa'),
        form: document.getElementById('screen-form'),
        success: document.getElementById('screen-success')
    },
    
    gridKelas: document.getElementById('grid-kelas'),
    listSiswa: document.getElementById('list-siswa'),
    titleKelas: document.getElementById('title-kelas-terpilih'),
    searchSiswa: document.getElementById('search-siswa'),
    
    form: {
        nama: document.getElementById('form-nama'),
        nis: document.getElementById('form-nis'),
        element: document.getElementById('form-penilaian'),
        btnSubmit: document.getElementById('btn-submit'),
        successNama: document.getElementById('success-nama'),
        btnNext: document.getElementById('btn-next-student')
    }
};

async function init() {
    showLoading();
    try {
        if(APPS_SCRIPT_URL !== "URL_APPS_SCRIPT_ANDA") {
            const res = await fetch(APPS_SCRIPT_URL);
            const json = await res.json();
            dataSiswa = json.data; 
        } else {
            dataSiswa = generateDummyData();
        }
        
        kelasUnik = [...new Set(dataSiswa.map(s => s.kelas))].sort();
        renderKelas();
        hideLoading();
    } catch(err) {
        hideLoading();
        showToast("Gagal mengambil data dari server");
    }
}

function navigate(toScreen) {
    Object.values(el.screens).forEach(s => s.classList.remove('active'));
    setTimeout(() => {
        Object.values(el.screens).forEach(s => s.classList.add('hidden'));
        el.screens[toScreen].classList.remove('hidden');
        void el.screens[toScreen].offsetWidth;
        el.screens[toScreen].classList.add('active');
    }, 50);

    state.currentScreen = toScreen;

    if(toScreen === 'kelas') {
        el.btnBack.classList.add('hidden');
    } else if (toScreen === 'siswa') {
        el.btnBack.classList.remove('hidden');
        el.titleKelas.textContent = "Kelas " + state.selectedKelas;
        renderSiswa();
    } else if (toScreen === 'form') {
        el.btnBack.classList.remove('hidden');
        
        const s = state.selectedSiswa;
        el.form.nama.textContent = s.nama;
        el.form.nis.textContent = "NIS: " + s.nis;
        el.form.element.reset();
        
        document.getElementById('detail-nisn').textContent = s.nisn || "-";
        
        // Clear all radios first
        document.querySelectorAll('input[name="ekskul"]').forEach(r => r.checked = false);
        if (s.ekskul) {
            const radio = document.querySelector(`input[name="ekskul"][value="${s.ekskul}"]`);
            if (radio) radio.checked = true;
        }

    } else if (toScreen === 'success') {
        el.btnBack.classList.add('hidden');
        el.form.successNama.textContent = state.selectedSiswa.nama;
        
        const s = dataSiswa.find(x => x.nis === state.selectedSiswa.nis);
        if(s) {
            s.status = 'done';
            const selectedRadio = document.querySelector('input[name="ekskul"]:checked');
            s.ekskul = selectedRadio ? selectedRadio.value : "";
        }
    }
}

el.btnBack.addEventListener('click', () => {
    if(state.currentScreen === 'siswa') navigate('kelas');
    if(state.currentScreen === 'form') navigate('siswa');
});

el.searchSiswa.addEventListener('input', (e) => {
    renderSiswa(e.target.value);
});

el.form.btnNext.addEventListener('click', () => navigate('siswa'));

function renderKelas() {
    el.gridKelas.innerHTML = kelasUnik.map(k => `
        <div class="kelas-card" onclick="selectKelas('${k}')">
            <h3>${k}</h3>
            <p>${dataSiswa.filter(s => s.kelas === k).length} Siswa</p>
        </div>
    `).join('');
}

function renderSiswa(search = "") {
    let filtered = dataSiswa.filter(s => s.kelas === state.selectedKelas);
    if(search) {
        filtered = filtered.filter(s => s.nama.toLowerCase().includes(search.toLowerCase()) || s.nis.includes(search));
    }
    
    el.listSiswa.innerHTML = filtered.map(s => `
        <div class="siswa-item" onclick="selectSiswa('${s.nis}')">
            <div class="siswa-info">
                <h4>${s.nama}</h4>
                <p>NIS: ${s.nis}</p>
            </div>
            <div style="display: flex; flex-direction: column; gap: 4px; align-items: flex-end;">
                ${s.status === 'done' ? "<div class='siswa-status done'>Sudah Memilih</div>" : "<div class='siswa-status warning'>Belum Memilih</div>"}
            </div>
        </div>
    `).join('');
}

window.selectKelas = (kelas) => {
    state.selectedKelas = kelas;
    navigate('siswa');
};

window.selectSiswa = (nis) => {
    state.selectedSiswa = dataSiswa.find(s => s.nis === nis);
    navigate('form');
};

el.form.element.addEventListener('submit', async (e) => {
    e.preventDefault();
    if(APPS_SCRIPT_URL === "URL_APPS_SCRIPT_ANDA") {
        showLoading();
        el.form.btnSubmit.disabled = true;
        el.form.btnSubmit.textContent = "Menyimpan...";
        
        setTimeout(() => {
            hideLoading();
            el.form.btnSubmit.disabled = false;
            el.form.btnSubmit.textContent = "Simpan";
            navigate('success');
        }, 1000);
        return;
    }

    const selectedRadio = document.querySelector('input[name="ekskul"]:checked');
    const ekskulValue = selectedRadio ? selectedRadio.value : "";

    const payload = {
        action: "insert",
        data: {
            nis: state.selectedSiswa.nis,
            ekskul: ekskulValue
        }
    };

    try {
        showLoading();
        el.form.btnSubmit.disabled = true;
        el.form.btnSubmit.textContent = "Menyimpan...";
        
        const res = await fetch(APPS_SCRIPT_URL, {
            method: 'POST',
            body: JSON.stringify(payload)
        });
        const result = await res.json();
        
        if(result.status === 'success') {
            navigate('success');
        } else {
            showToast("Gagal menyimpan data.");
        }
    } catch(err) {
        showToast("Terjadi kesalahan jaringan.");
    } finally {
        hideLoading();
        el.form.btnSubmit.disabled = false;
        el.form.btnSubmit.textContent = "Simpan";
    }
});

function showLoading() { el.loadingBar.style.width = '100%'; el.loadingBar.classList.add('loading-active'); }
function hideLoading() { el.loadingBar.classList.remove('loading-active'); setTimeout(()=> el.loadingBar.style.width = '0', 300); }
function showToast(msg) {
    el.toast.textContent = msg;
    el.toast.classList.remove('hidden');
    setTimeout(() => el.toast.classList.add('hidden'), 3000);
}

function generateDummyData() {
    return [
        {kelas: '7A', nis: '1001', nama: 'Budi Santoso', status: 'pending'},
        {kelas: '7A', nis: '1002', nama: 'Siti Aminah', status: 'done'}
    ];
}

init();
