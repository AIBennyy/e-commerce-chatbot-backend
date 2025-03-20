import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Badge, Button, Spinner } from 'react-bootstrap';
import { fetchSystemStatus } from '../../services/api';

function SystemStatus() {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStatus = async () => {
    try {
      setRefreshing(true);
      const data = await fetchSystemStatus();
      setStatus(data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch system status: ' + err.message);
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 30000); // Refresh every 30 seconds
    
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    fetchStatus();
  };

  if (loading && !status) {
    return <div className="loading">Loading system status...</div>;
  }

  return (
    <div className="system-status">
      <div className="d-flex justify-content-between align-items-center dashboard-title">
        <h2>System Status</h2>
        <Button 
          variant="outline-primary" 
          onClick={handleRefresh} 
          disabled={refreshing}
          className="refresh-button"
        >
          {refreshing ? (
            <>
              <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" />
              <span className="ms-2">Refreshing...</span>
            </>
          ) : (
            'Refresh'
          )}
        </Button>
      </div>
      
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}
      
      <Row className="mb-4">
        <Col md={6}>
          <Card className="status-card">
            <Card.Header>System Information</Card.Header>
            <Card.Body>
              {status && (
                <>
                  <div className="info-item">
                    <span className="info-label">Uptime:</span>
                    <span className="info-value">
                      {Math.floor(status.system.uptime / 3600)} hours, {Math.floor((status.system.uptime % 3600) / 60)} minutes
                    </span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Memory Usage:</span>
                    <span className="info-value">
                      {Math.round(status.system.memory.heapUsed / 1024 / 1024)} MB / {Math.round(status.system.memory.heapTotal / 1024 / 1024)} MB
                    </span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Last Restart:</span>
                    <span className="info-value">
                      {new Date(status.system.lastRestart).toLocaleString()}
                    </span>
                  </div>
                </>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
      
      <h3>Platform Status</h3>
      <Row>
        {status && Object.entries(status.platforms).map(([platform, data]) => (
          <Col md={3} key={platform}>
            <Card className="status-card mb-3">
              <Card.Header>{platform.charAt(0).toUpperCase() + platform.slice(1)}</Card.Header>
              <Card.Body>
                <div className="platform-status">
                  <Badge bg={getBadgeColor(data.status)}>
                    {formatStatus(data.status)}
                  </Badge>
                </div>
                {data.lastChecked && (
                  <div className="info-item">
                    <span className="info-label">Last Checked:</span>
                    <span className="info-value">{new Date(data.lastChecked).toLocaleString()}</span>
                  </div>
                )}
                {data.cookieExpiration && (
                  <div className="info-item">
                    <span className="info-label">Cookie Expires:</span>
                    <span className="info-value">{new Date(data.cookieExpiration).toLocaleString()}</span>
                  </div>
                )}
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  );
}

function getBadgeColor(status) {
  switch (status) {
    case 'connected':
      return 'success';
    case 'not_configured':
      return 'warning';
    case 'not_implemented':
      return 'secondary';
    default:
      return 'danger';
  }
}

function formatStatus(status) {
  switch (status) {
    case 'connected':
      return 'Connected';
    case 'not_configured':
      return 'Not Configured';
    case 'not_implemented':
      return 'Not Implemented';
    default:
      return 'Error';
  }
}

export default SystemStatus;
