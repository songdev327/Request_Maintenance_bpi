import React, { useMemo, useState ,  } from "react";
import "./MaintenanceForm.css";
import config from '../../config'; // นำเข้า config ที่คุณมี
import axios from 'axios';
import UndoIcon from '@mui/icons-material/Undo';
import { useNavigate } from "react-router-dom";

export default function MaintenanceForm() {
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
        receive_by: "",
        receive_time: "",
        work_by: "",
        from_date: "",
        from_time: "",
        to_date: "",
        to_time: "",
        total_hr: "",
        cause_member: {
            not_understand: false,
            not_checking: false,
            absent: false,
            not_carefully: false,
            repair_error: false,
        },
        cause_machine: {
            production: false,
            operate_error: false,
            design_error: false,
            quality_fail: false,
            inappropriate: false,
            not_lubricant: false,
            loosen: false,
        },
        cause_spare: { spare_damage: false, product_spare_error: false },
        cause_product_process: {
            dirty: false,
            high_temp: false,
            water_leak: false,
            chemical_gas: false,
        },
        corrective: "",
        result: "",
        spare_parts: [
            { name: "", model: "", maker: "", qty: "" },
            { name: "", model: "", maker: "", qty: "" },
            { name: "", model: "", maker: "", qty: "" },
            { name: "", model: "", maker: "", qty: "" },
        ],
        control: "",
        approve_by: "",
        repair_accept_by: "",
    });

    const navigate = useNavigate(); // ใช้ย้อนกลับ

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

    // const printPage = () => window.print();
   

    // function PaperField({
    //     label,
    //     col = 12,
    //     type = "text",
    //     value,
    //     onChange,
    // }) {
    //     return (
    //         <div className={`mr-col-${to24(col)} paper-field`}>
    //             <div className="paper-label">{label} :</div>
    //             <div className="paper-dots">
    //                 <input
    //                     type={type}
    //                     value={value}
    //                     onChange={(e) => onChange(e.target.value)} // ส่งค่าที่กรอกลงใน state
    //                 />
    //             </div>
    //         </div>
    //     );
    // }

    const setField = (k, v) => {
        console.log(`Setting field ${k} to ${v}`);
        setForm((prevState) => ({
            ...prevState,
            [k]: v,
        }));
    };

const submit = async (e) => {
  e.preventDefault();

  // 🔧 เพิ่ม machine_request_name ก่อนส่ง
  const newForm = {
    ...form,
    request_status: "request",
    machine_request_name: `${form.machine_name}-${form.machine_no}`

  };

  try {
    const response = await axios.post(`${config.api_path}/Maintenance`, newForm);
    console.log("✅ บันทึกสำเร็จ:", response.data);
    alert("บันทึกข้อมูลสำเร็จ");

    // เคลียร์ฟอร์มถ้าต้องการ
    // setForm(initialState);
  } catch (err) {
    console.error("❌ เกิดข้อผิดพลาด:", err);
    if (err.response?.data?.error) {
      alert("❌ บันทึกไม่สำเร็จ: " + err.response.data.error);
    } else {
      alert("❌ เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์");
    }
  }
};

