import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import config from "../../config";
import Template from "../../home/Template";
import { Link } from "react-router-dom";


export default function MachineSerial() {
    const [listMachineSerial, setListMachineSerial] = useState([]);
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState("");

    // ---- เลือกเครื่องสำหรับ Rename/Delete ----
    const [selectedId, setSelectedId] = useState("");

    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10); // เปลี่ยนตามต้องการ (10, 20, 50)

    const totalPages = Math.ceil(listMachineSerial.length / pageSize);
    const paginatedList = useMemo(() => {
        const start = (page - 1) * pageSize;
        return listMachineSerial.slice(start, start + pageSize);
    }, [listMachineSerial, page, pageSize]);


    // ---- Add Machine ----
    const [addForm, setAddForm] = useState({
        Machine_No: "",
        Serial_No: "",


    });

    // ---- Rename Machine ----
    const [renameForm, setRenameForm] = useState({
        Machine_No: "",
        Serial_No: "",

    });

    const selected = useMemo(
        () => listMachineSerial.find(m => String(m.id) === String(selectedId)),
        [listMachineSerial, selectedId]
    );

    useEffect(() => { loadMachines(); }, []);

    const loadMachines = async () => {
        setLoading(true);
        setErr("");
        try {
            const r = await axios.get(`${config.api_path}/MachineSerial`);
            const list = (r.data || []).sort((a, b) => a.id - b.id);
            setListMachineSerial(list);
            //   if (!selectedId && list[0]) setSelectedId(String(list[0].id));
        } catch (e) {
            setErr(e?.response?.data?.message || "โหลดรายการไม่สำเร็จ");
        } finally { setLoading(false); }
    };

    // ---------- สร้างเครื่อง ----------
    const onChangeAdd = (k, v) => setAddForm(p => ({ ...p, [k]: v }));

    const createMachine = async () => {

        // ตรวจสอบว่ามีช่องไหนว่างบ้าง
        const requiredFields = [
            "Machine_No", "Serial_No",

        ];

         const emptyFields = requiredFields.filter(field => {
            const value = addForm[field];
            return !value || value.trim() === "";
        });

        // ถ้ามีช่องว่าง ให้แจ้งเตือนและไม่ส่งข้อมูล
        if (emptyFields.length > 0) {
            alert(`กรุณากรอกข้อมูลให้ครบถ้วนในช่อง: ${emptyFields.join(', ')}`);
            return;
        }

        try {
            const res = await axios.post(`${config.api_path}/MachineSerial`, {
                Machine_No: (addForm.Machine_No || "").trim(),
                Serial_No: (addForm.Serial_No || "").trim(),
                Model: (addForm.Model || "").trim(),
                Maker: (addForm.Maker || "").trim(),

            });
            alert("เพิ่ม Machine Serial สำเร็จ");
            setAddForm({ Machine_No: "", Serial_No: "", Model: "", Maker: "" });
            await loadMachines();
            setSelectedId(String(res.data?.id));
        } catch (e) {
            console.error("error")
        }
    };

    // ---------- เตรียมฟอร์ม Rename เมื่อเลือกเครื่อง ----------
    useEffect(() => {
        if (!selected) return;
        setRenameForm({
            Machine_No: selected.Machine_No || "",
            Serial_No: selected.Serial_No || "",
            Model: selected.Model || "",
            Maker: selected.Maker || "",

        });
    }, [selected]);

    const onChangeRename = (k, v) => setRenameForm(p => ({ ...p, [k]: v }));

    const saveRename = async () => {

        const requiredFields = [
            "Machine_No", "Serial_No",

        ];

        // 🔍 ตรวจสอบว่าแต่ละช่องมีข้อมูลหรือไม่
        const emptyFields = requiredFields.filter(field => {
            const value = renameForm[field];
            return !value || value.trim() === "";
        });

        if (emptyFields.length > 0) {
            alert(`⚠️ กรุณากรอกข้อมูลให้ครบถ้วนในช่อง: ${emptyFields.join(', ')}`);
            return;
        }

        try {
            await axios.patch(`${config.api_path}/MachineSerial/${selectedId}`, {
                Machine_No: (renameForm.Machine_No || "").trim(),
                Serial_No: (renameForm.Serial_No || "").trim(),
                Model: (renameForm.Model || "").trim(),
                Maker: (renameForm.Maker || "").trim(),

            });
            alert("แก้ไข Machine Serial สำเร็จ");
            await loadMachines();
        } catch (e) {
            console.error("error")
        }
    };

    // ---------- ลบเครื่อง ----------
    const clearCacheForMachine = (mid) => {
        const toDel = [];
        for (let i = 0; i < sessionStorage.length; i++) {
            const k = sessionStorage.key(i);
            if (k && k.startsWith(`dcf:${mid}:`)) toDel.push(k);
        }
        toDel.forEach(k => sessionStorage.removeItem(k));
    };

    const deleteMachine = async () => {
        if (!selectedId) return;
        const cur = selected;
        if (!window.confirm(`ต้องการลบ Machine Serial "${cur?.Machine_No || selectedId}" หรือไม่?`)) return;
        try {
            await axios.delete(`${config.api_path}/MachineSerial/${selectedId}`);
            clearCacheForMachine(selectedId);
            alert("ลบ Machine Serial");
            await loadMachines();
        } catch {
            alert("ลบไม่สำเร็จ");
        }
    };

    return (
        <Template>
            <div className="content-wrapper">

                <h5 className="mb-3">
                    <Link to="/settings">
                        <button
                            type="button"
                            className="linklike"
                        >
                            ← BACK
                        </button> </Link>
                    <span className="fw-bold" style={{ fontSize: "2.8rem" }} ></span>MACHINE SERIAL</h5>
                {err && <div className="alert alert-danger">{err}</div>}
                {loading && <div className="alert alert-info">Loading…</div>}

                {/* ===== Add Machine ===== */}
                <div className="card mb-3">
                    <div className="card-header fw-bold" style={{ backgroundColor: "rgba(72, 72, 72, 1)", color: "white" }}>Add Machine Serial</div>
                    <div className="card-body">
                        <div className="row g-3">
                            <div className="col-md-3">
                                <label className="form-label">Machine_No</label>
                                  <input className="form-control" value={addForm.Machine_No}
                                    onChange={e => onChangeAdd("Machine_No", e.target.value)} />    
                            </div>
                            <div className="col-md-3">
                                <label className="form-label">Serial_No</label>
                                  <input className="form-control" value={addForm.Serial_No}
                                    onChange={e => onChangeAdd("Serial_No", e.target.value)} />    
                            </div>
                            <div className="col-md-3">
                                <label className="form-label">Model</label>
                                  <input className="form-control" value={addForm.Model}
                                    onChange={e => onChangeAdd("Model", e.target.value)} />    
                            </div>
                            <div className="col-md-3">
                                <label className="form-label">Maker</label>
                                  <input className="form-control" value={addForm.Maker}
                                    onChange={e => onChangeAdd("Maker", e.target.value)} />    
                            </div>                        
                        </div>

                        <div className="mt-3 d-flex justify-content-end">
                            <button className="btn btn-primary" onClick={createMachine}>Create</button>
                        </div>
                    </div>
                </div>

                {/* ===== Rename / Delete ===== */}
                <div className="card">
                    <div className="card-header fw-bold" style={{ backgroundColor: "rgba(72, 72, 72, 1)", color: "white" }}>Rename / Delete Machine_No</div>
                    <div className="card-body">
                        <div className="row g-3 mb-2">
                            <div className="col-md-4">
                                <label className="form-label">Select Machine_No</label>
                                <select
                                    className="form-select"
                                    value={selectedId}
                                    onChange={e => setSelectedId(e.target.value)}
                                >
                                    <option value="">-- Select Machine --</option>
                                    {listMachineSerial.map(m => (
                                        <option key={m.id} value={m.id}>{m.Machine_No}</option>
                                    ))}
                                </select>
                            </div>
                        </div>


                        {/* Rename form */}
                        <div className="row g-3">
                            <div className="col-md-3">
                                <label className="form-label">Machine_No</label>
                                <input className="form-control" value={renameForm.Machine_No}
                                    onChange={e => onChangeRename("Machine_No", e.target.value)} />
                            </div>
                            <div className="col-md-3">
                                <label className="form-label">Serial_No</label>
                                <input className="form-control" value={renameForm.Serial_No}
                                    onChange={e => onChangeRename("Serial_No", e.target.value)} />
                            </div>
                            <div className="col-md-3">
                                <label className="form-label">Model</label>
                                <input className="form-control" value={renameForm.Model}
                                    onChange={e => onChangeRename("Model", e.target.value)} />
                            </div>
                            <div className="col-md-3">
                                <label className="form-label">Maker</label>
                                <input className="form-control" value={renameForm.Maker}
                                    onChange={e => onChangeRename("Maker", e.target.value)} />
                            </div>
                        </div>

                        <div className="mt-3 d-flex gap-2 justify-content-end">
                            <button className="btn btn-primary" onClick={saveRename} disabled={!selectedId}>Save Rename</button>
                            <button className="btn btn-danger" onClick={deleteMachine} disabled={!selectedId}>Delete Machine_No</button>
                        </div>
                    </div>
                </div>

                {/* รายการเครื่อง (เสริม) */}
                <div className="card mt-3">
                    <div className="card-body">
                        <div style={{ backgroundColor: "rgba(72, 72, 72, 1)", color: "white", padding: "0.3rem" }}>
                            <h5 className="mb-2 fw-bold">List Serial Machine_No</h5>
                        </div>
                        <div className="table-responsive">
                            <table className="table table-sm table-bordered">
                                <thead className="table-light">
                                    <tr>
                                        <th style={{ width: 80 }}>ID</th>
                                        <th>Machine_No</th>
                                        <th>Serial_No</th>
                                        <th>Model</th>
                                        <th>Maker</th>
                                        <th>Date</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginatedList.map(m => (
                                        <tr key={m.id} className={String(m.id) === String(selectedId) ? "table-primary" : ""}>
                                            <td>{m.id}</td>
                                            <td>{m.Machine_No}</td>
                                            <td>{m.Serial_No || "-"}</td>
                                            <td>{m.Model || "-"}</td>
                                            <td>{m.Maker || "-"}</td>
                                            <td>{m.updatedAt ? new Date(m.updatedAt).toLocaleString() : "-"}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <div className="d-flex justify-content-between align-items-center mt-3">

                    <div>
                        Page {page} of {totalPages}
                    </div>
                    <select
                        className="form-select form-select-sm w-auto mt-2"
                        value={pageSize}
                        onChange={(e) => {
                            setPageSize(Number(e.target.value));
                            setPage(1); // reset หน้า
                        }}
                    >
                        <option value={5}>5</option>
                        <option value={10}>10</option>
                        <option value={20}>20</option>
                    </select>

                    <div>

                        <button className="btn btn-sm btn-secondary me-2" onClick={() => setPage(1)} disabled={page === 1}>First</button>
                        <button className="btn btn-sm btn-secondary me-2" onClick={() => setPage(page - 1)} disabled={page === 1}>Prev</button>
                        <button className="btn btn-sm btn-secondary me-2" onClick={() => setPage(page + 1)} disabled={page === totalPages}>Next</button>
                        <button className="btn btn-sm btn-secondary" onClick={() => setPage(totalPages)} disabled={page === totalPages}>Last</button>
                    </div>
                </div>

            </div>
        </Template>
    );
}
