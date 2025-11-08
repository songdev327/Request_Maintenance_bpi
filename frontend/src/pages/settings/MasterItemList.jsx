import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import config from "../../config";
import Template from "../../home/Template";
import { Link } from "react-router-dom";

const Country_Code = [
    "7E",
];
const Country_Name = [
    "THAILAND",
];
const Company_Code = [
    "71",
];
const Company_Name = [
    "NMB-MINEBEA THAI LTD.",
];
const Place_Code = [
    "T2",
];
const Place_Name = [
    "BANGPA-IN FACTORY",
];
const Section_Code = [
    "71DL",
];
const Section_Name = [
    "P.C. MECHANICAL BANGPAIN",
];
const Process_Group_Code = [
    "C1001",
    "C1005",
    "C1010",
    "C1011",
    "C1012",
];
const Process_Group_Name = [
    "MACHINING",
    "GRINDING",
    "INSPECTION",
    "POLISHING",
    "WASHING",
];
const Process_Code = [
    "C2001",
    "C2005",
    "C2006",
    "C2009",
    "C2013",
    "C2026",
];
const Process_Name = [
    "TURNING",
    "TURNING+1ST",
    "CUTTING",
    "CASTING",
    "GRINDING",
    "TAP CHECK",
    "CODDING",
    "BARELL",
    "SECONDARY",
];

