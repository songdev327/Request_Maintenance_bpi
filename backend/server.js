const express = require('express');
const cors = require('cors');
const conn = require('./connect');   
const app = express();


//-------------- Start Update data base ----------------------------------------------------

// const fs = require('fs'); // Update data base
// // const path = require('path'); // Update data base
// const SparePart = require('./models/ListSparePartModel'); // Update data base

//-------------- End Update data base --------------------------------------------------------------


const http = require('http');
const server = http.createServer(app);
const { Server } = require('socket.io');
const io = new Server(server, {
  cors: {
    origin: '*', // หรือใส่เฉพาะโดเมน front-end ของคุณ
    methods: ['GET','POST','PUT','DELETE']
  }
});
app.set('io', io);
app.use(cors());
app.use(express.json());


//------ Start Run server on Linux ----------------------------------

// const http = require('http');
// const server = http.createServer(app);

// // ========== SOCKET.IO CONFIG ==========
// const { Server } = require('socket.io');
// const io = new Server(server, {
//   cors: {
//     origin: [
//       'http://localhost:3005',
//       'http://10.120.123.25:3005',
//       'http://192.168.96.126:3005',
//     ],
//     methods: ['GET', 'POST', 'PUT', 'DELETE'],
//     credentials: true,
//   },
// });
// app.set('io', io); // ส่งไปใช้ใน controller

// // ========== CORS ==========
// const corsOptions = {
//   origin: [
//     'http://localhost:3005',
//     'http://10.120.123.25:3005',
//     'http://192.168.96.126:3005',
//   ],
//   credentials: true,
// };
// app.use(cors(corsOptions));

// app.use(express.json());

// // ========== React Build ==========
// const path = require("path");
// app.use(express.static(path.join(__dirname, "../frontend/build")));

// // ✅ เสิร์ฟ data/*.json โดยตรง
// app.use("/data", express.static(path.join(__dirname, "../frontend/build/data")));

//------ End Run server on Linux ----------------------------------


require('./models/MaintenanceModel');
require('./models/UserModel');  
require('./models/ListSparePartModel');  
require('./models/MasterItemListModel');  
require('./models/WorkGroupCodeModel');  
require('./models/MachineSerialModel');  
// ---- Auth ----
const Auth = require('./controllers/AuthController'); // ✅ ได้เป็นฟังก์ชัน (app)
const Menu = require('./controllers/MenuController'); // ✅ เพิ่มตรงนี้
app.use('/auth', Auth);    
app.use('/menu', Menu);   // ✅ API สำหรับเมนู


app.use('/Maintenance', require('./controllers/MaintenanceController'));
app.use('/users', require('./controllers/UserController')); 
app.use('/SparePart', require('./controllers/ListSparePartController')); 
app.use('/MasterList', require('./controllers/MasterItemListController')); 
app.use('/WorkGroup', require('./controllers/WorkGroupCodeController')); 
app.use('/MachineSerial', require('./controllers/MachineSerialController'));

//-------------- Start Update data base --------------------------------------------------------------
// อ่านข้อมูลจากไฟล์ JSON และเพิ่มข้อมูลเข้าสู่ฐานข้อมูล // Update data base
// const loadSparePartsData = async () => {
//   try {
//     const data = fs.readFileSync(path.join(__dirname, 'sparePartsData.json'), 'utf-8');
//     const spareParts = JSON.parse(data);

//     // เพิ่มข้อมูลทั้งหมดในไฟล์ JSON เข้าไปในฐานข้อมูล
//     for (const part of spareParts) {
//       await SparePart.create(part);
//     }
//     console.log('✅ Spare parts data loaded successfully');
//   } catch (err) {
//     console.error('❌ Error loading spare parts data:', err);
//   }
// };

// // โหลดข้อมูลเมื่อเริ่มต้น
// loadSparePartsData();

//-------------- End Update data base ---------------------------------------------------

//------ Start Run server on Linux -------------------------------------------

// ========== Fallback to React (สำหรับ React Router) ==========

// app.get(/.*/, (req, res) => {
//   res.sendFile(path.join(__dirname, "../frontend/build/index.html"));
// });



//------ End Run server on Linux --------------------------------------------



(async () => {
  try {
    await conn.authenticate();
    console.log('✅ DB connected');

    await conn.sync({ alter: true });
    console.log('✅ DB synced');

    const port = 3005;
    server.listen(port, () => {
      console.log(`🚀 Server listening on http://localhost:${port}`);
    });

    io.on('connection', (socket) => {
      console.log('🔌 socket connected', socket.id);
      socket.on('disconnect', () => console.log('🔌 socket disconnected', socket.id));
    });


  } catch (err) {
    console.error('❌ DB error:', err);
    process.exit(1);
  }
})();


//------ Start Run server on Linux -------------------------------------------

// ========== DB Connect & Start Server ==========
// (async () => {
//   try {
//     await conn.authenticate();
//     console.log('✅ DB connected');

//     await conn.sync({ alter: true });
//     console.log('✅ DB synced');

//     const port = 3005;
//     server.listen(port, '0.0.0.0', () => {
//       console.log(`🚀 Server is running on http://0.0.0.0:${port}`);
//     });

//     io.on('connection', (socket) => {
//       console.log('🔌 socket connected:', socket.id);
//       socket.on('disconnect', () => {
//         console.log('🔌 socket disconnected:', socket.id);
//       });
//     });

//   } catch (err) {
//     console.error('❌ DB error:', err);
//     process.exit(1);
//   }
// })();

//------ End Run server on Linux -------------------------------------------
