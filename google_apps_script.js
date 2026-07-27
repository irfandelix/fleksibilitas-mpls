function doPost(e) {
  try {
    var d = JSON.parse(e.postData.contents);
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Kumpulan Data");
    
    // Cari baris berdasarkan NIS di Kolom A
    var data = sheet.getDataRange().getValues();
    var rowToUpdate = -1;
    
    var payloadData = d.data || d; // Mendukung format {data: {...}} atau {...}
    for (var i = 0; i < data.length; i++) {
      if (data[i][0] == payloadData.nis) { // Cocokkan NIS (Kolom A / Index 0)
        rowToUpdate = i + 1; // getRange itu 1-indexed
        break;
      }
    }
    
    if (rowToUpdate !== -1) {
      // Update data di baris yang ditemukan:
      // Kolom L (12) = Ekstrakurikuler (Sesuai kesepakatan)
      sheet.getRange(rowToUpdate, 12).setValue(payloadData.ekskul);
      
      return ContentService.createTextOutput(JSON.stringify({status: 'success'}))
                           .setMimeType(ContentService.MimeType.JSON);
    } else {
      return ContentService.createTextOutput(JSON.stringify({status: 'error', message: 'Siswa tidak ditemukan'}))
                           .setMimeType(ContentService.MimeType.JSON);
    }
    
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({status: 'error', message: error.toString()}))
                         .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Kumpulan Data");
  var data = sheet.getDataRange().getValues();
  
  var dataSiswa = [];
  var currentClass = "";
  
  // Asumsi header ada di beberapa baris pertama, kita mulai baca dari baris ke-1 (index 0)
  for (var i = 0; i < data.length; i++) {
    var row = data[i];
    
    // Cek apakah ini baris pemisah kelas (misal "7A", "7B")
    if (row[0] && row[0].toString().match(/^7[A-Z]$/)) {
      currentClass = row[0].toString();
    } 
    // Jika bukan baris kosong, bukan header utama, dan kita sudah dapat kelasnya
    else if (row[0] && row[0] !== "NIS" && row[0] !== "LAPORAN TES FLEKSIBILITAS MPLS RAMAH 2026" && currentClass !== "") {
      
      // Filter out meta-data rows like "Nama Sekolah", "NPSN", dll (kalau ada di awal)
      if (row[0].toString() !== "Nama Sekolah" && row[0].toString() !== "NPSN" && row[0].toString() !== "Tanggal Pelaksanaan" && row[0].toString() !== "Jumlah Peserta") {
        
        var ekskulValue = row[11] || ""; // Kolom L (Index 11) = Ekstrakurikuler
        var isEkskulFilled = (ekskulValue.toString().trim() !== "");
        
        dataSiswa.push({
          nis: row[0] ? row[0].toString() : "", // Kolom A
          nisn: row[1] ? row[1].toString() : "", // Kolom B
          nama: row[2] ? row[2].toString() : "", // Kolom C = Nama Murid
          kelas: currentClass,
          ekskul: ekskulValue.toString(),
          
          // Status sekarang murni bergantung pada apakah Ekskul sudah diisi atau belum
          status: isEkskulFilled ? 'done' : 'pending' 
        });
      }
    }
  }
  
  return ContentService.createTextOutput(JSON.stringify({
    status: 'success',
    data: dataSiswa
  })).setMimeType(ContentService.MimeType.JSON);
}

function doOptions(e) {
  return ContentService.createTextOutput("")
    .setMimeType(ContentService.MimeType.TEXT)
    .setHeader("Access-Control-Allow-Origin", "*")
    .setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
    .setHeader("Access-Control-Allow-Headers", "Content-Type");
}
