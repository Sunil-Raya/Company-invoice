import { Link } from "react-router-dom";
import { RxDashboard } from "react-icons/rx";
import { FaRegChartBar } from "react-icons/fa";
import { MdOutlinePayments } from "react-icons/md";
import { HiOutlineDocumentReport } from "react-icons/hi";
import { MdOutlineFactory } from "react-icons/md";


function Sidebar() {
  return (
    <div className="sidebar">
      <h1>Ledger</h1>

      <div className="wrapper">

        <p>Main Menu</p>
          <nav>
            <Link to="/"><RxDashboard /> Dashboard</Link>
            <Link to="/companies"><MdOutlineFactory />Companies</Link>
            <Link to="/add-sale"><FaRegChartBar /> Add Sale</Link>
            <Link to="/add-payment"><MdOutlinePayments /> Add Payment</Link>
            <Link to="/reports"><HiOutlineDocumentReport />Reports</Link>
          </nav>
      </div>
    </div>
  );
}

export default Sidebar;