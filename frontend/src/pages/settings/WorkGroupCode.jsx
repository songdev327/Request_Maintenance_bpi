import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import config from "../../config";
import Template from "../../home/Template";
import { Link } from "react-router-dom";

const Work_Group_Code = [
    "1",
    "2",
    "3",
    "4",

];

const Work_Group_Name = [
    "OVERHAUL",
    "MODIFICATION",
    "REPAIR",
    "PREVENTIVE",
];

const Work_Type_Code = [
    "1",
    "2",
    "3",
    "4",
];

export default function WorkGroupCode() {
    const [listWorkGroup, setListWorkGroup] = useState([]);
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState("");

    // ---- เลือกเครื่องสำหรับ Rename/Delete ----
    const [selectedId, setSelectedId] = useState("");

    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10); // เปลี่ยนตามต้องการ (10, 20, 50)

    const totalPages = Math.ceil(listWorkGroup.length / pageSize);
    const paginatedList = useMemo(() => {
        const start = (page - 1) * pageSize;
        return listWorkGroup.slice(start, start + pageSize);
    }, [listWorkGroup, page, pageSize]);


    // ---- Add Machine ----
    const [addForm, setAddForm] = useState({
        Work_Group_Code: "",
        Work_Group_Name: "",
        Work_Type_Code: "",
        Work_Type_Name: "",

    });

    // ---- Rename Machine ----
    const [renameForm, setRenameForm] = useState({
       Work_Group_Code: "",
        Work_Group_Name: "",
        Work_Type_Code: "",
        Work_Type_Name: "",
    });

    const selected = useMemo(
        () => listWorkGroup.find(m => String(m.id) === String(selectedId)),
        [listWorkGroup, selectedId]
    );

    useEffect(() => { loadMachines(); }, []);

    const loadMachines = async () => {
        setLoading(true);
        setErr("");
        try {
            const r = await axios.get(`${config.api_path}/WorkGroup`);
            const list = (r.data || []).sort((a, b) => a.id - b.id);
            setListWorkGroup(list);
            //   if (!selectedId && list[0]) setSelectedId(String(list[0].id));
        } catch (e) {
            setErr(e?.response?.data?.message || "โหลดรายชื่อไม่สำเร็จ");
        } finally { setLoading(false); }
    };

    // ---------- สร้างเครื่อง ----------
    const onChangeAdd = (k, v) => setAddForm(p => ({ ...p, [k]: v }));

    const createMachine = async () => {

        // ตรวจสอบว่ามีช่องไหนว่างบ้าง
        const requiredFields = [
            "Work_Group_Code", "Work_Group_Name", "Work_Type_Code", "Work_Type_Name",

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
            const res = await axios.post(`${config.api_path}/WorkGroup`, {
                Work_Group_Code: (addForm.Work_Group_Code || "").trim(),
                Work_Group_Name: (addForm.Work_Group_Name || "").trim(),
                Work_Type_Code: (addForm.Work_Type_Code || "").trim(),
                Work_Type_Name: (addForm.Work_Type_Name || "").trim(),

            });
            alert("เพิ่ม Work Group สำเร็จ");
            setAddForm({ Work_Group_Code: "", Work_Group_Name: "", Work_Type_Code: "", Work_Type_Name: "" });
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
            Work_Group_Code: selected.Work_Group_Code || "",
            Work_Group_Name: selected.Work_Group_Name || "",
            Work_Type_Code: selected.Work_Type_Code || "",
            Work_Type_Name: selected.Work_Type_Name || "",

        });
    }, [selected]);

    const onChangeRename = (k, v) => setRenameForm(p => ({ ...p, [k]: v }));

    const saveRename = async () => {

        const requiredFields = [
            "Work_Group_Code", "Work_Group_Name","Work_Type_Code","Work_Type_Name"

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
            await axios.patch(`${config.api_path}/WorkGroup/${selectedId}`, {
                Work_Group_Code: (renameForm.Work_Group_Code || "").trim(),
                Work_Group_Name: (renameForm.Work_Group_Name || "").trim(),
                Work_Type_Code: (renameForm.Work_Type_Code || "").trim(),
                Work_Type_Name: (renameForm.Work_Type_Name || "").trim(),


            });
            alert("แก้ไข Work Group สำเร็จ");
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
        if (!window.confirm(`ต้องการลบ Work Group "${cur?.name_spare || selectedId}" หรือไม่?`)) return;
        try {
            await axios.delete(`${config.api_path}/WorkGroup/${selectedId}`);
            clearCacheForMachine(selectedId);
            alert("ลบ Work Group");
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
                    <span className="fw-bold" style={{ fontSize: "2.8rem" }} ></span>WORK GROUP CODE</h5>
                {err && <div className="alert alert-danger">{err}</div>}
                {loading && <div className="alert alert-info">Loading…</div>}

                {/* ===== Add Machine ===== */}
                <div className="card mb-3">
                    <div className="card-header fw-bold" style={{ backgroundColor: "rgba(72, 72, 72, 1)", color: "white" }}>Add Work group</div>
                    <div className="card-body">
                        <div className="row g-3">
                            <div className="col-md-3">
                                <label className="form-label">Work_Group_Code</label>
                                 <select className="form-select" value={addForm.Work_Group_Code}
                                    onChange={e => onChangeAdd("Work_Group_Code", e.target.value)}>
                                    <option value="">-- Select --</option>
                                    {Work_Group_Code.map(o => <option key={o} value={o}>{o}</option>)}
                                </select>
                            </div>
                            <div className="col-md-3">
                                <label className="form-label">Work_Group_Name</label>
                               <select className="form-select" value={addForm.Work_Group_Name}
                                    onChange={e => onChangeAdd("Work_Group_Name", e.target.value)}>
                                    <option value="">-- Select --</option>
                                    {Work_Group_Name.map(o => <option key={o} value={o}>{o}</option>)}
                                </select>
                            </div>
                            <div className="col-md-3">
                                <label className="form-label">Work_Type_Code</label>
                               <select className="form-select" value={addForm.Work_Type_Code}
                                    onChange={e => onChangeAdd("Work_Type_Code", e.target.value)}>
                                    <option value="">-- Select --</option>
                                    {Work_Type_Code.map(o => <option key={o} value={o}>{o}</option>)}
                                </select>
                            </div>

                              <div className="col-md-3">
                                <label className="form-label">Work_Type_Name</label>
                                <input className="form-control" value={addForm.Work_Type_Name}
                                    onChange={e => onChangeAdd("Work_Type_Name", e.target.value)} />
                            </div>

                        </div>

                        <div className="mt-3 d-flex justify-content-end">
                            <button className="btn btn-primary" onClick={createMachine}>Create</button>
                        </div>
                    </div>
                </div>

                {/* ===== Rename / Delete ===== */}
                <div className="card">
                    <div className="card-header fw-bold" style={{ backgroundColor: "rgba(72, 72, 72, 1)", color: "white" }}>Rename / Delete Work group</div>
                    <div className="card-body">
                        <div className="row g-3 mb-2">
                            <div className="col-md-4">
                                <label className="form-label">Select Work_Group_Name</label>
                                <select
                                    className="form-select"
                                    value={selectedId}
                                    onChange={e => setSelectedId(e.target.value)}
                                >
                                    <option value="">-- Select Work_Group_Name --</option>
                                    {listWorkGroup.map(m => (
                                        <option key={m.id} value={m.id}>{m.Work_Group_Name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>


                        {/* Rename form */}
                        <div className="row g-3">
                            <div className="col-md-3">
                                <label className="form-label">Work_Group_Name</label>
                                <input className="form-control" value={renameForm.Work_Group_Name}
                                    onChange={e => onChangeRename("Work_Group_Name", e.target.value)} />
                            </div>
                            <div className="col-md-3">
                                <label className="form-label">Work_Group_Code</label>
                                <input className="form-control" value={renameForm.Work_Group_Code}
                                    onChange={e => onChangeRename("Work_Group_Code", e.target.value)} />
                            </div>
                            <div className="col-md-3">
                                <label className="form-label">Work_Type_Code</label>
                                <input className="form-control" value={renameForm.Work_Type_Code}
                                    onChange={e => onChangeRename("Work_Type_Code", e.target.value)} />
                            </div>
                            <div className="col-md-3">
                                <label className="form-label">Work_Type_Name</label>
                                <input className="form-control" value={renameForm.Work_Type_Name}
                                    onChange={e => onChangeRename("Work_Type_Name", e.target.value)} />
                            </div>
                           

                        </div>

                        <div className="mt-3 d-flex gap-2 justify-content-end">
                            <button className="btn btn-primary" onClick={saveRename} disabled={!selectedId}>Save Rename</button>
                            <button className="btn btn-danger" onClick={deleteMachine} disabled={!selectedId}>Delete Work Group</button>
                        </div>
                    </div>
                </div>

                {/* รายการเครื่อง (เสริม) */}
                <div className="card mt-3">
                    <div className="card-body">
                        <div style={{ backgroundColor: "rgba(72, 72, 72, 1)", color: "white", padding: "0.3rem" }}>
                            <h5 className="mb-2 fw-bold">List Work group</h5>
                        </div>
                        <div className="table-responsive">
                            <table className="table table-sm table-bordered">
                                <thead className="table-light">
                                    <tr>
                                        <th style={{ width: 80 }}>ID</th>
                                        <th>Work_Group_Code</th>
                                        <th>Work_Group_Name</th>
                                        <th>Work_Type_Code</th>
                                        <th>Work_Type_Name</th>
                                        <th>Date</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginatedList.map(m => (
                                        <tr key={m.id} className={String(m.id) === String(selectedId) ? "table-primary" : ""}>
                                            <td>{m.id}</td>
                                            <td>{m.Work_Group_Code}</td>
                                            <td>{m.Work_Group_Name || "-"}</td>
                                            <td>{m.Work_Type_Code || "-"}</td>
                                            <td>{m.Work_Type_Name || "-"}</td>
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
