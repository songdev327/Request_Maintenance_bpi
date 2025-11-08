const express = require('express');
const cors = require('cors');
const conn = require('./connect');   
const app = express();

// const fs = require('fs');
// const path = require('path');
// const MasterList = require('./models/MasterItemListModel');


const http = require('http');
const server = http.createServer(app);

// ⬇️ Socket.IO
const { Server } = require('socket.io');
const io = new Server(server, {
  cors: {
    origin: '*', // หรือใส่เฉพาะโดเมน front-end ของคุณ
    methods: ['GET','POST','PUT','DELETE']
  }
});

app.set('io', io); // เอา io ยัดเข้า app เพื่อไปใช้ใน controller


app.use(cors());

app.use(express.json());

require('./models/MaintenanceModel');
require('./models/UserModel');  
require('./models/ListSparePartModel');  
require('./models/MasterItemListModel');  
// ---- Auth ----
const Auth = require('./controllers/AuthController'); // ✅ ได้เป็นฟังก์ชัน (app)
app.use('/auth', Auth);    


app.use('/Maintenance', require('./controllers/MaintenanceController'));
app.use('/users', require('./controllers/UserController')); 
app.use('/SparePart', require('./controllers/ListSparePartController')); 
app.use('/MasterList', require('./controllers/MasterItemListController')); 

// // อ่านข้อมูลจากไฟล์ JSON และเพิ่มข้อมูลเข้าสู่ฐานข้อมูล
// const loadSparePartsData = async () => {
//   try {
//     const data = fs.readFileSync(path.join(__dirname, 'masterItemList.json'), 'utf-8');
//     const masterList = JSON.parse(data);

//     for (const part of masterList) {
//       await MasterList.create(part);  // ใช้ create() เพื่อเพิ่มข้อมูลในฐานข้อมูล
//     }
//     console.log('✅ Spare parts data loaded successfully');
//   } catch (err) {
//     console.error('❌ Error loading spare parts data:', err);
//   }
// };

// // โหลดข้อมูลเมื่อเริ่มต้น
// loadSparePartsData();


// ❗️authenticate + sync ตาราง
(async () => {
  try {
    await conn.authenticate();
    console.log('✅ DB connected');

    await conn.sync({ alter: true });
    console.log('✅ DB synced');

    const port = 3006;
    server.listen(port, () => {
      console.log(`🚀 Server listening on http://localhost:${port}`);
    });

    // (ไม่บังคับ) Debug การเชื่อมต่อ
    io.on('connection', (socket) => {
      console.log('🔌 socket connected', socket.id);
      socket.on('disconnect', () => console.log('🔌 socket disconnected', socket.id));
    });


  } catch (err) {
    console.error('❌ DB error:', err);
    process.exit(1);
  }
})();
