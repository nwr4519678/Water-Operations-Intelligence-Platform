import { Link } from 'react-router-dom'
export function NotFound() { return <section className="not-found-page"><p className="section-kicker">404</p><h1>Page not found</h1><p>The requested EchoCloud workspace page is not available.</p><Link className="button-primary" to="/dashboard">Return to dashboard</Link></section> }
