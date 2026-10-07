// ========================================================
// DEKLARASI STATE (DATA UTAMA APLIKASI)
// ========================================================
// State menyimpan seluruh data aplikasi yang dapat berubah secara dinamis
let state = {
    tasks: [],       // Menyimpan daftar objek tugas: { id, title, score, completed }
    totalScore: 0    // Menyimpan total skor akumulasi pengguna
};

// ========================================================
// SELEKSI ELEMEN DOM (DOCUMENT OBJECT MODEL)
// ========================================================
// Mengambil referensi elemen HTML agar bisa dimanipulasi dengan JavaScript
const taskForm = document.getElementById('task-form');
const taskTitleInput = document.getElementById('task-title');
const taskDifficultySelect = document.getElementById('task-difficulty');

const activeTaskList = document.getElementById('task-list');
const completedTaskList = document.getElementById('completed-list');

const totalScoreDisplay = document.getElementById('total-score');
const activeCountDisplay = document.getElementById('active-count');
const completedCountDisplay = document.getElementById('completed-count');
const completionRateDisplay = document.getElementById('completion-rate');
const progressBar = document.getElementById('progress-bar');

const btnClearCompleted = document.getElementById('btn-clear-completed');
const btnResetAll = document.getElementById('btn-reset-all');

// ========================================================
// SISTEM PERSISTENSI DATA (LOCAL STORAGE)
// ========================================================
// Fungsi untuk menyimpan state saat ini ke penyimpanan lokal browser (LocalStorage)
function saveState() {
    localStorage.setItem('taskScoreState', JSON.stringify(state));
}

// Fungsi untuk memuat state dari penyimpanan lokal browser saat aplikasi pertama kali dibuka
function loadState() {
    const savedData = localStorage.getItem('taskScoreState');
    if (savedData) {
        state = JSON.parse(savedData);
    } else {
        // Data awal default jika pengguna baru pertama kali membuka aplikasi
        state = {
            tasks: [
                { id: 'default-1', title: 'Membaca Dokumentasi HTML5 (Contoh)', score: 20, completed: false },
                { id: 'default-2', title: 'Install Visual Studio Code (Contoh)', score: 10, completed: true }
            ],
            totalScore: 10
        };
        saveState();
    }
}

// ========================================================
// FUNGSI RENDER (UPDATE TAMPILAN ANTARMUKA / UI)
// ========================================================
// Fungsi ini bertanggung jawab menyinkronkan data di dalam 'state' ke tampilan HTML
function render() {
    // 1. Bersihkan kontainer list sebelum memuat ulang
    activeTaskList.innerHTML = '';
    completedTaskList.innerHTML = '';

    // 2. Filter tugas berdasarkan status (Aktif vs Selesai)
    const activeTasks = state.tasks.filter(task => !task.completed);
    const completedTasks = state.tasks.filter(task => task.completed);

    // 3. Render Daftar Tugas Aktif
    if (activeTasks.length === 0) {
        activeTaskList.innerHTML = '<li class="empty-state">Belum ada tugas aktif. Tambahkan tugas baru di atas!</li>';
    } else {
        activeTasks.forEach(task => {
            const li = document.createElement('li');
            li.className = 'task-item';
            
            // Menentukan kelas warna badge berdasarkan besaran skor
            let badgeClass = 'badge-medium';
            if (task.score === 10) badgeClass = 'badge-easy';
            if (task.score === 30) badgeClass = 'badge-hard';

            li.innerHTML = `
                <span class="task-name">${escapeHTML(task.title)}</span>
                <span class="badge ${badgeClass}">+${task.score} Poin</span>
                <div class="task-actions">
                    <button class="btn-complete" onclick="completeTask('${task.id}')">Selesai</button>
                    <button class="btn-delete" onclick="deleteTask('${task.id}')">Hapus</button>
                </div>
            `;
            activeTaskList.appendChild(li);
        });
    }

    // 4. Render Daftar Tugas Selesai
    if (completedTasks.length === 0) {
        completedTaskList.innerHTML = '<li class="empty-state">Belum ada tugas yang diselesaikan. Semangat!</li>';
    } else {
        completedTasks.forEach(task => {
            const li = document.createElement('li');
            li.className = 'task-item completed';
            
            let badgeClass = 'badge-medium';
            if (task.score === 10) badgeClass = 'badge-easy';
            if (task.score === 30) badgeClass = 'badge-hard';

            li.innerHTML = `
                <span class="task-name">${escapeHTML(task.title)}</span>
                <span class="badge ${badgeClass}">+${task.score} Poin</span>
                <span style="color: var(--color-success); font-weight: bold; font-size: 0.85rem;">✓ Selesai</span>
            `;
            completedTaskList.appendChild(li);
        });
    }

    // 5. Update Skor Total
    totalScoreDisplay.textContent = state.totalScore;

    // 6. Hitung & Update Statistik
    const totalCount = state.tasks.length;
    const activeCount = activeTasks.length;
    const completedCount = completedTasks.length;
    
    // Menghitung persentase penyelesaian tugas
    const completionRate = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

    activeCountDisplay.textContent = activeCount;
    completedCountDisplay.textContent = completedCount;
    completionRateDisplay.textContent = `${completionRate}%`;

    // 7. Update Lebar Indikator Progress Bar
    progressBar.style.width = `${completionRate}%`;
}

