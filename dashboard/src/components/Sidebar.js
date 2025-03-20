import React from 'react';
import { Nav } from 'react-bootstrap';
import { Link, useLocation } from 'react-router-dom';

function Sidebar() {
  const location = useLocation();
  
  return (
    <div className="sidebar">
      <Nav className="flex-column" activeKey={location.pathname}>
        <Nav.Item>
          <Nav.Link as={Link} to="/" active={location.pathname === '/'}>
            System Status
          </Nav.Link>
        </Nav.Item>
        
        <div className="sidebar-section">Monitoring</div>
        <Nav.Item>
          <Nav.Link as={Link} to="/monitoring/cookies" active={location.pathname === '/monitoring/cookies'}>
            Cookie Health
          </Nav.Link>
        </Nav.Item>
        <Nav.Item>
          <Nav.Link as={Link} to="/monitoring/errors" active={location.pathname === '/monitoring/errors'}>
            Error Logs
          </Nav.Link>
        </Nav.Item>
        
        <div className="sidebar-section">Configuration</div>
        <Nav.Item>
          <Nav.Link as={Link} to="/config/platforms" active={location.pathname === '/config/platforms'}>
            Platform Settings
          </Nav.Link>
        </Nav.Item>
        <Nav.Item>
          <Nav.Link as={Link} to="/config/cookies" active={location.pathname === '/config/cookies'}>
            Cookie Settings
          </Nav.Link>
        </Nav.Item>
        
        <div className="sidebar-section">Analytics</div>
        <Nav.Item>
          <Nav.Link as={Link} to="/analytics/usage" active={location.pathname === '/analytics/usage'}>
            Usage Statistics
          </Nav.Link>
        </Nav.Item>
        <Nav.Item>
          <Nav.Link as={Link} to="/analytics/performance" active={location.pathname === '/analytics/performance'}>
            Performance Metrics
          </Nav.Link>
        </Nav.Item>
      </Nav>
    </div>
  );
}

export default Sidebar;
