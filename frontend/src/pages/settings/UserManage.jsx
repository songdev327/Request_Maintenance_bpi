import { useEffect, useState } from "react";
import axios from "axios";
import config from "../../config";
import Template from "../../home/Template";
import { Link } from "react-router-dom";


export default function UserManage() {
  const [list, setList] = useState([]);
  const [q, setQ] = useState("");
  const [editingId, setEditingId] = useState(null);

  const [form, setForm] = useState({
    username: "",
    lastname: "",
    employee: "",
    password: "",
    permissions: "user",
    typemc: "",
    process: "",
  });

  const load = async () => {
    const r = await axios.get(`${config.api_path}/users`, { params: { q } });
    setList(r.data || []);
  };

  useEffect(() => { 
    load(); 
  }, []); // โหลดครั้งแรก

  const onChange = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  const resetForm = () => {
    setForm({ username:"", lastname:"", employee:"", password:"", permissions:"user", typemc:"", process:"" });
    setEditingId(null);
  };

  const submit = async (e) => {
    e?.preventDefault?.();
    try {
      if (editingId) {
        // update (ไม่ส่ง password ที่นี่)
        const { password, ...rest } = form;
        await axios.patch(`${config.api_path}/users/${editingId}`, rest);
        if (password) {
          await axios.patch(`${config.api_path}/users/${editingId}/password`, { newPassword: password });
        }
      } else {
        await axios.post(`${config.api_path}/users`, form);
      }
      await load();
      resetForm();
      alert("บันทึกสำเร็จ");
    } catch (err) {
      alert(err?.response?.data?.message || "บันทึกไม่สำเร็จ");
    }
  };

  const editRow = (u) => {
    setEditingId(u.id);
    setForm({
      username: u.username || "",
      lastname: u.lastname || "",
      employee: u.employee || "",
      password: "", // เวลาจะแก้ ให้ผู้ใช้กรอกใหม่
      permissions: u.permissions || "user",
      typemc: u.typemc || "",
      process: u.process || "",
    });
  };

  const removeRow = async (u) => {
    if (!window.confirm(`ลบผู้ใช้ "${u.username}" ?`)) return;
    await axios.delete(`${config.api_path}/users/${u.id}`);
    await load();
  };

  const search = async (e) => {
    e?.preventDefault?.();
    await load();
  };

  return (
    <>
   <Template>
    <div className="container" style={{maxWidth: 980}}>
      
      <h5> 
        <Link to="/settings">
        <button
            type="button"
            className="linklike"
          >
            ← BACK
          </button> </Link>
          <span className="fw-bold" style={{ fontSize: "2.2rem"}}>USER MANAGEMENT</span></h5>

      <form onSubmit={search} style={{display:'flex', gap:8, marginBottom:12}}>
        <input
          placeholder="ค้นหา username / ชื่อ / รหัสพนักงาน"
          value={q}
          onChange={e => setQ(e.target.value)}
          style={{flex:1}}
        />
        <button className="btn btn-primary" type="submit">ค้นหา</button>
        <button className="btn btn-secondary" type="button" onClick={() => { setQ(""); load(); }}>ล้าง</button>
      </form>

      <form onSubmit={submit} style={{border:'1px solid #ddd', padding:12, borderRadius:8, marginBottom:16}}>
        <div className="row g-2">
          <div className="col-md-3">
            <label>Username *</label>
            <input className="form-control" value={form.username} onChange={e=>onChange("username", e.target.value.toUpperCase())}/>
          </div>
          <div className="col-md-3">
            <label>last name</label>
            <input className="form-control" value={form.lastname} onChange={e=>onChange("lastname", e.target.value.toUpperCase())} />
          </div>
          <div className="col-md-3">
            <label>Employee ID</label>
            <input className="form-control" value={form.employee} onChange={e=>onChange("employee", e.target.value.toUpperCase())} />
          </div>
           <div className="col-md-3">
            <label>Type (typemc)</label>
            <input className="form-control" value={form.typemc} onChange={e=>onChange("typemc", e.target.value.toUpperCase())} />
          </div>
          <div className="col-md-4">
            <label>Password {editingId ? "(ใส่ถ้าต้องการเปลี่ยน)" : "*"}</label>
            <input className="form-control" type="password" value={form.password} onChange={e=>onChange("password", e.target.value)} required={!editingId}/>
          </div>
          <div className="col-md-4">
            <label>Permissions</label>
            <select className="form-select" value={form.permissions} onChange={e=>onChange("permissions", e.target.value)}>
              <option value="user">user</option>
              <option value="admin">admin</option>
            </select>
          </div>
         
          <div className="col-md-4">
            <label>Process</label>
            {/* <input className="form-control" value={form.process} onChange={e=>onChange("process", e.target.value)} /> */}
             <select className="form-select" value={form.process} onChange={e=>onChange("process", e.target.value)}>
                  <option value="">-- Select Process --</option>
                  <option value="Production">Production</option>
                  <option value="Engineer">Engineer</option>
                  <option value="Qc">Qc</option>
                  <option value="Maintenance">Maintenance</option>
            </select>
          </div>
        </div>

        <div style={{display:'flex', gap:8, marginTop:12}}>
          <button className="btn btn-success" type="submit">{editingId ? "Update" : "Create"}</button>
          {editingId && <button className="btn btn-secondary" type="button" onClick={resetForm}>Cancel</button>}
        </div>
      </form>

      <table className="table table-striped table-bordered">
        <thead className="table-dark">
          <tr>
            <th style={{width:80}}>ID</th>
            <th>Username</th>
            <th>last name</th>
            <th>Employee</th>
            <th>Type</th>
            <th>Permissions</th>
            <th>Process</th>
            <th style={{width:140}}>Action</th>
          </tr>
        </thead>
        <tbody>
          {list.length === 0 && (
            <tr><td colSpan={7} className="text-center">ไม่มีผู้ใช้</td></tr>
          )}
          {list.map(u => (
            <tr key={u.id}>
              <td>{u.id}</td>
              <td>{u.username}</td>
              <td>{u.lastname || "-"}</td>
              <td>{u.employee || "-"}</td>
              <td>{u.typemc || "-"}</td>
              <td>{u.permissions || "-"}</td>
              <td>{u.process || "-"}</td>
              <td>
                <div className="btn-group">
                  <button className="btn btn-sm btn-primary" onClick={()=>editRow(u)}>Edit</button>
                  <button className="btn btn-sm btn-danger" onClick={()=>removeRow(u)}>Delete</button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

    </div>
    </Template>
     </>
  );
}
