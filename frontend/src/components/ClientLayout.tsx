import { Outlet } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import Chatbot from './Chatbot';

// `min-h-[100vh]` on <main> (rather than relying on flex-1 alone) guarantees
// every client page — even short ones like Cart or Addresses — fills at
// least a full viewport before the footer appears, so the footer always
// requires a full scroll to reach, consistent with the Landing page.
const ClientLayout = () => (
  <div className="flex flex-col bg-paper">
    <Header />
    <main className="flex-1 min-h-screen">
      <Outlet />
    </main>
    <Footer />
    <Chatbot />
  </div>
);

export default ClientLayout;
