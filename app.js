// GANTI URL INI DENGAN URL WEB APP DARI GOOGLE APPS SCRIPT ANDA
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzWg67MwADUTOlPvAdjJGJ3VMNnAavfyTtjeHPVLAdWyYa4phOCjl7z2wcZawrE9NC-eQ/exec"; 

let dataSiswa = []; // Akan berisi {kelas, nis, nama, status}
let kelasUnik = [];
let state = {
    currentScreen: 'kelas', // kelas, siswa, form, success
    selectedKelas: null,
    selectedSiswa: null
};

// Elements
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
    },
    
    inputs: {
        vsit1: document.getElementById('input-vsit1'),
        vsit2: document.getElementById('input-vsit2'),
        vsit3: document.getElementById('input-vsit3'),
        vsitBest: document.getElementById('input-vsit-best')
    }
};

// Initialize App
async function init() {
    showLoading();
    try {
        if(APPS_SCRIPT_URL !== "URL_APPS_SCRIPT_ANDA") {
            const res = await fetch(APPS_SCRIPT_URL);
            const json = await res.json();
            dataSiswa = json.data; 
        } else {
            // DUMMY DATA JIKA BELUM ADA URL
            dataSiswa = generateDummyData();
        }
        
        // Extract Unique Classes
        kelasUnik = [...new Set(dataSiswa.map(s => s.kelas))].sort();
        renderKelas();
        hideLoading();
    } catch(err) {
        hideLoading();
        showToast("Gagal mengambil data dari server");
    }
}

// Navigation Logic
function navigate(toScreen, payload = null) {
    // Hide all
    Object.values(el.screens).forEach(s => s.classList.remove('active'));
    setTimeout(() => {
        Object.values(el.screens).forEach(s => s.classList.add('hidden'));
        
        // Show target
        el.screens[toScreen].classList.remove('hidden');
        // Trigger reflow for animation
        void el.screens[toScreen].offsetWidth;
        el.screens[toScreen].classList.add('active');
    }, 50); // slight delay to allow display block before transition

    state.currentScreen = toScreen;

    // Update Header
    if(toScreen === 'kelas') {
        el.btnBack.classList.add('hidden');
        el.headerTitle.textContent = "Sistem Penilaian";
    } else if (toScreen === 'siswa') {
        el.btnBack.classList.remove('hidden');
        el.headerTitle.textContent = `Kelas ${state.selectedKelas}`;
        el.titleKelas.textContent = `Kelas ${state.selectedKelas}`;
        renderSiswa();
    } else if (toScreen === 'form') {
        el.btnBack.classList.remove('hidden');
        el.headerTitle.textContent = "Input Penilaian";
        el.form.nama.textContent = state.selectedSiswa.nama;
        el.form.nis.textContent = `nis: ${state.selectedSiswa.nis}`;
        el.form.element.reset();
    } else if (toScreen === 'success') {
        el.btnBack.classList.add('hidden');
        el.headerTitle.textContent = "Selesai";
        el.form.successNama.textContent = state.selectedSiswa.nama;
        
        // Tandai siswa selesai
        const s = dataSiswa.find(x => x.nis === state.selectedSiswa.nis);
        if(s) s.status = 'done';
    }
}

// Event Listeners
el.btnBack.addEventListener('click', () => {
    if(state.currentScreen === 'siswa') navigate('kelas');
    if(state.currentScreen === 'form') navigate('siswa');
});

el.searchSiswa.addEventListener('input', (e) => {
    renderSiswa(e.target.value);
});

// Hitung Otomatis Vsit Terbaik
[el.inputs.vsit1, el.inputs.vsit2, el.inputs.vsit3].forEach(input => {
    input.addEventListener('input', updateBestVsit);
});

function updateBestVsit() {
    const v1 = parseFloat(el.inputs.vsit1.value) || 0;
    const v2 = parseFloat(el.inputs.vsit2.value) || 0;
    const v3 = parseFloat(el.inputs.vsit3.value) || 0;
    el.inputs.vsitBest.value = Math.max(v1, v2, v3);
}

el.form.btnNext.addEventListener('click', () => navigate('siswa'));

// Renderers
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
                <p>nis: ${s.nis}</p>
            </div>
            ${s.status === 'done' ? '<div class="siswa-status done">Selesai</div>' : '<div class="siswa-status">Belum</div>'}
        </div>
    `).join('');
}

// Actions
window.selectKelas = (kelas) => {
    state.selectedKelas = kelas;
    navigate('siswa');
};

window.selectSiswa = (nis) => {
    state.selectedSiswa = dataSiswa.find(s => s.nis === nis);
    navigate('form');
};

// Form Submission
el.form.element.addEventListener('submit', async (e) => {
    e.preventDefault();
    if(APPS_SCRIPT_URL === "URL_APPS_SCRIPT_ANDA") {
        // Mode Simulasi jika URL belum diisi
        showLoading();
        el.form.btnSubmit.disabled = true;
        el.form.btnSubmit.textContent = "Menyimpan...";
        
        setTimeout(() => {
            hideLoading();
            el.form.btnSubmit.disabled = false;
            el.form.btnSubmit.textContent = "Simpan Nilai";
            navigate('success');
        }, 1000);
        return;
    }

    // Submit ke Apps Script
    const payload = {
        action: "insert",
        data: {
            kelas: state.selectedKelas,
            nis: state.selectedSiswa.nis,
            nama: state.selectedSiswa.nama,
            tgl_lahir: document.getElementById('input-tgl').value,
            disabilitas: document.getElementById('input-disabilitas').value,
            tinggi: document.getElementById('input-tinggi').value,
            berat: document.getElementById('input-berat').value,
            vsit1: el.inputs.vsit1.value,
            vsit2: el.inputs.vsit2.value,
            vsit3: el.inputs.vsit3.value,
            vsit_best: el.inputs.vsitBest.value
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
        el.form.btnSubmit.textContent = "Simpan Nilai";
    }
});

// UI Utils
function showLoading() { el.loadingBar.style.width = '100%'; el.loadingBar.classList.add('loading-active'); }
function hideLoading() { el.loadingBar.classList.remove('loading-active'); setTimeout(()=> el.loadingBar.style.width = '0', 300); }
function showToast(msg) {
    el.toast.textContent = msg;
    el.toast.classList.remove('hidden');
    setTimeout(() => el.toast.classList.add('hidden'), 3000);
}

// Dummy Data Generator (For demo before Apps Script is linked)
function generateDummyData() {
    const data = [];
    const namaSiswa = ["Budi Santoso", "Siti Aminah", "Joko Widodo", "Ayu Tingting", "Raffi Ahmad", "Agnez Mo"];
    for(let i=1; i<=3; i++) {
        for(let j=0; j<6; j++) {
            data.push({
                kelas: `Kelas ${i}`,
                nis: `100${i}00${j}`,
                nama: `${namaSiswa[j]} - ${i}`,
                status: j === 0 ? 'done' : 'pending' // contoh ada yg sudah selesai
            });
        }
    }
    return data;
}

// Run
init();
