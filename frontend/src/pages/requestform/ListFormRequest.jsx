import { io } from "socket.io-client";
import { Link } from "react-router-dom";
import { useState, useEffect, useMemo } from "react";
import { useLocation } from 'react-router-dom'
import UndoIcon from '@mui/icons-material/Undo';
import RotateLeftIcon from '@mui/icons-material/RotateLeft';
import { AiFillFileExcel } from "react-icons/ai"; // นำเข้าไอคอน Excel
import config from "../../config";
import axios from "axios";
import Swal from "sweetalert2";
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import { Badge } from '@mui/material';
import { useNavigate } from "react-router-dom";
import SnowshoeingIcon from '@mui/icons-material/Snowshoeing';
import ManageSearchIcon from '@mui/icons-material/ManageSearch';
import InProgressRemarkModal from "../modals/InProgressRemarkModal";
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import "./modalApp.css"

import ExcelJS from "exceljs"; // อย่าลืมติดตั้ง: npm install exceljs

function ListFormRequest() {
    const location = useLocation();
    const machineName = location.state?.machine_request_name || "";
    const sectionName = location.state?.section || "";

    const [requests, setRequests] = useState([]);
    const [requestList, setRequestList] = useState([]);
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");

    const [locFilter, setLocFilter] = useState("ALL");

    const [exportRows, setExportRows] = useState([]); // เก็บผลค้นหาสำหรับแสดง count/preview ถ้าต้องการ


    const [remarkModal, setRemarkModal] = useState({ open: false, item: null });

    // เปิด/ปิด
    const openRemarkModal = (item) => setRemarkModal({ open: true, item });
    const closeRemarkModal = () => setRemarkModal({ open: false, item: null });

    // NEW: pagination states
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);            // เลือกได้ 10/20/50
    const [query, setQuery] = useState("");                  // (ทางเลือก) ค้นหาเร็ว ๆ ในหน้านี้


    const navigate = useNavigate(); // ใช้ย้อนกลับ

    // สถานะ (กันสะกด/ภาษาไม่ตรง)
    function isRequest(s = "") {
        return String(s).toLowerCase().trim() === "request";
    }
    function isInProgress(s = "") {
        const t = String(s).toLowerCase().trim();
        return t === "in progress" || t === "กำลังดำเนินการ";
    }

    const handleShowRequestList = () => {
        const requestItems = requestList.filter(item =>
            item.request_status === "request" &&
            (locFilter === "ALL" || String(item.Location_Name || "").toUpperCase() === locFilter)
        );
        if (requestItems.length === 0) {
            Swal.fire("ไม่มีรายการ Request", "", "info");
            return;
        }
        const esc = (v) =>
            String(v ?? "")
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;")
                .replace(/"/g, "&quot;")
                .replace(/'/g, "&#39;");
        const html = `
        <ul style="text-align: left;">
          ${requestItems.map(item => `<li><b>${esc(item.Location_Name ?? "-")} : ${item.date ?? "-"} : ${item.machine_request_name ?? "-"}</b>: ${item.brief_description ?? "-"}</li>`).join("")}
        </ul>`;
        Swal.fire({ title: `รายการ Request (${requestItems.length})`, html, width: 700, confirmButtonText: 'ปิด' });
    };

    const handleShowInProgressList = () => {
        const items = requestList.filter(item =>
            isInProgress(item.request_status) &&
            (locFilter === "ALL" || String(item.Location_Name || "").toUpperCase() === locFilter)
        );
        if (items.length === 0) {
            Swal.fire("ไม่มีรายการ In Progress", "", "info");
            return;
        }
        // ✅ escape ป้องกัน XSS และแก้ no-undef
        const esc = (v) =>
            String(v ?? "")
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;")
                .replace(/"/g, "&quot;")
                .replace(/'/g, "&#39;");
        const html = `
    <ul style="text-align:left; margin:0; padding-left:18px;">
      ${items.map(item => `<li><b>${esc(item.Location_Name ?? "-")} : ${item.date ?? "-"} : ${item.machine_request_name ?? "-"}</b>: ${item.brief_description ?? "-"} , 
       <span style="color:#d32f2f; font-weight:600;">${esc(item.remark_in_progress ?? "-")}</span>
        </li>`).join("")}
    </ul>`;
        Swal.fire({ title: `รายการ In Progress (${items.length})`, html, width: 800, confirmButtonText: 'ปิด' });
    };

    const handleShowApprovePendingList = () => {
        const items = requestList.filter(item =>
            item.request_status === "finished" &&
            (item.approve_by == null || String(item.approve_by).trim() === "") &&
            (locFilter === "ALL" || String(item.Location_Name || "").toUpperCase() === locFilter)
        );

        if (items.length === 0) {
            Swal.fire("ไม่มีรายการรอ Approve", "", "info");
            return;
        }

        const esc = (v) =>
            String(v ?? "")
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;")
                .replace(/"/g, "&quot;")
                .replace(/'/g, "&#39;");

        const html = `
        <ul style="text-align:left; margin:0; padding-left:18px;">
            ${items.map(item => `
                <li>
                    <b>${esc(item.Location_Name ?? "-")} : 
                    ${esc(item.date ?? "-")} : 
                    ${esc(item.machine_request_name ?? "-")}</b> :
                    <span style="color:#d32f2f; font-weight:600;">${esc(item.brief_description ?? "-")} </span> :
                    <span style="color:#0222f6; font-weight:600;">${esc(item.corrective ?? "-")} </span>
                </li>
            `).join("")}
        </ul>
    `;

        Swal.fire({
            title: `รายการรอ Approve (${items.length})`,
            html,
            width: 800,
            confirmButtonText: "ปิด"
        });
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await axios.get(`${config.api_path}/Maintenance`);
                setRequests(res.data ?? []);
                setRequestList(res.data ?? []);
            } catch (err) {
                console.error("❌ เกิดข้อผิดพลาด:", err);
            }
        };
        fetchData();
    }, []);

    // เชื่อม socket
    useEffect(() => {
        const socket = io(config.api_path, {
            transports: ['websocket'], // เร็ว/เสถียรกว่า polling
            reconnection: true,
        });

        socket.on('connect', () => console.log('🔌 connected', socket.id));

        // เมื่อมีใบแจ้งใหม่
        socket.on('maintenance:new', (record) => {
            setRequests(prev => [record, ...prev]);     // ดันขึ้นบนสุด
            setRequestList(prev => [record, ...prev]);

            // Toast แจ้งเตือน
            if (record.request_status === 'request') {
                Swal.fire({
                    toast: true, position: 'top-end', icon: 'info',
                    title: `มี Request ใหม่: ${record.machine_request_name || record.machine_no || ''}`,
                    showConfirmButton: false, timer: 2500
                });
            }
        });

        // เมื่อมีการอัปเดต (เช่น เปลี่ยนสถานะ)
        socket.on('maintenance:update', (record) => {
            setRequests(prev => prev.map(r => r.id === record.id ? { ...r, ...record } : r));
            setRequestList(prev => prev.map(r => r.id === record.id ? { ...r, ...record } : r));

            if (isInProgress(record.request_status)) {
                Swal.fire({
                    toast: true, position: 'top-end', icon: 'info',
                    title: `อัปเดตเป็น In Progress: ${record.machine_request_name || record.machine_no || ''}`,
                    showConfirmButton: false, timer: 2200
                });
            }
        });

        return () => socket.disconnect();
    }, []);


    const saveRemarkInProgress = async (remarkText) => {
        const item = remarkModal.item;
        if (!item) return;

        try {
            await axios.put(
                `${config.api_path}/Maintenance/updateRemarkInProgress/${item.id}`,
                { remark_in_progress: (remarkText ?? "").toString().toUpperCase().trim() }
            );

            // อัปเดต UI ทั้ง 2 แหล่ง
            setRequests(prev => prev.map(r => r.id === item.id ? { ...r, remark_in_progress: remarkText } : r));
            setRequestList(prev => prev.map(r => r.id === item.id ? { ...r, remark_in_progress: remarkText } : r));

            Swal.fire({ icon: "success", title: "บันทึกสำเร็จ", timer: 1000, showConfirmButton: false });
            closeRemarkModal();
        } catch (e) {
            console.error(e);
            Swal.fire({ icon: "error", title: "เกิดข้อผิดพลาด", text: "บันทึกไม่สำเร็จ" });
        }
    };


    // ที่ไฟล์ ListFormRequest.jsx
    const handleSearch = async () => {
        if (!startDate || !endDate) {
            Swal.fire("กรุณาเลือกวันที่ให้ครบ", "", "warning");
            return;
        }
        if (new Date(startDate) > new Date(endDate)) {
            Swal.fire("ช่วงวันที่ไม่ถูกต้อง", "Start ต้องไม่เกิน End", "warning");
            return;
        }

        try {
            const res = await axios.get(`${config.api_path}/Maintenance/export1`, {
                params: {
                    startDate,
                    endDate,
                    status: "finished",
                    location: locFilter,
                },
                headers: { Accept: "application/json" }, // บังคับให้ API ส่ง JSON
            });
            setExportRows(res.data ?? []);
            Swal.fire({
                icon: "success",
                title: "ค้นหาสำเร็จ",
                // text: `พบข้อมูล ${res.data?.length ?? 0} รายการ (FINISHED)`,
                timer: 1200,
                showConfirmButton: false,
            });
        } catch (e) {
            const msg =
                e?.response?.data?.detail ||
                e?.response?.data?.message ||
                e?.message ||
                "";
            console.error(e);
            Swal.fire("ค้นหาไม่สำเร็จ", msg, "error");
        }
    };

    // EXPORT → Excel
    const onExport = async () => {
        if (!startDate || !endDate) {
            Swal.fire("กรุณาเลือกวันที่ให้ครบก่อนโหลดไฟล์", "", "warning");
            return;
        }
        if (new Date(startDate) > new Date(endDate)) {
            Swal.fire("ช่วงวันที่ไม่ถูกต้อง", "Start ต้องไม่เกิน End", "warning");
            return;
        }

        try {
            const res = await axios.get(`${config.api_path}/Maintenance/export1`, {
                params: {
                    startDate,
                    endDate,
                    status: "finished",
                    location: locFilter,
                },
                responseType: "blob",
                headers: {
                    Accept: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                },
            });

            const blob = new Blob([res.data], {
                type:
                    res.headers["content-type"] ||
                    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            });

            // ✅ ตรวจสอบก่อนโหลด: ใช้ ExcelJS อ่านจาก Blob
            const buffer = await blob.arrayBuffer();
            const workbook = new ExcelJS.Workbook();
            await workbook.xlsx.load(buffer);

            const worksheet = workbook.worksheets[0]; // แผ่นแรก
            const rowCount = worksheet.actualRowCount;

            if (rowCount <= 1) {
                // ✅ มีแค่หัวตาราง (ไม่มีข้อมูล)
                Swal.fire("ไม่มีข้อมูล", "ไม่มีข้อมูลให้ดาวน์โหลด", "warning");
                return;
            }

            // ✅ ถ้ามีข้อมูล ให้ดาวน์โหลดตามปกติ
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `maintenance_${startDate}_to_${endDate}_FINISHED.xlsx`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
        } catch (e) {
            let msg = e?.message || "";
            if (e?.response?.data instanceof Blob) {
                try {
                    const txt = await e.response.data.text();
                    const j = JSON.parse(txt);
                    msg = j.detail || j.message || msg;
                } catch { }
            } else if (e?.response?.data?.message || e?.response?.data?.detail) {
                msg = e.response.data.message || e.response.data.detail;
            }
            console.error(e);
            Swal.fire("Export ไม่สำเร็จ", msg, "error");
        }
    };

    const handleMachineClick = (item) => {
        navigate("/resultFormProToMM", { state: { machineData: item } });
    };


    const filtered = useMemo(() => {
        // กรองตาม Location_Name ก่อน
        const location = locFilter.trim().toUpperCase();

        const base = locFilter === "ALL"
            ? requests
            : requests.filter(r => String(r.Location_Name || "").toUpperCase() === location);

        // แล้วค่อยกรองตามคำค้น (query)
        if (!query.trim()) return base;

        const q = query.toLowerCase();
        return base.filter(r =>
            (r.machine_request_name || "").toLowerCase().includes(q) ||
            (r.machine_status || "").toLowerCase().includes(q) ||
            (r.request_status || "").toLowerCase().includes(q) ||
            (r.brief_description || "").toLowerCase().includes(q)
        );
    }, [requests, query, locFilter]);

    const requestCount = filtered.filter(item => isRequest(item.request_status)).length;
    const inProgressCount = filtered.filter(item => isInProgress(item.request_status)).length;

    const approvePendingCount = filtered.filter(item =>
        item.request_status === "finished" &&
        (item.approve_by == null || String(item.approve_by).trim() === "")
    ).length;

    const totalItems = filtered.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

    // ถ้า page เกินหลัง filter เปลี่ยน ให้ดึงกลับมาที่หน้าสุดท้ายที่มีจริง
    useEffect(() => {
        if (page > totalPages) setPage(totalPages);
    }, [totalPages, page]);

    const startIdx = (page - 1) * pageSize;
    const currentRows = filtered.slice(startIdx, startIdx + pageSize);

    const goto = (p) => setPage(Math.min(Math.max(1, p), totalPages));



    return (
        <>
            <div className="" id="record-check-sheet">
                <h2 className="text-center text-bold">
                    LIST REQUEST DETAIL ( BOARD MM )
                    <span style={{ color: "rgba(0, 154, 8, 1)" }}>
                        ( {sectionName || locFilter} {machineName ? `/ ${machineName}` : ""} )
                    </span>
                    <div style={{ textAlign: "right" }} className="mr-5">
                        {requestCount > 0 ? (
                            <div style={{ textAlign: "right" }} className="mr-5">
                                <Badge badgeContent={requestCount} color="error" onClick={handleShowRequestList} style={{ cursor: "pointer" }}>
                                    <NotificationsActiveIcon style={{ fontSize: "2.0rem" }} />
                                </Badge>
                            </div>
                        ) : (
                            <div style={{ textAlign: "right" }} className="mr-5">
                                <NotificationsActiveIcon style={{ fontSize: "2.0rem" }} />
                            </div>
                        )}
                    </div>
                </h2>
                <div className="d-flex justify-content-end" style={{ marginRight: "12rem" }}
                    onClick={handleShowInProgressList}
                >
                    <Badge badgeContent={inProgressCount} color="warning">
                        <SnowshoeingIcon
                            className={inProgressCount > 0 ? "walk-animation" : ""}
                            style={{ fontSize: "2.5rem", fontWeight: "bold", color: inProgressCount > 0 ? "#ffffffff" : "#9e9e9e" }}
                        />
                    </Badge>
                </div>
                
                <div
                    style={{ textAlign: "left", cursor: approvePendingCount > 0 ? "pointer" : "default" }}
                    className="mr-5"
                    onClick={() => {
                        if (approvePendingCount > 0) {
                            handleShowApprovePendingList();
                        }
                    }}
                >
                    {approvePendingCount > 0 ? (
                        <Badge badgeContent={approvePendingCount} color="success">
                            <CheckCircleOutlineIcon
                                style={{ fontSize: "2.2rem", color: "#2e7d32" }}
                            />
                        </Badge>
                    ) : (
                        <CheckCircleOutlineIcon
                            style={{ fontSize: "2.2rem", color: "#9e9e9e" }}
                        />
                    )}
                </div>

            </div>

            {/* Toolbar ค้นหา + page size */}
            <div className="row">
                <div className="col-md-6">
                    <div className="m-1 rounded p-1" id="board-mm">
                        <div className="row align-items-end">
                            <div className="col-sm-2 col-md-2 mb-2">
                                <label className="text-bold">LOCATION:</label>
                                <select
                                    className="form-control text-primary fw-bold"
                                    value={locFilter}
                                    onChange={(e) => { setLocFilter(e.target.value.toUpperCase()); goto(1); }}
                                >
                                    <option value="ALL">ALL</option>
                                    <option value="BPI">BPI</option>
                                    <option value="BPI TO NVK">BPI TO NVK</option>
                                    <option value="NVK">NVK</option>
                                </select>
                            </div>
                            <div className="col-sm-5 col-md-5 mb-2">
                                <label className="text-bold">SEARCH: (MC / STATUS / DETAIL)</label>
                                <input
                                    value={query}
                                    onChange={(e) => { setQuery(e.target.value); goto(1); }} // รีเซ็ตไปหน้า 1
                                    className="form-control"
                                    placeholder="Search......"
                                />
                            </div>
                            <div className="col-sm-2 col-md-2 mb-2">
                                <label className="text-bold">SHOW/PAGE:</label>
                                <select
                                    style={{ backgroundColor: "rgba(221, 221, 221, 1)", color: "blue" }}
                                    className="form-control"
                                    value={pageSize}
                                    onChange={(e) => { setPageSize(Number(e.target.value)); goto(1); }}
                                >
                                    <option value={10}>10</option>
                                    <option value={20}>20</option>
                                    <option value={50}>50</option>
                                    <option value={100}>100</option>
                                </select>
                            </div>
                            <div className="col-sm-3 col-md-3 mb-2">
                                <button className="btn btn-danger ml-3" id="clear" onClick={() => { setQuery(""); setPage(1); }}>
                                    CLEAR <RotateLeftIcon />
                                </button>
                            </div>
                            <div className="col-sm-2 col-md-2 mb-2">
                                <Link to='/dashboardMM'>
                                    <button className="btn btn-danger" id="clear" onClick={() => { setQuery(""); setPage(1); }}>
                                        <UndoIcon className="ml-1" />
                                        BACK
                                    </button>
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="col-md-6">
                    <div className="m-1 rounded p-1" id="board-mm">
                        <div className="row align-items-end">
                            <div className="col-sm-3 col-md-3 mb-1">
                                <label className="text-bold">START DATE</label>
                                <input
                                    type="date"
                                    className="form-control"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                />
                            </div>
                            <div className="col-sm-3 col-md-3 mb-1">
                                <label className="text-bold">END DATE</label>
                                <input
                                    type="date"
                                    className="form-control"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                />
                            </div>
                            <div className="col-sm-2 col-md-2 mb-2">
                                <label className="text-bold">LOCATION:</label>
                                <select
                                    className="form-control text-primary fw-bold"
                                    value={locFilter}
                                    onChange={(e) => { setLocFilter(e.target.value.toUpperCase()); goto(1); }}
                                >
                                    <option value="ALL">ALL</option>
                                    <option value="BPI">BPI</option>
                                    <option value="BPI TO NVK">BPI TO NVK</option>
                                    <option value="NVK">NVK</option>
                                </select>
                            </div>
                            <div className="col-sm-3 col-md-3 mb-1 ml-4">
                                <button className="btn btn-primary"
                                    onClick={handleSearch}
                                >
                                    <ManageSearchIcon /> SEARCH
                                </button>

                            </div>
                            <div className="col-sm-4 col-md-4 mb-2 mt-1">

                                <button className="btn btn-success" id="export" onClick={onExport}>
                                    <AiFillFileExcel />
                                    EXPORT TO EXCEL
                                </button>
                            </div>
                            <div className="col-sm-2 col-md-2 mb-2">
                                <Link to='/dashboardMM'>
                                    <button className="btn btn-danger" id="clear" onClick={() => { setQuery(""); setPage(1); }}>
                                        <UndoIcon className="ml-1" />
                                        BACK
                                    </button>
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>

            </div>

            {/* ตาราง */}
            <div className="table-responsive">
                <table className="table table-bordered table-striped table-bordered-black">
                    <thead className="table-dark">
                        <tr>
                            <th className="text-white" style={{ width: "5rem", fontSize: "0.965rem" }}>NO</th>
                            <th className="text-white" style={{ width: "12.5rem", fontSize: "0.965rem" }}>DATE</th>
                            <th className="text-white" style={{ width: "5.5rem", fontSize: "0.965rem" }}>M/C NO</th>
                            <th className="text-white" style={{ width: "18rem", fontSize: "0.965rem" }}>DETAIL</th>
                            <th className="text-white" style={{ width: "8rem", fontSize: "0.965rem" }}>STATUS MC</th>
                            <th className="text-white" style={{ width: "12rem", fontSize: "0.965rem" }}>NAME MM</th>
                            <th className="text-white" style={{ width: "10rem", fontSize: "0.965rem" }}>STATUS REQUEST</th>
                            <th className="text-white" style={{ width: "10rem", fontSize: "0.965rem" }}>CORRECTIVE</th>
                            <th className="text-white" style={{ width: "8rem", fontSize: "0.965rem" }}>RESULT</th>
                            <th className="text-white" style={{ width: "8rem", fontSize: "0.965rem" }}>PRO RECEIVE</th>
                            <th className="text-white" style={{ width: "8rem", fontSize: "0.965rem" }}>APPROVE BY</th>
                        </tr>
                    </thead>
                    <tbody>
                        {currentRows.length > 0 ? currentRows.map((item) => (
                            <tr key={item.id}>
                                <td>{item.id}</td>
                                <td>
                                    {item.createdAt ? new Date(item.createdAt).toLocaleString('en-GB', { hour12: false }) : "-"}
                                    <br />
                                    {item.requestor_name || ""}
                                </td>
                                <td onClick={() => handleMachineClick(item)} style={{ cursor: "pointer", textDecoration: "underline" }}>
                                    {item.machine_request_name || "-"}
                                </td>
                                <td>{item.brief_description}</td>
                                <td>{item.machine_status}</td>
                                <td>
                                    {item.receive_by}
                                    <br />
                                    {item.receive_time}
                                </td>

                                <td
                                    className={
                                        item.request_status === "request" ? "status-request" :
                                            item.request_status === "in progress" ? "status-inprogress" :
                                                item.request_status === "cancel" ? "status-cancel" :
                                                    item.request_status === "finished" ? "status-finished" : ""
                                    }
                                    onClick={() => { if (isInProgress(item.request_status)) openRemarkModal(item); }}
                                    style={{ cursor: isInProgress(item.request_status) ? "pointer" : "default" }}
                                    title={isInProgress(item.request_status) ? "คลิกเพื่อกรอก Remark in progress" : undefined}
                                >
                                    {item.request_status}
                                    <br />
                                    {item.to_time}
                                    <br />
                                    {item.work_by}
                                </td>

                                {/* <td className={item.corrective ? "approve-green" : ""}
                                >
                                    {item.corrective || '-'}
                                </td> */}

                                  <td
                                    className={
                                        item.corrective
                                            ? String(item.corrective).toUpperCase().includes("WAIT SPARE PART")
                                                ? "approve-orange"
                                                : "approve-green"
                                            : ""
                                    }
                                >
                                    {item.corrective || "-"}
                                </td>


                                <td className={item.result ? "approve-green" : ""}
                                >
                                    {item.result || '-'}
                                </td>
                                <td className={
                                    item.pro_receive === "Receive" ? "approve-green" :
                                        item.pro_receive === "cancel" ? "approve-red" : ""}>
                                    {item.pro_receive || '-'}

                                    <br />

                                    {
                                        (() => {
                                            const v = item.repair_accept_time;
                                            if (!v) return "-";
                                            const s = String(v).trim();

                                            // รูปแบบเวลาเช่น "20:15", "20:15:30", "8:05 pm"
                                            const m = s.match(/^(\d{1,2}):(\d{2})(?::\d{2})?\s*([AaPp][Mm])?$/);
                                            if (m) {
                                                let h = parseInt(m[1], 10);
                                                const min = m[2];
                                                const ap = (m[3] || "").toLowerCase();
                                                if (ap === "pm" && h < 12) h += 12;
                                                if (ap === "am" && h === 12) h = 0;
                                                return `${String(h).padStart(2, "0")}:${min}`;
                                            }

                                            // ถ้าเป็นวันที่/เวลาแบบ ISO
                                            const d = new Date(s);
                                            if (!Number.isNaN(d.getTime())) {
                                                const hh = String(d.getHours()).padStart(2, "0");
                                                const mm = String(d.getMinutes()).padStart(2, "0");
                                                return `${hh}:${mm}`;
                                            }

                                            // กรณีอื่น ๆ ที่ยังมี ":" อย่างน้อย -> เก็บแค่ HH:MM
                                            return s.includes(":") ? s.split(":").slice(0, 2).join(":") : s;
                                        })()
                                    }

                                    <br />
                                    {item.repair_accept_by || '-'}

                                </td>

                                <td className={item.approve_by ? "approve-green" : ""}>
                                    {item.approve_by || "-"}
                                </td>
                            </tr>
                        )) : (
                            <tr><td colSpan={7} className="text-center">ไม่มีข้อมูล</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
            <InProgressRemarkModal
                open={remarkModal.open}
                defaultRemark={remarkModal.item?.remark_in_progress || ""}
                onClose={closeRemarkModal}
                onSave={saveRemarkInProgress}
            />

            {/* NEW: Pagination bar */}
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>แสดง {totalItems === 0 ? 0 : startIdx + 1}-{Math.min(startIdx + pageSize, totalItems)} จาก {totalItems} รายการ</div>
                <nav>
                    <ul className="pagination mb-0">
                        <li className={`page-item ${page === 1 ? "disabled" : ""}`}>
                            <button className="page-link" onClick={() => goto(1)}>« First</button>
                        </li>
                        <li className={`page-item ${page === 1 ? "disabled" : ""}`}>
                            <button className="page-link" onClick={() => goto(page - 1)}>‹ Prev</button>
                        </li>

                        {/* แสดงหมายเลขหน้าแบบย่อ */}
                        {Array.from({ length: totalPages }, (_, i) => i + 1)
                            .filter(p => (p === 1 || p === totalPages || Math.abs(p - page) <= 2))
                            .map((p, idx, arr) => {
                                const prev = arr[idx - 1];
                                const needDots = prev && p - prev > 1;
                                return (
                                    <>
                                        {needDots && (
                                            <li key={`dots-${p}`} className="page-item disabled">
                                                <span className="page-link">…</span>
                                            </li>
                                        )}
                                        <li key={p} className={`page-item ${p === page ? "active" : ""}`}>
                                            <button className="page-link" onClick={() => goto(p)}>{p}</button>
                                        </li>
                                    </>
                                );
                            })
                        }

                        <li className={`page-item ${page === totalPages ? "disabled" : ""}`}>
                            <button className="page-link" onClick={() => goto(page + 1)}>Next ›</button>
                        </li>
                        <li className={`page-item ${page === totalPages ? "disabled" : ""}`}>
                            <button className="page-link" onClick={() => goto(totalPages)}>Last »</button>
                        </li>
                    </ul>
                </nav>
            </div>
        </>
    )
}



export default ListFormRequest;