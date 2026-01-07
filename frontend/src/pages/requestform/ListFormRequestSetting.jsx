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
import * as XLSX from "xlsx";
import InProgressRemarkModal from "../modals/InProgressRemarkModal";
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import "./modalApp.css"

function ListFormRequestSetting() {
    const location = useLocation();
    const machineName = location.state?.machine_request_name || "";
    const sectionName = location.state?.section || "";

    const [requests, setRequests] = useState([]);
    const [requestList, setRequestList] = useState([]);
    const [data, setData] = useState([]); // ✅ เพิ่มบรรทัดนี้
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [spareData, setSpareData] = useState([]);
    const [mode, setMode] = useState("raw"); // 'raw' | 'spare'

    const [locFilter, setLocFilter] = useState("ALL");

    const [remarkModal, setRemarkModal] = useState({ open: false, item: null });
    const [deletingId, setDeletingId] = useState(null);

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

    const handleDelete = async (item) => {
        const result = await Swal.fire({
            title: `ลบรายการ No.${item.id}?`,
            html: `<div style="text-align:left">
             <b>Machine:</b> ${item.machine_request_name ?? "-"}<br/>
             <b>Detail:</b> ${item.brief_description ?? "-"}
           </div>`,
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#d33",
            confirmButtonText: "ลบ",
            cancelButtonText: "ยกเลิก",
        });
        if (!result.isConfirmed) return;

        try {
            setDeletingId(item.id);
            // เลือก path ให้ตรงกับ API ที่คุณจะทำ (ดูหัวข้อ 2)
            await axios.delete(`${config.api_path}/Maintenance/${item.id}`);

            // เอาออกจากรายการบนหน้า (optimistic update)
            setRequests(prev => prev.filter(r => r.id !== item.id));
            setRequestList(prev => prev.filter(r => r.id !== item.id));

            Swal.fire({ icon: "success", title: "ลบสำเร็จ", timer: 900, showConfirmButton: false });
        } catch (err) {
            console.error(err);
            Swal.fire({ icon: "error", title: "ลบไม่สำเร็จ", text: "กรุณาลองใหม่" });
        } finally {
            setDeletingId(null);
        }
    };



    function decimalToTime(decimalHours) {
        if (isNaN(decimalHours) || decimalHours === null) return "00:00";

        const totalMinutes = Math.round(decimalHours * 60);
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;

        // ทำให้เป็น 2 หลักเสมอ เช่น 01:05
        const pad = (n) => String(n).padStart(2, '0');

        return `${pad(hours)}:${pad(minutes)}`;
    }


    const handleSearch = async () => {
        try {
            const response = await axios.get(`${config.api_path}/Maintenance/exportByDate`, {
                params: {
                    startDate: startDate,
                    endDate: endDate,
                    location: locFilter, // ✅ เพิ่ม location filter
                    status: "finished,in progress,กำลังดำเนินการ" // ✅ Send as string
                },
            });
            setData(response.data); // set state ของข้อมูล
            Swal.fire({
                icon: 'success',
                title: 'ค้นหาสำเร็จ',
                text: 'ข้อมูลถูกดึงมาเรียบร้อยแล้ว ✅',
                timer: 1000,
                showConfirmButton: false,
            });
        } catch (error) {
            console.error("Error loading data:", error);
            Swal.fire({
                icon: 'error',
                title: 'เกิดข้อผิดพลาด',
                text: 'ไม่สามารถค้นหาข้อมูลได้ ❌',
            });
        }
    };
    const handleSearchSpare = async () => {
        try {
            const response = await axios.get(`${config.api_path}/Maintenance/exportByDateSpare`, {
                params: {
                    startDate: startDate,
                    endDate: endDate,
                    location: locFilter // ✅ เพิ่ม location filter
                },
            });

            // ✅ กรองเฉพาะที่มี spare_parts ไม่ว่าง
            const filtered = response.data.filter(item =>
                Array.isArray(item.spare_parts) &&
                item.spare_parts.some(sp =>
                    sp &&
                    (sp.name?.trim() ||
                        sp.model?.trim() ||
                        sp.maker?.trim() ||
                        sp.qty?.trim())
                )
            );

            setSpareData(filtered);

            Swal.fire({
                icon: 'success',
                title: 'ค้นหาสำเร็จ',
                text: 'ข้อมูลถูกดึงมาเรียบร้อยแล้ว ✅',
                timer: 1000,
                showConfirmButton: false,
            });
        } catch (error) {
            console.error("Error loading data:", error);
            Swal.fire({
                icon: 'error',
                title: 'เกิดข้อผิดพลาด',
                text: 'ไม่สามารถค้นหาข้อมูลได้ ❌',
            });
        }
    };

    const handleExport = () => {
        if (!data || data.length === 0) {
            Swal.fire("ไม่มีข้อมูล", "ยังไม่มีข้อมูลสำหรับ export", "warning");
            return;
        }

        // --- helper functions ---
        const parseDate = (str) => {
            if (!str) return null;
            const [y, m, d] = str.split("-");
            return new Date(y, m - 1, d); // Excel จะเก็บเป็น serial number ของ Date
        };

        const parseTime = (str) => {
            if (!str) return null;
            const [h, m] = str.split(":");
            return (Number(h) * 60 + Number(m)) / (24 * 60); // fraction of a day
        };

        const mappedData = data.map((item) => ({
            "Record No": item.id,

            "Country Code": item.Country_Code,
            "Country Name": item.Country_Name,
            "Company Code": item.Company_Code,
            "Company Name": item.Company_Name,

            "Place Code": item.Place_Code,
            "Place Name": item.Place_Name,
            "Section Code": item.Section_Code,
            "Section Name": item.Section_Name,

            "Request No 1": item.Request_No_1,
            "Request No 2": item.Request_No_2,
            "Request No 3": item.Request_No_3,

            "Worker Code 1": item.Worker_Code_1,
            "Worker Name 1": item.Worker_Name_1,
            "Worker Code 2": item.Worker_Code_2,
            "Worker Name 2": item.Worker_Name_2,
            "Worker Code 3": item.Worker_Code_3,
            "Worker Name 3": item.Worker_Name_3,

            "Machine No": item.Machine_No,

            "Process Group Code": item.Process_Group_Code,
            "Process Group Name": item.Process_Group_Name,
            "Process Code": item.Process_Code,
            "Process Name": item.Process_Name,

            "Work Group Code": item.Work_Group_Code,
            "Work Group Name": item.Work_Group_Name,
            "Work Type Code": item.Work_Type_Code,
            "Work Type Name": item.Work_Type_Name,

            // ✅ Date/Time แก้ให้เป็น Date object หรือ fraction
            "Work Request Date": parseDate(item.Work_Request_Date),
            "Work Request Time": parseTime(item.Work_Request_Time),

            "Work Start Date": parseDate(item.Work_Start_Date),
            "Work Start Time": parseTime(item.Work_Start_Time),
            "Work End Date": parseDate(item.Work_End_Date),
            "Work End Time": parseTime(item.Work_End_Time),
            "Work Total Time": decimalToTime(item.Work_Total_Time),

            "Remark": item.Remark,

            "Attached File Name 1": item.Attached_File_Name_1,
            "Attached File Name 2": item.Attached_File_Name_2,
            "Attached File Name 3": item.Attached_File_Name_3,

            "Brief Description": item.Brief_Description,
            "Serial No": item.Serial_No,
            "Line": item.Line,
            "Model": item.Model,

            "Cause 1 Code 1": item.Cause_1_Code_1,
            "Cause 1 Name 1": item.Cause_1_Name_1,
            "Cause 1 Code 2": item.Cause_1_Code_2,
            "Cause 1 Name 2": item.Cause_1_Name_2,

            "Cause 2 Code 1": item.Cause_2_Code_1,
            "Cause 2 Name 1": item.Cause_2_Name_1,
            "Cause 2 Code 2": item.Cause_2_Code_2,
            "Cause 2 Name 2": item.Cause_2_Name_2,

            "Cause 3 Code 1": item.Cause_3_Code_1,
            "Cause 3 Name 1": item.Cause_3_Name_1,
            "Cause 3 Code 2": item.Cause_3_Code_2,
            "Cause 3 Name 2": item.Cause_3_Name_2,
        }));

        const worksheet = XLSX.utils.json_to_sheet(mappedData);

        // --- กำหนด format ให้เป็น Date/Time ---
        const range = XLSX.utils.decode_range(worksheet["!ref"]);
        for (let C = range.s.c; C <= range.e.c; ++C) {
            const header = worksheet[XLSX.utils.encode_cell({ r: 0, c: C })].v;
            for (let R = 1; R <= range.e.r; ++R) {
                const cell = worksheet[XLSX.utils.encode_cell({ r: R, c: C })];
                if (!cell) continue;

                if (header.includes("Date")) {
                    cell.z = "yyyy-mm-dd"; // Format Excel เป็นวันที่
                }
                if (header.includes("Time")) {
                    cell.z = "hh:mm"; // Format Excel เป็นเวลา
                }
            }
        }

        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Raw Data");
        XLSX.writeFile(workbook, `RawData_${startDate}_to_${endDate}.xlsx`);
    };



    const handleExportSpare = () => {
        if (!Array.isArray(spareData) || !spareData.length) return;

        const norm = v => (v ?? "").toString().trim();
        const rows = [];

        spareData.forEach(item => {
            const common = {
                Date: norm(item.date),
                "Name Work": norm(item.work_by),
                "Machine No": norm(item.machine_request_name),
                "Serial No": norm(item.Serial_No),
            };

            // ✅ กรองอะไหล่ที่ไม่ใช่ object ว่างออก
            const validParts = (item.spare_parts || []).filter(sp =>
                sp &&
                (sp.name?.trim() ||
                    sp.model?.trim() ||
                    sp.maker?.trim() ||
                    sp.qty?.trim())
            );

            validParts.forEach(sp => {
                rows.push({
                    ...common,
                    "Spare Name": norm(sp?.name),
                    "Spare Model": norm(sp?.model),
                    "Spare Maker": norm(sp?.maker),
                    "Spare Qty": norm(sp?.qty),
                    Unit: norm(sp?.unit),
                });
            });
        });

        const headers = [
            "Date", "Name Work", "Machine No", "Serial No",
            "Spare Name", "Spare Model", "Spare Maker", "Spare Qty", "Unit"
        ];

        const ws = XLSX.utils.json_to_sheet(rows, { header: headers });
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Spare_Part_Data");
        XLSX.writeFile(wb, "SparePartData.xlsx");
    };


    const ClearPage = () => {
        window.location.reload();
    }

    const handleMachineClick = (item) => {
        navigate("/resultFormProToMMSetting", { state: { machineData: item } });
    };

    // NEW: filter + sort + paginate
    const filtered = useMemo(() => {
        // กรองตาม Location_Name ก่อน
        const location = locFilter.trim().toUpperCase(); //add

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
            <div className="" id="record-check-sheetS">
                <h4 className="text-center text-bold">
                    <span className="spacing text-danger">( ADMIN PAGE )</span>
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

                        <span
                            style={{ cursor: "pointer", marginLeft: "10rem" }}
                            onClick={handleShowInProgressList}
                        >
                            <Badge badgeContent={inProgressCount} color="warning">
                                <SnowshoeingIcon
                                    className={inProgressCount > 0 ? "walk-animation" : ""}
                                    style={{ fontSize: "2.5rem", fontWeight: "bold", color: inProgressCount > 0 ? "#ffffffff" : "#9e9e9e" }}
                                />
                            </Badge>
                        </span>

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

                </h4>
            </div>

            <div className="row">
                {/* ซ้าย */}
                <div className="col-md-6">
                    <div className="m-1 border rounded border-primary p-1">
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
                            <div className="col-sm-3 col-md-3 mb-2">
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

                            <div className="col-sm-12 mt-1">
                                <button className="btn btn-danger" id="clear" onClick={() => { setQuery(""); setPage(1); }}>
                                    <RotateLeftIcon className="ml-1" /> CLEAR
                                </button>
                                <Link to='/settings'>
                                    <button type="button" className="btn btn-danger ml-4">
                                        <UndoIcon /> BACK
                                    </button>
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ขวา */}
                <div className="col-md-6">
                    <div className="m-1 border rounded border-primary p-1">
                        <div className="row align-items-end">
                            {/* วันที่ร่วมกัน */}
                            <div className="col-sm-2 col-md-3 mb-1">
                                <label className="text-bold">START DATE</label>
                                <input
                                    type="date"
                                    className="form-control"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                />
                            </div>
                            <div className="col-sm-2 col-md-3 mb-1">
                                <label className="text-bold">END DATE</label>
                                <input
                                    type="date"
                                    className="form-control"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                />
                            </div>
                            <div className="col-sm-2 col-md-2 mb-1">
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
                            <div className="col-sm-6 col-md-6 mb-2">
                                <div className="form-check form-check-inline">
                                    <input
                                        id="modeRaw"
                                        type="radio"
                                        name="mode"
                                        value="raw"
                                        className="form-check-input"
                                        checked={mode === "raw"}
                                        onChange={() => setMode("raw")}
                                    />
                                    <label className="form-check-label" htmlFor="modeRaw">
                                        RAW DATA
                                    </label>
                                </div>
                                <div className="form-check form-check-inline ml-2">
                                    <input
                                        id="modeSpare"
                                        type="radio"
                                        name="mode"
                                        value="spare"
                                        className="form-check-input"
                                        checked={mode === "spare"}
                                        onChange={() => setMode("spare")}
                                    />
                                    <label className="form-check-label" htmlFor="modeSpare">
                                        SPARE DATA
                                    </label>
                                </div>
                                <button className="btn btn-danger ml-1" onClick={ClearPage}>
                                    <RotateLeftIcon className="ml-1" /> CLEAR
                                </button>
                            </div>
                            {/* ปุ่มค้นหา (แสดงตามโหมด) */}
                            {mode === "raw" ? (
                                <>
                                    <div className="col-sm-3 col-md-3 mb-2">
                                        <button className="btn btn-primary"
                                            onClick={handleSearch}>
                                            <ManageSearchIcon /> SEARCH RAW DATA
                                        </button>
                                    </div>
                                    <div className="col-sm-3 col-md-3 mb-2">
                                        <button className="btn btn-success" onClick={handleExport}>
                                            <AiFillFileExcel style={{ marginRight: 5 }} />
                                            EXPORT RAW DATA
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="col-sm-3 col-md-3 mb-2">
                                        <button
                                            className="btn btn-primary"
                                            onClick={handleSearchSpare}
                                        >
                                            <ManageSearchIcon /> SEARCH SPARE
                                        </button>
                                    </div>
                                    <div className="col-sm-4 col-md-3 mb-2">
                                        <button
                                            className="btn btn-success"
                                            onClick={handleExportSpare}
                                        >
                                            <AiFillFileExcel style={{ marginRight: 5 }} />
                                            EXPORT SPARE PART
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>

            </div>


            {/* NEW: Pagination bar */}
            <div className="d-flex justify-content-between align-items-center mb-4 mt-2">
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
                            <th className="text-white" style={{ width: "8rem", fontSize: "0.965rem" }}>DELETE</th>
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

                                {/* <td className={item.corrective ? "approve-green" : ""}>
                                    {item.corrective || '-'}</td> */}

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

                                <td className={item.result ? "approve-green" : ""}>
                                    {item.result || '-'}</td>
                                <td className={
                                    item.pro_receive === "Receive" ? "approve-green" :
                                        item.pro_receive === "cancel" ? "approve-red" : ""}
                                >
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
                                <td>
                                    <button
                                        className="btn btn-danger"
                                        disabled={deletingId === item.id}
                                        onClick={(e) => { e.stopPropagation(); handleDelete(item); }}
                                    >
                                        {deletingId === item.id ? "DELETING..." : "DELETE"}
                                    </button>
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


        </>
    )
}


export default ListFormRequestSetting;