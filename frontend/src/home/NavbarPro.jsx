import Swal from "sweetalert2";
import { useNavigate } from 'react-router-dom'
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import LogoutIcon from '@mui/icons-material/Logout';


function NavbarPro() {

  const [currentDateTime, setCurrentDateTime] = useState(new Date());


  useEffect(() => {
    const intervalId = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000); // อัปเดตทุกๆ 1 วินาที

    return () => {
      clearInterval(intervalId);
    };
  }, []);


  const formatTime = (date) => {
    let hours = date.getHours();
    let minutes = date.getMinutes();
    let seconds = date.getSeconds();
    //  let meridiem = hours < 12 ? "AM" : "PM";

    // แปลงให้เป็นรูปแบบ 12 ชั่วโมง (AM/PM)
    if (hours > 24) {
      hours -= 24;
    } else if (hours === 0) {
      hours = 24;
    }

    // เพิ่มเลข 0 นำหน้าเวลาที่มีตัวเลขน้อยกว่า 10
    hours = String(hours).padStart(2, "0");
    minutes = String(minutes).padStart(2, "0");
    seconds = String(seconds).padStart(2, "0");

    return `${hours}:${minutes}:${seconds}`;
  };

  const formatDate = (date) => {
    const days = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    const months = [
      "01",
      "02",
      "03",
      "04",
      "05",
      "06",
      "07",
      "08",
      "09",
      "10",
      "11",
      "12",
    ];

    const day = days[date.getDay()];
    const month = months[date.getMonth()];
    const dayOfMonth = date.getDate();
    const year = date.getFullYear();

    return `${day}   ${dayOfMonth}-${month}-${year}`;
  };
  const navigate = useNavigate();

  const handleSignOut = () => {

    Swal.fire({
      title: 'LOG OUT',
      text: 'ยืนยันการออกจากระบบ',
      icon: 'question',
      showCancelButton: true,
      showConfirmButton: true

    }).then(res => {
      if (res.isConfirmed) {
        //  localStorage.removeItem(config.token_name);
        navigate('/');
      }
    })

  }

  return (
    <>
      <nav class="main-header navbar navbar-expand" id="navbar-mm">
        <h6 className="fw-bold" id="clock-header">
          {formatDate(currentDateTime)} [ {formatTime(currentDateTime)} ]
        </h6>

        <ul class="navbar-nav">
          <li class="nav-item">
            <a class="nav-link" data-widget="pushmenu" href=" " role="button">
              <i class="fas fa-bars"></i>
            </a>
          </li>
        </ul>

        <ul class="navbar-nav ml-auto">
          <li class="nav-item">
            <Link to="/homeSettings">
              <button className="btn fw-bold text-white mr-4">
                {/* <i className="fa fa-user mr-2"></i> */}
                SETTING
              </button>
            </Link>
            <button onClick={handleSignOut} className="btn fw-bold text-danger mr-3" id="login-navbar-p">
              {/* <i className="fa fa-times mr-2"></i> */}
              <LogoutIcon />
              LOG OUT
            </button>
          </li>

          <li class="nav-item">
            <Link
              class="nav-link"
              data-widget="fullscreen"
              href="#"
              role="button"
            >
              <i class="fas fa-expand-arrows-alt text-white"></i>
            </Link>
          </li>
        </ul>
      </nav>
    </>
  );
}

export default NavbarPro;