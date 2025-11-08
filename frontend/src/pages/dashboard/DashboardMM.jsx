import { io } from 'socket.io-client';
import { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import config from '../../config';
import './Dashboard.css'; // ⬅️ นำเข้าไฟล์ CSS ที่สร้าง

import {
    ResponsiveContainer,
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
    PieChart, Pie, Cell
} from 'recharts';
import Template from '../../home/Template';

const DashboardMM = () => {
    const [statsPayload, setStatsPayload] = useState({
        totalRequests: 0,
        totalRequested: 0,   // ⬅️ เพิ่ม
        totalPending: 0,
        totalCompleted: 0,
        totalCancel:0,
        stats: []
    });
    const [recentRequests, setRecentRequests] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            const [res1, res2] = await Promise.all([
                axios.get(`${config.api_path}/Maintenance/stats?days=90`),
                axios.get(`${config.api_path}/Maintenance/recent?limit=5`)
            ]);
            setStatsPayload({
                totalRequests: res1.data?.totalRequests ?? 0,
                totalRequested: res1.data?.totalRequested ?? 0, // ⬅️ เพิ่ม
                totalPending: res1.data?.totalPending ?? 0,
                totalCompleted: res1.data?.totalCompleted ?? 0,
                totalCancel: res1.data?.totalCancel ?? 0,
                stats: res1.data?.stats ?? []
            });
            setRecentRequests(res2.data ?? []);
        };

        fetchData();

        const socket = io(config.api_path, { transports: ['websocket'] });

        const onChange = () => fetchData(); // มี new/update ก็ refetch
        socket.on('maintenance:new', onChange);
        socket.on('maintenance:update', onChange);
        socket.on('connect', onChange);     // เผื่อ reconnect แล้วพลาด event

        return () => socket.disconnect();
    }, []);

    const lineData = useMemo(() => {
        return (statsPayload.stats || []).map((d) => {
            const dt = new Date(d.date);
            return {
                dateLabel: dt.toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'short', 
                    day: 'numeric' }),
                count: Number(d.count ?? 0)
            };
        });
    }, [statsPayload.stats]);

    // pieData: เปลี่ยนให้เป็น 3 ชิ้นตามที่ต้องการ
    const pieData = useMemo(() => ([
        { name: 'request', value: Number(statsPayload.totalRequested || 0) },
        { name: 'in process', value: Number(statsPayload.totalPending || 0) },
        { name: 'finished', value: Number(statsPayload.totalCompleted || 0) },
        { name: 'cancel', value: Number(statsPayload.totalCancel || 0) },
    ]), [statsPayload]);

    
    const PIE_COLOR_MAP = {
        request: '#f44336',  // แดง
        'in process': '#ff9800',  // ส้ม
        finished: '#2e7d32',  // เขียว
        cancel: '#9e9e9e',  // เทา
    };

    const totalPie = useMemo(
        () => (pieData || []).reduce((s, d) => s + Number(d.value || 0), 0),
        [pieData]
    );

    // สัดส่วนเป็น % อ้างอิงตามชื่อ (ไว้ใช้ใน Legend)
    const percentByName = useMemo(() => {
        const m = {};
        const t = totalPie || 0;
        (pieData || []).forEach(d => {
            m[d.name] = t ? (Number(d.value || 0) / t) * 100 : 0;
        });
        return m;
    }, [pieData, totalPie]);

    // label ที่โชว์บนชิ้นพาย
    const renderPieLabel = ({ name, value, percent }) =>
        `${name}: ${value} (${(percent * 100).toFixed(1)}%)`;

    // เส้นชี้ที่ใช้สีตามสถานะ
    const renderLabelLine = (props) => {
        const { points = [], payload } = props; // payload.name คือชื่อสถานะ
        const stroke = PIE_COLOR_MAP[payload?.name] || '#999';

        // บางเวอร์ชันของ Recharts ให้ 2–3 จุด เรารองรับทุกกรณี
        const d = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join('');

        return (
            <path
                d={d}
                fill="none"
                stroke={stroke}
                strokeWidth={2}
                strokeLinecap="round"
            />
        );
    };

    // ช่วยเลือก badge class จากสถานะ
    const statusBadgeClass = (status) => {
        if (!status) return 'badge badge--other';
        if (status === 'request') return 'badge badge--request'; // แดง
        if (status === 'in progress' || status === 'กำลังดำเนินการ')
            return 'badge badge--progress'; // ส้ม
        if (status === 'finished' || status === 'เสร็จสิ้น' || status === 'completed' || status === 'done')
            return 'badge badge--done'; // เขียว
        return 'badge badge--other';
    };

    return (
        <>
            <Template>

                <div className="content-wrapper">
                    <div className="dashboard-container">
                         <h3 className='fw-bold'>📊 MAINTENANCE DASHBOARD</h3>

                        {/* Cards */}
                        <div className="stats-row">
                            <div className="stat-total">
                                <h3 className='h3-text'>TOTAL</h3>
                                <p className="big-number">{statsPayload.totalRequests}</p>
                            </div>
                             <div className="stat-finished">
                                <h3 className='h3-text'>FINISHED</h3>
                                <p className="big-number">{statsPayload.totalCompleted}</p>
                            </div>
                            <div className="stat-inprogress">
                                <h3 className='h3-text'>IN PROCESS</h3>
                                <p className="big-number">{statsPayload.totalPending}</p>
                            </div>                     
                            <div className="stat-request">
                                <h3 className='h3-text'>REQUEST</h3>
                                <p className="big-number">{statsPayload.totalRequested}</p>
                            </div>
                             <div className="stat-cancel">
                                <h3 className='h3-text'>CANCEL</h3>
                                <p className="big-number">{statsPayload.totalCancel}</p>
                            </div>
                        </div>

                        {/* Charts */}
                        <div className="panels mb-2">
                            <div className="panel">
                                <div className="panel-header">Trend in number of repair reports/day</div>
                                <div className="chart-box">
                                    <div style={{ minWidth: 0, width: '100%', height: '100%' }}>
                                        <ResponsiveContainer width="100%" height={320}>
                                            <LineChart data={lineData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                                                <CartesianGrid strokeDasharray="3 3" />
                                                <XAxis 
                                                dataKey="dateLabel" 
                                                  angle={-40}               // เอียง 45°
                                                    textAnchor="end"          // ปลายอักษรชิดแกน
                                                    height={70}               // เพิ่มความสูงแกน X
                                                    tickMargin={8}            // กันชนระหว่าง tick กับกรอบ
                                                />
                                                <YAxis allowDecimals={false} />
                                                <Tooltip />
                                                <Legend />
                                                <Line type="monotone" dataKey="count" name="Number of worksheets" stroke="#0d00ffff" strokeWidth={2} dot />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            </div>

                             <div className="panel">
                                <div className="panel-header">Proportion of work status</div>
                                <div className="chart-box">
                                    <div style={{ minWidth: 0, width: '100%', height: '100%' }}>
                                        <ResponsiveContainer width="100%" height={320}>
                                            <PieChart>
                                                {/* Tooltip โชว์ จำนวน + % */}
                                                <Tooltip
                                                    formatter={(value, name) => [
                                                        `${value} (${totalPie ? ((value / totalPie) * 100).toFixed(1) : 0}%)`,
                                                        name,
                                                    ]}
                                                />
                                                {/* Legend โชว์ชื่อ + % */}
                                                <Legend
                                                    formatter={(value) =>
                                                        `${value} (${(percentByName[value] || 0).toFixed(1)}%)`
                                                    }
                                                />
                                                <Pie
                                                    data={pieData}
                                                    dataKey="value"
                                                    nameKey="name"
                                                    cx="50%"
                                                    cy="50%"
                                                    outerRadius={100}
                                                    label={renderPieLabel}
                                                    labelLine={renderLabelLine}  // ใช้แทนบรรทัด labelLine เฉยๆ
                                                >
                                                    {pieData.map((d, i) => (
                                                        <Cell key={i} fill={PIE_COLOR_MAP[d.name] || '#90a4ae'} />
                                                    ))}
                                                </Pie>
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            </div>

                        </div>

                        {/* Recent table */}
                        <h3>📝 Latest repair notification list</h3>
                        <table className="recent-table">
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>Machine name</th>
                                    <th>Notification time</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentRequests.map((item, index) => (
                                    <tr key={item.id}>
                                        <td>{index + 1}</td>
                                        <td>{item.machine_name} ({item.machine_no})</td>
                                        <td>{item.date} {item.time}</td>
                                        <td><span className={statusBadgeClass(item.request_status)}>{item.request_status || '-'}</span></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </Template>
        </>
    );
};

export default DashboardMM;
