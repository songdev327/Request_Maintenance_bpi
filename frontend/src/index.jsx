import ReactDOM from 'react-dom/client';
import reportWebVitals from './reportWebVitals';

import {createBrowserRouter,RouterProvider,} from "react-router-dom";
import Home from './home/Home';
import MaintenanceForm from './pages/requestform/MaintenanceForm';
import ListFormRequest from './pages/requestform/ListFormRequest';
import ListFormProduct from './pages/production/ListFormProduct';
import MaintenanceFormPro from './pages/requestform/MaintenanceFormPro';
import ResultFormPro from './pages/requestform/ResultFormPro';
import ResultFormProToMM from './pages/requestform/ResultFormProToMM';
import Dashboard from './pages/dashboard/Dashboard';
import DashboardMM from './pages/dashboard/DashboardMM';
import Settings from './pages/settings/Settings';
import HomeSetting from './home/HomeSetting';
import UserManage from './pages/settings/UserManage';
import ListSparePart from './pages/settings/ListSparePart';
import MasterItemList from './pages/settings/MasterItemList';
import WorkGroupCode from './pages/settings/WorkGroupCode';
import MachineSerial from './pages/settings/MachineSerial';
import ListFormRequestSetting from './pages/requestform/ListFormRequestSetting';
import ResultFormProToMMSetting from './pages/requestform/ResultFormProToMMSetting';
import ListFormProductBPI from './pages/production/ListFormProductBPI';
import ListFormProductBPIToNVK from './pages/production/ListFormProductBPIToNVK';
import ListFormProductNVK from './pages/production/ListFormProductNVK';

const router = createBrowserRouter([

  {path: "/", element: <Home />},
  {path: "/homeSetting", element: <HomeSetting />},

  {path: "/maintenanceForm", element: <MaintenanceForm />},
  {path: "/maintenanceFormPro", element: <MaintenanceFormPro />},
  {path: "/listFormRequest", element: <ListFormRequest />},
  {path: "/listFormRequestSetting", element: <ListFormRequestSetting />},
  {path: "/listFormProduct", element: <ListFormProduct />},
  {path: "/listFormProductBPI", element: <ListFormProductBPI />},
  {path: "/listFormProductBPIToNVK", element: <ListFormProductBPIToNVK />},
  {path: "/listFormProductNVK", element: <ListFormProductNVK />},

  {path: "/resultFormPro", element: <ResultFormPro />},
  {path: "/resultFormProToMM", element: <ResultFormProToMM />},
  {path: "/resultFormProToMMSetting", element: <ResultFormProToMMSetting />},
  {path: "/dashboardMM", element: <DashboardMM />},
  {path: "/dashboardProduct", element: <Dashboard />},
  
  {path: "/settings", element: <Settings />},
  {path: "/userManage", element: <UserManage />},
  {path: "/listSparePart", element: <ListSparePart />},
  {path: "/masterItemList", element: <MasterItemList />},
  {path: "/workGroupCode", element: <WorkGroupCode />},
  {path: "/machineSerial", element: <MachineSerial />}

  ]);

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
    <RouterProvider router={router} />
);

reportWebVitals();