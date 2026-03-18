function Navbar() {
  const today = new Date().toLocaleDateString();

  return (
    <div className="navbar">
      <h3>Dashboard</h3>
      <span>{today}</span>
    </div>
  );
}

export default Navbar;