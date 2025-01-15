import { Link } from 'react-router-dom'

export const Navbar = () => {
  return (
    <nav className="bg-white shadow">
      <div className="container mx-auto px-4">
        <div className="flex h-16 justify-between items-center">
          <Link to="/" className="text-xl font-bold">
            ELO Ranking
          </Link>
          <div className="flex gap-4">
            <Link to="/lists" className="hover:text-gray-600">My Lists</Link>
            <Link to="/auth" className="hover:text-gray-600">Login</Link>
          </div>
        </div>
      </div>
    </nav>
  )
}