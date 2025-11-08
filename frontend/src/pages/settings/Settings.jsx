import Template from "../../home/Template";
import { Link } from "react-router-dom";
import SettingsIcon from "@mui/icons-material/Settings";
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import AddBoxIcon from '@mui/icons-material/AddBox';
import ReorderIcon from '@mui/icons-material/Reorder';
import './setting.css'


function Settings() {


  return (
    <>
      <Template>
        <div className="signup_container d-flex justify-content-center">
          {/* <div className="register-box"> */}
          <div className="signup_form w-50">
            <div className="card card-outline card-success mt-1" id="card-setting">
              <div className="card-header text-center" id="">
                <h3 className="h2">
                  <SettingsIcon className="mb-2 fw-bold" id="setting" />
                  <b className="ml-3">SETTING</b>
                  <span className="ml-3"></span>
                </h3>
              </div>
              <div className="card-body" id="">
                <form>
                  <div className="row g-3">
                    <div className="col-md-4">
                      <Link to="/userManage">
                        <button className="btn btn-success w-100">
                          <ExitToAppIcon className="mr-1"/>
                          REGISTER
                        </button>
                      </Link>
                    </div>

                    <div className="col-md-4">
                      <Link to="/listSparePart">
                        <button className="btn btn-success w-100">
                          <AddBoxIcon className="mr-1"/>
                          ADD SPARE PART
                        </button>
                      </Link>
                    </div>

                    <div className="col-md-4">
                      <Link to="/masterItemList">
                        <button className="btn btn-success w-100">
                          <AddBoxIcon className="mr-1"/>
                          ADD MASTER ITEM LIST
                        </button>
                      </Link>
                    </div>

                    <div className="col-md-4">
                      <Link to="/workGroupCode">
                        <button className="btn btn-success w-100">
                          <AddBoxIcon className="mr-1"/>
                          ADD WORK GROUP CODE
                        </button>
                      </Link>
                    </div>

                    <div className="col-md-4">
                      <Link to="/machineSerial">
                        <button className="btn btn-success w-100">
                          <AddBoxIcon className="mr-1"/>
                          ADD MACHINE SERIAL
                        </button>
                      </Link>
                    </div>
                    <div className="col-md-4">
                      <Link to="/listFormRequestSetting">
                        <button className="btn btn-primary w-100">
                          <ReorderIcon className="mr-1"/>
                          LIST REQUEST
                        </button>
                      </Link>
                    </div>
                  </div>

                </form>
              </div>
            </div>
          </div>
        </div>
      </Template>
    </>
  );
}
export default Settings;
