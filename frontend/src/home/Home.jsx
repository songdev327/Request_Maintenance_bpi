// src/home/Home.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import config from "../config";
import hero from "../images/maintenance_request.jpg";
import "./index.css"; // << เพิ่ม

function Home() {
  const [password, setPassword] = useState("");
  const [process, setProcess] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const navigate = useNavigate();

  const onSubmit = async (e) => {
    e.preventDefault();
    setErr("");
    if (!password || !process) {
      setErr("กรุณากรอกชื่อผู้ใช้ รหัสผ่าน และเลือก Process");
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post(`${config.api_path}/auth/login`, { password , process });
      localStorage.setItem("auth.token", res.data.token);
      localStorage.setItem("auth.user", JSON.stringify(res.data.user || {}));
      axios.defaults.headers.common["Authorization"] = `Bearer ${res.data.token}`;

      if (["Production", "Engineer", "Qc"].includes(process)) {
        navigate("/dashboardProduct", { replace: true });
        window.location.reload();
      } else if (process === "Maintenance") {
        navigate("/dashboardMM", { replace: true });
      } else {
        setErr("Process ไม่ถูกต้อง");
      }

    } catch (e) {
      setErr(e?.response?.data?.message || "เข้าสู่ระบบไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  };


  return (
    <>
      <div className="login-wrap">
        <div className="login-shell">
          {/* ซ้าย: รูปใหญ่ + หัวข้อ */}
          <aside className="login-hero" aria-hidden="true">
            <img src={hero} alt="Factory maintenance" />
            <h1>Application Request Maintenance System</h1>
            <p>ระบบใบร้องขอการบำรุงรักษา</p>
          </aside>

          {/* ขวา: การ์ดฟอร์ม */}
          <main className="login-card">
            <div className="brand">
              <div>
                <h2 style={{ color: "blue" }}>LOGIN</h2>
              </div>
            </div>

            <form onSubmit={onSubmit}>
              <div className="mb-3">
                <label className="form-label">Process</label>
                <select
                  className="form-control"
                  value={process}
                  onChange={(e) => setProcess(e.target.value)}
                  autoFocus
                >
                  <option value="">-- Select Process --</option>
                  <option value="Production">Production</option>
                  <option value="Engineer">Engineer</option>
                  <option value="Qc">Qc</option>
                  <option value="Maintenance">Maintenance</option>
                </select>
              </div>

              <div className="mb-2">
                <label className="form-label">Password</label>
                <div style={{ display: "flex", gap: 8 }}>
                  <input
                    className="form-control"
                    type={showPw ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => setShowPw((v) => !v)}
                    style={{ whiteSpace: "nowrap" }}
                  >
                    {showPw ? "Hide" : "Show"}
                  </button>
                </div>
              </div>

              {err && <div className="alert alert-danger py-2 my-2">{err}</div>}

              <button className="btn btn-primary w-100" disabled={loading} type="submit">
                {loading ? "Signing in..." : "Sign in"}
              </button>
            </form>
          </main>
        </div>
      </div>
    </>
  );
}

export default Home;
