import AddDonationModal from "./AddDonationModal";

function App() {
  return (
    <div className="app-bg">
      <AddDonationModal onAuditComplete={(data) => console.log("Audit result:", data)} />
    </div>
  );
}

export default App;
