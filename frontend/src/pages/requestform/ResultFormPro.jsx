import { useLocation } from 'react-router-dom';
import { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import config from '../../config';
import { useNavigate } from "react-router-dom";
import UndoIcon from '@mui/icons-material/Undo';
import Swal from "sweetalert2";
import DownloadForOfflineIcon from '@mui/icons-material/DownloadForOffline';

import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

function ResultFormPro() {
    const location = useLocation();
    const machineData = location.state?.machineData;

    const [employeeId, setEmployeeId] = useState("");

    const id = machineData?.id;

    const isInitialLoad = useRef(true);
    const navigate = useNavigate(); // ใช้ย้อนกลับ
    const pdfRef = useRef(null);

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
        corrective: "",
        result: "",
        spare_parts: [
            { name: "", model: "", maker: "", qty: "", unit: "" },
            { name: "", model: "", maker: "", qty: "", unit: "" },
            { name: "", model: "", maker: "", qty: "", unit: "" },
            { name: "", model: "", maker: "", qty: "", unit: "" },
            { name: "", model: "", maker: "", qty: "", unit: "" },
            { name: "", model: "", maker: "", qty: "", unit: "" },
            { name: "", model: "", maker: "", qty: "", unit: "" },
            { name: "", model: "", maker: "", qty: "", unit: "" },
        ],
        control: "control",
    });

    // เวลาแบบ HH:MM (ถ้าต้องการวินาที เปลี่ยนเป็น HH:MM:SS ได้)
    const nowHHMM = () => {
        const d = new Date();
        const hh = String(d.getHours()).padStart(2, "0");
        const mm = String(d.getMinutes()).padStart(2, "0");
        return `${hh}:${mm}`;
    };

    useEffect(() => {
        if (id) {
            fetchFormData();
        }
    }, []);

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


     useEffect(() => {
        if (!employeeId) return;

        const fetchUserByEmployee = async () => {
            try {
                const res = await axios.get(`${config.api_path}/users`, {
                    params: { q: employeeId }, // ค้นหาจาก employee field
                });
                const found = res.data?.find(
                    (u) => u.employee?.toLowerCase() === employeeId.toLowerCase()
                );
                if (found) {
                    setField("repair_accept_by", `${found.username}`);
                } else {
                    setField("repair_accept_by", "");
                }
            } catch (err) {
                console.error("❌ ค้นหาผู้ใช้ไม่สำเร็จ:", err);
                setField("repair_accept_by", "");
            }
        };

        const timeout = setTimeout(fetchUserByEmployee, 50); // debounce
        return () => clearTimeout(timeout);
    }, [employeeId]);


    if (!formData) {
        return <div>Loading...</div>;
    }

    function Area({ label, col = 12, rows = 3, value, onChange, readOnly = false }) {
        return (
            <div className={`mr-col-${to24(col)} mr-line-wrap`}>
                <div className="mr-label">{label}</div>
                <textarea
                    style={{ color: "blue" }}
                    rows={rows}
                    className={`mr-box dotted ${readOnly ? 'readonly-textarea' : ''}`}
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

    const setNested = (g, k, v) =>
        setFormData((p) => ({ ...p, [g]: { ...p[g], [k]: v } }));
    const handleSpareChange = (i, k, v) =>
        setFormData((p) => {
            const n = [...p.spare_parts];
            n[i] = { ...n[i], [k]: v };
            return { ...p, spare_parts: n };
        });

    const handleUpdate_data_completed = async () => {
        // ⛔ ตรวจสอบ Corrective และ Result
        if (!formData.repair_accept_by) {
            Swal.fire({
                icon: "warning",
                title: "ข้อมูลไม่ครบ",
                text: "กรุณากรอก REPAIR ACCEPT BY ให้ครบก่อนบันทึก",
            });
            return;
        }
        // ถ้า repair_accept_time ยังว่าง → ใส่เวลาปัจจุบัน
        const autoTime = (formData.repair_accept_time ?? "").trim() || nowHHMM();

        try {
            const response = await axios.put(`${config.api_path}/Maintenance/updateRequestFinished/${formData.id}`, {
                ...formData,
                repair_accept_by: formData.repair_accept_by,
                repair_accept_time: autoTime,     // ✅ ใส่เวลาปัจจุบัน
                pro_receive: "Receive"
            });

            if (response.data.success) {
                // อัปเดต state ให้ UI เห็นเวลาใหม่ทันที (เผื่อยังอยู่หน้าเดิมชั่วคราว)
                setFormData(prev => ({ ...prev, repair_accept_time: autoTime }));
                Swal.fire({
                    icon: "success",
                    title: "บันทึกสำเร็จ",
                    text: "ข้อมูลได้รับการอัปเดตเรียบร้อยแล้ว",
                    timer: 1500
                }).then(() => {
                    // navigate("/listFormProduct");  // ย้ายหลังจากกด OK ใน Swal
                    navigate(location.state?.from || "/listFormProduct");  // ✅ กลับหน้าก่อนหน้า หรือ fallback
                });
            } else {
                Swal.fire("เกิดข้อผิดพลาด", "ไม่สามารถอัปเดตข้อมูลได้", "error");
            }
        } catch (error) {
            console.error("Update failed:", error);
            Swal.fire("เกิดข้อผิดพลาด", "ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้", "error");
        }
    };
    const handleUpdate_data_cancel = async () => {
        const result = await Swal.fire({
            title: "ยืนยันยกเลิกข้อมูล?",
            text: "ระบบจะเปลี่ยนสถานะเป็น Cancel และบันทึกการยกเลิก",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "ใช่, ยกเลิกเลย",
            cancelButtonText: "ไม่ยกเลิก",
            reverseButtons: true,
            focusCancel: true,
            showLoaderOnConfirm: true,
            allowOutsideClick: () => !Swal.isLoading(),
            preConfirm: async () => {
                try {
                    const response = await axios.put(
                        `${config.api_path}/Maintenance/updateRequestCancel/${formData.id}`,
                        {
                            ...formData,
                            request_status: "cancel",
                        }
                    );

                    if (!response?.data?.success) {
                        throw new Error("ไม่สามารถอัปเดตข้อมูลได้");
                    }
                    return response.data; // ส่งต่อไปใช้หลังปิด modal
                } catch (err) {
                    Swal.showValidationMessage(
                        err?.response?.data?.message ||
                        err?.message ||
                        "เกิดข้อผิดพลาด ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้"
                    );
                }
            },
        });

        if (result.isConfirmed) {
            await Swal.fire({
                icon: "success",
                title: "บันทึกสำเร็จ",
                text: "ข้อมูลได้รับการอัปเดตเรียบร้อยแล้ว",
                timer: 1200,
                showConfirmButton: false,
            });
            // navigate("/listFormProduct");
            navigate(location.state?.from || "/listFormProduct");  // ✅ กลับหน้าก่อนหน้า
        }
    };


    const BackPage = () => {
        navigate(location.state?.from || "/listFormProduct");  // ✅ กลับหน้าก่อนหน้า
        window.location.reload()
    }

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
                                    /></div>
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
                                    /></div>
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
                                        onChange={() => setField("Location_Name", "BPI")}
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
                                <input
                                    className="mr-line w-180 text-primary"
                                    value={formData.receive_by || ""}
                                />
                                <span>Receive Time :</span>
                                <input
                                    type="text"
                                    className="mr-line w-120 text-primary"
                                    value={formData.receive_time || ""}

                                />
                            </div>
                        </div>

                        <div className="mr-row very-small">
                            <div style={{ fontSize: "0.9rem", fontWeight: "bold" }}>BY</div>
                            <input
                                value={formData.work_by || ""}
                                className="mr-line w-180 text-primary"
                            />
                            <Line label="FROM DATE" col={2}
                                type="text"
                                value={formData.from_date || ""} readOnly
                            />
                            <Line label="TIME" col={2} type="text"
                                value={formData.from_time || ""} readOnly
                            />
                            <Line label="TO DATE" col={2} type="text"
                                value={formData.to_date || ""} readOnly
                            />
                            <Line label="TIME" col={2} type="text"
                                value={formData.to_time} readOnly
                            />
                            <Line label="TOTAL (Hr.)" col={2}
                                value={formData.total_hr} readOnly
                            />
                        </div>

                    </section>


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
                                            //  onChange={e => setNested("cause_member", "not_understand", e.target.checked)} 
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

                    {/* Corrective / Result */}
                    <section className="mr-section">
                        <div className="mr-row">
                            <div className="mr-col-24 mr-line-wrap">
                                <div className="mr-label">Corrective (การแก้ไข)</div>
                                <textarea
                                    rows={2}
                                    className="mr-box dotted text-primary"
                                    value={formData.corrective || ""}
                                />
                            </div>

                            <div className="mr-col-24 mr-line-wrap">
                                <div className="mr-label">Result (ผล)</div>
                                <textarea
                                    rows={2}
                                    className="mr-box dotted text-primary"
                                    value={formData.result || ""}
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
                                            />
                                        </td>
                                        <td>
                                            <input
                                                className="mr-line text-primary"
                                                value={sp.model}
                                            />
                                        </td>
                                        <td>
                                            <input
                                                className="mr-line text-primary"
                                                value={sp.maker}
                                            />
                                        </td>
                                        <td>
                                            <input
                                                className="mr-line text-primary"
                                                value={sp.qty}
                                            />
                                        </td>
                                        <td>
                                            <input
                                                className="mr-line text-primary"
                                                value={sp.unit}
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
                                    />
                                    CONTROL (ควบคุม)
                                </label>
                                <label>
                                    <input
                                        type="radio"
                                        name="ctrl"
                                        checked={formData.control === "uncontrol"}
                                    />
                                    UNCONTROL (ไม่ควบคุม)
                                </label>
                                <div style={{ marginLeft: "auto", minWidth: "200px" }}>
                                    <Line
                                        label="APPROVE BY (อนุมัติโดย)"
                                        col={4}
                                        value={formData.approve_by}
                                    />
                                </div>
                            </div>
                        </div>
                    </section>

                    <section className="mr-section slim">
                        <div className="mr-row very-small">
                            <div className="mr-col-24">
                               {machineData.receive_by && machineData.receive_time && machineData.corrective && !machineData.approve_by && (
                                 <div className="accept-row">
                                        <input
                                        class="dotted-input text-primary fw-bold col-3"
                                        value={employeeId}
                                        onChange={(e) => setEmployeeId(e.target.value.toLocaleUpperCase())}
                                        placeholder="**Emp no...."
                                    />
                                 </div>
                                   )}

                                <div className="accept-row">
                                    <span className="accept-label">REPAIR ACCEPT BY :</span>
                                    <input
                                        className="mr-line text-primary accept-input"
                                        value={formData.repair_accept_by || ""}
                                        onChange={(e) => setField("repair_accept_by", e.target.value.toUpperCase())}
                                        readOnly
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

                        {machineData.receive_by && machineData.receive_time && machineData.corrective && !machineData.approve_by && (
                            <div className="col-12 mt-2">
                                <button className="col-6 btn btn-success" onClick={handleUpdate_data_completed}>
                                    💾 Save Data recording completed
                                </button>
                            </div>
                        )}
                        {!machineData.repair_accept_by && (
                            <div className="accept-keep d-flex justify-content-end">
                                <button className='btn btn-danger ml-2'
                                    onClick={handleUpdate_data_cancel}
                                >
                                    CANCEL
                                </button>
                            </div>
                        )}
                    </section>

                </div>
            </div>
        </>
    );
}

export default ResultFormPro;
