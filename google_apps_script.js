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
    // Baris 8 adalah Header (nis, No Absen, Nama Murid, dll)
    // Data siswa dimulai dari index 8 (Baris 9 di spreadsheet)
    for(var i = 8; i < data.length; i++) {
      var nis = data[i][0]; // Kolom A
      var nama = data[i][2]; // Kolom C (Index 2)
      var tinggi = data[i][5]; // Kolom F (Index 5)
      
      if(nis && nama) { // Jika nis dan Nama tidak kosong
        result.push({
          kelas: namaKelas,
          nis: nis.toString(),
          nama: nama.toString(),
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
      
      // Cari baris siswa berdasarkan nis (Kolom A / Index 0) mulai dari baris data (index 8)
      for(var i = 8; i < data.length; i++) {
        if(data[i][0].toString() === d.nis.toString()) {
          rowToUpdate = i + 1; // +1 karena index array mulai 0, row sheet mulai 1
          break;
        }
      }
      
      if(rowToUpdate === -1) {
        return ContentService.createTextOutput(JSON.stringify({status: 'error', message: 'Siswa dengan nis ' + d.nis + ' tidak ditemukan di sheet ' + d.kelas}))
                             .setMimeType(ContentService.MimeType.JSON);
      }
      
      // Update data di baris yang ditemukan berdasarkan kolom yang tepat:
      // Kolom D (4) = Tgl Lahir
      // Kolom E (5) = Disabilitas
      // Kolom F (6) = Tinggi Badan
      // Kolom G (7) = Berat Badan
      // Kolom H (8) = VSit 1
      // Kolom I (9) = VSit 2
      // Kolom J (10) = VSit 3
      // Kolom K (11) = VSit Terbaik
      
      sheet.getRange(rowToUpdate, 4).setValue(d.tgl_lahir);
      sheet.getRange(rowToUpdate, 5).setValue(d.disabilitas);
      sheet.getRange(rowToUpdate, 6).setValue(d.tinggi);
      sheet.getRange(rowToUpdate, 7).setValue(d.berat);
      sheet.getRange(rowToUpdate, 8).setValue(d.vsit1);
      sheet.getRange(rowToUpdate, 9).setValue(d.vsit2);
      sheet.getRange(rowToUpdate, 10).setValue(d.vsit3);
      sheet.getRange(rowToUpdate, 11).setValue(d.vsit_best);
      
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