// Helper untuk mencegah serangan XSS (Cross-Site Scripting) dengan membersihkan input teks
function escapeHTML(str) {
    return str.replace(/[&<>'"]/g, 
        tag => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            "'": '&#39;',
            '"': '&quot;'
        }[tag] || tag)
    );
}

// ========================================================
// AKSI & OPERASI APLIKASI (LOGIKA UTAMA)
// ========================================================

// 1. Aksi Menambah Tugas Baru
taskForm.addEventListener('submit', function(event) {
    event.preventDefault(); // Mencegah reload halaman secara default saat submit form

    const title = taskTitleInput.value.trim();
    const score = parseInt(taskDifficultySelect.value, 10);

    if (title) {
        // Buat objek tugas baru dengan ID unik (menggunakan timestamp)
        const newTask = {
            id: 'task-' + Date.now(),
            title: title,
            score: score,
            completed: false
        };

        // Masukkan ke array state dan simpan
        state.tasks.push(newTask);
        saveState();
        render();

        // Reset input form
        taskTitleInput.value = '';
        taskTitleInput.focus();
    }
});

// 2. Aksi Menyelesaikan Tugas (Mendapatkan Skor)
window.completeTask = function(id) {
    // Cari tugas yang cocok dengan id
    const taskIndex = state.tasks.findIndex(task => task.id === id);
    
    if (taskIndex !== -1) {
        // Tandai selesai
        state.tasks[taskIndex].completed = true;
        // Tambahkan skor tugas tersebut ke total skor
        state.totalScore += state.tasks[taskIndex].score;
        
        saveState();
        render();
    }
};

// 3. Aksi Menghapus Tugas Aktif
window.deleteTask = function(id) {
    // Saring keluar tugas yang memiliki ID tersebut
    state.tasks = state.tasks.filter(task => task.id !== id);
    
    saveState();
    render();
};

// 4. Aksi Membersihkan Daftar Tugas Selesai (Hanya menghapus riwayat list tanpa memotong skor)
btnClearCompleted.addEventListener('click', function() {
    if (confirm('Apakah Anda yakin ingin menghapus semua daftar riwayat tugas yang sudah selesai? (Skor Anda akan tetap aman)')) {
        state.tasks = state.tasks.filter(task => !task.completed);
        saveState();
        render();
    }
});

// 5. Aksi Reset Semua Data (Kembali ke Nol)
btnResetAll.addEventListener('click', function() {
    if (confirm('Peringatan: Tindakan ini akan menghapus semua tugas dan mereset skor Anda ke 0. Lanjutkan?')) {
        state.tasks = [];
        state.totalScore = 0;
        saveState();
        render();
    }
});

// ========================================================
// INISIALISASI AWAL (STARTUP)
// ========================================================
// Jalankan pemuatan state dan rendering pertama kali saat halaman siap
document.addEventListener('DOMContentLoaded', () => {
    loadState();
    render();
});