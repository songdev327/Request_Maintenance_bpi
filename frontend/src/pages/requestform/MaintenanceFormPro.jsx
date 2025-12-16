import React, { useMemo, useState, useEffect } from "react";
import "./MaintenanceForm.css";
import config from '../../config'; // นำเข้า config ที่คุณมี
import axios from 'axios';
import UndoIcon from '@mui/icons-material/Undo';
import { useNavigate, useLocation } from "react-router-dom";
import Swal from "sweetalert2";


export default function MaintenanceFormPro() {
    const [form, setForm] = useState({
        to: "Machine maintenance",
        requestor_name: "",
        shift: "",
        section: "",
        date: "",
        time: "",
        shift_leader: "",
        machine_name: "",
        machine_no: "",
        machine_stop_time: "",
        machine_status: "can_running",
        brief_description: "",
        production_action: "",
        Location_Name: "",

        cause_member: {
            not_understand: false,
            not_checking: false,
            absent: false,
            not_carefully: false,
            repair_error: false,
        },
        cause_machine: {
            operate_error: false,
            design_error: false,
        },
        cause_spare: {
            spare_damage: false,
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
        control: "",

    });

    const [masterItemData, setMasterItemData] = useState(null);

    // เพิ่ม useEffect และ state
    const [employeeId, setEmployeeId] = useState("");
    const [employeeIdLoader, setEmployeeIdLoader] = useState("");

    const location = useLocation();

    const navigate = useNavigate(); // ใช้ย้อนกลับ


    useEffect(() => {
        if (location.state) {
            const { section, machine_name, location_name } = location.state;

            setForm((prev) => ({
                ...prev,
                section: section || prev.section,
                machine_name: machine_name || prev.machine_name,
                Location_Name: location_name || prev.Location_Name
            }));

            // 👉 โหลดข้อมูล master item ทันทีหากมี machine_name
            if (machine_name) {
                handleMachineNameChange(machine_name);
            }
        }
    }, []);

    useEffect(() => {
        // เซ็ต default ให้ date/time แค่ครั้งแรก และเฉพาะช่องที่ยังว่าง
        setForm(prev => {
            if (prev.date && prev.time) return prev;     // มีทั้งคู่แล้ว ไม่ต้องทำอะไร

            const now = new Date();
            const yyyy = now.getFullYear();
            const mm = String(now.getMonth() + 1).padStart(2, "0");
            const dd = String(now.getDate()).padStart(2, "0");
            const hh = String(now.getHours()).padStart(2, "0");
            const min = String(now.getMinutes()).padStart(2, "0");

            return {
                ...prev,
                date: prev.date || `${yyyy}-${mm}-${dd}`,  // สำหรับ input type="date"
                time: prev.time || `${hh}:${min}`,         // สำหรับ input type="time"
            };
        });
    }, []);

    // const setField = (k, v) => setForm((p) => ({ ...p, [k]: v }));
    const setNested = (g, k, v) =>
        setForm((p) => ({ ...p, [g]: { ...p[g], [k]: v } }));
    const handleSpareChange = (i, k, v) =>
        setForm((p) => {
            const n = [...p.spare_parts];
            n[i] = { ...n[i], [k]: v };
            return { ...p, spare_parts: n };
        });

    const requiredOk = useMemo(
        () =>
            form.requestor_name &&
            form.section &&
            form.date &&
            form.machine_name &&
            form.machine_no,
        [form]
    );


    const setField = (k, v) => {
        console.log(`Setting field ${k} to ${v}`);
        setForm((prevState) => ({
            ...prevState,
            [k]: v,
        }));
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
                    setField("requestor_name", `${found.username}`);
                } else {
                    setField("requestor_name", "");
                }
            } catch (err) {
                console.error("❌ ค้นหาผู้ใช้ไม่สำเร็จ:", err);
                setField("requestor_name", "");
            }
        };

        const timeout = setTimeout(fetchUserByEmployee, 50); // debounce
        return () => clearTimeout(timeout);
    }, [employeeId]);

    useEffect(() => {
        if (!employeeIdLoader) return;

        const fetchUserByEmployee = async () => {
            try {
                const res = await axios.get(`${config.api_path}/users`, {
                    params: { q: employeeIdLoader }, // ค้นหาจาก employee field
                });
                const found = res.data?.find(
                    (u) => u.employee?.toLowerCase() === employeeIdLoader.toLowerCase()
                );
                if (found) {
                    setField("shift_leader", `${found.username}`);
                } else {
                    setField("shift_leader", "");
                }
            } catch (err) {
                console.error("❌ ค้นหาผู้ใช้ไม่สำเร็จ:", err);
                setField("shift_leader", "");
            }
        };

        const timeout = setTimeout(fetchUserByEmployee, 100); // debounce
        return () => clearTimeout(timeout);
    }, [employeeIdLoader]);


    const submit = async (e) => {
        e.preventDefault();

        if (!form.Location_Name) {
            Swal.fire({ icon: "warning", title: "กรุณาเลือก LOCATION", text: "โปรดเลือก BPI , BPI TO NVK , NVK ก่อนบันทึก" });
            return;
        }

        // 🔧 เพิ่ม machine_request_name ก่อนส่ง
        const newForm = {
            ...form,
            request_status: "request",
            machine_request_name: `${form.machine_name}-${form.machine_no}`,
            Machine_No: `${form.machine_name}-${form.machine_no}`,
            // Request_No_1: `${form.requestor_name}`,
            Work_Request_Date: `${form.date}`,
            Work_Request_Time: `${form.time}`,
            Brief_Description: `${form.brief_description}`,
            Location_Name: `${form.Location_Name}`,

            // 🟩 เพิ่มข้อมูลจาก masterItemData
            Country_Code: masterItemData?.Country_Code || "",
            Country_Name: masterItemData?.Country_Name || "",
            Company_Code: masterItemData?.Company_Code || "",
            Company_Name: masterItemData?.Company_Name || "",
            Place_Code: masterItemData?.Place_Code || "",
            Place_Name: masterItemData?.Place_Name || "",
            Section_Code: masterItemData?.Section_Code || "",
            Section_Name: masterItemData?.Section_Name || "",
            Process_Group_Code: masterItemData?.Process_Group_Code || "",
            Process_Group_Name: masterItemData?.Process_Group_Name || "",
            Process_Code: masterItemData?.Process_Code || "",
            Process_Name: masterItemData?.Process_Name || "",

        };

        const redirectBackTo = location.state?.from || "/listFormProduct";  // ✅ แก้ตรงนี้

        try {
            const response = await axios.post(`${config.api_path}/Maintenance`, newForm);
            console.log("✅ บันทึกสำเร็จ:", response.data);
            // ✅ SweetAlert แทน alert
            await Swal.fire({
                icon: "success",
                title: "บันทึกสำเร็จ",
                text: "ข้อมูลของคุณถูกบันทึกเรียบร้อยแล้ว",
                confirmButtonText: "ตกลง",
                timer: 1200,
            });

            // navigate("/listFormProduct");
            // window.location.reload();
            navigate(redirectBackTo);     // ✅ กลับไปหน้าที่มา
            window.location.reload();     // ✅ รีเฟรชเพื่อโหลดข้อมูลใหม่

            // เคลียร์ฟอร์มถ้าต้องการ
            // setForm(initialState);
        } catch (err) {
            console.error("❌ เกิดข้อผิดพลาด:", err);
            // ✅ SweetAlert แสดง error
            if (err.response?.data?.error) {
                Swal.fire({
                    icon: "error",
                    title: "บันทึกไม่สำเร็จ",
                    text: err.response.data.error,
                    confirmButtonText: "ปิด"
                });
            } else {
                Swal.fire({
                    icon: "error",
                    title: "เกิดข้อผิดพลาด",
                    text: "ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้",
                    confirmButtonText: "ปิด"
                });
            }
        }
    };

    const BackPage = () => {
        navigate(location.state?.from || "/listFormProduct");  // ✅ กลับหน้าก่อนหน้า
        window.location.reload()
    }

    const handleMachineNameChange = async (value) => {
        setField("machine_name", value);
        setField("machine_no", "");
        setMasterItemData(null);

        if (!value) return;

        try {
            const res = await axios.get(`${config.api_path}/MasterList/by-machine/${value}`);
            if (res.data) {
                setMasterItemData(res.data);
            } else {
                setMasterItemData(null);
            }
        } catch (err) {
            console.error("Error fetching master item data:", err);
        }
    };


    return (
        <div className="mr-root">
            <button className="btn btn-danger" onClick={BackPage}>
                <UndoIcon className="mr-2" />
                BACK
            </button>
            <div className="mr-a4">
                <header className="mr-header">
                    <h2 className="text-bold text-center">MAINTENANCE REQUEST SHEET</h2>
                    <h6 className="text-center">(ใบแจ้งซ่อมเครื่องจักร)</h6>
                    <div className="no-print">
                        {/* <button className="mr-btn" onClick={printPage}>
                            พิมพ์/บันทึก PDF
                        </button> */}
                    </div>
                </header>

                <form onSubmit={submit}>
                    {/* Meta line */}
                    <div className="mr-row mr-meta mr-between">
                        {/* ฝั่งซ้าย */}
                        <div className="mr-col-12">
                            ถึง (To): <strong>{form.to}</strong>
                        </div>

                        {/* ฝั่งขวา */}
                        <div className="mr-col-12 mr-right">
                            DATE :
                            <input
                                // type="date"
                                value={form.date}
                                onChange={(e) => setField("date", e.target.value)}
                                className="mr-line-input w-40 text-primary"
                            />
                            TIME :
                            <input
                                // type="time"
                                value={form.time}
                                onChange={(e) => setField("time", e.target.value)}
                                className="mr-line-input w-32 text-primary"
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
                                        class="dotted-input text-primary fw-bold"
                                        value={employeeId}
                                        onChange={(e) => setEmployeeId(e.target.value.toLocaleUpperCase())}
                                        placeholder="Emp no...."
                                    />
                                    <input
                                        type="text" id="request-name"
                                        class="dotted-input text-primary fw-bold" disabled
                                        value={form.requestor_name}
                                        onChange={(e) => setField("requestor_name", e.target.value.toUpperCase())}
                                    />
                                </div>
                                <div class="field-hint">(ชื่อผู้แจ้งซ่อม)</div>
                            </div>

                            <div class="form-group">
                                <div class="field-label">SHIFT :
                                    <select
                                        class="dotted-input text-primary fw-bold"
                                        value={form.shift}
                                        onChange={(e) => setField("shift", e.target.value)}
                                    >
                                        <option value="">............................</option>
                                        <option value="A">A</option>
                                        <option value="B">B</option>
                                        <option value="C">C</option>
                                        <option value="D">D</option>
                                        <option value="M">M</option>
                                        <option value="N">N</option>
                                    </select>
                                </div>

                                <div class="field-hint">(กะ)</div>

                            </div>

                            <div class="form-group">
                                <div class="field-label">SECTION :
                                    <select
                                        class="dotted-input text-primary fw-bold"
                                        value={form.section}
                                        onChange={(e) => setField("section", e.target.value)}
                                    >
                                        <option value="">............................</option>
                                        <option value="TN SLV+CONE">TN SLV+CONE</option>
                                        <option value="TN SHAFT">TN SHAFT</option>
                                        <option value="SUB CUT">SUB CUT</option>
                                        <option value="WASHING">WASHING</option>
                                        <option value="SECONDARY">SECONDARY</option>
                                        <option value="SECONDARY">GIEDING</option>
                                        <option value="ENGINEER">ENGINEER</option>
                                        <option value="IT">IT</option>
                                    </select>
                                </div>
                                <div class="field-hint">(หน่วยงาน)</div>
                            </div>

                            <div class="form-group">
                                <div class="field-label">SHIFT LEADER :
                                    <input
                                        class="dotted-input text-primary fw-bold"
                                        value={employeeIdLoader}
                                        onChange={(e) => setEmployeeIdLoader(e.target.value.toLocaleUpperCase())}
                                    />
                                    <input
                                        type="text" id="request-name"
                                        class="dotted-input text-primary fw-bold" disabled
                                        value={form.shift_leader}
                                        onChange={(e) => setField("shift_leader", e.target.value.toUpperCase())}
                                    />
                                </div>
                                <div class="field-hint">(หัวหน้างาน, หัวหน้ากะ)</div>

                            </div>
                        </div>

                        <div class="form-row">
                            <div class="form-group">
                                <div class="field-label">MACHINE NAME :
                                    <select
                                        class="dotted-input text-primary fw-bold"
                                        value={form.machine_name}
                                        onChange={(e) => handleMachineNameChange(e.target.value)}
                                    >
                                        <option value="">............................</option>
                                        <option value="TTC">TTC</option>
                                        <option value="TB">TB</option>
                                        <option value="TBS">TBS</option>
                                        <option value="TBM">TBM</option>
                                        <option value="TN">TN</option>
                                        <option value="SB">SB</option>
                                        <option value="CS">CS</option>
                                        <option value="CH">CH</option>
                                        <option value="SFG">SFG</option>
                                        <option value="TCG">TCG</option>
                                        <option value="SGM">SGM</option>
                                        <option value="RFG">RFG</option>
                                        <option value="ODG">ODG</option>
                                        <option value="ICG">ICG</option>
                                        <option value="SI">SI</option>
                                        <option value="AVS">AVS</option>
                                        <option value="AVC">AVC</option>
                                        <option value="AIC">AIC</option>
                                        <option value="AB">AB</option>
                                        <option value="AG">AG</option>
                                        <option value="ACD">ACD</option>
                                        <option value="HP">HP</option>
                                        <option value="BX">BX</option>
                                        <option value="BE">BE</option>
                                        <option value="WT">WT</option>
                                        <option value="PSA">PSA</option>
                                    </select>
                                </div>
                                <div class="field-hint">(ชื่อเครื่องจักร)</div>
                            </div>


                            <div class="form-group">
                                <div class="field-label">MACHINE No. :
                                    <select
                                        class="dotted-input text-primary fw-bold"
                                        value={form.machine_no}
                                        onChange={(e) => setField("machine_no", e.target.value)}
                                    >
                                        <option value="">............................</option>
                                        {Array.from({ length: 100 }, (_, i) => (
                                            <option key={i + 1} value={String(i + 1).padStart(2, "0")}>
                                                {String(i + 1).padStart(2, "0")}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div class="field-hint">(หมายเลขเครื่องจักร)</div>
                            </div>

                            <div class="form-group">
                                <div class="field-label">MACHINE STOP TIME :
                                    <input
                                        type="time"
                                        class="dotted-input text-primary fw-bold"
                                        value={form.machine_stop_time}
                                        onChange={(e) => setField("machine_stop_time", e.target.value)}
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
                                        checked={form.Location_Name === "BPI"}
                                        onChange={() => setField("Location_Name", "BPI")}
                                    />
                                    <span> BPI</span>
                                    <input
                                        type="radio"
                                        name="Location_Name" className="ml-5"
                                        checked={form.Location_Name === "BPI TO NVK"}
                                        onChange={() => setField("Location_Name", "BPI TO NVK")}
                                    />
                                    <span> BPI TO NVK</span>
                                    <input
                                        type="radio"
                                        name="Location_Name" className="ml-5"
                                        checked={form.Location_Name === "NVK"}
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
                                        checked={form.machine_status === "can_running"}
                                        onChange={() => setField("machine_status", "can_running")}
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
                                        checked={form.machine_status === "cannot_running_stop"}
                                        onChange={() => setField("machine_status", "cannot_running_stop")}
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
                                        checked={form.machine_status === "no_schedule"}
                                        onChange={() => setField("machine_status", "no_schedule")}
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
                                rows={3}
                                value={form.brief_description}
                                onChange={(v) => setField("brief_description", v.toUpperCase())}
                            />
                            <Area
                                label="PRODUCTION ACTION (สิ่งที่ดำเนินการในฝ่ายผลิต)"
                                col={12}
                                rows={3}
                                value={form.production_action}
                                onChange={(v) => setField("production_action", v.toUpperCase())}
                            />
                        </div>
                    </section>

                    <section className="mr-section slim">
                        <div className="row">
                            <div className="col-6">
                                <button type="submit" className="btn btn-success col-12" disabled={!requiredOk}>
                                    Save request to M/M
                                </button>
                            </div>
                        </div>
                    </section>

                    {/* Display metadata */}
                    {masterItemData && (
                        <section className="mr-section slim bg-secondary">
                            <div className="row">
                                <div className="col-12 text-secondary">
                                    <span className="text-secondary">- Country_Code: {masterItemData.Country_Code}</span> , <span className="text-secondary">- Country_Name: {masterItemData.Country_Name}</span> ,
                                    <span className="text-secondary">- Company_Code: {masterItemData.Company_Code}</span> , <span className="text-secondary">- Company_Name: {masterItemData.Company_Name}</span> ,  <span className="text-secondary">- Place_Code: {masterItemData.Place_Code}</span>
                                    <br />
                                    <span className="text-secondary">- Place_Name: {masterItemData.Place_Name}</span> ,  <span className="text-secondary">- Section_Code: {masterItemData.Section_Code}</span> ,
                                    <span className="text-secondary">- Section_Name: {masterItemData.Section_Name}</span> , <span className="text-secondary">- Process_Group_Code: {masterItemData.Process_Group_Code}</span>
                                    <br />
                                    <span className="text-secondary">- Process_Group_Name: {masterItemData.Process_Group_Name}</span> ,  <span className="text-secondary">- Process_Code: {masterItemData.Process_Code}</span> ,
                                    <span className="text-secondary">- Process_Name: {masterItemData.Process_Name}</span>
                                </div>
                            </div>
                        </section>
                    )}


                </form>
            </div>
        </div>
    );
}


function Area({ label, col = 12, rows = 3, value, onChange }) {
    return (
        <div className={`mr-col-${to24(col)} mr-line-wrap`}>
            <div className="mr-label">{label}</div>
            <textarea
                rows={rows}
                className="mr-box text-primary fw-bold"
                value={value}
                onChange={(e) => onChange(e.target.value)}
            />
        </div>
    );
}


function to24(c) {
    const v = Math.round(c * 2); // 0..24
    return Math.max(1, Math.min(24, v));
}