export default function MasterItemList() {
    const [masterItemlist, setMasterItemList] = useState([]);
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState("");

    // ---- เลือกเครื่องสำหรับ Rename/Delete ----
    const [selectedId, setSelectedId] = useState("");

    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10); // เปลี่ยนตามต้องการ (10, 20, 50)

    const totalPages = Math.ceil(masterItemlist.length / pageSize);
    const paginatedList = useMemo(() => {
        const start = (page - 1) * pageSize;
        return masterItemlist.slice(start, start + pageSize);
    }, [masterItemlist, page, pageSize]);


    // ---- Add Machine ----
    const [addForm, setAddForm] = useState({
        Country_Code: "",
        Country_Name: "",
        Company_Code: "",
        Company_Name: "",
        Place_Code: "",
        Place_Name: "",
        Section_Code: "",
        Section_Name: "",
        Machine_No: "",
        Process_Group_Code: "",
        Process_Group_Name: "",
        Process_Code: "",
        Process_Name: "",

    });

    // ---- Rename Machine ----
    const [renameForm, setRenameForm] = useState({
        Country_Code: "",
        Country_Name: "",
        Company_Code: "",
        Company_Name: "",
        Place_Code: "",
        Place_Name: "",
        Section_Code: "",
        Section_Name: "",
        Machine_No: "",
        Process_Group_Code: "",
        Process_Group_Name: "",
        Process_Code: "",
        Process_Name: "",
    });

    const selected = useMemo(
        () => masterItemlist.find(m => String(m.id) === String(selectedId)),
        [masterItemlist, selectedId]
    );

    useEffect(() => { loadMachines(); }, []);

    const loadMachines = async () => {
        setLoading(true);
        setErr("");
        try {
            const r = await axios.get(`${config.api_path}/MasterList`);
            const list = (r.data || []).sort((a, b) => a.id - b.id);
            setMasterItemList(list);
            //   if (!selectedId && list[0]) setSelectedId(String(list[0].id));
        } catch (e) {
            setErr(e?.response?.data?.message || "โหลดรายชื่อเครื่องไม่สำเร็จ");
        } finally { setLoading(false); }
    };

    // ---------- สร้างเครื่อง ----------
    const onChangeAdd = (k, v) => setAddForm(p => ({ ...p, [k]: v }));

    const createMasterItemList = async () => {
        // ตรวจสอบว่ามีช่องไหนว่างบ้าง
        const requiredFields = [
            "Country_Code", "Country_Name", "Company_Code", "Company_Name",
            "Place_Code", "Place_Name", "Section_Code", "Section_Name",
            "Machine_No", "Process_Group_Code", "Process_Group_Name",
            "Process_Code", "Process_Name"
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
            const res = await axios.post(`${config.api_path}/MasterList`, {
                Country_Code: addForm.Country_Code.trim(),
                Country_Name: addForm.Country_Name.trim(),
                Company_Code: addForm.Company_Code.trim(),
                Company_Name: addForm.Company_Name.trim(),
                Place_Code: addForm.Place_Code.trim(),
                Place_Name: addForm.Place_Name.trim(),
                Section_Code: addForm.Section_Code.trim(),
                Section_Name: addForm.Section_Name.trim(),
                Machine_No: renameForm.Machine_No.trim(),
                Process_Group_Code: addForm.Process_Group_Code.trim(),
                Process_Group_Name: addForm.Process_Group_Name.trim(),
                Process_Code: addForm.Process_Code.trim(),
                Process_Name: addForm.Process_Name.trim(),
            });

            alert("✅ เพิ่มข้อมูล Master Item สำเร็จ");

            setAddForm({
                Country_Code: "", Country_Name: "", Company_Code: "", Company_Name: "",
                Place_Code: "", Place_Name: "",
                Section_Code: "", Section_Name: "",
                Machine_No: "",
                Process_Group_Code: "", Process_Group_Name: "",
                Process_Code: "", Process_Name: "",
            });

            await loadMachines();
            setSelectedId(String(res.data?.id));
        } catch (e) {
            console.error("❌ Error submitting data", e);
            alert("❌ เกิดข้อผิดพลาดในการเพิ่มข้อมูล");
        }
    };


    // ---------- เตรียมฟอร์ม Rename เมื่อเลือกเครื่อง ----------
    useEffect(() => {
        if (!selected) return;
        setRenameForm({
            Country_Code: selected.Country_Code || "",
            Country_Name: selected.Country_Name || "",
            Company_Code: selected.Company_Code || "",
            Company_Name: selected.Company_Name || "",

            Place_Code: selected.Place_Code || "",
            Place_Name: selected.Place_Name || "",
            Section_Code: selected.Section_Code || "",
            Section_Name: selected.Section_Name || "",

            Machine_No: selected.Machine_No || "",
            Process_Group_Code: selected.Process_Group_Code || "",
            Process_Group_Name: selected.Process_Group_Name || "",
            Process_Code: selected.Process_Code || "",
            Process_Name: selected.Process_Name || "",

        });
    }, [selected]);

    const onChangeRename = (k, v) => setRenameForm(p => ({ ...p, [k]: v }));

   const saveRename = async () => {
    // 🔎 รายชื่อฟิลด์ที่ต้องกรอก
    const requiredFields = [
        "Country_Code", "Country_Name", "Company_Code", "Company_Name",
        "Place_Code", "Place_Name", "Section_Code", "Section_Name",
        "Machine_No", "Process_Group_Code", "Process_Group_Name",
        "Process_Code", "Process_Name"
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
        await axios.patch(`${config.api_path}/MasterList/${selectedId}`, {
            Country_Code: renameForm.Country_Code.trim(),
            Country_Name: renameForm.Country_Name.trim(),
            Company_Code: renameForm.Company_Code.trim(),
            Company_Name: renameForm.Company_Name.trim(),
            Place_Code: renameForm.Place_Code.trim(),
            Place_Name: renameForm.Place_Name.trim(),
            Section_Code: renameForm.Section_Code.trim(),
            Section_Name: renameForm.Section_Name.trim(),
            Machine_No: renameForm.Machine_No.trim(),
            Process_Group_Code: renameForm.Process_Group_Code.trim(),
            Process_Group_Name: renameForm.Process_Group_Name.trim(),
            Process_Code: renameForm.Process_Code.trim(),
            Process_Name: renameForm.Process_Name.trim(),
        });

        alert("✅ แก้ไข Master Item สำเร็จ");
        await loadMachines();
    } catch (e) {
        console.error("❌ เกิดข้อผิดพลาดในการแก้ไขข้อมูล", e);
        alert("❌ ไม่สามารถแก้ไขข้อมูลได้");
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
        if (!window.confirm(`ต้องการลบเครื่อง "${cur?.Machine_No || selectedId}" หรือไม่?`)) return;
        try {
            await axios.delete(`${config.api_path}/MasterList/${selectedId}`);
            clearCacheForMachine(selectedId);
            alert("ลบเครื่องสำเร็จ");
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
                    <span className="fw-bold" style={{ fontSize: "2.8rem" }} ></span>MASTER ITEM LIST</h5>
                {err && <div className="alert alert-danger">{err}</div>}
                {loading && <div className="alert alert-info">Loading…</div>}

                {/* ===== Add Machine ===== */}
                <div className="card mb-3">
                    <div className="card-header fw-bold" style={{ backgroundColor: "rgba(72, 72, 72, 1)", color: "white" }}>Add Master Item List</div>
                    <div className="card-body">
                        <div className="row g-3">
                            <div className="col-md-2">
                                <label className="form-label">Country_Code</label>
                                <select className="form-select text-primary" value={addForm.Country_Code}
                                    onChange={e => onChangeAdd("Country_Code", e.target.value)}>
                                    <option value="">-- Select --</option>
                                    {Country_Code.map(o => <option key={o} value={o}>{o}</option>)}
                                </select>
                            </div>
                            <div className="col-md-2">
                                <label className="form-label">Country_Name</label>
                                <select className="form-select text-primary" value={addForm.Country_Name}
                                    onChange={e => onChangeAdd("Country_Name", e.target.value)}>
                                    <option value="">-- Select --</option>
                                    {Country_Name.map(o => <option key={o} value={o}>{o}</option>)}
                                </select>
                            </div>
                            <div className="col-md-2">
                                <label className="form-label">Company_Code</label>
                                <select className="form-select text-primary" value={addForm.Company_Code}
                                    onChange={e => onChangeAdd("Company_Code", e.target.value)}>
                                    <option value="">-- Select --</option>
                                    {Company_Code.map(o => <option key={o} value={o}>{o}</option>)}
                                </select>
                            </div>
                            <div className="col-md-3">
                                <label className="form-label">Company_Name</label>
                                <select className="form-select text-primary" value={addForm.Company_Name}
                                    onChange={e => onChangeAdd("Company_Name", e.target.value)}>
                                    <option value="">-- Select --</option>
                                    {Company_Name.map(o => <option key={o} value={o}>{o}</option>)}
                                </select>
                            </div>
                            <div className="col-md-3">
                                <label className="form-label">Place_Code</label>
                                <select className="form-select text-primary" value={addForm.Place_Code}
                                    onChange={e => onChangeAdd("Place_Code", e.target.value)}>
                                    <option value="">-- Select --</option>
                                    {Place_Code.map(o => <option key={o} value={o}>{o}</option>)}
                                </select>
                            </div>
                            <div className="col-md-2">
                                <label className="form-label">Place_Name</label>
                                <select className="form-select text-primary" value={addForm.Place_Name}
                                    onChange={e => onChangeAdd("Place_Name", e.target.value)}>
                                    <option value="">-- Select --</option>
                                    {Place_Name.map(o => <option key={o} value={o}>{o}</option>)}
                                </select>
                            </div>
                            <div className="col-md-2">
                                <label className="form-label">Section_Code</label>
                                <select className="form-select text-primary" value={addForm.Section_Code}
                                    onChange={e => onChangeAdd("Section_Code", e.target.value)}>
                                    <option value="">-- Select --</option>
                                    {Section_Code.map(o => <option key={o} value={o}>{o}</option>)}
                                </select>
                            </div>
                            <div className="col-md-3">
                                <label className="form-label">Section_Name</label>
                                <select className="form-select text-primary" value={addForm.Section_Name}
                                    onChange={e => onChangeAdd("Section_Name", e.target.value)}>
                                    <option value="">-- Select --</option>
                                    {Section_Name.map(o => <option key={o} value={o}>{o}</option>)}
                                </select>
                            </div>
                            <div className="col-md-2">
                                <label className="form-label">Machine_No</label>
                                <input className="form-control text-primary" value={addForm.Machine_No}
                                    onChange={e => onChangeAdd("Machine_No", e.target.value)} />
                            </div>
                            <div className="col-md-3">
                                <label className="form-label">Process_Group_Code</label>
                                <select className="form-select text-primary" value={addForm.Process_Group_Code}
                                    onChange={e => onChangeAdd("Process_Group_Code", e.target.value)}>
                                    <option value="">-- Select --</option>
                                    {Process_Group_Code.map(o => <option key={o} value={o}>{o}</option>)}
                                </select>
                            </div>
                            <div className="col-md-2">
                                <label className="form-label">Process_Group_Name</label>
                                <select className="form-select text-primary" value={addForm.Process_Group_Name}
                                    onChange={e => onChangeAdd("Process_Group_Name", e.target.value)}>
                                    <option value="">-- Select --</option>
                                    {Process_Group_Name.map(o => <option key={o} value={o}>{o}</option>)}
                                </select>
                            </div>
                            <div className="col-md-2">
                                <label className="form-label">Process_Code</label>
                                <select className="form-select text-primary" value={addForm.Process_Code}
                                    onChange={e => onChangeAdd("Process_Code", e.target.value)}>
                                    <option value="">-- Select --</option>
                                    {Process_Code.map(o => <option key={o} value={o}>{o}</option>)}
                                </select>
                            </div>
                            <div className="col-md-2">
                                <label className="form-label">Process_Name</label>
                                <select className="form-select text-primary" value={addForm.Process_Name}
                                    onChange={e => onChangeAdd("Process_Name", e.target.value)}>
                                    <option value="">-- Select --</option>
                                    {Process_Name.map(o => <option key={o} value={o}>{o}</option>)}
                                </select>
                            </div>

                        </div>

                        <div className="mt-3 d-flex justify-content-end">
                            <button className="btn btn-primary" onClick={createMasterItemList}>Create</button>
                        </div>
                    </div>
                </div>

                {/* ===== Rename / Delete ===== */}
                <div className="card">
                    <div className="card-header fw-bold" style={{ backgroundColor: "rgba(72, 72, 72, 1)", color: "white" }}>Rename / Delete Master Item List</div>
                    <div className="card-body">
                        <div className="row g-3 mb-2">
                            <div className="col-md-2">
                                <label className="form-label">Select Machine No</label>
                                <select
                                    className="form-select"
                                    value={selectedId}
                                    onChange={e => setSelectedId(e.target.value)}
                                >
                                    <option value="">-- Select Machine No --</option>
                                    {masterItemlist.map(m => (
                                        <option key={m.id} value={m.id}>{m.Machine_No}</option>
                                    ))}
                                </select>
                            </div>
                        </div>


                        {/* Rename form */}
                        <div className="row g-3">
                            <div className="col-md-2">
                                <label className="form-label">New Machine_No</label>
                                <input className="form-control text-primary" value={renameForm.Machine_No}
                                    onChange={e => onChangeRename("Machine_No", e.target.value)} />
                            </div>
                            <div className="col-md-2">
                                <label className="form-label">Country_Code</label>
                                <input className="form-control text-primary" value={renameForm.Country_Code}
                                    onChange={e => onChangeRename("Country_Code", e.target.value)} />
                            </div>
                            <div className="col-md-2">
                                <label className="form-label">Country_Name</label>
                                <input className="form-control text-primary" value={renameForm.Country_Name}
                                    onChange={e => onChangeRename("Country_Name", e.target.value)} />
                            </div>
                            <div className="col-md-2">
                                <label className="form-label">Company_Code</label>
                                <input className="form-control text-primary" value={renameForm.Company_Code}
                                    onChange={e => onChangeRename("Company_Code", e.target.value)} />
                            </div>
                            <div className="col-md-3">
                                <label className="form-label">Company_Name</label>
                                <input className="form-control text-primary" value={renameForm.Company_Name}
                                    onChange={e => onChangeRename("Company_Name", e.target.value)} />
                            </div>
                            <div className="col-md-2">
                                <label className="form-label">Place_Code</label>
                                <input className="form-control text-primary" value={renameForm.Place_Code}
                                    onChange={e => onChangeRename("Place_Code", e.target.value)} />
                            </div>
                            <div className="col-md-2">
                                <label className="form-label">Place_Name</label>
                                <input className="form-control text-primary" value={renameForm.Place_Name}
                                    onChange={e => onChangeRename("Place_Name", e.target.value)} />
                            </div>
                            <div className="col-md-2">
                                <label className="form-label">Section_Code</label>
                                <input className="form-control text-primary" value={renameForm.Section_Code}
                                    onChange={e => onChangeRename("Section_Code", e.target.value)} />
                            </div>
                            <div className="col-md-3">
                                <label className="form-label">Section_Name</label>
                                <input className="form-control text-primary" value={renameForm.Section_Name}
                                    onChange={e => onChangeRename("Section_Name", e.target.value)} />
                            </div>
                            <div className="col-md-2">
                                <label className="form-label">Process_Group_Code</label>
                                <input className="form-control text-primary" value={renameForm.Process_Group_Code}
                                    onChange={e => onChangeRename("Process_Group_Code", e.target.value)} />
                            </div>
                            <div className="col-md-2">
                                <label className="form-label">Process_Group_Name</label>
                                <input className="form-control text-primary" value={renameForm.Process_Group_Name}
                                    onChange={e => onChangeRename("Process_Group_Name", e.target.value)} />
                            </div>
                            <div className="col-md-2">
                                <label className="form-label">Process_Code</label>
                                <input className="form-control text-primary" value={renameForm.Process_Code}
                                    onChange={e => onChangeRename("Process_Code", e.target.value)} />
                            </div>
                            <div className="col-md-2">
                                <label className="form-label">Process_Name</label>
                                <input className="form-control text-primary" value={renameForm.Process_Name}
                                    onChange={e => onChangeRename("Process_Name", e.target.value)} />
                            </div>
                        </div>

                        <div className="mt-3 d-flex gap-2 justify-content-end">
                            <button className="btn btn-primary" onClick={saveRename} disabled={!selectedId}>Save Rename</button>
                            <button className="btn btn-danger" onClick={deleteMachine} disabled={!selectedId}>Delete Item</button>
                        </div>
                    </div>
                </div>

                {/* รายการเครื่อง (เสริม) */}
                <div className="card mt-3">
                    <div className="card-body">
                        <div style={{ backgroundColor: "rgba(72, 72, 72, 1)", color: "white", padding: "0.3rem" }}>
                            <h5 className="mb-2 fw-bold">List Master Item List</h5>
                        </div>
                        <div className="table-responsive">
                            <table className="table table-sm table-bordered">
                                <thead className="table-light">
                                    <tr>
                                        <th style={{ width: 80 }}>ID</th>
                                        <th>Machine_No</th>
                                        <th>Country_Code</th>
                                        <th>Country_Name</th>
                                        <th>Company_Code</th>
                                        <th>Company_Name</th>
                                        <th>Place_Code</th>
                                        <th>Place_Name</th>
                                        <th>Section_Code</th>
                                        <th>Section_Name</th>
                                        <th>Process_Group_Code</th>
                                        <th>Process_Group_Name</th>
                                        <th>Process_Code</th>
                                        <th>Process_Name</th>
                                        <th>Date</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginatedList.map(m => (
                                        <tr key={m.id} className={String(m.id) === String(selectedId) ? "table-primary" : ""}>
                                            <td>{m.id}</td>
                                            <td>{m.Machine_No}</td>
                                            <td>{m.Country_Code || "-"}</td>
                                            <td>{m.Country_Name || "-"}</td>
                                            <td>{m.Company_Code || "-"}</td>
                                            <td>{m.Company_Name || "-"}</td>
                                            <td>{m.Place_Code || "-"}</td>
                                            <td>{m.Place_Name || "-"}</td>
                                            <td>{m.Section_Code || "-"}</td>
                                            <td>{m.Section_Name || "-"}</td>
                                            <td>{m.Process_Group_Code || "-"}</td>
                                            <td>{m.Process_Group_Name || "-"}</td>
                                            <td>{m.Process_Code || "-"}</td>
                                            <td>{m.Process_Name || "-"}</td>
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
