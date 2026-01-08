import { useLocation } from 'react-router-dom';
import { useEffect, useState, useRef, useMemo } from 'react';
import axios from 'axios';
import config from '../../config';
import { useNavigate } from "react-router-dom";
import UndoIcon from '@mui/icons-material/Undo';
import Swal from "sweetalert2";
import DownloadForOfflineIcon from '@mui/icons-material/DownloadForOffline';
import "./modalApp.css"

import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

function ResultFormProToMM() {
    const location = useLocation();
    const machineData = location.state?.machineData;

    const id = machineData?.id;

    const isInitialLoad = useRef(true);
    const navigate = useNavigate(); // ใช้ย้อนกลับ
    const pdfRef = useRef(null);

    const [mmUsers, setMmUsers] = useState([]);
    const [selectedEmployeeCode, setSelectedEmployeeCode] = useState("");
    const [isApproveModalOpen, setApproveModalOpen] = useState(false);
    const [serialNumber, setSerialNumber] = useState("");

    const [workGroupList, setWorkGroupList] = useState([]);
    const [filteredWorkTypes, setFilteredWorkTypes] = useState([]);

    // ตัวเลือกจากไฟล์
    const [correctiveOptions, setCorrectiveOptions] = useState([]);
    const [correctiveQuery, setCorrectiveQuery] = useState("");
    const [openCorrective, setOpenCorrective] = useState(false);
    const [hiIdx, setHiIdx] = useState(-1); // ไฮไลต์ด้วยคีย์บอร์ด


    // ⬅️ อ้างอิง A4 กล่องที่จะทำ PDF
    // ✅ ดึง id จาก URL
    const [formData, setFormData] = useState({
        receive_by: "",
        receive_time: "",
        work_by: "",
        from_date: "",
        from_time: "",
        to_date: "",
        to_time: "",
        total_hr: "",
        cause_member_mode: "",
        corrective: "",
        result: "",
        cause_mm: "",

        cause_member: {
            not_understand: false,
            not_checking: false,
            absent: false,
            not_carefully: false,
            repair_error: false,
        },
        cause_machine: {
            // production: false,
            operate_error: false,
            design_error: false,
            // quality_fail: false,
            // inappropriate: false,
            // not_lubricant: false,
            // loosen: false,
        },
        cause_spare: {
            spare_damage: false,
            // product_spare_error: false,
            quality_fail: false,
            inappropriate: false,
            not_lubricant: false,
            loosen: false,
        },
        cause_product_process: {
            dirty: false,
            high_temp: false,
            product_spare_error: false,
            water_leak: false,
            chemical_gas: false,
        },
        spare_parts: [],
        control: "",
        approve_by: "",

        Work_Group_Name: "",
        Work_Group_Code: "",
        Work_Type_Name: "",
        Work_Type_Code: ""
    });


    const causeMappings = {
        //member
        not_understand: {
            code_1: "CP101",
            name_1: "MEMBER",
            code_2: "C2101",
            name_2: "NOT UNDERSTAND"
        },
        not_checking: {
            code_1: "CP101",
            name_1: "MEMBER",
            code_2: "C2102",
            name_2: "NOT CHECKING"
        },
        absent: {
            code_1: "CP101",
            name_1: "MEMBER",
            code_2: "C2103",
            name_2: "ABSENT"
        },
        not_carefully: {
            code_1: "CP101",
            name_1: "MEMBER",
            code_2: "C2104",
            name_2: "NOT CAREFULLY"
        },
        repair_error: {
            code_1: "CP101",
            name_1: "MEMBER",
            code_2: "C2105",
            name_2: "REPAIR ERROR"
        },
        // เครื่องจักร
        operate_error: {
            code_1: "CP102",
            name_1: "MACHINE",
            code_2: "C2201",
            name_2: "OPERATE ERROR"
        },

        // รูปพัณฑ์
        spare_damage: {
            code_1: "CP103",
            name_1: "SPAREPARTS",
            code_2: "C2301",
            name_2: "DEGENERATE"
        },
        quality_fail: {
            code_1: "CP103",
            name_1: "SPAREPARTS",
            code_2: "C2302",
            name_2: "QUALITY FAIL"
        },
        inappropriate: {
            code_1: "CP103",
            name_1: "SPAREPARTS",
            code_2: "C2303",
            name_2: "UN APPROPRIATE"
        },
        not_lubricant: {
            code_1: "CP103",
            name_1: "SPAREPARTS",
            code_2: "C2304",
            name_2: "NOT LUBRICANT"
        },
        loosen: {
            code_1: "CP103",
            name_1: "SPAREPARTS",
            code_2: "C2305",
            name_2: "LOOSEN"
        },

        // กระบวนการผลิต
        dirty: {
            code_1: "CP104",
            name_1: "PRODUCT PRO.",
            code_2: "C2401",
            name_2: "DIRTY"
        },
        high_temp: {
            code_1: "CP104",
            name_1: "PRODUCT PRO.",
            code_2: "C2402",
            name_2: "HIGH TEMP"
        },
        water_leak: {
            code_1: "CP104",
            name_1: "PRODUCT PRO.",
            code_2: "C2403",
            name_2: "WATER LEAK"
        },
        chemical_gas: {
            code_1: "CP104",
            name_1: "PRODUCT PRO.",
            code_2: "C2404",
            name_2: "CHEMICAL GAS"
        },
        product_spare_error: {
            code_1: "CP104",
            name_1: "PRODUCT PRO.",
            code_2: "C2405",
            name_2: "PRODUCT SPARE ERROR"
        }
    };

    useEffect(() => {
        if (id) {
            fetchFormData();
        }
    }, []);

    // โหลดรายชื่อผู้ใช้ที่เป็น Maintenance
    useEffect(() => {
        const loadUsers = async () => {
            try {
                const res = await axios.get(`${config.api_path}/users?process=Maintenance`);
                setMmUsers(res.data ?? []);
            } catch (e) {
                console.error("โหลดรายชื่อ Maintenance ไม่สำเร็จ:", e);
            }
        };
        loadUsers();
    }, []);

    useEffect(() => {
        const total = calcTotalHours(
            formData.from_date,
            formData.from_time,
            formData.to_date,
            formData.to_time
        );

        setFormData(prev => {
            const next = total ?? "";
            // กัน set ซ้ำ ๆ
            if ((prev.total_hr ?? "") === next) return prev;
            return { ...prev, total_hr: next };
        });
    }, [formData.from_date, formData.from_time, formData.to_date, formData.to_time]);

    useEffect(() => {
        if (formData.receive_by && (!formData.receive_time || formData.receive_time.trim() === "")) {
            setFormData(prev => ({ ...prev, receive_time: nowHHMM() }));
        }
    }, [formData.receive_by, formData.work_by]);


    useEffect(() => {
        const fetchSerialNo = async () => {
            if (isApproveModalOpen && machineData?.machine_request_name) {
                try {
                    const res = await axios.get(`${config.api_path}/MachineSerial/serialGet`, {
                        params: { machineNo: machineData.machine_request_name }
                    });

                    if (res.data?.length > 0) {
                        const match = res.data.find(
                            item => item.Machine_No === machineData.machine_request_name
                        );
                        if (match) {
                            setSerialNumber(match.Serial_No);
                        } else {
                            setSerialNumber(""); // fallback
                        }
                    } else {
                        setSerialNumber(""); // fallback
                    }
                } catch (err) {
                    console.error("❌ ดึง Serial Number ไม่สำเร็จ:", err);
                    setSerialNumber("");
                }
            }
        };

        fetchSerialNo();
    }, [isApproveModalOpen, machineData]);

    useEffect(() => {
        axios.get(`${config.api_path}/WorkGroup/api`) // เปลี่ยน URL ตามจริง
            .then((res) => {
                setWorkGroupList(res.data);
            })
            .catch((err) => {
                console.error("Error fetching work group data:", err);
            });
    }, []);


    useEffect(() => {
        if (machineData?.Worker_Code_1) {
            setSelectedEmployeeCode(machineData.Worker_Code_1);
        }
    }, [machineData]);



    // อัปเปอร์เคสสม่ำเสมอ
    const toUpper = (s) => (s ?? "").toString().toUpperCase();

    // โหลด JSON ครั้งเดียว
    useEffect(() => {
        fetch("/data/case_action.json")
            .then(r => r.json())
            .then(data => {
                setCorrectiveOptions(data.corrective || []);
            })
            .catch(err => console.error("โหลด case_action.json ไม่สำเร็จ:", err));
    }, []);

    // เลือกแล้วใส่ลงฟอร์ม
    const selectCorrective = (opt) => {
        if (!opt) return;
        setFormData(prev => ({ ...prev, corrective: toUpper(opt) }));
        setCorrectiveQuery("");
        setHiIdx(-1);
        setOpenCorrective(false);
    };

    // กรองแบบ contains (ไม่สนตัวพิมพ์ใหญ่-เล็ก)
    const filteredCorrective = useMemo(() => {
        const q = correctiveQuery.trim().toLowerCase();
        if (!q) return correctiveOptions;
        return correctiveOptions.filter(o => o.toLowerCase().includes(q));
    }, [correctiveQuery, correctiveOptions]);

    const fetchFormData = async () => {
        try {
            const response = await axios.get(`${config.api_path}/Maintenance/${id}`);

            // ป้องกันการ overwrite ตอน user กำลังพิมพ์
            if (isInitialLoad.current) {
                setFormData(prev => ({
                    ...prev,
                    ...response.data,
                    cause_member: response.data.cause_member || prev.cause_member,
                    cause_machine: response.data.cause_machine || prev.cause_machine,
                    cause_spare: response.data.cause_spare || prev.cause_spare,
                    cause_product_process: response.data.cause_product_process || prev.cause_product_process,
                    spare_parts: response.data.spare_parts || [],
                }));
                isInitialLoad.current = false;
            }
        } catch (err) {
            console.error("❌ ไม่สามารถโหลดข้อมูล:", err);
        }
    };


    if (!formData) {
        return <div>Loading...</div>;
    }

    function Area({ label, col = 12, rows = 3, value, onChange, readOnly = false }) {
        return (
            <div className={`mr-col-${to24(col)} mr-line-wrap`}>
                <div className="mr-label">{label}</div>
                <textarea
                    rows={rows}
                    className={`mr-box dotted text-primary ${readOnly ? 'readonly-textarea' : ''}`}
                    value={value}
                    onChange={(e) => {
                        if (!readOnly && onChange) {
                            onChange(e.target.value);
                        }
                    }}
                    readOnly={readOnly}
                />
            </div>
        );
    }

    function to24(c) {
        const v = Math.round(c * 2); // 0..24
        return Math.max(1, Math.min(24, v));
    }

    /* ---------- Small building blocks ---------- */
    function Line({ label, col = 12, value, onChange, type = "text", readOnly = false }) {
        return (
            <div className={`mr-col-${to24(col)} mr-line-wrap`}>
                <div className="mr-label" style={{ fontSize: "0.9rem" }}>{label}</div>
                <input
                    className="mr-line text-primary"
                    type={type}
                    value={value}
                    // onChange={(e) => onChange(e.target.value)}
                    onChange={(e) => !readOnly && onChange(e.target.value)}
                    readOnly={readOnly}
                />
            </div>
        );
    }

    function setField(fieldName, value) {
        setFormData((prev) => ({
            ...prev,
            [fieldName]: value
        }));
    }

    // helper ทำให้เปรียบเทียบค่าได้เสถียร
    const normalize = (s) => (s || "").replace(/\s+/g, " ").trim();;

    const currentReceiveBy = normalize(formData.receive_by);


    // ตรวจว่าค่าที่ดึงจาก DB ตรงกับ option ใดหรือไม่
    const hasReceiveByInList = mmUsers.some(
        (u) => normalize(`${u.username} ${u.lastname || ""}`) === currentReceiveBy
    );


    // ...อยู่ใต้ setField(...) จะดีสุด
    // helper ให้เป็น HH:MM เสมอ
    const nowHHMM = () => {
        const d = new Date();
        const hh = String(d.getHours()).padStart(2, "0");
        const mm = String(d.getMinutes()).padStart(2, "0");
        return `${hh}:${mm}`;
    };

    // เมื่อเลือกช่าง: เซ็ตทั้ง receive_by และ receive_time (ถ้ายังว่าง)
    const onReceiveByChange = (val) => {
        setFormData((prev) => ({
            ...prev,
            receive_by: val,
            work_by: val,  // 👈 ให้ตามค่าที่เลือก
            receive_time: prev.receive_time && prev.receive_time.trim() !== ""
                ? prev.receive_time
                : nowHHMM(),
        }));
    };

    // ตัวใหม่: เปลี่ยนเฉพาะ work_by
    const onWorkByChange = (val) => {
        const selectedUser = mmUsers.find(
            u => normalize(`${u.username} ${u.lastname || ""}`) === val
        );

        setFormData(prev => ({
            ...prev,
            work_by: val,
        }));

        // เซ็ต employee code จาก user ที่เลือก
        setSelectedEmployeeCode(selectedUser?.employee || "");
    };

    const handleUpdate_request = async () => {
        const updateId = formData.id;
        const { receive_by, receive_time } = formData;

        if (!updateId) {
            Swal.fire({
                icon: "error",
                title: "ไม่พบ ID",
                text: "ไม่สามารถอัปเดตข้อมูลได้เนื่องจากไม่พบ ID",
            });
            return;
        }

        if (!receive_by || !receive_time) {
            Swal.fire({
                icon: "warning",
                title: "กรอกข้อมูลไม่ครบ",
                text: "กรุณากรอก Receive by และ Receive time ให้ครบก่อนบันทึก",
            });
            return;
        }

        try {
            await axios.put(`${config.api_path}/Maintenance/update/${updateId}`, {
                // ...formData,
                request_status: "in progress",
                receive_time: receive_time,
                receive_by: formData.receive_by,
            });

            // ✅ โหลดข้อมูลใหม่หลังจากบันทึกเสร็จ
            const response = await axios.get(`${config.api_path}/Maintenance/${updateId}`);
            setFormData(response.data);

            Swal.fire({
                icon: "success",
                title: "บันทึกสำเร็จ",
                text: "ข้อมูลได้รับการอัปเดตเรียบร้อยแล้ว",
                timer: 1500
            }).then(() => {
                navigate("/listFormRequest");  // ย้ายหลังจากกด OK ใน Swal
            });

        } catch (err) {
            console.error("❌ บันทึกไม่สำเร็จ:", err);
            Swal.fire({
                icon: "error",
                title: "เกิดข้อผิดพลาด",
                text: "ไม่สามารถบันทึกข้อมูลได้ กรุณาลองใหม่",
            });
        }
    };

    const setNested = (g, k, v) =>
        setFormData((p) => ({ ...p, [g]: { ...p[g], [k]: v } }));

    const handleSpareChange = async (index, field, value) => {
        const updatedSpareParts = [...formData.spare_parts];
        updatedSpareParts[index][field] = value;

        if (field === "model") {
            try {
                const response = await axios.get(`${config.api_path}/SparePart/search`, {
                    params: { model: value }, // 👈 ป้องกัน cache
                    headers: {
                        "Cache-Control": "no-cache",
                        Pragma: "no-cache",
                        Expires: "0",
                    },
                });

                const data = response.data;

                if (data) {
                    updatedSpareParts[index].name = data.name_spare || "";
                    updatedSpareParts[index].model = data.spec_spare || value;
                    updatedSpareParts[index].maker = data.maker_spare || "";
                    updatedSpareParts[index].unit = data.unit_spare || "";
                }
            } catch (error) {
                console.error("❌ Error fetching spare part:", error);
            }
        }

        setFormData(prev => ({
            ...prev,
            spare_parts: updatedSpareParts
        }));
    };

    const normalizeTime = (t) => {
        if (!t) return "";
        const s = String(t).trim();
        const ampm = s.match(/\b(am|pm)\b/i);
        if (!ampm) return s.slice(0, 5); // "10:16" → "10:16"
        const [hm] = s.split(/\s+/);
        let [h, m] = hm.split(':').map(Number);
        const isPM = ampm[1].toLowerCase() === 'pm';
        if (isPM && h < 12) h += 12;
        if (!isPM && h === 12) h = 0;
        return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    };

    const toDateTime = (d, t) => {
        if (!d || !t) return null;
        const [Y, M, D] = d.split('-').map(Number);
        const [h, m] = normalizeTime(t).split(':').map(Number);
        return new Date(Y, (M ?? 1) - 1, D ?? 1, h ?? 0, m ?? 0, 0, 0);
    };

    const calcTotalHours = (from_date, from_time, to_date, to_time) => {
        const from = toDateTime(from_date, from_time);
        const to = toDateTime(to_date, to_time);
        if (!from || !to) return "";
        const diffMs = to.getTime() - from.getTime();
        if (diffMs < 0) return "";
        const hours = diffMs / (1000 * 60 * 60);
        return hours.toFixed(2); // ⬅️ บังคับเป็นทศนิยม 2 หลักเสมอ
    };

    const handleTimeBlur = (value) => {
        if (!value) return;
        const isValid = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/.test(value);
        if (!isValid) {
            Swal.fire({
                icon: "warning",
                title: "รูปแบบเวลาไม่ถูกต้อง",
                text: "กรุณากรอกเวลาเป็น 00:00 - 23:59 (เช่น 08:00, 14:30)",
            });
        }
    };


    const handleUpdate_request_to_pro = async () => {
        const safeTotal = calcTotalHours(
            formData.from_date,
            formData.from_time,
            formData.to_date,
            formData.to_time
        );

        if (safeTotal === "") {
            Swal.fire({
                icon: "warning",
                title: "ตรวจสอบช่วงเวลา",
                text: "กรุณากรอก FROM/TO ให้ครบ และให้ TO มากกว่า FROM",
            });
            return;
        }

        if (!formData.corrective || !formData.result) {
            Swal.fire({
                icon: "warning",
                title: "ข้อมูลไม่ครบ",
                text: "กรุณากรอก Corrective และ Result ให้ครบก่อนบันทึก",
            });
            return;
        }

        // ตรวจสอบ Spare Parts: ถ้ามี name, model, maker, unit แต่ไม่มี qty ให้แสดงแจ้งเตือน
        const missingQty = formData.spare_parts.find(
            (sp) =>
                (sp.name || sp.model || sp.maker || sp.unit) &&
                (!sp.qty || sp.qty === "")
        );

        if (missingQty) {
            Swal.fire({
                icon: "warning",
                title: "ข้อมูลไม่ครบ",
                text: "กรุณากรอก Quantity ให้ครบทุกชิ้นส่วนที่มีข้อมูล",
            });
            return;
        }

        try {
            const payload = {
                ...formData,
                total_hr: safeTotal, // ⬅️ ใช้ค่าที่คำนวณได้
                cause_member_mode: formData.cause_member_mode,
                cause_member: formData.cause_member,
                cause_machine: formData.cause_machine,
                cause_spare: formData.cause_spare,
                cause_product_process: formData.cause_product_process,

                corrective: formData.corrective,
                result: formData.result,
                spare_parts: formData.spare_parts,
                control: formData.control,
                approve_by: formData.approve_by,
                work_by: formData.work_by,
                from_date: formData.from_date,
                from_time: formData.from_time,
                to_date: formData.to_date,
                to_time: formData.to_time,
                request_status: "finished",
                cause_mm: formData.cause_mm,

                Worker_Code_1: selectedEmployeeCode,
                Worker_Name_1: formData.work_by,
                Work_Start_Date: formData.from_date,
                Work_Start_Time: formData.from_time,
                Work_End_Date: formData.to_date,
                Work_End_Time: formData.to_time,
                Work_Total_Time: safeTotal,
                Remark: formData.corrective,

            };

            const response = await axios.put(
                `${config.api_path}/Maintenance/updateRequestToPro/${formData.id}`,
                payload
            );

            if (response.data.success) {
                Swal.fire({
                    icon: "success",
                    title: "บันทึกสำเร็จ",
                    text: "ข้อมูลได้รับการอัปเดตเรียบร้อยแล้ว",
                    timer: 1500
                }).then(() => {
                    navigate("/listFormRequest");
                });
            } else {
                Swal.fire("เกิดข้อผิดพลาด", "ไม่สามารถอัปเดตข้อมูลได้", "error");
            }
        } catch (error) {
            console.error("Update failed:", error);
            Swal.fire("เกิดข้อผิดพลาด", "ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้", "error");
        }
    };

    const handleUpdate_record_approve = async () => {
        if (!formData.approve_by) {
            Swal.fire({
                icon: "warning",
                title: "กรอกข้อมูลไม่ครบ",
                text: "กรุณากรอก APPROVE BY ให้ครบก่อนบันทึก",
            });
            return;
        }

        const selectedCauses = [];

        Object.entries(formData.cause_member).forEach(([key, value]) => {
            if (value && causeMappings[key]) {
                selectedCauses.push(causeMappings[key]);
            }
        });
        Object.entries(formData.cause_machine).forEach(([key, value]) => {
            if (value && causeMappings[key]) {
                selectedCauses.push(causeMappings[key]);
            }
        });
        Object.entries(formData.cause_spare).forEach(([key, value]) => {
            if (value && causeMappings[key]) {
                selectedCauses.push(causeMappings[key]);
            }
        });
        Object.entries(formData.cause_product_process).forEach(([key, value]) => {
            if (value && causeMappings[key]) {
                selectedCauses.push(causeMappings[key]);
            }
        });

        // เตรียมค่าเพื่อเก็บลง DB
        const causeFields = {};
        selectedCauses.slice(0, 3).forEach((cause, index) => {
            causeFields[`Cause_${index + 1}_Code_1`] = cause.code_1;
            causeFields[`Cause_${index + 1}_Name_1`] = cause.name_1;
            causeFields[`Cause_${index + 1}_Code_2`] = cause.code_2;
            causeFields[`Cause_${index + 1}_Name_2`] = cause.name_2;
        });

        try {
            const response = await axios.put(
                `${config.api_path}/Maintenance/updateRecordApprove/${formData.id}`,
                {
                    ...formData,
                    Serial_No: serialNumber,
                    approve_by: formData.approve_by,
                    Work_Group_Name: formData.Work_Group_Name,
                    Work_Group_Code: formData.Work_Group_Code,
                    Work_Type_Name: formData.Work_Type_Name,
                    Work_Type_Code: formData.Work_Type_Code,
                    ...causeFields,

                    // ✅ เพิ่ม 5 ค่านี้เข้าไป
                    // cause_member_mode: formData.cause_member_mode,
                    // cause_member: formData.cause_member,
                    // cause_machine: formData.cause_machine,
                    // cause_spare: formData.cause_spare,
                    // cause_product_process: formData.cause_product_process,                  
                }
            );

            if (response.data.success) {
                Swal.fire({
                    icon: "success",
                    title: "บันทึกสำเร็จ",
                    text: "ข้อมูลได้รับการอัปเดตเรียบร้อยแล้ว",
                    timer: 1500
                }).then(() => {
                    navigate("/listFormRequest");
                });
            } else {
                Swal.fire("เกิดข้อผิดพลาด", "ไม่สามารถอัปเดตข้อมูลได้", "error");
            }
        } catch (error) {
            console.error("Update failed:", error);
            Swal.fire("เกิดข้อผิดพลาด", "ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้", "error");
        }
    };


    const BackPage = () => {
        navigate("/listFormRequest");
        window.location.reload()
    }


    const handleWorkGroupChange = (e) => {
        const selectedGroup = e.target.value;
        setField("Work_Group_Name", selectedGroup);

        // ค้นหาข้อมูลที่ตรงกับ Work_Group_Name
        const filtered = workGroupList.filter(item => item.Work_Group_Name === selectedGroup);

        // เซต options ที่ตรง
        setFilteredWorkTypes(filtered);

        // ดึง Work_Group_Code ตัวแรก (หรือจะให้เลือกเองก็ได้)
        if (filtered.length > 0) {
            setFormData((prev) => ({
                ...prev,
                Work_Group_Code: filtered[0].Work_Group_Code,
                Work_Type_Code: "",
                Work_Type_Name: ""
            }));
        }
    };

    const handleWorkTypeChange = (e) => {
        const selectedType = e.target.value;
        setFormData((prev) => {
            const match = filteredWorkTypes.find(item => item.Work_Type_Name === selectedType);
            return {
                ...prev,
                Work_Type_Name: selectedType,
                Work_Type_Code: match?.Work_Type_Code || ""
            };
        });
    };

    // ⬇️ ฟังก์ชันสร้าง PDF (รองรับหลายหน้าอัตโนมัติ)
    const handleDownloadPDF = async () => {
        if (!pdfRef.current) return;

        Swal.fire({
            title: 'กำลังสร้าง PDF...',
            allowOutsideClick: false,
            didOpen: () => Swal.showLoading()
        });

        try {
            const input = pdfRef.current;

            // Capture DOM
            const canvas = await html2canvas(input, {
                scale: 2,
                useCORS: true,
                backgroundColor: '#ffffff'
            });

            const imgData = canvas.toDataURL('image/png');

            // ตั้งค่า A4 แนวตั้ง
            const pdf = new jsPDF('p', 'pt', 'a4');
            const pageWidth = pdf.internal.pageSize.getWidth();    // 595.28
            const pageHeight = pdf.internal.pageSize.getHeight();  // 841.89

            // ⬇️ ปรับให้ภาพพอดีกับหน้า A4 โดยคงอัตราส่วน
            const ratio = Math.min(pageWidth / canvas.width, pageHeight / canvas.height);
            const imgWidth = canvas.width * ratio;
            const imgHeight = canvas.height * ratio;

            // จัดให้อยู่ตรงกลางแนวตั้ง/แนวนอน
            const x = (pageWidth - imgWidth) / 2;
            const y = (pageHeight - imgHeight) / 2;

            pdf.addImage(imgData, 'PNG', x, y, imgWidth, imgHeight);

            const fileName = `maintenance_${machineData?.machine_request_name || 'form'}_${id || ''}.pdf`;
            pdf.save(fileName);

            Swal.close();
            Swal.fire({ icon: 'success', title: 'ดาวน์โหลดสำเร็จ', timer: 1200, showConfirmButton: false });
        } catch (e) {
            console.error(e);
            Swal.close();
            Swal.fire({ icon: 'error', title: 'ไม่สามารถสร้าง PDF ได้', text: 'กรุณาลองอีกครั้ง' });
        }
    };


    return (
        <>
            <div className="mr-root">
                <button className="btn btn-danger mb-1" onClick={BackPage}>
                    <UndoIcon />
                    BACK
                </button>
                {machineData.approve_by && (
                    <button className="btn btn-success ml-2 mb-1" onClick={handleDownloadPDF}>
                        <DownloadForOfflineIcon />
                        DOWNLOAD PDF
                    </button>
                )}
                <div className="mr-a4" ref={pdfRef}>
                    <header className="mr-header">
                        <h3 className="text-bold text-center">MAINTENANCE REQUEST SHEET</h3>
                        <h6 className="text-center">(ใบแจ้งซ่อมเครื่องจักร)</h6>
                    </header>
                    <div className="mr-row mr-meta mr-between">
                        {/* ฝั่งซ้าย */}
                        <div className="mr-col-12 text-primary">
                            ถึง (To): <strong>{machineData.to}</strong>

                        </div>
                        {/* ฝั่งขวา */}
                        <div className="mr-col-12 mr-right">
                            DATE :
                            <input
                                type="text"
                                className='text-primary border border-non'
                                value={machineData.date}
                            />
                            TIME :
                            <input
                                type="text"
                                value={machineData.time}
                                className="text-primary border border-non"
                            />
                        </div>
                    </div>

                    {/* Top line blocks */}
                    <section className="mr-section slim">
                        {/* แถว A */}
                        <div class="form-row">
                            <div class="form-group">
                                <div class="field-label">REQUESTOR NAME :
                                    <input
                                        type="text"
                                        class="dotted-input text-primary"
                                        value={machineData.requestor_name}
                                    />
                                </div>
                                <div class="field-hint">(ชื่อผู้แจ้งซ่อม)</div>
                            </div>

                            <div class="form-group">
                                <div class="field-label">SHIFT :
                                    <input
                                        type="text"
                                        class="dotted-input text-primary"
                                        value={machineData.shift}
                                    /></div>

                                <div class="field-hint">(กะ)</div>

                            </div>

                            <div class="form-group">
                                <div class="field-label">SECTION :
                                    <input
                                        type="text"
                                        class="dotted-input text-primary"
                                        value={machineData.section}
                                    /></div>
                                <div class="field-hint">(หน่วยงาน)</div>
                            </div>

                            <div class="form-group">
                                <div class="field-label">SHIFT LEADER :
                                    <input
                                        type="text"
                                        class="dotted-input text-primary"
                                        value={machineData.shift_leader}
                                    /></div>
                                <div class="field-hint">(หัวหน้างาน, หัวหน้ากะ)</div>

                            </div>
                        </div>

                        <div class="form-row">
                            <div class="form-group">
                                <div class="field-label">MACHINE NAME :
                                    <input
                                        type="text"
                                        class="dotted-input text-primary"
                                        value={machineData.machine_name}
                                    /></div>
                                <div class="field-hint">(ชื่อเครื่องจักร)</div>

                            </div>

                            <div class="form-group">
                                <div class="field-label">MACHINE No. :
                                    <input
                                        type="text"
                                        class="dotted-input text-primary"
                                        value={machineData.machine_no}
                                    />
                                </div>
                                <div class="field-hint">(หมายเลขเครื่องจักร)</div>

                            </div>

                            <div class="form-group">
                                <div class="field-label">MACHINE STOP TIME :
                                    <input
                                        type="text"
                                        class="dotted-input text-primary"
                                        value={machineData.machine_stop_time}
                                    /></div>
                                <div class="field-hint">(เวลาที่เครื่องจักรเสีย)</div>

                            </div>
                        </div>

                        <div class="form-row">
                            <div class="form-group">
                                <div class="field-label"><span style={{ color: "rgba(1, 5, 255, 1)" }}>LOCATION :</span>
                                    <input
                                        type="radio"
                                        name="Location_Name" className="ml-2"
                                        checked={machineData.Location_Name === "BPI"}
                                        onChange={() => setField("Location_Name", "BPI")}
                                    />
                                    <span> BPI</span>
                                    <input
                                        type="radio"
                                        name="Location_Name" className="ml-5"
                                        checked={machineData.Location_Name === "BPI TO NVK"}
                                        onChange={() => setField("Location_Name", "BPI TO NVK")}
                                    />
                                    <span> BPI TO NVK</span>
                                    <input
                                        type="radio"
                                        name="Location_Name" className="ml-5"
                                        checked={machineData.Location_Name === "NVK"}
                                        onChange={() => setField("Location_Name", "NVK")}
                                    />
                                    <span> NVK</span>
                                </div>
                            </div>
                        </div>

                        {/* กล่อง MACHINE STATUS (คงไว้ตามที่ทำไปแล้ว) */}
                        <div className="status-box">

                            <div className="status-options">
                                <div className="status-title">
                                    MACHINE STATUS <br />
                                    <span className="muted">(สถานะเครื่องจักร)</span>
                                </div>
                                <label>
                                    <input
                                        type="radio"
                                        name="machine_status"
                                        checked={machineData.machine_status === "can_running"}
                                    />
                                    <div className="option-text">
                                        <div>CAN RUNNING</div>
                                        <small className="muted">(เครื่องจักรสามารถทำงานได้)</small>
                                    </div>
                                </label>
                                <label>
                                    <input
                                        type="radio"
                                        name="machine_status"
                                        checked={machineData.machine_status === "cannot_running_stop"}
                                    />
                                    <div className="option-text">
                                        <div>CAN NOT RUNNING AND STOP</div>
                                        <small className="muted">(เครื่องขัดข้อง/ไม่สามารถทำงานได้)</small>
                                    </div>
                                </label>
                                <label>
                                    <input
                                        type="radio"
                                        name="machine_status"
                                        checked={machineData.machine_status === "no_schedule"}
                                    />
                                    <div className="option-text">
                                        <div>NO SCHEDULE</div>
                                        <small className="muted">(เครื่องที่ยังไม่มีแผนการผลิต)</small>
                                    </div>
                                </label>
                            </div>
                        </div>

                        {/* คำอธิบาย 2 ช่องถัดไป เหมือนเดิม */}
                        <div className="mr-row">
                            <Area
                                label="BRIEF DESCRIPTION (รายละเอียด)"
                                col={12}
                                rows={2}
                                value={machineData.brief_description || ""}
                                className="text-primary"
                                readOnly={true} // ✅ ใส่ตรงน
                            />
                            <Area
                                label="PRODUCTION ACTION (สิ่งที่ดำเนินการในฝ่ายผลิต)"
                                col={12}
                                rows={2}
                                value={machineData.production_action || ""} readOnly={true} // ✅ ใส่ตรงน
                            />
                        </div>
                    </section>

                    {/* Maintenance Section Only */}
                    <section className="mr-section">
                        <div className="mr-ribbon">
                            <div className="mr-ribbon-title">
                                MAINTENANCE SECTION ONLY <span className="muted">(เฉพาะช่างซ่อมบำรุง)</span>
                            </div>
                            <div className="mr-ribbon-inline">
                                <span>Receive Request Sheet by :</span>
                                <select
                                    className="mr-line w-180 text-primary"
                                    value={currentReceiveBy}
                                    onChange={(e) => onReceiveByChange(e.target.value)}
                                >
                                    <option value="">-- Select technician --</option>

                                    {/* ถ้าค่าจาก DB ไม่อยู่ในรายการ ให้แสดง option พิเศษเพื่อให้เห็นค่าที่บันทึกไว้ */}
                                    {!hasReceiveByInList && currentReceiveBy && (
                                        <option value={currentReceiveBy}>
                                            {formData.receive_by}
                                        </option>
                                    )}

                                    {mmUsers.map((u) => {
                                        const val = normalize(`${u.username} ${u.lastname || ""}`);
                                        return (
                                            <option key={u.id} value={val}>
                                                {u.username} {u.lastname}
                                            </option>
                                        );
                                    })}
                                </select>
                                <span>Receive Time :</span>
                                <input
                                    // type="time"
                                    className="mr-line w-120 text-primary"
                                    value={formData.receive_time || ""}
                                    onChange={(e) => setField("receive_time", e.target.value)}
                                />
                            </div>
                        </div>
                        {!machineData.receive_by && !machineData.receive_time && (
                            <>
                                <div className="col-12 mt-2">
                                    <button
                                        className="col-6 btn btn-success"
                                        onClick={handleUpdate_request}
                                    >
                                        💾 Save Receive by
                                    </button>
                                </div>
                            </>
                        )}

                        {machineData.receive_by && machineData.receive_time && (
                            <>
                                <div className="mr-row very-small">
                                    <div style={{ fontSize: "0.9rem", fontWeight: "bold" }}>
                                        BY:<span className="text-primary">{selectedEmployeeCode || "-"}</span>

                                    </div>
                                    <select
                                        className="mr-line w-180 text-primary"
                                        value={normalize(formData.work_by)}
                                        onChange={(e) => onWorkByChange(normalize(e.target.value))}
                                    >
                                        <option value="">-- Select technician --</option>
                                        {!hasReceiveByInList && formData.work_by && (
                                            <option value={normalize(formData.work_by)}>
                                                {formData.work_by}
                                            </option>
                                        )}
                                        {mmUsers.map(u => {
                                            const val = normalize(`${u.username} ${u.lastname || ""}`);
                                            return (
                                                <option key={u.id} value={val}>
                                                    {u.username} {u.lastname}
                                                </option>

                                            );
                                        })}
                                    </select>

                                    {/* <Line label="FROM DATE" col={2} type="date"
                                        value={formData.from_date || ""}
                                        onChange={(v) => setField("from_date", v)}
                                    />
                                    <Line label="TIME" col={2} type="time"
                                        value={formData.from_time || ""}
                                        onChange={(v) => setField("from_time", v)}
                                    />
                                    <Line label="TO DATE" col={2} type="date"
                                        value={formData.to_date || ""}
                                        onChange={(v) => setField("to_date", v)}
                                    />
                                    <Line label="TIME" col={2} type="time"
                                        value={formData.to_time}
                                        onChange={(v) => setField("to_time", v)}
                                    />
                                    <Line label="TOTAL (Hr.)" col={2} value={formData.total_hr || ""} readOnly /> */}

                                    <div className="mr-col-4 mr-line-wrap">
                                        <div className="mr-label" style={{ fontSize: "0.9rem" }}>FROM DATE</div>
                                        <input
                                            type="date"
                                            className="mr-line text-primary"
                                            value={formData.from_date || ""}
                                            onChange={(e) => setField("from_date", e.target.value)}
                                        />
                                    </div>

                                    <div className="mr-col-4 mr-line-wrap">
                                        <div className="mr-label" style={{ fontSize: "0.9rem" }}>TIME</div>
                                        <input
                                            type="text"
                                            className="mr-line text-primary"
                                            placeholder="HH:mm"
                                            maxLength={5}
                                            value={normalizeTime(formData.from_time)}
                                            onChange={(e) => setField("from_time", e.target.value)}
                                            onBlur={(e) => handleTimeBlur(e.target.value)}
                                        />
                                    </div>

                                    <div className="mr-col-4 mr-line-wrap">
                                        <div className="mr-label" style={{ fontSize: "0.9rem" }}>TO DATE</div>
                                        <input
                                            type="date"
                                            className="mr-line text-primary"
                                            value={formData.to_date || ""}
                                            onChange={(e) => setField("to_date", e.target.value)}
                                        />
                                    </div>

                                    <div className="mr-col-4 mr-line-wrap">
                                        <div className="mr-label" style={{ fontSize: "0.9rem" }}>TIME</div>
                                        <input
                                            type="text"
                                            className="mr-line text-primary"
                                            placeholder="HH:mm"
                                            maxLength={5}
                                            value={normalizeTime(formData.to_time)}
                                            onChange={(e) => setField("to_time", e.target.value)}
                                            onBlur={(e) => handleTimeBlur(e.target.value)}
                                        />
                                    </div>

                                    <div className="mr-col-4 mr-line-wrap">
                                        <div className="mr-label" style={{ fontSize: "0.9rem" }}>TOTAL (Hr.)</div>
                                        <input
                                            className="mr-line text-primary"
                                            value={formData.total_hr || ""}
                                            readOnly
                                        />
                                    </div>

                                </div>

                                <div className="mr-col-4 mr-line-wrap mt-2">
                                    <div className="mr-label" style={{ fontSize: "0.9rem" }}>Cause (สาเหตุ)</div>
                                    <input
                                        value={formData.cause_mm || ""}
                                        className="mr-line text-primary"
                                        onChange={(e) => setField("cause_mm", e.target.value.toUpperCase())}
                                    />
                                </div>

                            </>
                        )}
                    </section>

                    {machineData.receive_by && machineData.receive_time && (

                        <>
                            {/* ✅ ส่วน CAUSE OF PROBLEM */}
                            <section className="mr-section">
                                <div className="mr-subtitle big">สาเหตุที่กระทบความผิดปกติ ( CAUSE OF PROBLEM )</div>
                                <div className="cause-panel">
                                    <div className="cause-columns">
                                        {/* 1) คน (Member) */}
                                        <div className="cause-col">
                                            <div className="cause-title">คน (Member)</div>

                                            {/* บรรทัดตัวเลือกตามแบบฟอร์ม */}
                                            <div className="cause-radio">
                                                <label>
                                                    <input
                                                        type="radio"
                                                        name="member_mode_modal"
                                                        checked={formData.cause_member_mode === "mm"}
                                                        onClick={() => {
                                                            setField(
                                                                "cause_member_mode",
                                                                formData.cause_member_mode === "mm" ? "" : "mm"
                                                            );
                                                        }}
                                                    />{" "}
                                                    M/M
                                                </label>

                                                <label>
                                                    <input
                                                        type="radio"
                                                        name="member_mode_modal"
                                                        checked={formData.cause_member_mode === "production"}
                                                        onClick={() => {
                                                            setField(
                                                                "cause_member_mode",
                                                                formData.cause_member_mode === "production" ? "" : "production"
                                                            );
                                                        }}
                                                    />{" "}
                                                    PRODUCTION
                                                </label>
                                            </div>

                                            <div className="mr-checkboxes">
                                                <label><input type="checkbox" checked={formData.cause_member.not_understand} onChange={e => setNested("cause_member", "not_understand", e.target.checked)} /> ไม่เข้าใจ (Not Understand)</label>
                                                <label><input type="checkbox" checked={formData.cause_member.not_checking} onChange={e => setNested("cause_member", "not_checking", e.target.checked)} /> ไม่ตรวจเช็ค (Not Checking)</label>
                                                <label><input type="checkbox" checked={formData.cause_member.absent} onChange={e => setNested("cause_member", "absent", e.target.checked)} /> ขาดงาน (Absent)</label>
                                                <label><input type="checkbox" checked={formData.cause_member.not_carefully} onChange={e => setNested("cause_member", "not_carefully", e.target.checked)} /> ทำด้วยไม่ถี่ถ้วน (Not Carefully)</label>
                                                <label><input type="checkbox" checked={formData.cause_member.repair_error} onChange={e => setNested("cause_member", "repair_error", e.target.checked)} /> ทำไม่ดี (Repair Error)</label>
                                            </div>
                                        </div>

                                        {/* 2) เครื่องจักร (Machine) */}
                                        <div className="cause-col">
                                            <div className="cause-title">เครื่องจักร (Machine)</div>
                                            <div className="mr-checkboxes">
                                                <label><input type="checkbox" checked={formData.cause_machine.operate_error} onChange={e => setNested("cause_machine", "operate_error", e.target.checked)} /> Operate Error</label>
                                                <label><input type="checkbox" checked={formData.cause_machine.design_error} onChange={e => setNested("cause_machine", "design_error", e.target.checked)} /> ออกแบบไม่ดี (Design Error)</label>
                                            </div>
                                        </div>

                                        {/* 3) รูปภัณฑ์ (Spare parts) */}
                                        <div className="cause-col">
                                            <div className="cause-title">รูปภัณฑ์ (Spare parts)</div>
                                            <div className="mr-checkboxes">
                                                <label><input type="checkbox" checked={formData.cause_spare.spare_damage} onChange={e => setNested("cause_spare", "spare_damage", e.target.checked)} /> เสื่อมสภาพ(Degenerate)</label>
                                                <label><input type="checkbox" checked={formData.cause_spare.quality_fail} onChange={e => setNested("cause_spare", "quality_fail", e.target.checked)} /> คุณภาพไม่ดี(Quality Fail)</label>
                                                <label><input type="checkbox" checked={formData.cause_spare.inappropriate} onChange={e => setNested("cause_spare", "inappropriate", e.target.checked)} /> ไม่เหมาะสมกับงาน(Unappropriate)</label>
                                                <label><input type="checkbox" checked={formData.cause_spare.not_lubricant} onChange={e => setNested("cause_spare", "not_lubricant", e.target.checked)} /> ขาดการหล่อลื่น (Not Lubricant)</label>
                                                <label><input type="checkbox" checked={formData.cause_spare.loosen} onChange={e => setNested("cause_spare", "loosen", e.target.checked)} /> หลวม คลอน คาย (Loosen)</label>
                                            </div>
                                        </div>

                                        {/* 4) กระบวนการผลิต (Process) */}
                                        <div className="cause-col">
                                            <div className="cause-title">กระบวนการผลิต (Product Proc.)</div>
                                            <div className="mr-checkboxes">
                                                <label><input type="checkbox" checked={formData.cause_product_process.dirty} onChange={e => setNested("cause_product_process", "dirty", e.target.checked)} /> สกปรก (Dirty)</label>
                                                <label><input type="checkbox" checked={formData.cause_product_process.high_temp} onChange={e => setNested("cause_product_process", "high_temp", e.target.checked)} /> อุณหภูมิสูง (High Temp.)</label>
                                                <label><input type="checkbox" checked={formData.cause_product_process.product_spare_error} onChange={e => setNested("cause_product_process", "product_spare_error", e.target.checked)} /> Product Spare Error</label>
                                                <label><input type="checkbox" checked={formData.cause_product_process.water_leak} onChange={e => setNested("cause_product_process", "water_leak", e.target.checked)} /> น้ำรั่ว (Water Leak)</label>
                                                <label><input type="checkbox" checked={formData.cause_product_process.chemical_gas} onChange={e => setNested("cause_product_process", "chemical_gas", e.target.checked)} /> สารเคมี/แก๊ส (Chemical, Gas)</label>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </section>


                            {/* Corrective / Result */}
                            <section className="mr-section">
                                <div className="mr-row">

                                    <div className="mr-col-24 mr-line-wrap">
                                        {!machineData.repair_accept_by && !machineData.approve_by && (

                                            <div className="autocomplete mb-1">
                                                <input
                                                    className="mr-line text-primary"
                                                    placeholder="พิมพ์เพื่อค้นหา/เลือก Corrective"
                                                    value={correctiveQuery}
                                                    onChange={(e) => { setCorrectiveQuery(e.target.value.toUpperCase()); setOpenCorrective(true); setHiIdx(-1); }}
                                                    onFocus={() => setOpenCorrective(true)}
                                                    onBlur={() => setTimeout(() => setOpenCorrective(false), 120)}  // หน่วงนิดให้คลิกไอเท็มได้
                                                    onKeyDown={(e) => {
                                                        if (!openCorrective) return;
                                                        if (e.key === "ArrowDown") { setHiIdx(i => Math.min(i + 1, filteredCorrective.length - 1)); e.preventDefault(); }
                                                        if (e.key === "ArrowUp") { setHiIdx(i => Math.max(i - 1, 0)); e.preventDefault(); }
                                                        if (e.key === "Enter") { selectCorrective(filteredCorrective[hiIdx] || correctiveQuery); e.preventDefault(); }
                                                        if (e.key === "Escape") { setOpenCorrective(false); }
                                                    }}
                                                />

                                                {openCorrective && filteredCorrective.length > 0 && (
                                                    <div className="ac-menu">
                                                        {filteredCorrective.slice(0, 6).map((opt, idx) => (
                                                            <div
                                                                key={opt}
                                                                className={`ac-item ${idx === hiIdx ? "active" : ""}`}
                                                                onMouseDown={() => selectCorrective(opt)}   // ใช้ mousedown กัน blur
                                                            >
                                                                {opt}
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                                {openCorrective && filteredCorrective.length === 0 && (
                                                    <div className="ac-menu ac-empty">ไม่พบรายการที่ตรงกับ “{correctiveQuery}”</div>
                                                )}
                                                <button type="button" className="btn btn-outline-danger"
                                                    onClick={() => { setFormData(p => ({ ...p, corrective: "" })); setCorrectiveQuery(""); }}>
                                                    เคลียร์
                                                </button>
                                            </div>
                                        )}
                                        <div className="mr-label">Corrective (การแก้ไข)</div>
                                        <textarea
                                            rows={2}
                                            className="mr-box dotted text-primary"
                                            style={{ textTransform: 'uppercase' }}  // ✅ เพิ่ม: ให้แสดงผลเป็นตัวใหญ่
                                            value={formData.corrective || ""}
                                            onChange={(e) => setFormData(prev => ({ ...prev, corrective: e.target.value }))} // ✅ แก้: รับค่าปกติ (Cursor ไม่เด้ง)
                                            onBlur={(e) => setFormData(prev => ({ ...prev, corrective: toUpper(e.target.value) }))} // ✅ เพิ่ม: แปลงเป็นตัวใหญ่เมื่อพิมพ์เสร็จ
                                        />
                                    </div>

                                    <div className="mr-col-24 mr-line-wrap">
                                        <div className="mr-label">Result (ผล)</div>
                                        {!machineData.repair_accept_by && !machineData.approve_by && (
                                            <div>
                                                <select
                                                    value={formData.result === "OK" || formData.result === "OK NEW SETUP" ? "" : formData.result}
                                                    onChange={(e) => {
                                                        const value = e.target.value;
                                                        // ถ้าเลือกค่าใน dropdown ให้ใส่ค่าใน textarea และทำให้ select ว่าง
                                                        setField("result", value);
                                                    }}
                                                    className="mr-line dotted text-primary"
                                                >
                                                    <option value="">-- เลือกผล --</option>
                                                    <option value="OK">OK</option>
                                                    <option value="OK NEW SETUP">OK NEW SETUP</option>
                                                </select>
                                            </div>
                                        )}

                                        <textarea
                                            rows={2}
                                            className="mr-box dotted text-primary"
                                            value={formData.result || ""}
                                            onChange={(e) => setField("result", e.target.value.toUpperCase())}
                                        />
                                    </div>
                                </div>
                            </section>


                            {/* Spare parts */}
                            <section className="mr-section">
                                <div className="mr-subtitle big">SPARE PART (อุปกรณ์ที่เปลี่ยนใหม่)</div>
                                <table className="mr-table">
                                    <thead>
                                        <tr>
                                            <th style={{ width: 40 }}>#</th>
                                            <th>Part name</th>
                                            <th>Part Model</th>
                                            <th>Maker</th>
                                            <th style={{ width: 120 }}>Quantity</th>
                                            <th>Unit</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {formData.spare_parts.map((sp, i) => (
                                            <tr key={i}>
                                                <td className="tc">{i + 1}</td>
                                                <td>
                                                    <input
                                                        className="mr-line text-primary"
                                                        value={sp.name}
                                                        onChange={(e) => handleSpareChange(i, "name", e.target.value)}
                                                    />
                                                </td>
                                                <td>
                                                    <input
                                                        className="mr-line text-primary"
                                                        value={sp.model}
                                                        onChange={(e) => handleSpareChange(i, "model", e.target.value)}
                                                        placeholder='Search....'
                                                    />
                                                </td>
                                                <td>
                                                    <input
                                                        className="mr-line text-primary"
                                                        value={sp.maker}
                                                        onChange={(e) => handleSpareChange(i, "maker", e.target.value)}
                                                    />
                                                </td>
                                                <td>
                                                    <input
                                                        type="number"
                                                        className="mr-line text-primary"
                                                        value={sp.qty}
                                                        onChange={(e) => handleSpareChange(i, "qty", e.target.value)}
                                                    />
                                                </td>
                                                <td>
                                                    <input
                                                        className="mr-line text-primary"
                                                        value={sp.unit}
                                                        onChange={(e) => handleSpareChange(i, "unit", e.target.value)}
                                                    />
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>

                                <div className="mr-col-12">
                                    <div className="mr-subtitle">สถานะการควบคุม</div>
                                    <div className="mr-radios2 tight2">
                                        <label>
                                            <input
                                                type="radio"
                                                name="ctrl"
                                                checked={formData.control === "control"}
                                                onChange={() => setField("control", "control")}
                                            />
                                            CONTROL (ควบคุม)
                                        </label>
                                        <label>
                                            <input
                                                type="radio"
                                                name="ctrl"
                                                checked={formData.control === "uncontrol"}
                                                onChange={() => setField("control", "uncontrol")}
                                            />
                                            UNCONTROL (ไม่ควบคุม)
                                        </label>
                                        <div style={{ marginLeft: "auto", minWidth: "200px" }}>
                                            <div className="mr-label" style={{ fontSize: "0.9rem" }}>APPROVE BY (อนุมัติโดย)</div>
                                            <input
                                                className="mr-line text-primary fw-bold text-center"
                                                value={formData.approve_by || ""}
                                            // onChange={(e) => setField("approve_by", e.target.value)}
                                            />

                                        </div>
                                    </div>
                                </div>

                                {/* {!machineData.repair_accept_by && !machineData.corrective && ( */}
                                {!machineData.result &&  (
                                    <>
                                        <div className="col-12 mt-2">
                                            <button
                                                className="col-6 btn btn-success"
                                                onClick={handleUpdate_request_to_pro}
                                            >
                                                💾 Save Data recording completed
                                            </button>
                                        </div>
                                    </>

                                )}

                                {machineData.repair_accept_by && !machineData.approve_by && (
                                    <>
                                        <div className="col-12 mt-2 d-flex justify-content-end">
                                            <button
                                                className="col-5 btn btn-success"
                                                // onClick={handleUpdate_record_approve}
                                                onClick={() => setApproveModalOpen(true)}
                                            >
                                                💾 Save recording approve completed
                                            </button>
                                        </div>
                                    </>
                                )}

                            </section>

                        </>
                    )}

                    {machineData.work_by && machineData.receive_time && (
                        <>
                            <section className="mr-section slim">
                                <div className="mr-row very-small">
                                    <div className="mr-col-24">
                                        <div className="accept-row">
                                            <span className="accept-label">REPAIR ACCEPT BY :</span>
                                            <input
                                                className="mr-line text-primary  text-center fw-bold accept-input"
                                                value={formData.repair_accept_by || ""}
                                            />

                                            <span className="accept-note">
                                                <b>**Break down time</b> = Maintenance request time to maintenance repair finish on
                                                machine cannot running and stop status only
                                            </span>
                                        </div>

                                        {/* บรรทัดภาษาไทย + บรรทัดเก็บเอกสาร */}
                                        <div className="accept-notes-th">
                                            (เวลาที่เครื่องจักรหยุด = เวลาที่เรียกใบแจ้งซ่อมเครื่องจักรถึงเวลาที่ฝ่ายซ่อมบำรุงทำการงาน
                                            ไปเรียบร้อย ในสภาพที่เครื่องจักรทำงานต่อจากเดิมไม่ได้) 1-DC-MM-001C , FDB-0352A4
                                        </div>
                                        <div className="accept-keep">
                                            <i>เอกสารควรเก็บเป็นระยะเวลา 3 เดือน</i>
                                        </div>
                                    </div>
                                </div>
                            </section>
                        </>

                    )}
                </div>
            </div>

            {isApproveModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        {/* ปุ่มปิด */}
                        <button
                            className="btn btn-danger mb-2"
                            onClick={() => setApproveModalOpen(false)}
                        >
                            ❌ Close
                        </button>

                        <div class="form-row">
                            <div class="form-group">
                                <div class="field-label">MACHINE No :
                                    <input
                                        type="text"
                                        class="dotted-input text-primary"
                                        value={machineData.machine_request_name}
                                    /></div>
                                <div class="field-hint">(ชื่อเครื่องจักร)</div>

                            </div>

                            <div class="form-group">
                                <div class="field-label">SERIAL No :
                                    <input
                                        type="text"
                                        class="dotted-input text-primary"
                                        value={serialNumber}
                                        readOnly
                                    /></div>
                                <div class="field-hint">(หมายเลขซีเรียล)</div>

                            </div>
                        </div>

                        {/* Cause of Problem */}
                        <section className="mr-section">
                            <div className="mr-subtitle big">สาเหตุที่กระทบความผิดปกติ ( CAUSE OF PROBLEM )</div>
                            <div className="cause-panel">
                                <div className="cause-columns">
                                    {/* 1) คน (Member) */}
                                    <div className="cause-col">
                                        <div className="cause-title">คน (Member)</div>

                                        {/* บรรทัดตัวเลือกตามแบบฟอร์ม */}
                                        <div className="cause-radio">
                                            <label>
                                                <input
                                                    type="radio"
                                                    name="member_mode"
                                                    checked={formData.cause_member_mode === "mm"}
                                                />{" "}
                                                M/M
                                            </label>
                                            <label>
                                                <input
                                                    type="radio"
                                                    name="member_mode"
                                                    checked={formData.cause_member_mode === "production"}
                                                />{" "}
                                                PRODUCTION
                                            </label>
                                        </div>

                                        <div className="mr-checkboxes">
                                            <label>
                                                <input
                                                    type="checkbox"
                                                    checked={formData.cause_member.not_understand} readOnly
                                                />
                                                ไม่เข้าใจ (Not Understand)
                                            </label>
                                            <label>
                                                <input
                                                    type="checkbox"
                                                    checked={formData.cause_member.not_checking} readOnly
                                                />
                                                ไม่ตรวจเช็ค (Not Checking)
                                            </label>
                                            <label>
                                                <input
                                                    type="checkbox"
                                                    checked={formData.cause_member.absent} readOnly
                                                />
                                                ขาดงาน (Absent)
                                            </label>
                                            <label>
                                                <input
                                                    type="checkbox"
                                                    checked={formData.cause_member.not_carefully} readOnly
                                                />
                                                ทำด้วยไม่ถี่ถ้วน (Not Carefully)
                                            </label>
                                            <label>
                                                <input
                                                    type="checkbox"
                                                    checked={formData.cause_member.repair_error} readOnly
                                                />
                                                ทำไม่ดี (Repair Error)
                                            </label>
                                        </div>
                                    </div>

                                    {/* 2) เครื่องจักร (Machine) */}
                                    <div className="cause-col">
                                        <div className="cause-title">เครื่องจักร (Machine)</div>
                                        <div className="mr-checkboxes">
                                            <label>
                                                <input
                                                    type="checkbox"
                                                    checked={formData.cause_machine.operate_error} readOnly

                                                />
                                                Operate Error
                                            </label>
                                            <label>
                                                <input
                                                    type="checkbox"
                                                    checked={formData.cause_machine.design_error} readOnly

                                                />
                                                ออกแบบไม่ดี (Design Error)
                                            </label>
                                        </div>
                                    </div>

                                    {/* 3) รูปภัณฑ์ (Spare parts) */}
                                    <div className="cause-col">
                                        <div className="cause-title">รูปภัณฑ์ (Spare parts)</div>
                                        <div className="mr-checkboxes">
                                            <label>
                                                <input
                                                    type="checkbox"
                                                    checked={formData.cause_spare.spare_damage} readOnly

                                                />
                                                เสื่อมสภาพ(Degenerate)
                                            </label>
                                            <label>
                                                <input
                                                    type="checkbox"
                                                    checked={formData.cause_spare.quality_fail} readOnly

                                                />
                                                คุณภาพไม่ดี(Quality Fail)
                                            </label>
                                            <label>
                                                <input
                                                    type="checkbox"
                                                    checked={formData.cause_spare.inappropriate} readOnly

                                                />
                                                ไม่เหมาะสมกับงาน(Unappropriate)
                                            </label>
                                            <label>
                                                <input
                                                    type="checkbox"
                                                    checked={formData.cause_spare.not_lubricant} readOnly

                                                />
                                                ขาดการหล่อลื่น (Not Lubricant)
                                            </label>
                                            <label>
                                                <input
                                                    type="checkbox"
                                                    checked={formData.cause_spare.loosen} readOnly

                                                />
                                                หลวม คลอน คาย (Loosen)
                                            </label>
                                        </div>
                                    </div>

                                    {/* 4) กระบวนการผลิต (Process) */}
                                    <div className="cause-col">
                                        <div className="cause-title">กระบวนการผลิต (Product Proc.)</div>
                                        <div className="mr-checkboxes">
                                            <label>
                                                <input
                                                    type="checkbox"
                                                    checked={formData.cause_product_process.dirty} readOnly

                                                />
                                                สกปรก (Dirty)
                                            </label>
                                            <label>
                                                <input
                                                    type="checkbox"
                                                    checked={formData.cause_product_process.high_temp} readOnly

                                                />
                                                อุณหภูมิสูง (High Temp.)
                                            </label>
                                            <label>
                                                <input
                                                    type="checkbox"
                                                    checked={formData.cause_product_process.product_spare_error} readOnly

                                                />
                                                Product Spare Error
                                            </label>
                                            <label>
                                                <input
                                                    type="checkbox"
                                                    checked={formData.cause_product_process.water_leak} readOnly

                                                />
                                                น้ำรั่ว (Water Leak)
                                            </label>
                                            <label>
                                                <input
                                                    type="checkbox"
                                                    checked={formData.cause_product_process.chemical_gas} readOnly

                                                />
                                                สารเคมี/แก๊ส (Chemical, Gas)
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* ✅ ส่วน CAUSE OF PROBLEM */}
                        {/* <section className="mr-section">
                            <div className="mr-subtitle big">สาเหตุที่กระทบความผิดปกติ ( CAUSE OF PROBLEM )</div>
                            <div className="cause-panel">
                                <div className="cause-columns">
                                  
                                    <div className="cause-col">
                                        <div className="cause-title">คน (Member)</div>

                                    
                                        <div className="cause-radio">
                                            <label>
                                                <input
                                                    type="radio"
                                                    name="member_mode_modal"
                                                    checked={formData.cause_member_mode === "mm"}
                                                    onClick={() => {
                                                        setField(
                                                            "cause_member_mode",
                                                            formData.cause_member_mode === "mm" ? "" : "mm"
                                                        );
                                                    }}
                                                />{" "}
                                                M/M
                                            </label>

                                            <label>
                                                <input
                                                    type="radio"
                                                    name="member_mode_modal"
                                                    checked={formData.cause_member_mode === "production"}
                                                    onClick={() => {
                                                        setField(
                                                            "cause_member_mode",
                                                            formData.cause_member_mode === "production" ? "" : "production"
                                                        );
                                                    }}
                                                />{" "}
                                                PRODUCTION
                                            </label>
                                        </div>

                                        <div className="mr-checkboxes">
                                            <label><input type="checkbox" checked={formData.cause_member.not_understand} onChange={e => setNested("cause_member", "not_understand", e.target.checked)} /> ไม่เข้าใจ (Not Understand)</label>
                                            <label><input type="checkbox" checked={formData.cause_member.not_checking} onChange={e => setNested("cause_member", "not_checking", e.target.checked)} /> ไม่ตรวจเช็ค (Not Checking)</label>
                                            <label><input type="checkbox" checked={formData.cause_member.absent} onChange={e => setNested("cause_member", "absent", e.target.checked)} /> ขาดงาน (Absent)</label>
                                            <label><input type="checkbox" checked={formData.cause_member.not_carefully} onChange={e => setNested("cause_member", "not_carefully", e.target.checked)} /> ทำด้วยไม่ถี่ถ้วน (Not Carefully)</label>
                                            <label><input type="checkbox" checked={formData.cause_member.repair_error} onChange={e => setNested("cause_member", "repair_error", e.target.checked)} /> ทำไม่ดี (Repair Error)</label>
                                        </div>
                                    </div>

                                  
                                    <div className="cause-col">
                                        <div className="cause-title">เครื่องจักร (Machine)</div>
                                        <div className="mr-checkboxes">
                                            <label><input type="checkbox" checked={formData.cause_machine.operate_error} onChange={e => setNested("cause_machine", "operate_error", e.target.checked)} /> Operate Error</label>
                                            <label><input type="checkbox" checked={formData.cause_machine.design_error} onChange={e => setNested("cause_machine", "design_error", e.target.checked)} /> ออกแบบไม่ดี (Design Error)</label>
                                        </div>
                                    </div>

                                 
                                    <div className="cause-col">
                                        <div className="cause-title">รูปภัณฑ์ (Spare parts)</div>
                                        <div className="mr-checkboxes">
                                            <label><input type="checkbox" checked={formData.cause_spare.spare_damage} onChange={e => setNested("cause_spare", "spare_damage", e.target.checked)} /> เสื่อมสภาพ(Degenerate)</label>
                                            <label><input type="checkbox" checked={formData.cause_spare.quality_fail} onChange={e => setNested("cause_machine", "quality_fail", e.target.checked)} /> คุณภาพไม่ดี(Quality Fail)</label>
                                            <label><input type="checkbox" checked={formData.cause_spare.inappropriate} onChange={e => setNested("cause_machine", "inappropriate", e.target.checked)} /> ไม่เหมาะสมกับงาน(Unappropriate)</label>
                                            <label><input type="checkbox" checked={formData.cause_spare.not_lubricant} onChange={e => setNested("cause_machine", "not_lubricant", e.target.checked)} /> ขาดการหล่อลื่น (Not Lubricant)</label>
                                            <label><input type="checkbox" checked={formData.cause_spare.loosen} onChange={e => setNested("cause_machine", "loosen", e.target.checked)} /> หลวม คลอน คาย (Loosen)</label>
                                        </div>
                                    </div>

                                 
                                    <div className="cause-col">
                                        <div className="cause-title">กระบวนการผลิต (Product Proc.)</div>
                                        <div className="mr-checkboxes">
                                            <label><input type="checkbox" checked={formData.cause_product_process.dirty} onChange={e => setNested("cause_product_process", "dirty", e.target.checked)} /> สกปรก (Dirty)</label>
                                            <label><input type="checkbox" checked={formData.cause_product_process.high_temp} onChange={e => setNested("cause_product_process", "high_temp", e.target.checked)} /> อุณหภูมิสูง (High Temp.)</label>
                                            <label><input type="checkbox" checked={formData.cause_product_process.product_spare_error} onChange={e => setNested("cause_spare", "product_spare_error", e.target.checked)} /> Product Spare Error</label>
                                            <label><input type="checkbox" checked={formData.cause_product_process.water_leak} onChange={e => setNested("cause_product_process", "water_leak", e.target.checked)} /> น้ำรั่ว (Water Leak)</label>
                                            <label><input type="checkbox" checked={formData.cause_product_process.chemical_gas} onChange={e => setNested("cause_product_process", "chemical_gas", e.target.checked)} /> สารเคมี/แก๊ส (Chemical, Gas)</label>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </section> */}

                        {/* ✅ ส่วน Corrective / Result */}
                        <section className="mr-section">
                            <div className="mr-row">
                                <div className="mr-col-24 mr-line-wrap">
                                    <div className="mr-label">Corrective (การแก้ไข)</div>
                                    {/* <textarea
                                        rows={2}
                                        className="mr-box dotted text-primary"
                                        value={formData.corrective || ""}
                                        onChange={(e) => setField("corrective", e.target.value.toUpperCase())}
                                    /> */}
                                    <textarea
                                        rows={2}
                                        className="mr-box dotted text-primary"
                                        style={{ textTransform: 'uppercase' }}  // ✅ เพิ่ม: ให้แสดงผลเป็นตัวใหญ่
                                        value={formData.corrective || ""}
                                        onChange={(e) => setFormData(prev => ({ ...prev, corrective: e.target.value }))} // ✅ แก้: รับค่าปกติ (Cursor ไม่เด้ง)
                                        onBlur={(e) => setFormData(prev => ({ ...prev, corrective: toUpper(e.target.value) }))} // ✅ เพิ่ม: แปลงเป็นตัวใหญ่เมื่อพิมพ์เสร็จ
                                    />
                                </div>

                                <div className="mr-col-24 mr-line-wrap">
                                    <div className="mr-label">Result (ผล)</div>
                                    <textarea
                                        rows={2}
                                        className="mr-box dotted text-primary"
                                        value={formData.result || ""}
                                        onChange={(e) => setField("result", e.target.value.toUpperCase())}
                                    />
                                </div>
                            </div>
                        </section>

                        <section className="mr-section">
                            <div className="form-row">

                                <div className="form-group">
                                    <div className="field-label">Work_Group_Name *
                                        <select
                                            className="dotted-input text-primary fw-bold"
                                            value={formData.Work_Group_Name}
                                            onChange={handleWorkGroupChange}
                                        >
                                            <option value="">...... Select .......</option>
                                            <option value="OVERHAUL">OVERHAUL</option>
                                            <option value="MODIFICATION">MODIFICATION</option>
                                            <option value="REPAIR">REPAIR</option>
                                            <option value="PREVENTIVE">PREVENTIVE</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="form-group">
                                    <div className="field-label">Work_Type_Name *
                                        <select
                                            className="dotted-input text-primary fw-bold"
                                            value={formData.Work_Type_Name}
                                            onChange={handleWorkTypeChange}
                                        >
                                            <option value="">...... Select .......</option>
                                            {filteredWorkTypes.map((type, index) => (
                                                <option key={index} value={type.Work_Type_Name}>
                                                    {type.Work_Type_Name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="form-group">
                                    <div className="field-label">Work_Group_Code :
                                        <input
                                            type="text"
                                            className="dotted-input text-primary"
                                            value={formData.Work_Group_Code || ""}
                                            readOnly
                                        />
                                    </div>
                                </div>

                                <div className="form-group">
                                    <div className="field-label">Work_Type_Code :
                                        <input
                                            type="text"
                                            className="dotted-input text-primary"
                                            value={formData.Work_Type_Code || ""}
                                            readOnly
                                        />
                                    </div>
                                </div>

                            </div>
                        </section>

                        <div style={{ marginLeft: "auto", minWidth: "200px" }}>
                            <div className="mr-label" style={{ fontSize: "0.9rem" }}>APPROVE BY (อนุมัติโดย)</div>
                            <select
                                class="dotted-input text-primary fw-bold"
                                value={formData.approve_by}
                                onChange={(e) => setField("approve_by", e.target.value)}
                            >
                                <option value="">............................</option>
                                <option value="NATTHAPONG">NATTHAPONG</option>


                            </select>

                        </div>


                        {/* ✅ ปุ่ม Submit */}
                        <button
                            className="btn btn-success mt-2"
                            onClick={handleUpdate_record_approve}
                        >
                            ✅ ยืนยันบันทึก APPROVE
                        </button>
                    </div>
                </div>
            )}

        </>
    );

}

export default ResultFormProToMM;
