import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import ReorderIcon from '@mui/icons-material/Reorder';
import DashboardIcon from '@mui/icons-material/Dashboard';
import config from "../config";  // ✅ เอา base URL จากไฟล์ config

function SidebarPro() {
  const [menuItems, setMenuItems] = useState([]);

  useEffect(() => {
    fetch(`${config.api_path}/menu`)
      .then((res) => res.json())
      .then((data) => setMenuItems(data))
      .catch((err) => console.error("โหลดเมนูไม่สำเร็จ", err));
  }, []);

  return (
    <aside className="main-sidebar sidebar-white elevation-4">
      <a href=" " className="brand-link" id="sidebar-mm-link">
        <span className="brand-text fw-bold">PRODUCTION SYSTEM</span>
      </a>

      <div className="sidebar" id="sidebar-pro">
        <nav className="mt-2">
          <ul
            className="nav nav-pills nav-sidebar flex-column"
            data-widget="treeview"
            role="menu"
            data-accordion="false"
          >
            {/* static menu */}
            <li className="nav-item">
              <Link to="/dashboardProduct" className="nav-link">
                <DashboardIcon
                  className="text-black fw-bold"
                  style={{ fontSize: "2rem" }}
                />
                <p
                  className="text-black fw-bold ml-1"
                  style={{ fontSize: "1rem" }}
                >
                  DASHBOARD
                </p>
              </Link>
            </li>
            <li className="nav-item mt-3">
              <Link to="/listFormProduct" className="nav-link">
                <ReorderIcon
                  className="text-black fw-bold"
                  style={{ fontSize: "2rem" }}
                />
                <p
                  className="text-black fw-bold ml-1"
                  style={{ fontSize: "1rem" }}
                >
                  LIST REQUEST ALL
                </p>
              </Link>
            </li>

            {/* dynamic menu */}
            {menuItems.map((item, idx) => (
              <li className="nav-item mt-3" key={idx}>
                {/* หัวข้อใหญ่ เช่น BPI, BPI TO NVK, NVK */}
                <p className="text-uppercase fw-bold ml-2" style={{ fontSize: "0.9rem", opacity: 0.7 }}>
                  {item.label}
                </p>

                {/* render submenu */}
                {item.submenu &&
                  item.submenu.map((sub, subIdx) => (
                    <Link to={sub.path} className="nav-link ml-3" key={subIdx}>
                      <ReorderIcon
                        className="text-black fw-bold"
                        style={{ fontSize: "1rem" }}
                      />
                      <span
                        className="text-black ml-2"
                        style={{ fontSize: "0.95rem" }}
                      >
                        {sub.label}
                      </span>
                    </Link>
                  ))}
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </aside>
  );
}

export default SidebarPro;
