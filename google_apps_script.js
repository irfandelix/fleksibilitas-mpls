// ==========================================
// Menerima request GET dari Web App (Mengambil daftar kelas & siswa)
// ==========================================
function doGet(e) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheets = ss.getSheets();
  var result = [];
  
  // Mengambil data dari SEMUA sheet
  for(var s = 0; s < sheets.length; s++) {
    var sheet = sheets[s];
    var namaKelas = sheet.getName();
    var data = sheet.getDataRange().getValues();
    
    // Berdasarkan format Spreadsheet Anda:
    // Baris 1-7 adalah kop surat (Nama Sekolah, dll)
    // Baris 8 adalah Header (NIS, No Absen, NISN, Nama Murid, dll)
    // Data siswa dimulai dari index 8 (Baris 9 di spreadsheet)
    for(var i = 8; i < data.length; i++) {
      var nis = data[i][0]; // Kolom A
      var nama = data[i][3]; // Kolom D (Index 3)
      var tinggi = data[i][6]; // Kolom G (Index 6)
      
      if(nis && nama) { // Jika NIS dan Nama tidak kosong
        
        // Format Tanggal Lahir ke YYYY-MM-DD untuk input HTML
        var tgl = data[i][4]; // Kolom E (Index 4)
        var tglStr = "";
        if (tgl instanceof Date) {
          var m = tgl.getMonth() + 1;
          var d = tgl.getDate();
          tglStr = tgl.getFullYear() + '-' + (m < 10 ? '0'+m : m) + '-' + (d < 10 ? '0'+d : d);
        } else if (tgl) {
          tglStr = tgl.toString();
        }

        result.push({
          kelas: namaKelas,
          nis: nis.toString(),
          nisn: data[i][2] ? data[i][2].toString() : "", // Kolom C (Index 2)
          nama: nama.toString(),
          tgl_lahir: tglStr,
          disabilitas: data[i][5] || "", // Kolom F
          tinggi: data[i][6] || "", // Kolom G
          berat: data[i][7] || "", // Kolom H
          vsit1: data[i][8] || "", // Kolom I
          vsit2: data[i][9] || "", // Kolom J
          vsit3: data[i][10] || "", // Kolom K
          vsit_best: data[i][11] || "", // Kolom L
          ekskul: data[i][12] || "", // Kolom M
          
          // Jika kolom Tinggi Badan sudah terisi, anggap sudah dinilai
          status: tinggi ? 'done' : 'pending' 
        });
      }
    }
  }
  
  return ContentService.createTextOutput(JSON.stringify({status: 'success', data: result}))
                       .setMimeType(ContentService.MimeType.JSON);
}

// ==========================================
// Menerima request POST dari Web App (Menyimpan form penilaian)
// ==========================================
function doPost(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var body = JSON.parse(e.postData.contents);
    
    if(body.action === "insert") {
      var d = body.data;
      var sheet = ss.getSheetByName(d.kelas);
      
      if(!sheet) {
        return ContentService.createTextOutput(JSON.stringify({status: 'error', message: 'Sheet kelas "' + d.kelas + '" tidak ditemukan'}))
                             .setMimeType(ContentService.MimeType.JSON);
      }
      
      var data = sheet.getDataRange().getValues();
      var rowToUpdate = -1;
      
      // Cari baris siswa berdasarkan NIS (Kolom A / Index 0) mulai dari baris data (index 8)
      for(var i = 8; i < data.length; i++) {
        if(data[i][0].toString() === d.nis.toString()) {
          rowToUpdate = i + 1; // +1 karena index array mulai 0, row sheet mulai 1
          break;
        }
      }
      
      if(rowToUpdate === -1) {
        return ContentService.createTextOutput(JSON.stringify({status: 'error', message: 'Siswa dengan NIS ' + d.nis + ' tidak ditemukan di sheet ' + d.kelas}))
                             .setMimeType(ContentService.MimeType.JSON);
      }
      
      // Update data di baris yang ditemukan berdasarkan kolom yang tepat:
      // Kolom C (3) = NISN (Inputan baru)
      // Kolom E (5) = Tgl Lahir
      // Kolom F (6) = Disabilitas
      // Kolom G (7) = Tinggi Badan
      // Kolom H (8) = Berat Badan
      // Kolom I (9) = VSit 1
      // Kolom J (10) = VSit 2
      // Kolom K (11) = VSit 3
      // Kolom L (12) = VSit Terbaik
      // Kolom M (13) = Ekstrakurikuler
      
      // Tambahkan tanda petik satu (') di depan NISN agar angka 0 di depan tidak hilang
      sheet.getRange(rowToUpdate, 3).setValue("'" + d.nisn_input);
      sheet.getRange(rowToUpdate, 5).setValue(d.tgl_lahir);
      sheet.getRange(rowToUpdate, 6).setValue(d.disabilitas);
      sheet.getRange(rowToUpdate, 7).setValue(d.tinggi);
      sheet.getRange(rowToUpdate, 8).setValue(d.berat);
      sheet.getRange(rowToUpdate, 9).setValue(d.vsit1);
      sheet.getRange(rowToUpdate, 10).setValue(d.vsit2);
      sheet.getRange(rowToUpdate, 11).setValue(d.vsit3);
      sheet.getRange(rowToUpdate, 12).setValue(d.vsit_best);
      sheet.getRange(rowToUpdate, 13).setValue(d.ekskul);
      
      return ContentService.createTextOutput(JSON.stringify({status: 'success'}))
                           .setMimeType(ContentService.MimeType.JSON);
    }
  } catch(error) {
    return ContentService.createTextOutput(JSON.stringify({status: 'error', message: error.toString()}))
                         .setMimeType(ContentService.MimeType.JSON);
  }
}

// ==========================================
// Wajib ada agar Web App bisa diakses lintas domain (CORS)
// ==========================================
function doOptions(e) {
  return ContentService.createTextOutput("")
    .setMimeType(ContentService.MimeType.JSON);
}
