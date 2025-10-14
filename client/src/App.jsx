import Sidebar from './components/shared/Sidebar'

function App() {
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1">
        {/* Your main content */}
      </div>
    </div>
  )
}

export default App