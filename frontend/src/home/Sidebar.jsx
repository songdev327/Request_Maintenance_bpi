import { Link } from 'react-router-dom';
import ReorderIcon from '@mui/icons-material/Reorder';
import DashboardIcon from '@mui/icons-material/Dashboard';

import "./index.css"

function Sidebar() {

    return (
        <>
            <aside class="main-sidebar sidebar-white elevation-4" id="sidebar-mm">
                <a href=" " class="brand-link" id="sidebar-mm-link">
                    {/* <img src="dist/img/AdminLTELogo.png" alt="AdminLTE Logo" class="brand-image img-circle elevation-3" style={{opacity: '.8'}} /> */}
                    <span class="brand-text fw-bold">
                        MAINTENANCE SYSTEM
                    </span>
                </a>

                <div class="sidebar" id="sidebar-mm">
                    <nav class="mt-2">
                        <ul
                            class="nav nav-pills nav-sidebar flex-column"
                            data-widget="treeview"
                            role="menu"
                            data-accordion="false"
                        >
                            <li class="nav-item">
                                <Link to="/dashboardMM" class="nav-link">
                                    <DashboardIcon className='text-white fw-bold' style={{ fontSize: "2rem" }} />
                                    <p className="text-white fw-bold ml-1" style={{ fontSize: "1rem" }}>DASHBOARD</p>
                                </Link>
                            </li>
                            <li class="nav-item">
                                <Link to="/listFormRequest" class="nav-link">
                                    <ReorderIcon className='text-white fw-bold' style={{ fontSize: "2rem" }} />
                                    <p className="text-white fw-bold ml-1" style={{ fontSize: "1rem" }}>LIST REQUEST</p>
                                </Link>
                            </li>
                            <li class="nav-item"></li>
                        </ul>
                    </nav>
                </div>
            </aside>
        </>
    );
}

export default Sidebar;