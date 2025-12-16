// models/MaintenanceModel.js
const conn = require("../connect");
const { DataTypes } = require("sequelize");

const Maintenance = conn.define('Maintenance', {
  id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },  
  to: DataTypes.STRING,
  requestor_name: DataTypes.STRING,
  shift: DataTypes.STRING,
  section: DataTypes.STRING,
  date: DataTypes.STRING,
  time: DataTypes.STRING,
  shift_leader: DataTypes.STRING,
  machine_name: DataTypes.STRING,
  machine_no: DataTypes.STRING,
  machine_stop_time: DataTypes.STRING,
  machine_status: DataTypes.STRING,
  brief_description: DataTypes.TEXT,
  production_action: DataTypes.TEXT,
  receive_by: DataTypes.STRING,
  receive_time: DataTypes.STRING,
  work_by: DataTypes.STRING,
  from_date: DataTypes.STRING,
  from_time: DataTypes.STRING,
  to_date: DataTypes.STRING,
  to_time: DataTypes.STRING,
  total_hr: DataTypes.STRING,

  cause_member: DataTypes.JSONB,
  cause_machine: DataTypes.JSONB,
  cause_spare: DataTypes.JSONB,
  cause_product_process: DataTypes.JSONB,
  corrective: DataTypes.TEXT,
  result: DataTypes.TEXT,
  spare_parts: DataTypes.JSONB,
  control: DataTypes.STRING,
  approve_by: DataTypes.STRING,
  repair_accept_by: DataTypes.STRING,
  request_status: DataTypes.STRING,
  machine_request_name: DataTypes.STRING,
  cause_member_mode: DataTypes.STRING,
  pro_receive: DataTypes.STRING,

  Country_Code: DataTypes.STRING,
  Country_Name: DataTypes.STRING,
  Company_Code: DataTypes.STRING,
  Company_Name: DataTypes.STRING,

  Place_Code: DataTypes.STRING,
  Place_Name: DataTypes.STRING,
  Section_Code: DataTypes.STRING,
  Section_Name: DataTypes.STRING,

  Request_No_1: DataTypes.STRING,
  Request_No_2: DataTypes.STRING,
  Request_No_3: DataTypes.STRING,

  Worker_Code_1: DataTypes.STRING,
  Worker_Name_1: DataTypes.STRING,
  Worker_Code_2: DataTypes.STRING,
  Worker_Name_2: DataTypes.STRING,
  Worker_Code_3: DataTypes.STRING,
  Worker_Name_3: DataTypes.STRING,

  Machine_No: DataTypes.STRING,

  Process_Group_Code: DataTypes.STRING,
  Process_Group_Name: DataTypes.STRING,
  Process_Code: DataTypes.STRING,
  Process_Name: DataTypes.STRING,

  Work_Group_Code: DataTypes.STRING,
  Work_Group_Name: DataTypes.STRING,
  Work_Type_Code: DataTypes.STRING,
  Work_Type_Name: DataTypes.STRING,

  Work_Request_Date: DataTypes.STRING,
  Work_Request_Time: DataTypes.STRING,

  Work_Start_Date: DataTypes.STRING,
  Work_Start_Time: DataTypes.STRING,
  Work_End_Date: DataTypes.STRING,
  Work_End_Time: DataTypes.STRING,
  Work_Total_Time: DataTypes.STRING,

  Remark: DataTypes.STRING,

  Attached_File_Name_1: DataTypes.STRING,
  Attached_File_Name_2: DataTypes.STRING,
  Attached_File_Name_3: DataTypes.STRING,

  Brief_Description: DataTypes.STRING,
  Serial_No: DataTypes.STRING,
  Line: DataTypes.STRING,
  Model: DataTypes.STRING,

  Cause_1_Code_1: DataTypes.STRING,
  Cause_1_Name_1: DataTypes.STRING,
  Cause_1_Code_2: DataTypes.STRING,
  Cause_1_Name_2: DataTypes.STRING,

  Cause_2_Code_1: DataTypes.STRING,
  Cause_2_Name_1: DataTypes.STRING,
  Cause_2_Code_2: DataTypes.STRING,
  Cause_2_Name_2: DataTypes.STRING,

  Cause_3_Code_1: DataTypes.STRING,
  Cause_3_Name_1: DataTypes.STRING,
  Cause_3_Code_2: DataTypes.STRING,
  Cause_3_Name_2: DataTypes.STRING,

  repair_accept_time: DataTypes.TIME,
  remark_in_progress: DataTypes.STRING,
  Location_Name: DataTypes.STRING,

   cause_mm: DataTypes.STRING,

  
}, {

  tableName: 'maintenance_requests',
  timestamps: true,
});

module.exports = Maintenance;