const BackPage = ()=>{
    navigate("/listFormProduct");
   window.location.reload()
}


    return (
        <div className="mr-root">
            <button className="btn btn-danger" onClick={BackPage}>
                <UndoIcon className="mr-2"/>
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
                                type="date"
                                value={form.date}
                                onChange={(e) => setField("date", e.target.value)}
                                className="mr-line-input w-40"
                            />
                            TIME :
                            <input
                                type="time"
                                value={form.time}
                                onChange={(e) => setField("time", e.target.value)}
                                className="mr-line-input w-32"
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
                                        class="dotted-input"
                                        value={form.requestor_name}
                                        onChange={(e) => setField("requestor_name", e.target.value)}
                                    /></div>
                                <div class="field-hint">(ชื่อผู้แจ้งซ่อม)</div>
                            </div>

                            <div class="form-group">
                                <div class="field-label">SHIFT :
                                    <input
                                        type="text"
                                        class="dotted-input"
                                        value={form.shift}
                                        onChange={(e) => setField("shift", e.target.value)}
                                    /></div>

                                <div class="field-hint">(กะ)</div>

                            </div>

                            <div class="form-group">
                                <div class="field-label">SECTION :
                                    <input
                                        type="text"
                                        class="dotted-input"
                                        value={form.section}
                                        onChange={(e) => setField("section", e.target.value)}
                                    /></div>
                                <div class="field-hint">(หน่วยงาน)</div>
                            </div>

                            <div class="form-group">
                                <div class="field-label">SHIFT LEADER :
                                    <input
                                        type="text"
                                        class="dotted-input"
                                        value={form.shift_leader}
                                        onChange={(e) => setField("shift_leader", e.target.value)}
                                    /></div>
                                <div class="field-hint">(หัวหน้างาน, หัวหน้ากะ)</div>

                            </div>
                        </div>

                        <div class="form-row">
                            <div class="form-group">
                                <div class="field-label">MACHINE NAME :
                                    <input
                                        type="text"
                                        class="dotted-input"
                                        value={form.machine_name}
                                        onChange={(e) => setField("machine_name", e.target.value)}
                                    /></div>
                                <div class="field-hint">(ชื่อเครื่องจักร)</div>

                            </div>

                            <div class="form-group">
                                <div class="field-label">MACHINE No. :
                                    <input
                                        type="text"
                                        class="dotted-input"
                                        value={form.machine_no}
                                        onChange={(e) => setField("machine_no", e.target.value)}
                                    /></div>
                                <div class="field-hint">(หมายเลขเครื่องจักร)</div>

                            </div>

                            <div class="form-group">
                                <div class="field-label">MACHINE STOP TIME :
                                    <input
                                        type="time"
                                        class="dotted-input"
                                        value={form.machine_stop_time}
                                        onChange={(e) => setField("machine_stop_time", e.target.value)}
                                    /></div>
                                <div class="field-hint">(เวลาที่เครื่องจักรเสีย)</div>

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
                                onChange={(v) => setField("brief_description", v)}
                            />
                            <Area
                                label="PRODUCTION ACTION (สิ่งที่ดำเนินการในฝ่ายผลิต)"
                                col={12}
                                rows={3}
                                value={form.production_action}
                                onChange={(v) => setField("production_action", v)}
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
                                    className="mr-line w-180"
                                    value={form.receive_by}
                                    onChange={(e) => setField("receive_by", e.target.value)}
                                />
                                <span>Receive Time :</span>
                                <input
                                    type="time"
                                    className="mr-line w-120"
                                    value={form.receive_time}
                                    onChange={(e) => setField("receive_time", e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="mr-row very-small">
                            <Line label="WORK BY" col={2}
                                value={form.work_by}
                                onChange={(v) => setField("work_by", v)} />
                            <Line label="FROM DATE" col={2} type="date"
                                value={form.from_date}
                                onChange={(v) => setField("from_date", v)} />
                            <Line label="TIME" col={2} type="time"
                                value={form.from_time}
                                onChange={(v) => setField("from_time", v)} />
                            <Line label="TO DATE" col={2} type="date"
                                value={form.to_date}
                                onChange={(v) => setField("to_date", v)} />
                            <Line label="TIME" col={2} type="time"
                                value={form.to_time}
                                onChange={(v) => setField("to_time", v)} />
                            <Line label="TOTAL (Hr.)" col={2}
                                value={form.total_hr}
                                onChange={(v) => setField("total_hr", v)} />
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
                                                checked={form.cause_member_mode === "mm"}
                                                onChange={() => setField("cause_member_mode", "mm")}
                                            />{" "}
                                            M/M
                                        </label>
                                        <label>
                                            <input
                                                type="radio"
                                                name="member_mode"
                                                checked={form.cause_member_mode === "production"}
                                                onChange={() => setField("cause_member_mode", "production")}
                                            />{" "}
                                            PRODUCTION
                                        </label>
                                    </div>

                                    <div className="mr-checkboxes">
                                        <label><input type="checkbox" checked={form.cause_member.not_understand} onChange={e => setNested("cause_member", "not_understand", e.target.checked)} /> ไม่เข้าใจ (Not Understand)</label>
                                        <label><input type="checkbox" checked={form.cause_member.not_checking} onChange={e => setNested("cause_member", "not_checking", e.target.checked)} /> ไม่ตรวจเช็ค (Not Checking)</label>
                                        <label><input type="checkbox" checked={form.cause_member.absent} onChange={e => setNested("cause_member", "absent", e.target.checked)} /> ขาดงาน (Absent)</label>
                                        <label><input type="checkbox" checked={form.cause_member.not_carefully} onChange={e => setNested("cause_member", "not_carefully", e.target.checked)} /> ทำด้วยไม่ถี่ถ้วน (Not Carefully)</label>
                                        <label><input type="checkbox" checked={form.cause_member.repair_error} onChange={e => setNested("cause_member", "repair_error", e.target.checked)} /> ทำไม่ดี (Repair Error)</label>
                                    </div>
                                </div>

                                {/* 2) เครื่องจักร (Machine) */}
                                <div className="cause-col">
                                    <div className="cause-title">เครื่องจักร (Machine)</div>
                                    <div className="mr-checkboxes">
                                        <label><input type="checkbox" checked={form.cause_machine.production} onChange={e => setNested("cause_machine", "production", e.target.checked)} /> PRODUCTION</label>
                                        <label><input type="checkbox" checked={form.cause_machine.operate_error} onChange={e => setNested("cause_machine", "operate_error", e.target.checked)} /> Operate Error</label>
                                        <label><input type="checkbox" checked={form.cause_machine.design_error} onChange={e => setNested("cause_machine", "design_error", e.target.checked)} /> ออกแบบไม่ดี (Design Error)</label>
                                        <label><input type="checkbox" checked={form.cause_machine.quality_fail} onChange={e => setNested("cause_machine", "quality_fail", e.target.checked)} /> Quality Fail</label>
                                        <label><input type="checkbox" checked={form.cause_machine.inappropriate} onChange={e => setNested("cause_machine", "inappropriate", e.target.checked)} /> ไม่เหมาะสมกับงาน (Inappropriate)</label>
                                        <label><input type="checkbox" checked={form.cause_machine.not_lubricant} onChange={e => setNested("cause_machine", "not_lubricant", e.target.checked)} /> ขาดการหล่อลื่น (Not Lubricant)</label>
                                        <label><input type="checkbox" checked={form.cause_machine.loosen} onChange={e => setNested("cause_machine", "loosen", e.target.checked)} /> หลวม คลอน คาย (Loosen)</label>
                                    </div>
                                </div>

                                {/* 3) รูปภัณฑ์ (Spare parts) */}
                                <div className="cause-col">
                                    <div className="cause-title">รูปภัณฑ์ (Spare parts)</div>
                                    <div className="mr-checkboxes">
                                        <label><input type="checkbox" checked={form.cause_spare.spare_damage} onChange={e => setNested("cause_spare", "spare_damage", e.target.checked)} /> ชิ้นส่วนเสียหาย (Spare damage)</label>
                                        <label><input type="checkbox" checked={form.cause_spare.product_spare_error} onChange={e => setNested("cause_spare", "product_spare_error", e.target.checked)} /> Product Spare Error</label>
                                    </div>
                                </div>

                                {/* 4) กระบวนการผลิต (Process) */}
                                <div className="cause-col">
                                    <div className="cause-title">กระบวนการผลิต (Product Proc.)</div>
                                    <div className="mr-checkboxes">
                                        <label><input type="checkbox" checked={form.cause_product_process.dirty} onChange={e => setNested("cause_product_process", "dirty", e.target.checked)} /> สกปรก (Dirty)</label>
                                        <label><input type="checkbox" checked={form.cause_product_process.high_temp} onChange={e => setNested("cause_product_process", "high_temp", e.target.checked)} /> อุณหภูมิสูง (High Temp.)</label>
                                        <label><input type="checkbox" checked={form.cause_product_process.water_leak} onChange={e => setNested("cause_product_process", "water_leak", e.target.checked)} /> น้ำรั่ว (Water Leak)</label>
                                        <label><input type="checkbox" checked={form.cause_product_process.chemical_gas} onChange={e => setNested("cause_product_process", "chemical_gas", e.target.checked)} /> สารเคมี/แก๊ส (Chemical, Gas)</label>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                   {/* Corrective / Result */}
                    <section className="mr-section">
                        <div className="mr-row">
                            <Area
                                label="Corrective (การแก้ไข)"
                                rows={6}
                                col={12}
                                value={form.corrective}
                                onChange={(v) => setField("corrective", v)}
                            />
                            <Area
                                label="Result (ผล)"
                                rows={6}
                                col={12}
                                value={form.result}
                                onChange={(v) => setField("result", v)}
                            />
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
                                </tr>
                            </thead>
                            <tbody>
                                {form.spare_parts.map((sp, i) => (
                                    <tr key={i}>
                                        <td className="tc">{i + 1}</td>
                                        <td>
                                            <input
                                                className="mr-line"
                                                value={sp.name}
                                                onChange={(e) => handleSpareChange(i, "name", e.target.value)}
                                            />
                                        </td>
                                        <td>
                                            <input
                                                className="mr-line"
                                                value={sp.model}
                                                onChange={(e) => handleSpareChange(i, "model", e.target.value)}
                                            />
                                        </td>
                                        <td>
                                            <input
                                                className="mr-line"
                                                value={sp.maker}
                                                onChange={(e) => handleSpareChange(i, "maker", e.target.value)}
                                            />
                                        </td>
                                        <td>
                                            <input
                                                type="number"
                                                className="mr-line"
                                                value={sp.qty}
                                                onChange={(e) => handleSpareChange(i, "qty", e.target.value)}
                                            />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </section>

                    {/* Control / Approve */}
                    <section className="mr-section slim">
                        <div className="mr-row very-small">
                            <div className="mr-col-8">
                                <div className="mr-subtitle">สถานะการควบคุม</div>
                                <div className="mr-radios tight">
                                    <label>
                                        <input
                                            type="radio"
                                            name="ctrl"
                                            checked={form.control === "control"}
                                            onChange={() => setField("control", "control")}
                                        />
                                        CONTROL (ควบคุม)
                                    </label>
                                    <label>
                                        <input
                                            type="radio"
                                            name="ctrl"
                                            checked={form.control === "uncontrol"}
                                            onChange={() => setField("control", "uncontrol")}
                                        />
                                        UNCONTROL (ไม่ควบคุม)
                                    </label>
                                </div>
                            </div>

                            <Line
                                label="APPROVE BY (อนุมัติโดย)"
                                col={8}
                                value={form.approve_by}
                                onChange={(v) => setField("approve_by", v)}
                            />
                            <Line
                                label="REPAIR ACCEPT BY (รับงานซ่อมโดย)"
                                col={8}
                                value={form.repair_accept_by}
                                onChange={(v) => setField("repair_accept_by", v)}
                            />
                        </div>

                        <div className="mr-row no-print">
                            <div className="mr-col-24 mr-right">
                                <button type="submit" className="mr-btn" disabled={!requiredOk}>
                                    บันทึก
                                </button>
                            </div>
                        </div>
                    </section>
                </form>
            </div>
        </div>
    );
}

/* ---------- Small building blocks ---------- */
function Line({ label, col = 12, value, onChange, type = "text" }) {
    return (
        <div className={`mr-col-${to24(col)} mr-line-wrap`}>
            <div className="mr-label">{label}</div>
            <input
                className="mr-line"
                type={type}
                value={value}
                onChange={(e) => onChange(e.target.value)}
            />
        </div>
    );
}

function Area({ label, col = 12, rows = 3, value, onChange }) {
    return (
        <div className={`mr-col-${to24(col)} mr-line-wrap`}>
            <div className="mr-label">{label}</div>
            <textarea
                rows={rows}
                className="mr-box dotted"
                value={value}
                onChange={(e) => onChange(e.target.value)}
            />
        </div>
    );
}

// function CauseBox({ title, items, state, onChange, col = 12 }) {
//     return (
//         <div className={`mr-col-${to24(col)} mr-cause`}>
//             <div className="mr-cause-title">{title}</div>
//             <div className="mr-checkboxes">
//                 {items.map(([k, text]) => (
//                     <label key={k}>
//                         <input
//                             type="checkbox"
//                             checked={!!state[k]}
//                             onChange={(e) => onChange(k, e.target.checked)}
//                         />{" "}
//                         {text}
//                     </label>
//                 ))}
//             </div>
//         </div>
//     );
// }

function to24(c) {
    const v = Math.round(c * 2); // 0..24
    return Math.max(1, Math.min(24, v));
}
