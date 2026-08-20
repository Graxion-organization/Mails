import { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';
import { useAuth } from './AuthContext';

const MailContext = createContext();

export const useMail = () => useContext(MailContext);

export const MailProvider = ({ children }) => {
  const { user } = useAuth();
  
  // Organization state
  const [orgs, setOrgs] = useState([]);
  const [activeOrg, setActiveOrg] = useState(null);
  
  // Mailbox state
  const [mailboxes, setMailboxes] = useState([]);
  const [activeMailbox, setActiveMailbox] = useState(null);
  
  // App state
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [composerInitialData, setComposerInitialData] = useState(null);
  const [stats, setStats] = useState({ unread: 0, drafts: 0, spam: 0 });

  const [isLoading, setIsLoading] = useState(true);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);

  useEffect(() => {
    if (user) {
      fetchOrgs();
    } else {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (activeOrg) {
      fetchMailboxes(activeOrg._id);
    }
  }, [activeOrg]);

  const fetchOrgs = async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/orgs');
      if (res.data.success) {
        setOrgs(res.data.data);
        if (res.data.data.length > 0) {
          setActiveOrg(res.data.data[0]);
          setNeedsOnboarding(false);
        } else {
          setNeedsOnboarding(true);
        }
      }
    } catch (error) {
      console.error('Failed to fetch orgs', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMailboxes = async (orgId) => {
    try {
      const res = await api.get(`/orgs/${orgId}/mailboxes`);
      if (res.data.success) {
        setMailboxes(res.data.data);
        if (res.data.data.length > 0) {
          setActiveMailbox(res.data.data[0]);
        }
      }
    } catch (error) {
      console.error('Failed to fetch mailboxes', error);
    }
  };

  const openComposer = (data = null) => {
    setComposerInitialData(data);
    setIsComposerOpen(true);
  };

  const closeComposer = () => {
    setIsComposerOpen(false);
    setComposerInitialData(null);
  };

  return (
    <MailContext.Provider value={{
      orgs,
      activeOrg,
      setActiveOrg,
      mailboxes,
      activeMailbox,
      setActiveMailbox,
      isComposerOpen,
      openComposer,
      closeComposer,
      composerInitialData,
      stats,
      setStats,
      isLoading,
      needsOnboarding,
      fetchOrgs,
      fetchMailboxes
    }}>
      {children}
    </MailContext.Provider>
  );
};
