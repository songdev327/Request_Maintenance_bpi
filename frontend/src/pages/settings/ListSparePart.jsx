import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import config from "../../config";
import Template from "../../home/Template";
import { Link } from "react-router-dom";

const MAKER_SPARE = [
    "AIRTAC",
    "ALLEN BRADLEY",
    "AZBIL",
    "BALLUFF",
    "BANDO",
    "BANGPA-IN GROUP",
    "CKD",
    "CITIZEN",
    "COSEL",
    "COSEL =>OMRON",
    "DMG MORI",
    "DIA",
    "DAIKIN",
    "DAITO",
    "DEUBLIN",
    "EATON MOELLER",
    "ELAN",
    "ENDLESS",
    "EATON",
    "ELEPON"
];
const UNIT_SPARE = [
    "PCS",
];

export default function ListSparePart() {
    const [listSpare, setListSpare] = useState([]);
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState("");

    // ---- เลือกเครื่องสำหรับ Rename/Delete ----
    const [selectedId, setSelectedId] = useState("");

    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10); // เปลี่ยนตามต้องการ (10, 20, 50)

    const totalPages = Math.ceil(listSpare.length / pageSize);
    const paginatedList = useMemo(() => {
        const start = (page - 1) * pageSize;
        return listSpare.slice(start, start + pageSize);
    }, [listSpare, page, pageSize]);


    // ---- Add Machine ----
    const [addForm, setAddForm] = useState({
        name_spare: "",
        spec_spare: "",
        maker_spare: "",
        unit_spare: "",

    });

    // ---- Rename Machine ----
    const [renameForm, setRenameForm] = useState({
        name_spare: "",
        spec_spare: "",
        maker_spare: "",
        unit_spare: "",
    });

    const selected = useMemo(
        () => listSpare.find(m => String(m.id) === String(selectedId)),
        [listSpare, selectedId]
    );

    useEffect(() => { loadMachines(); }, []);

    const loadMachines = async () => {
        setLoading(true);
        setErr("");
        try {
            const r = await axios.get(`${config.api_path}/SparePart`);
            const list = (r.data || []).sort((a, b) => a.id - b.id);
            setListSpare(list);
            //   if (!selectedId && list[0]) setSelectedId(String(list[0].id));
        } catch (e) {
            setErr(e?.response?.data?.message || "โหลดรายชื่อเครื่องไม่สำเร็จ");
        } finally { setLoading(false); }
    };

    // ---------- สร้างเครื่อง ----------
    const onChangeAdd = (k, v) => setAddForm(p => ({ ...p, [k]: v }));

    const createMachine = async () => {

        // ตรวจสอบว่ามีช่องไหนว่างบ้าง
        const requiredFields = [
            "name_spare", "spec_spare", "maker_spare", "unit_spare",

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
            const res = await axios.post(`${config.api_path}/SparePart`, {
                name_spare: (addForm.name_spare || "").trim(),
                spec_spare: (addForm.spec_spare || "").trim(),
                maker_spare: (addForm.maker_spare || "").trim(),
                unit_spare: (addForm.unit_spare || "").trim(),

            });
            alert("เพิ่ม Spare part สำเร็จ");
            setAddForm({ name_spare: "", spec_spare: "", maker_spare: "", unit_spare: "" });
            await loadMachines();
            setSelectedId(String(res.data?.id));
        } catch (e) {
            // if (e?.response?.status === 409) alert("ชื่อ Spart ซ้ำ");
            // else alert("เพิ่ม Spare part ไม่สำเร็จ");
            console.error("error")
        }
    };

    // ---------- เตรียมฟอร์ม Rename เมื่อเลือกเครื่อง ----------
    useEffect(() => {
        if (!selected) return;
        setRenameForm({
            name_spare: selected.name_spare || "",
            spec_spare: selected.spec_spare || "",
            maker_spare: selected.maker_spare || "",
            unit_spare: selected.unit_spare || "",

        });
    }, [selected]);

    const onChangeRename = (k, v) => setRenameForm(p => ({ ...p, [k]: v }));

    const saveRename = async () => {

        const requiredFields = [
            "name_spare", "spec_spare",

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
            await axios.patch(`${config.api_path}/SparePart/${selectedId}`, {
                name_spare: (renameForm.name_spare || "").trim(),
                spec_spare: (renameForm.spec_spare || "").trim(),
                maker_spare: (renameForm.maker_spare || "").trim(),
                unit_spare: (renameForm.unit_spare || "").trim(),


            });
            alert("แก้ไข Spare part สำเร็จ");
            await loadMachines();
        } catch (e) {
            // if (e?.response?.status === 409) alert("ชื่อเครื่องซ้ำ");
            // else alert("แก้ไข Spare part ไม่สำเร็จ");
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
        if (!window.confirm(`ต้องการ Spare "${cur?.name_spare || selectedId}" หรือไม่?`)) return;
        try {
            await axios.delete(`${config.api_path}/SparePart/${selectedId}`);
            clearCacheForMachine(selectedId);
            alert("ลบ Spaer");
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
                    <span className="fw-bold" style={{ fontSize: "2.8rem" }} ></span>LIST SPARE PART</h5>
                {err && <div className="alert alert-danger">{err}</div>}
                {loading && <div className="alert alert-info">Loading…</div>}

                {/* ===== Add Machine ===== */}
                <div className="card mb-3">
                    <div className="card-header fw-bold" style={{ backgroundColor: "rgba(72, 72, 72, 1)", color: "white" }}>Add Spare part</div>
                    <div className="card-body">
                        <div className="row g-3">
                            <div className="col-md-3">
                                <label className="form-label">Name Spare</label>
                                <input className="form-control" value={addForm.name_spare}
                                    onChange={e => onChangeAdd("name_spare", e.target.value)} />
                            </div>
                            <div className="col-md-3">
                                <label className="form-label">Spec</label>
                                <input className="form-control" value={addForm.spec_spare}
                                    onChange={e => onChangeAdd("spec_spare", e.target.value)} />
                            </div>
                            <div className="col-md-3">
                                <label className="form-label">Maker</label>
                                <select className="form-select" value={addForm.maker_spare}
                                    onChange={e => onChangeAdd("maker_spare", e.target.value)}>
                                    <option value="">-- Select --</option>
                                    {MAKER_SPARE.map(o => <option key={o} value={o}>{o}</option>)}
                                </select>
                            </div>
                            <div className="col-md-3">
                                <label className="form-label">UNIT</label>
                                <select className="form-select" value={addForm.unit_spare}
                                    onChange={e => onChangeAdd("unit_spare", e.target.value)}>
                                    <option value="">-- Select --</option>
                                    {UNIT_SPARE.map(o => <option key={o} value={o}>{o}</option>)}
                                </select>
                            </div>

                        </div>

                        <div className="mt-3 d-flex justify-content-end">
                            <button className="btn btn-primary" onClick={createMachine}>Create</button>
                        </div>
                    </div>
                </div>

                {/* ===== Rename / Delete ===== */}
                <div className="card">
                    <div className="card-header fw-bold" style={{ backgroundColor: "rgba(72, 72, 72, 1)", color: "white" }}>Rename / Delete Spare part</div>
                    <div className="card-body">
                        <div className="row g-3 mb-2">
                            <div className="col-md-4">
                                <label className="form-label">Select Spare part</label>
                                <select
                                    className="form-select"
                                    value={selectedId}
                                    onChange={e => setSelectedId(e.target.value)}
                                >
                                    <option value="">-- Select Spare part --</option>
                                    {listSpare.map(m => (
                                        <option key={m.id} value={m.id}>{m.name_spare}</option>
                                    ))}
                                </select>
                            </div>
                        </div>


                        {/* Rename form */}
                        <div className="row g-3">
                            <div className="col-md-3">
                                <label className="form-label">New name</label>
                                <input className="form-control" value={renameForm.name_spare}
                                    onChange={e => onChangeRename("name_spare", e.target.value)} />
                            </div>
                            <div className="col-md-3">
                                <label className="form-label">Spec</label>
                                <input className="form-control" value={renameForm.spec_spare}
                                    onChange={e => onChangeRename("spec_spare", e.target.value)} />
                            </div>
                            <div className="col-md-3">
                                <label className="form-label">Maker</label>
                                <select className="form-select" value={renameForm.maker_spare}
                                    onChange={e => onChangeRename("maker_spare", e.target.value)}>
                                    <option value="">-- Select --</option>
                                    {MAKER_SPARE.map(o => <option key={o} value={o}>{o}</option>)}
                                </select>
                            </div>
                            <div className="col-md-3">
                                <label className="form-label">Unit</label>
                                <select className="form-select" value={renameForm.unit_spare}
                                    onChange={e => onChangeRename("unit_spare", e.target.value)}>
                                    <option value="">-- Select --</option>
                                    {UNIT_SPARE.map(o => <option key={o} value={o}>{o}</option>)}
                                </select>
                            </div>

                        </div>

                        <div className="mt-3 d-flex gap-2 justify-content-end">
                            <button className="btn btn-primary" onClick={saveRename} disabled={!selectedId}>Save Rename</button>
                            <button className="btn btn-danger" onClick={deleteMachine} disabled={!selectedId}>Delete List Spare</button>
                        </div>
                    </div>
                </div>

                {/* รายการเครื่อง (เสริม) */}
                <div className="card mt-3">
                    <div className="card-body">
                        <div style={{ backgroundColor: "rgba(72, 72, 72, 1)", color: "white", padding: "0.3rem" }}>
                            <h5 className="mb-2 fw-bold">List Spare part</h5>
                        </div>
                        <div className="table-responsive">
                            <table className="table table-sm table-bordered">
                                <thead className="table-light">
                                    <tr>
                                        <th style={{ width: 80 }}>ID</th>
                                        <th>Name</th>
                                        <th>Spec</th>
                                        <th>Maker</th>
                                        <th>Unit</th>
                                        <th>Date</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginatedList.map(m => (
                                        <tr key={m.id} className={String(m.id) === String(selectedId) ? "table-primary" : ""}>
                                            <td>{m.id}</td>
                                            <td>{m.name_spare}</td>
                                            <td>{m.spec_spare || "-"}</td>
                                            <td>{m.maker_spare || "-"}</td>
                                            <td>{m.unit_spare || "-"}</td>
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
