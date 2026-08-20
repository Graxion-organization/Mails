import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import Composer from '../mail/Composer';
import { useMail } from '../../context/MailContext';

export default function MailboxLayout() {
  const { isComposerOpen } = useMail();

  return (
    <div style={styles.container}>
      <Sidebar />
      <div style={styles.main}>
        <Header />
        <div style={styles.content}>
          <Outlet />
        </div>
      </div>
      
      {isComposerOpen && <Composer />}
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    height: '100vh',
    width: '100vw',
    backgroundColor: 'var(--bg-main)',
  },
  main: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    minWidth: 0, // prevents flex item from overflowing
  },
  content: {
    flex: 1,
    overflow: 'hidden',
    position: 'relative',
  }
};
