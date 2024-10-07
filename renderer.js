// renderer.js
window.database.getLinks((err, rows) => {
    if (err) {
      console.error(err.message);
    } else {
      console.log(rows);
      // Verileri kullanarak arayüzünüzü güncelleyebilirsiniz
    }
  });